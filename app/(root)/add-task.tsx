import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
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
  const [startDate, setStartDate] = useState(new Date().toISOString())
  const [endDate, setEndDate] = useState(new Date().toISOString())
  const [isLoading, setIsLoading] = useState(false)

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      if (!user) throw new Error('Not authenticated');

      const taskData = {
        name: taskName.trim(),
        description: description.trim(),
        group_id: selectedGroup?.id,
        group_name: selectedGroup?.name,
        group_icon: selectedGroup?.icon,
        group_color: selectedGroup?.color,
        start_date: startDate,
        end_date: endDate,
        completed: false,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      console.log('Creating task with data:', taskData);
      const { error, data } = await supabase.from('tasks').insert(taskData).select();
      console.log('Insert response:', { error, data });

      if (error) throw error;

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
                    {startDate}
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
            <View className='mt-6 mb-24'>
              <Text className='text-sm font-rubik text-[#666876] mb-2'>
                End Date
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
                    {endDate}
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
