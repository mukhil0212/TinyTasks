# TinyTasks Backend

Flask backend for TinyTasks application, handling voice recording transcription and task creation.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
```

2. Activate the virtual environment:
```bash
source venv/bin/activate  # On Unix/macOS
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a .env file:
```bash
cp .env.example .env
```

5. Add your Groq API key to the .env file:
```
GROQ_API_KEY=your_actual_api_key
```

## Running the Server

Start the development server:
```bash
python app.py
```

The server will run on http://localhost:3001

## API Endpoints

### Health Check
- **GET** `/health`
  - Returns server health status

### Create Task from Voice
- **POST** `/api/tasks/create-from-voice`
  - Accepts multipart/form-data with an 'audio' file
  - Returns created task details

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 500: Internal Server Error

All error responses include a JSON object with an 'error' message.
