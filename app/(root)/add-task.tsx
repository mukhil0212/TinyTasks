import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, Switch, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { format, addMinutes } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { googleCalendarService } from '../../lib/googleCalendar'
import { notificationService } from '../../lib/notifications'
import DateTimePicker from '@react-native-community/datetimepicker'
import icons from '@/constants/icons'

interface TaskGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
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
  
  // Google Calendar settings
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(false)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  useEffect(() => {
    notificationService.setupNotificationChannel()
    notificationService.requestPermissions()
  }, [])

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

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let googleEventId = null;
      if (addToGoogleCalendar) {
        try {
          googleEventId = await googleCalendarService.addEventToCalendar({
            name: taskName.trim(),
            description: description.trim(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });
        } catch (error) {
          console.error('Google Calendar Error:', error);
          Alert.alert('Warning', 'Failed to add event to Google Calendar. The task will be created without calendar integration.');
        }
      }

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
        google_calendar_event_id: googleEventId,
      };

      const { error, data: newTask } = await supabase.from('tasks').insert(taskData).select().single();
      if (error) throw error;

      if (reminderEnabled && newTask) {
        try {
          const reminderId = await notificationService.scheduleTaskReminder({
            id: newTask.id,
            name: newTask.name,
            description: newTask.description,
            remindAt: reminderTime,
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

      router.back();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
                  <View 
                    className='w-10 h-10 rounded-xl items-center justify-center mr-3'
                    style={{ backgroundColor: selectedGroup?.color }}
                  >
                    <Text className='text-xl'>{selectedGroup?.icon}</Text>
                  </View>
                  <Text className='font-rubik-medium text-base text-[#1A1A1A]'>
                    {selectedGroup?.name}
                  </Text>
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
                placeholder="Guest Speaker - reflection paper submit"
                placeholderTextColor="#1A1A1A"
                className='bg-white rounded-2xl p-4 font-rubik-medium text-base text-[#1A1A1A]'
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

            {/* Start Date */}
            <View className='mt-6'>
              <Text className='text-sm font-rubik text-[#666876] mb-2'>
                Start Date
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
                  <View className='bg-[#7C3AED15] p-2 rounded-lg mr-3'>
                    <Image 
                      source={icons.calendar} 
                      style={{ 
                        width: 20, 
                        height: 20,
                        tintColor: '#7C3AED' 
                      }}
                    />
                  </View>
                  <Text className='font-rubik-medium text-base text-[#1A1A1A]'>
                    {format(startDate, 'MMM d, yyyy h:mm a')}
                  </Text>
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

            {/* End Date */}
            <View className='mt-6'>
              <Text className='text-sm font-rubik text-[#666876] mb-2'>
                End Date
              </Text>
              <TouchableOpacity 
                onPress={() => setShowEndPicker(true)}
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
                  <View className='bg-[#7C3AED15] p-2 rounded-lg mr-3'>
                    <Image 
                      source={icons.calendar} 
                      style={{ 
                        width: 20, 
                        height: 20,
                        tintColor: '#7C3AED' 
                      }}
                    />
                  </View>
                  <Text className='font-rubik-medium text-base text-[#1A1A1A]'>
                    {format(endDate, 'MMM d, yyyy h:mm a')}
                  </Text>
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

            {/* Reminder */}
            <View className='mt-6'>
              <Text className='text-sm font-rubik text-[#666876] mb-2'>
                Reminder
              </Text>
              <View 
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
                <View className='flex-row items-center justify-between'>
                  <View className='flex-row items-center'>
                    <View className='bg-[#7C3AED15] p-2 rounded-lg mr-3'>
                      <Image 
                        source={icons.bell} 
                        style={{ 
                          width: 20, 
                          height: 20,
                          tintColor: '#7C3AED' 
                        }}
                      />
                    </View>
                    <Text className='font-rubik-medium text-base text-[#1A1A1A]'>
                      Set Reminder
                    </Text>
                  </View>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={setReminderEnabled}
                    trackColor={{ false: '#7C3AED20', true: '#7C3AED40' }}
                    thumbColor={reminderEnabled ? '#7C3AED' : '#666876'}
                  />
                </View>
                {reminderEnabled && (
                  <TouchableOpacity 
                    onPress={() => setShowReminderPicker(true)}
                    className='mt-4 flex-row items-center justify-between'
                  >
                    <Text className='font-rubik text-[#666876]'>
                      Remind me at
                    </Text>
                    <Text className='font-rubik-medium text-[#7C3AED]'>
                      {format(reminderTime, 'MMM d, yyyy h:mm a')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Google Calendar */}
            <View className='mt-6 mb-24'>
              <Text className='text-sm font-rubik text-[#666876] mb-2'>
                Google Calendar
              </Text>
              <View 
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
                <View className='flex-row items-center justify-between'>
                  <View className='flex-row items-center'>
                    <View className='bg-[#7C3AED15] p-2 rounded-lg mr-3'>
                      <Image 
                        source={icons.calendar} 
                        style={{ 
                          width: 20, 
                          height: 20,
                          tintColor: '#7C3AED' 
                        }}
                      />
                    </View>
                    <Text className='font-rubik-medium text-base text-[#1A1A1A]'>
                      Add to Google Calendar
                    </Text>
                  </View>
                  <Switch
                    value={addToGoogleCalendar}
                    onValueChange={setAddToGoogleCalendar}
                    trackColor={{ false: '#7C3AED20', true: '#7C3AED40' }}
                    thumbColor={addToGoogleCalendar ? '#7C3AED' : '#666876'}
                  />
                </View>
              </View>
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
        </ScrollView>

        {/* Add Task Button */}
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
            <Text className='font-rubik-bold text-base text-white'>
              Add Task
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}
