import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, Switch, Platform, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { format, addMinutes } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { voiceService } from '../../lib/voiceService'
import { notificationService } from '../../lib/notifications'
import { calendarService } from '../../lib/calendarService'
import DateTimePicker from '@react-native-community/datetimepicker'
import icons from '@/constants/icons'

interface TaskGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
}

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
  user_id?: string;
  parent_id?: string;
}

const taskGroups: TaskGroup[] = [
  {
    id: '1',
    name: 'School',
    icon: '📚',
    color: '#FFE2EC'
  },
  // Add more task groups as needed
]

export default function AddTask() {
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(taskGroups[0])
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(addMinutes(new Date(), 60))
  const [isLoading, setIsLoading] = useState(false)

  // Reminder settings
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState(new Date())
  const [showReminderPicker, setShowReminderPicker] = useState(false)

  // User info for personalized notifications
  const [userName, setUserName] = useState('')

  // Subtask settings
  const [subtasks, setSubtasks] = useState<SubTask[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [isProcessingSubtasks, setIsProcessingSubtasks] = useState(false)

  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile()
    notificationService.setupNotificationChannel()
    notificationService.requestPermissions()
  }, [])

  // Fetch user profile from Supabase
  const fetchUserProfile = async () => {
    try {
      // Get current user
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (user) {
        // Set user name from metadata if available
        if (user.user_metadata && user.user_metadata.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user.user_metadata && user.user_metadata.name) {
          setUserName(user.user_metadata.name);
        } else if (user.email) {
          // Use email username as fallback
          const emailName = user.email.split('@')[0];
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  const handleDateChange = (type: 'start' | 'end' | 'reminder', selectedDate?: Date) => {
    if (!selectedDate) return;

    if (type === 'start') {
      setStartDate(selectedDate);
      setShowStartPicker(false);
      // Automatically set end date to 1 hour after start date
      setEndDate(addMinutes(selectedDate, 60));
    } else if (type === 'end') {
      setEndDate(selectedDate);
      setShowEndPicker(false);
    } else {
      setReminderTime(selectedDate);
      setShowReminderPicker(false);
    }
  };

  // Split an existing task into subtasks
  const handleSplitTask = useCallback(async (task: Task) => {
    setIsProcessingSubtasks(true);
    try {
      const subtasksList = await voiceService.splitTaskIntoSubtasks({
        name: task.name,
        description: task.description,
      });
      setSubtasks(subtasksList);
      setShowSubtasks(true);
    } catch (err) {
      console.error('Error splitting task:', err);
      Alert.alert('Error', 'Failed to split task. Please try again.');
    } finally {
      setIsProcessingSubtasks(false);
    }
  }, []);

  // Create subtasks in the database
  const handleCreateSubtasks = useCallback(async () => {
    if (!currentTask || subtasks.length === 0) return;
    setIsProcessingSubtasks(true);
    try {
      // Ensure parent task has valid dates
      const currentDate = new Date().toISOString();
      let taskStartDate = currentTask.start_date || currentDate;
      let taskEndDate = currentTask.end_date || currentDate;

      // If end date is before start date, set end date equal to start date
      if (new Date(taskEndDate) < new Date(taskStartDate)) {
        taskEndDate = taskStartDate;
      }

      const subtasksToInsert = subtasks.map(subtask => ({
        name: subtask.name,
        description: subtask.description || '',
        group_id: currentTask.group_id,
        group_name: currentTask.group_name,
        group_icon: currentTask.group_icon,
        group_color: currentTask.group_color,
        start_date: taskStartDate,
        end_date: taskEndDate,
        completed: false,
        user_id: currentTask.user_id,
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
      router.back();
    } catch (err) {
      console.error('Error creating subtasks:', err);
      Alert.alert('Error', 'Failed to create subtasks. Please try again.');
    } finally {
      setIsProcessingSubtasks(false);
    }
  }, [currentTask, subtasks]);

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const taskData = {
        name: taskName.trim(),
        description: description.trim(),
        group_id: selectedGroup?.id,
        group_name: selectedGroup?.name,
        group_icon: selectedGroup?.icon,
        group_color: selectedGroup?.color,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        completed: false,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      const { error, data: newTask } = await supabase.from('tasks').insert(taskData).select().single();
      if (error) throw error;

      // Create calendar event for the task
      try {
        await calendarService.createEventForTask(newTask);
      } catch (calendarError) {
        console.error('Error creating calendar event:', calendarError);
        // Continue with task creation even if calendar event fails
      }

      if (reminderEnabled && newTask) {
        try {
          const reminderId = await notificationService.scheduleTaskReminder({
            id: newTask.id,
            name: newTask.name,
            description: newTask.description,
            remindAt: reminderTime,
            userName: userName, // Add user name for personalized notifications
            dueDate: endDate, // Add due date for context
          });

          await supabase.from('reminders').insert({
            task_id: newTask.id,
            remind_at: reminderTime.toISOString(),
            is_enabled: true,
            id: reminderId,
          });
        } catch (error) {
          console.error('Reminder Error:', error);
          Alert.alert('Warning', 'Failed to set reminder. The task was created successfully.');
        }
      }

      setCurrentTask({
        ...newTask,
        user_id: user.id
      });

      // Ask if user wants to split the task
      Alert.alert(
        'Task Created',
        'Would you like to split this task into smaller subtasks?',
        [
          { text: 'No', style: 'cancel', onPress: () => router.back() },
          { text: 'Yes', onPress: () => handleSplitTask(newTask) },
        ]
      );
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the main form or subtasks view
  const renderContent = () => {
    if (showSubtasks) {
      return (
        <View className='flex-1 px-5'>
          <View className='flex-row items-center justify-between mt-4 mb-6'>
            <TouchableOpacity
              onPress={() => setShowSubtasks(false)}
              className='bg-[#7C3AED15] p-2 rounded-lg'
              style={{ borderWidth: 1, borderColor: '#7C3AED20' }}
            >
              <Image
                source={icons.backArrow}
                style={{
                  width: 20,
                  height: 20,
                  tintColor: '#7C3AED'
                }}
              />
            </TouchableOpacity>
            <Text className='text-xl font-rubik-bold text-[#1A1A1A]'>
              Create Subtasks
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <Text className='text-base font-rubik-medium text-[#1A1A1A] mb-2'>
            Suggested Subtasks
          </Text>
          <Text className='text-sm font-rubik text-[#666876] mb-4'>
            Review and create these subtasks for "{currentTask?.name}"
          </Text>

          <ScrollView className='flex-1 mb-4'>
            {subtasks.map((subtask, index) => (
              <View
                key={index}
                className='bg-[#F8F7FF] p-4 rounded-xl mb-3'
                style={{
                  borderWidth: 1,
                  borderColor: '#7C3AED20',
                }}
              >
                <Text className='font-rubik-medium text-base text-[#1A1A1A]'>{subtask.name}</Text>
                {subtask.description && (
                  <Text className='font-rubik text-sm text-[#666876] mt-2'>{subtask.description}</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View className='mb-8'>
            <TouchableOpacity
              className='bg-[#7C3AED] rounded-2xl py-4 items-center'
              onPress={handleCreateSubtasks}
              disabled={isProcessingSubtasks}
            >
              {isProcessingSubtasks ? (
                <ActivityIndicator color='#FFFFFF' />
              ) : (
                <Text className='font-rubik-bold text-base text-white'>
                  Create All Subtasks
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View className='px-5'>
            {/* Header */}
            <View className='flex-row items-center justify-between mt-4'>
              <TouchableOpacity
                onPress={() => router.back()}
                className='bg-[#7C3AED15] p-2 rounded-lg'
                style={{ borderWidth: 1, borderColor: '#7C3AED20' }}
              >
                <Image
                  source={icons.backArrow}
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: '#7C3AED'
                  }}
                />
              </TouchableOpacity>
              <Text className='text-xl font-rubik-bold text-[#1A1A1A]'>
                Add Task
              </Text>
              <TouchableOpacity
                className='bg-[#7C3AED15] p-2 rounded-lg'
                style={{ borderWidth: 1, borderColor: '#7C3AED20' }}
              >
                <Image
                  source={icons.bell}
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: '#7C3AED'
                  }}
                />
              </TouchableOpacity>
            </View>

            {/* Task Group */}
            <View className='mt-8'>
              <Text className='text-sm font-rubik text-[#666876] mb-2'>
                Task Group
              </Text>
              <TouchableOpacity
                className='flex-row items-center justify-between bg-white rounded-2xl p-4'
                style={{
                  borderWidth: 1,
                  borderColor: '#7C3AED20',
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className='flex-row items-center'>
                  <Text className='text-xl mr-3'>{selectedGroup?.icon}</Text>
                  <Text className='font-rubik text-base text-[#1A1A1A]'>{selectedGroup?.name}</Text>
                </View>
                <Image
                  source={icons.rightArrow}
                  style={{
                    width: 16,
                    height: 16,
                    tintColor: '#666876'
                  }}
                />
              </TouchableOpacity>
            </View>

            {/* Task Name */}
            <View className='mt-6'>
              <Text className='text-sm font-rubik text-[#666876] mb-2'>
                Task Name
              </Text>
              <TextInput
                value={taskName}
                onChangeText={setTaskName}
                placeholder="Complete assignment 3"
                placeholderTextColor="#666876"
                className='bg-white rounded-2xl p-4 font-rubik text-base text-[#1A1A1A]'
                style={{
                  borderWidth: 1,
                  borderColor: '#7C3AED20',
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              />
            </View>

            {/* Description */}
            <View className='mt-6'>
              <Text className='text-sm font-rubik text-[#666876] mb-2'>
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Submit paper before midnight"
                placeholderTextColor="#666876"
                multiline
                numberOfLines={4}
                className='bg-white rounded-2xl p-4 font-rubik text-base text-[#1A1A1A]'
                style={{
                  borderWidth: 1,
                  borderColor: '#7C3AED20',
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                  height: 120,
                  textAlignVertical: 'top'
                }}
              />
            </View>

            {/* Date & Time */}
            <View className='mt-6'>
              <Text className='text-sm font-rubik text-[#666876] mb-2'>
                Date & Time
              </Text>
              <View className='flex-row justify-between'>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  className='bg-white rounded-2xl p-4 flex-1 mr-2'
                  style={{
                    borderWidth: 1,
                    borderColor: '#7C3AED20',
                    shadowColor: '#7C3AED',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text className='font-rubik text-xs text-[#666876] mb-1'>Start</Text>
                  <Text className='font-rubik-medium text-sm text-[#1A1A1A]'>
                    {format(startDate, 'MMM d, yyyy')}
                  </Text>
                  <Text className='font-rubik text-xs text-[#666876] mt-1'>
                    {format(startDate, 'h:mm a')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  className='bg-white rounded-2xl p-4 flex-1'
                  style={{
                    borderWidth: 1,
                    borderColor: '#7C3AED20',
                    shadowColor: '#7C3AED',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text className='font-rubik text-xs text-[#666876] mb-1'>End</Text>
                  <Text className='font-rubik-medium text-sm text-[#1A1A1A]'>
                    {format(endDate, 'MMM d, yyyy')}
                  </Text>
                  <Text className='font-rubik text-xs text-[#666876] mt-1'>
                    {format(endDate, 'h:mm a')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Reminder */}
            <View className='mt-6'>
              <View className='flex-row justify-between items-center mb-2'>
                <Text className='text-sm font-rubik text-[#666876]'>
                  Set Reminder
                </Text>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: '#E5E5E5', true: '#7C3AED50' }}
                  thumbColor={reminderEnabled ? '#7C3AED' : '#F4F4F5'}
                />
              </View>

              {reminderEnabled && (
                <TouchableOpacity
                  onPress={() => setShowReminderPicker(true)}
                  className='bg-white rounded-2xl p-4'
                  style={{
                    borderWidth: 1,
                    borderColor: '#7C3AED20',
                    shadowColor: '#7C3AED',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View className='flex-row justify-between items-center'>
                    <View>
                      <Text className='font-rubik-medium text-sm text-[#1A1A1A]'>
                        {format(reminderTime, 'MMM d, yyyy')}
                      </Text>
                      <Text className='font-rubik text-xs text-[#666876] mt-1'>
                        {format(reminderTime, 'h:mm a')}
                      </Text>
                    </View>
                    <Image
                      source={icons.bell}
                      style={{
                        width: 20,
                        height: 20,
                        tintColor: '#7C3AED'
                      }}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Date Pickers */}
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleDateChange('start', date)}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleDateChange('end', date)}
                minimumDate={startDate}
              />
            )}

            {showReminderPicker && (
              <DateTimePicker
                value={reminderTime}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleDateChange('reminder', date)}
                maximumDate={startDate}
              />
            )}
          </View>
    );
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FF']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className='flex-1'>
        <ScrollView
          className='flex-1'
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        {/* Add Task Button - Only show when not in subtasks view */}
        {!showSubtasks && (
          <View
            className='absolute bottom-8 left-5 right-5'
            style={{
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <TouchableOpacity
              className='bg-[#7C3AED] rounded-2xl py-4 items-center'
              onPress={handleAddTask}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color='#FFFFFF' />
              ) : (
                <Text className='font-rubik-bold text-base text-white'>
                  Add Task
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  )
}
