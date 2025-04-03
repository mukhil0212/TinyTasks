from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import groq
import tempfile
import json
import base64

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Groq client
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    raise ValueError('GROQ_API_KEY environment variable is not set')

groq_client = groq.Client(api_key=GROQ_API_KEY)
TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo'
CHAT_MODEL = 'llama-3.1-8b-instant'

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

@app.route('/api/tasks/create-from-voice', methods=['POST'])
def create_task_from_voice():
    """Create a new task from voice input"""
    print('Received request:', request.files)
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    print('Audio file:', audio_file.filename)
    if not audio_file.filename:
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.m4a') as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name
            print('Saved audio to:', temp_path)

        # 1. Transcribe Audio using Groq
        with open(temp_path, 'rb') as audio:
            transcription_response = groq_client.audio.transcriptions.create(
                file=audio,
                model=TRANSCRIPTION_MODEL,
                language='en',
                response_format='verbose_json',
                temperature=0
            )

        transcription_text = transcription_response.text
        if not transcription_text or not transcription_text.strip():
            raise ValueError('Transcription result was empty')

        # 2. Extract Task Details using Groq Chat
        extraction_response = groq_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {
                    'role': 'system',
                    'content': '''Extract task details from the transcribed text. 
                    Return ONLY a valid JSON object with: 
                    name (string, required), 
                    description (string, optional), 
                    startDate (string ISO format, optional), 
                    endDate (string ISO format, optional), 
                    groupName (string, optional). 
                    If no valid task can be extracted, return an empty JSON object {}.'''
                },
                {'role': 'user', 'content': transcription_text}
            ],
            temperature=0.2,
            response_format={'type': 'json_object'}
        )

        message_content = extraction_response.choices[0].message.content
        if not message_content:
            raise ValueError('Failed to extract task details')

        task_details = json.loads(message_content)  # Parse the JSON string
        if not isinstance(task_details, dict) or 'name' not in task_details:
            raise ValueError('Invalid task details format')

        return jsonify({
            'message': 'Task created successfully',
            'task': task_details
        }), 201

    except Exception as e:
        app.logger.error(f'Error processing voice task: {str(e)}')
        return jsonify({'error': str(e)}), 500

    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_path)
        except Exception as e:
            app.logger.error(f'Error deleting temporary file: {str(e)}')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)
