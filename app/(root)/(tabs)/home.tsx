import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { calendarService } from '../../../lib/calendarService';
// @ts-ignore Named import for expo-linear-gradient; ignore TS errors
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import icons from '../../../constants/icons';
import { voiceService } from '../../../lib/voiceService';
import FloatingChatAI from '../../../components/FloatingChatAI';
import { Task } from '../../../types/task';

const TaskDetails = ({ task }: { task: Task }) => {
  return (
    <View className="bg-[#F8F7FF] p-4 rounded-xl mb-2">
      {task.description && (
        <Text className="font-rubik text-sm text-[#666876] mb-3">
          {task.description}
        </Text>
      )}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Image source={icons.calendar} style={{ width: 16, height: 16, marginRight: 8 }} />
          <Text className="text-sm font-rubik text-[#666876]">
            {format(new Date(task.start_date), 'MMM d')} - {format(new Date(task.end_date || task.start_date), 'MMM d')}
          </Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: task.completed ? '#22C55E20' : '#7C3AED20' }}
        >
          <Text
            className="text-sm font-rubik-medium"
            style={{ color: task.completed ? '#22C55E' : '#7C3AED' }}
          >
            {task.completed ? 'Completed' : 'In Progress'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const TaskCard = ({ task, onToggleComplete }: { task: Task, onToggleComplete: (taskId: string, completed: boolean) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);

  // Fetch subtasks when task is expanded
  useEffect(() => {
    if (expanded) {
      fetchSubtasks();
    }
  }, [expanded]);

  // Fetch subtasks for this task
  const fetchSubtasks = async () => {
    setIsLoadingSubtasks(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_id', task.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching subtasks:', error);
        return;
      }

      setSubtasks(data || []);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    } finally {
      setIsLoadingSubtasks(false);
    }
  };

  return (
    <View className="mb-3">
      <TouchableOpacity
        className="bg-white rounded-2xl p-4"
        onPress={() => setExpanded(!expanded)}
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
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: task.group_color || '#7C3AED' }}
          >
            <Text className="text-xl">{task.group_icon || '📝'}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-rubik-medium text-base text-[#1A1A1A]" numberOfLines={1}>
              {task.name}
            </Text>
            <Text className="font-rubik text-sm text-[#666876]">
              {task.group_name || 'General'}
            </Text>
          </View>
          <TouchableOpacity
            className="p-2 rounded-xl"
            style={{
              backgroundColor: task.completed ? '#22C55E15' : '#F4F4F5',
              borderWidth: 1.5,
              borderColor: task.completed ? '#22C55E' : '#E5E5E5',
            }}
            onPress={() => onToggleComplete(task.id, !task.completed)}
          >
            {task.completed ? (
              <Image
                source={icons.star}
                style={{
                  width: 16,
                  height: 16,
                  tintColor: '#22C55E'
                }}
              />
            ) : null}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View>
          <TaskDetails task={task} />

          {/* Subtasks Section */}
          {subtasks.length > 0 && (
            <View className="mt-2 ml-6 border-l-2 border-[#7C3AED20] pl-4">
              <Text className="font-rubik-medium text-sm text-[#666876] mb-2">Subtasks:</Text>
              {subtasks.map((subtask) => (
                <View key={subtask.id} className="mb-2">
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      className="p-2 mr-2 rounded-xl"
                      style={{
                        backgroundColor: subtask.completed ? '#22C55E15' : '#F4F4F5',
                        borderWidth: 1.5,
                        borderColor: subtask.completed ? '#22C55E' : '#E5E5E5',
                      }}
                      onPress={() => onToggleComplete(subtask.id, !subtask.completed)}
                    >
                      {subtask.completed ? (
                        <Image
                          source={icons.star}
                          style={{
                            width: 12,
                            height: 12,
                            tintColor: '#22C55E'
                          }}
                        />
                      ) : null}
                    </TouchableOpacity>
                    <Text
                      className={`font-rubik-medium text-sm ${subtask.completed ? 'text-[#22C55E]' : 'text-[#1A1A1A]'}`}
                      style={subtask.completed ? { textDecorationLine: 'line-through' } : {}}
                    >
                      {subtask.name}
                    </Text>
                  </View>
                  {subtask.description ? (
                    <Text className="font-rubik text-xs text-[#666876] ml-10 mt-1">
                      {subtask.description}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {isLoadingSubtasks && (
            <View className="mt-2 items-center">
              <ActivityIndicator color="#7C3AED" size="small" />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const Home: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [needsCalendarSync, setNeedsCalendarSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(0);

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

    // Only fetch parent tasks (tasks with no parent_id)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .is('parent_id', null) // Only get tasks that are not subtasks
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    setTasks(data || []);

    // Only sync with calendar if needed and not synced recently
    if (needsCalendarSync) {
      syncTasksWithCalendar();
      setNeedsCalendarSync(false);
    }
  }, [session?.user?.id, needsCalendarSync]);

  // Sync tasks with Apple Calendar with debounce
  const syncTasksWithCalendar = async () => {
    if (!session?.user?.id) return;

    // Debounce: only sync if it's been more than 10 seconds since the last sync
    const now = Date.now();
    if (now - lastSyncTime < 10000) {
      console.log('Skipping calendar sync - too soon since last sync');
      return;
    }

    try {
      setLastSyncTime(now);
      await calendarService.syncAllTasks(session.user.id);
    } catch (error) {
      console.error('Error syncing tasks with calendar:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // When the screen is focused, we want to check if we need to sync
      // But we don't want to sync on every focus, only when needed
      const now = Date.now();
      // Only set needsCalendarSync to true if it's been more than 5 minutes since last sync
      if (now - lastSyncTime > 300000) { // 5 minutes in milliseconds
        setNeedsCalendarSync(true);
      }
      fetchTasks();
      return () => {};
    }, [fetchTasks, lastSyncTime])
  );

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      // Get the task first
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;

      // Update the task
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) throw error;

      // Update the calendar event if it exists
      if (task.google_calendar_event_id) {
        await calendarService.updateEventForTask({
          ...task,
          completed
        });
      } else {
        // If no calendar event exists yet, mark for sync
        setNeedsCalendarSync(true);
      }

      // Refresh tasks
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to delete all completed tasks
  const deleteCompletedTasks = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      // First, get all completed parent tasks with calendar event IDs
      const { data: completedParentTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session?.user?.id)
        .eq('completed', true)
        .is('parent_id', null);

      if (fetchError) throw fetchError;

      if (completedParentTasks && completedParentTasks.length > 0) {
        // Delete calendar events for tasks that have them
        for (const task of completedParentTasks) {
          if (task.google_calendar_event_id) {
            await calendarService.deleteEventForTask(task);
          }
        }

        // Delete all completed parent tasks (this will cascade delete their subtasks)
        const parentIds = completedParentTasks.map(task => task.id);
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .in('id', parentIds);

        if (deleteError) throw deleteError;
      }

      // Get completed subtasks with calendar events
      const { data: completedSubtasks, error: fetchSubtasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session?.user?.id)
        .eq('completed', true)
        .not('parent_id', 'is', null);

      if (fetchSubtasksError) throw fetchSubtasksError;

      // Delete calendar events for subtasks
      if (completedSubtasks && completedSubtasks.length > 0) {
        for (const task of completedSubtasks) {
          if (task.google_calendar_event_id) {
            await calendarService.deleteEventForTask(task);
          }
        }
      }

      // Delete completed subtasks that might have non-completed parents
      const { error: deleteSubtasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', session?.user?.id)
        .eq('completed', true)
        .not('parent_id', 'is', null);

      if (deleteSubtasksError) throw deleteSubtasksError;

      // Mark for calendar sync since we deleted tasks
      setNeedsCalendarSync(true);

      // Refresh tasks
      await fetchTasks();
      Alert.alert('Success', 'All completed tasks have been deleted.');
    } catch (error) {
      console.error('Error deleting completed tasks:', error);
      Alert.alert('Error', 'Failed to delete completed tasks. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle refresh action
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // When user manually refreshes, we should sync with calendar
    setNeedsCalendarSync(true);
    await fetchTasks();

    // Check if there are any completed tasks
    const hasCompletedTasks = tasks.some(task => task.completed);

    if (hasCompletedTasks) {
      // Ask user if they want to delete completed tasks
      Alert.alert(
        'Clean Up',
        'Would you like to delete all completed tasks?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', onPress: deleteCompletedTasks }
        ]
      );
    }

    setRefreshing(false);
  }, [tasks, session?.user?.id]);

  // This useFocusEffect is removed to prevent duplicate calls

  if (!session) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-xl font-rubik-bold text-center mb-4">Please sign in to view your tasks</Text>
        <TouchableOpacity
          className="bg-[#7C3AED] py-3 px-6 rounded-xl"
          onPress={() => router.push('/login')}
        >
          <Text className="text-white font-rubik-medium">Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#F8F7FF', '#FFFFFF']}
        style={{ flex: 1 }}
      >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7C3AED']} // Android
              tintColor="#7C3AED" // iOS
              title="Pull to refresh" // iOS
              titleColor="#7C3AED" // iOS
            />
          }
        >
          <View className="flex-1 p-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-2xl font-rubik-bold text-[#1A1A1A]">My Tasks</Text>
                <Text className="text-sm font-rubik text-[#666876]">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  source={require('../../../assets/images/avatar.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>

            {/* User Greeting */}
            <View className="bg-white rounded-2xl p-4 mb-8">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-xl bg-[#7C3AED15] items-center justify-center mr-3">
                  <Text className="text-2xl">👋</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-rubik text-sm text-[#666876]">Welcome back,</Text>
                  <Text className="font-rubik-bold text-base text-[#1A1A1A]">
                    {session?.user?.email || 'Guest'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tasks */}
            <View className="mb-8">
              <Text className="text-xl font-rubik-bold text-[#1A1A1A] mb-4">Today's Tasks</Text>
              {tasks.length === 0 ? (
                <View className="bg-white rounded-2xl p-6 items-center justify-center">
                  <Image
                    source={icons.info}
                    style={{ width: 80, height: 80, marginBottom: 16, opacity: 0.5 }}
                  />
                  <Text className="font-rubik-medium text-base text-[#666876] text-center mb-2">
                    No tasks yet
                  </Text>
                  <Text className="font-rubik text-sm text-[#666876] text-center">
                    Create your first task using the quick actions below
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

                        // Ensure dates are valid and satisfy the constraint (end_date >= start_date)
                        const currentDate = new Date().toISOString();
                        let startDate = taskDetails.startDate || currentDate;
                        let endDate = taskDetails.endDate || currentDate;

                        // If end date is before start date, set end date equal to start date
                        if (new Date(endDate) < new Date(startDate)) {
                          endDate = startDate;
                        }

                        const { data: newTask, error } = await supabase.from('tasks').insert({
                          name: taskDetails.name,
                          description: taskDetails.description || '',
                          group_id: taskDetails.groupId || '3',
                          group_name: taskDetails.groupName || 'Personal',
                          group_icon: '📝',
                          group_color: '#7C3AED',
                          start_date: startDate,
                          end_date: endDate,
                          completed: false,
                          user_id: session.user.id,
                          created_at: new Date().toISOString(),
                        }).select().single();

                        if (error) throw error;

                        // Mark for calendar sync since we created a new task
                        setNeedsCalendarSync(true);
                        await fetchTasks();

                        // Ask if user wants to split the task into subtasks
                        Alert.alert(
                          'Task Created',
                          'Would you like to split this task into smaller subtasks?',
                          [
                            { text: 'No', style: 'cancel' },
                            {
                              text: 'Yes',
                              onPress: async () => {
                                try {
                                  setIsProcessing(true);
                                  // Split the task into subtasks
                                  const subtasks = await voiceService.splitTaskIntoSubtasks({
                                    name: newTask.name,
                                    description: newTask.description
                                  });

                                  if (subtasks && subtasks.length > 0) {
                                    // Create subtasks with parent_id set to the main task
                                    const subtasksToInsert = subtasks.map(subtask => ({
                                      name: subtask.name,
                                      description: subtask.description || '',
                                      group_id: newTask.group_id,
                                      group_name: newTask.group_name,
                                      group_icon: newTask.group_icon,
                                      group_color: newTask.group_color,
                                      start_date: newTask.start_date,
                                      end_date: newTask.end_date,
                                      completed: false,
                                      user_id: session.user.id,
                                      parent_id: newTask.id, // Set parent_id to link to the parent task
                                      created_at: new Date().toISOString(),
                                    }));

                                    const { error: subtasksError } = await supabase.from('tasks').insert(subtasksToInsert);
                                    if (subtasksError) throw subtasksError;

                                    // Mark for calendar sync since we created subtasks
                                    setNeedsCalendarSync(true);
                                    await fetchTasks();
                                    Alert.alert('Success', `Created ${subtasks.length} subtasks!`);
                                  }
                                } catch (subtaskError) {
                                  console.error('Error creating subtasks:', subtaskError);
                                  Alert.alert('Error', 'Failed to create subtasks. Please try again.');
                                } finally {
                                  setIsProcessing(false);
                                }
                              }
                            }
                          ]
                        );
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
                    borderColor: '#7C3AED20',
                    shadowColor: '#7C3AED',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#7C3AED" size="small" />
                  ) : (
                    <>
                      <View className='bg-[#7C3AED15] p-3 rounded-xl mb-2'>
                        <Image
                          source={isRecording ? icons.mic : icons.mic}
                          style={{
                            width: 20,
                            height: 20,
                            tintColor: '#7C3AED'
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
                  <Text className='font-rubik-medium text-sm text-[#1A1A1A]'>Add Task</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => supabase.auth.signOut()}
                  className='bg-white rounded-2xl p-4 flex-1 items-center'
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

      {/* Floating Chat AI Widget */}
      {session?.user && (
        <FloatingChatAI
          userId={session.user.id}
          onTaskCreated={fetchTasks}
        />
      )}
    </View>
  );
};

export default Home;
