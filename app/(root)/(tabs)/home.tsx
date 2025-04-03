import { View, Text, TouchableOpacity, SafeAreaView, Image, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import icons from '@/constants/icons';
import { voiceService } from '../../../lib/voiceService';
import { Task } from '../../../types/task';

const TaskDetailsModal = ({ task, visible, onClose }: { task: Task, visible: boolean, onClose: () => void }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={onClose}
      />
      <View className="bg-white rounded-t-3xl p-6">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View 
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: task.group_color }}
            >
              <Text className="text-xl">{task.group_icon}</Text>
            </View>
            <View>
              <Text className="text-xl font-rubik-bold text-[#1A1A1A]" numberOfLines={2}>
                {task.name}
              </Text>
              <Text className="text-sm font-rubik text-[#666876]">
                {task.group_name}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="p-2"
          >
            <Text className="text-[#7C3AED] font-rubik-medium">Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {task.description && (
            <View className="mb-6">
              <Text className="text-sm font-rubik-medium text-[#1A1A1A] mb-2">Description</Text>
              <Text className="text-base font-rubik text-[#666876]">
                {task.description}
              </Text>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-sm font-rubik-medium text-[#1A1A1A] mb-2">Date Range</Text>
            <View className="flex-row items-center bg-[#7C3AED08] p-3 rounded-xl">
              <Image 
                source={icons.calendar} 
                style={{ 
                  width: 18, 
                  height: 18,
                  tintColor: '#7C3AED',
                  marginRight: 8
                }}
              />
              <Text className="font-rubik text-base text-[#1A1A1A]">
                {format(new Date(task.start_date), 'MMMM d, yyyy')} - {format(new Date(task.end_date), 'MMMM d, yyyy')}
              </Text>
            </View>
          </View>

          <View>
            <Text className="text-sm font-rubik-medium text-[#1A1A1A] mb-2">Status</Text>
            <View 
              className="flex-row items-center bg-[#7C3AED08] p-3 rounded-xl"
              style={{ borderWidth: 1, borderColor: '#7C3AED20' }}
            >
              <View 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: task.completed ? '#22C55E' : '#7C3AED' }}
              />
              <Text className="font-rubik text-base text-[#1A1A1A]">
                {task.completed ? 'Completed' : 'In Progress'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const TaskCard = ({ task, onToggleComplete }: { task: Task, onToggleComplete: (taskId: string, completed: boolean) => void }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
  <>
    <TouchableOpacity 
      className='bg-white rounded-2xl p-4 mb-3'
      onPress={() => setShowDetails(true)}
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
    <View className='flex-row items-center mb-3'>
      <View 
        className='w-10 h-10 rounded-xl items-center justify-center mr-3'
        style={{ backgroundColor: task.group_color }}
      >
        <Text className='text-xl'>{task.group_icon}</Text>
      </View>
      <View className='flex-1'>
        <Text className='font-rubik-medium text-base text-[#1A1A1A]' numberOfLines={1}>
          {task.name}
        </Text>
        <Text className='font-rubik text-sm text-[#666876]'>
          {task.group_name}
        </Text>
      </View>
      <TouchableOpacity 
        className='p-2 rounded-xl'
        style={{ 
          backgroundColor: task.completed ? '#7C3AED15' : '#F4F4F5',
          borderWidth: 1.5,
          borderColor: task.completed ? '#7C3AED' : '#E5E5E5',
        }}
        onPress={() => onToggleComplete(task.id, !task.completed)}
      >
        {task.completed ? (
          <Image 
            source={icons.star} 
            style={{ 
              width: 16, 
              height: 16,
              tintColor: '#7C3AED'
            }}
          />
        ) : null}
      </TouchableOpacity>
    </View>
    {task.description && (
      <Text className='font-rubik text-sm text-[#666876] mb-3' numberOfLines={2}>
        {task.description}
      </Text>
    )}
    <View className='flex-row items-center'>
      <View className='flex-row items-center'>
        <Image 
          source={icons.calendar} 
          style={{ 
            width: 16, 
            height: 16,
            tintColor: '#666876',
            marginRight: 4
          }}
        />
        <Text className='font-rubik text-xs text-[#666876]'>
          {format(new Date(task.start_date), 'MMM d')} - {format(new Date(task.end_date), 'MMM d')}
        </Text>
      </View>
    </View>
    </TouchableOpacity>
    <TaskDetailsModal 
      task={task}
      visible={showDetails}
      onClose={() => setShowDetails(false)}
    />
  </>
  );
}

export default function Home() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    setTasks(data || []);
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      return () => {};
    }, [fetchTasks])
  );

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Refresh tasks when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      return () => {};
    }, [fetchTasks])
  );

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FF']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className='h-full'>
        <ScrollView className='flex-1'>
          <View className='px-5'>
            {/* Header */}
            <View className='flex flex-row items-start justify-between mt-12'>
              <View className='flex flex-row items-center'>
                <View className='bg-[#7C3AED15] p-0.5 rounded-full'>
                  <Image 
                    source={require('@/assets/images/avatar.png')} 
                    style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 20,
                      borderWidth: 1.5, 
                      borderColor: '#7C3AED30' 
                    }}
                  />
                </View>

                <View className='flex flex-col items-start ml-3 justify-center'>
                  <Text className='text-sm font-rubik text-[#666876]'>Good Morning</Text>
                  <Text className='text-base font-rubik-medium text-[#1A1A1A]' numberOfLines={1}>
                    {session?.user?.email || 'Guest'}
                  </Text>
                </View>
              </View>

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

            {/* Tasks Section */}
            <View className='mt-8'>
              <View className='flex flex-row items-center justify-between mb-4'>
                <Text className='text-xl font-rubik-bold text-[#1A1A1A]'>Today's Tasks</Text>
                <TouchableOpacity>
                  <Text className='text-[#7C3AED] font-rubik-medium'>See All</Text>
                </TouchableOpacity>
              </View>

              {tasks.length === 0 ? (
                <View className='bg-white rounded-2xl p-6 items-center justify-center'
                  style={{ 
                    borderWidth: 1, 
                    borderColor: '#7C3AED20',
                    shadowColor: '#7C3AED',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <Image 
                    source={icons.calendar} 
                    style={{ 
                      width: 48, 
                      height: 48, 
                      marginBottom: 16,
                      tintColor: '#7C3AED40' 
                    }}
                  />
                  <Text className='font-rubik-medium text-base text-[#1A1A1A] mb-2'>No Tasks Yet</Text>
                  <Text className='font-rubik text-sm text-[#666876] text-center'>
                    Create your first task and start being productive!
                  </Text>
                </View>
              ) : (
                <View>
                  {tasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onToggleComplete={handleToggleComplete}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View className='mt-8 mb-24'>
              <Text className='text-xl font-rubik-bold text-[#1A1A1A] mb-4'>Quick Actions</Text>
              <View className='flex-row justify-between items-center'>
                {/* Voice Input Button */}
                <TouchableOpacity 
                  onPress={async () => {
                    try {
                    if (isRecording) {
                      setIsProcessing(true);
                      try {
                        const uri = await voiceService.stopRecording();
                        const taskDetails = await voiceService.processVoiceRecording(uri);
                        
                        const { data: newTask, error } = await supabase.from('tasks').insert({
                          name: taskDetails.name,
                          description: taskDetails.description || '',
                          group_id: taskDetails.groupId || '3',
                          group_name: taskDetails.groupName || 'Personal',
                          group_icon: '📝',
                          group_color: '#7C3AED',
                          start_date: taskDetails.startDate || new Date().toISOString(),
                          end_date: taskDetails.endDate || new Date().toISOString(),
                          completed: false,
                          user_id: session.user.id,
                          created_at: new Date().toISOString(),
                        }).select().single();

                        if (error) throw error;
                        await fetchTasks();
                        Alert.alert('Success', 'Task created from voice input!');
                      } catch (err) {
                        console.error('Error processing voice input:', err);
                        Alert.alert('Error', 'Failed to process voice input. Please try again.');
                      } finally {
                        setIsRecording(false);
                        setIsProcessing(false);
                      }
                    } else {
                      try {
                        await voiceService.startRecording();
                        setIsRecording(true);
                      } catch (err) {
                        console.error('Error starting recording:', err);
                        Alert.alert('Error', 'Failed to start recording. Please try again.');
                        setIsRecording(false);
                      }
                    }
                    } catch (err) {
                      console.error('Error with voice recording:', err);
                      Alert.alert('Error', 'Something went wrong. Please try again.');
                      setIsRecording(false);
                      setIsProcessing(false);
                    }
                  }}
                  className='bg-white rounded-2xl p-4 flex-1 mr-2 items-center'
                  style={{ 
                    borderWidth: 1, 
                    borderColor: isRecording ? '#EF4444' : '#7C3AED20',
                    shadowColor: isRecording ? '#EF4444' : '#7C3AED',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#7C3AED" />
                  ) : (
                    <>
                      <View className='bg-[#7C3AED15] p-3 rounded-xl mb-2'>
                        <Image 
                          source={icons.mic} 
                          style={{ 
                            width: 20, 
                            height: 20,
                            tintColor: isRecording ? '#EF4444' : '#7C3AED'
                          }}
                        />
                      </View>
                      <Text className='font-rubik-medium text-sm text-[#1A1A1A]'>
                        {isRecording ? 'Stop Recording' : 'Voice Input'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push('/add-task')}
                  className='bg-white rounded-2xl p-4 flex-1 mr-2 items-center'
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
                  <View className='bg-[#7C3AED15] p-3 rounded-xl mb-2'>
                    <Image 
                      source={icons.star} 
                      style={{ 
                        width: 20, 
                        height: 20,
                        tintColor: '#7C3AED' 
                      }}
                    />
                  </View>
                  <Text className='font-rubik-medium text-sm text-[#1A1A1A]'>New Task</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => supabase.auth.signOut()}
                  className='bg-white rounded-2xl p-4 flex-1 ml-2 items-center'
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
                  <View className='bg-[#7C3AED15] p-3 rounded-xl mb-2'>
                    <Image 
                      source={icons.logout} 
                      style={{ 
                        width: 20, 
                        height: 20,
                        tintColor: '#7C3AED' 
                      }}
                    />
                  </View>
                  <Text className='font-rubik-medium text-sm text-[#1A1A1A]'>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};
