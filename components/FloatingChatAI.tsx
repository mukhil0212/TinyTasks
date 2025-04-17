import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Image,
  Keyboard,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { voiceService } from '../lib/voiceService';
import { calendarService } from '../lib/calendarService';
import icons from '../constants/icons';

interface SubTask {
  name: string;
  description?: string;
}

interface Task {
  id: string;
  name: string;
  description?: string;
  group_id?: string;
  group_name?: string;
  group_icon?: string;
  group_color?: string;
  start_date?: string;
  end_date?: string;
  parent_id?: string;
}

interface FloatingChatAIProps {
  userId: string;
  onTaskCreated: () => void;
}

const { width, height } = Dimensions.get('window');

const FloatingChatAI: React.FC<FloatingChatAIProps> = ({ userId, onTaskCreated }) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const expandAnim = useRef(new Animated.Value(0)).current;

  // Listen for keyboard show/hide
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Toggle expand/collapse
  const toggleExpand = useCallback(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsExpanded(!isExpanded);
  }, [isExpanded, expandAnim]);

  // Create a task from free text
  const handleCreateTask = useCallback(async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }
    setIsProcessing(true);
    try {
      const taskDetails = await voiceService.createTaskFromText(text.trim());

      // Ensure dates are valid and satisfy the constraint (end_date >= start_date)
      const currentDate = new Date().toISOString();
      let startDate = taskDetails.startDate || currentDate;
      let endDate = taskDetails.endDate || currentDate;

      // If end date is before start date, set end date equal to start date
      if (new Date(endDate) < new Date(startDate)) {
        endDate = startDate;
      }

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          name: taskDetails.name,
          description: taskDetails.description || '',
          group_id: taskDetails.groupId || '3',
          group_name: taskDetails.groupName || 'Personal',
          group_icon: '📝',
          group_color: '#7C3AED',
          start_date: startDate,
          end_date: endDate,
          completed: false,
          user_id: userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      // Create calendar event for the task
      try {
        await calendarService.createEventForTask(newTask);
      } catch (calendarError) {
        console.error('Error creating calendar event:', calendarError);
        // Continue with task creation even if calendar event fails
      }

      setCurrentTask(newTask);
      setText('');
      onTaskCreated();
      Alert.alert(
        'Task Created',
        'Would you like to split this task into smaller subtasks?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: () => handleSplitTask(newTask) },
        ]
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [text, userId, onTaskCreated]);

  // Split an existing task into subtasks
  const handleSplitTask = useCallback(async (task: Task) => {
    setIsProcessing(true);
    try {
      const subtasksList = await voiceService.splitTaskIntoSubtasks({
        name: task.name,
        description: task.description,
      });
      setSubtasks(subtasksList);
      setShowSubtasks(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to split task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Create subtasks in the database
  const handleCreateSubtasks = useCallback(async () => {
    if (!currentTask || subtasks.length === 0) return;
    setIsProcessing(true);
    try {
      // Ensure parent task has valid dates
      const currentDate = new Date().toISOString();
      let startDate = currentTask.start_date || currentDate;
      let endDate = currentTask.end_date || currentDate;

      // If end date is before start date, set end date equal to start date
      if (new Date(endDate) < new Date(startDate)) {
        endDate = startDate;
      }

      const subtasksToInsert = subtasks.map(subtask => ({
        name: subtask.name,
        description: subtask.description || '',
        group_id: currentTask.group_id,
        group_name: currentTask.group_name,
        group_icon: currentTask.group_icon,
        group_color: currentTask.group_color,
        start_date: startDate,
        end_date: endDate,
        completed: false,
        user_id: userId,
        parent_id: currentTask.id, // Set parent_id to link to the parent task
        created_at: new Date().toISOString(),
      }));
      const { data: newSubtasks, error } = await supabase.from('tasks').insert(subtasksToInsert).select();
      if (error) throw error;

      // Create calendar events for subtasks
      try {
        for (const subtask of newSubtasks) {
          await calendarService.createEventForTask(subtask);
        }
      } catch (calendarError) {
        console.error('Error creating calendar events for subtasks:', calendarError);
        // Continue even if calendar events fail
      }
      Alert.alert('Success', `Created ${subtasks.length} subtasks!`);
      setSubtasks([]);
      setShowSubtasks(false);
      onTaskCreated();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create subtasks. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentTask, subtasks, userId, onTaskCreated]);

  // Interpolations for animated styles
  const contentOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  const chatBoxStyle = {
    position: 'absolute' as const,
    bottom: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [80, keyboardVisible ? height * 0.4 : 100],
    }),
    right: 20,
    width: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [60, width - 40],
    }),
    height: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [60, keyboardVisible ? height * 0.5 : 400],
    }),
    borderRadius: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 20],
    }),
    backgroundColor: '#7C3AED',
    padding: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 16],
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ position: 'absolute', width: '100%', height: '100%' }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Animated.View style={chatBoxStyle}>
        {!isExpanded ? (
          <TouchableOpacity
            onPress={toggleExpand}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Image source={icons.chat} style={{ width: 28, height: 28, tintColor: 'white' }} />
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 8 }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>AI Assistant</Text>
              <TouchableOpacity onPress={toggleExpand} style={{ padding: 8 }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>×</Text>
              </TouchableOpacity>
            </View>
            <Animated.View style={{ opacity: contentOpacity, flex: 1 }}>
              {showSubtasks ? (
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '500', marginBottom: 8 }}>Suggested Subtasks</Text>
                  <ScrollView style={{ flex: 1, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 8 }}>
                    {subtasks.map((subtask, i) => (
                      <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12, marginBottom: 8 }}>
                        <Text style={{ color: 'white', fontWeight: '500' }}>{subtask.name}</Text>
                        {subtask.description && <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>{subtask.description}</Text>}
                      </View>
                    ))}
                  </ScrollView>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12, flex: 1, marginRight: 8, alignItems: 'center' }}
                      onPress={() => setShowSubtasks(false)}
                    >
                      <Text style={{ color: 'white' }}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12, flex: 1, alignItems: 'center' }}
                      onPress={handleCreateSubtasks}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white' }}>Create All</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1, paddingBottom: keyboardVisible ? 40 : 0 }}>
                  <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="How can I help you?"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 12,
                      padding: 12,
                      color: 'white',
                      marginBottom: 12,
                      minHeight: 80,
                      maxHeight: 120,
                      fontSize: 16,
                    }}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12, alignItems: 'center' }}
                    onPress={handleCreateTask}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '500' }}>Create Task</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default FloatingChatAI;
