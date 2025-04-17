import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { Task } from '../../../types/task';
import { format, isSameDay, parseISO } from 'date-fns';
import icons from '@/constants/icons';
import { useFocusEffect } from 'expo-router';

const TaskItem = ({ task }: { task: Task }) => {
  return (
    <View className="bg-white rounded-xl p-4 mb-3" style={{
      borderWidth: 1,
      borderColor: '#7C3AED20',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: task.group_color || '#7C3AED' }}
        >
          <Text className="text-xl">{task.group_icon || '📝'}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-rubik-medium text-base text-[#1A1A1A]" numberOfLines={2}>
            {task.name}
          </Text>
          <Text className="font-rubik text-sm text-[#666876]">
            {task.group_name || 'General'}
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
      {task.description && (
        <Text className="font-rubik text-sm text-[#666876] mt-2" numberOfLines={2}>
          {task.description}
        </Text>
      )}
    </View>
  );
};

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [days, setDays] = useState<(number | null)[][]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.session.user.id)
        .is('parent_id', null) // Only get parent tasks
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      const taskStart = typeof task.start_date === 'string' ? parseISO(task.start_date) : new Date(task.start_date);
      const taskEnd = typeof task.end_date === 'string' ? parseISO(task.end_date) : new Date(task.end_date || task.start_date);

      // Reset hours, minutes, seconds to compare dates only
      const startDate = new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate());
      const endDate = new Date(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate());
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      // Include tasks that start on, end on, or span over the selected date
      return startDate <= compareDate && endDate >= compareDate;
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      return () => {};
    }, [fetchTasks])
  );

  useEffect(() => {
    generateCalendar(currentDate);
  }, [currentDate]);

  // Update selected date tasks whenever tasks or selectedDate changes
  useEffect(() => {
    if (selectedDate && tasks.length > 0) {
      updateSelectedDateTasks(selectedDate);
    }
  }, [tasks, selectedDate]);

  // Set today as the selected date when component mounts
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    // Tasks might not be loaded yet, so we'll rely on the tasks dependency in the other useEffect
  }, []);

  const generateCalendar = (date: Date): void => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    let daysArray: (number | null)[] = new Array(firstDay).fill(null);
    for (let i = 1; i <= lastDate; i++) {
      daysArray.push(i);
    }

    // Ensure each row has exactly 7 columns
    while (daysArray.length % 7 !== 0) {
      daysArray.push(null);
    }

    // Convert to 2D array (rows of 7 days)
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < daysArray.length; i += 7) {
      weeks.push(daysArray.slice(i, i + 7));
    }

    setDays(weeks);
  };

  const navigateMonth = (direction: 'prev' | 'next'): void => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Update tasks for the selected date
  const updateSelectedDateTasks = (date: Date): void => {
    const tasksForDate = tasks.filter(task => {
      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.end_date || task.start_date);

      // Reset hours, minutes, seconds to compare dates only
      const startDate = new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate());
      const endDate = new Date(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate());
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      // Include tasks that start on, end on, or span over the selected date
      return startDate <= compareDate && endDate >= compareDate;
    });
    setSelectedDateTasks(tasksForDate);
  };

  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
    updateSelectedDateTasks(date);
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FF', '#FAE1FA', '#FFF9FF']}
      locations={[0, 0.36, 0.70, 0.979]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20 }}>
          <View className="mt-12 mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-2xl font-rubik-bold text-[#1A1A1A]">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  className="p-2 rounded-xl bg-white"
                  onPress={() => navigateMonth('prev')}
                >
                  <Image
                    source={icons.backArrow}
                    style={{ width: 20, height: 20, tintColor: '#1A1A1A' }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="p-2 rounded-xl bg-white"
                  onPress={() => navigateMonth('next')}
                >
                  <Image
                    source={icons.rightArrow}
                    style={{ width: 20, height: 20, tintColor: '#1A1A1A' }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row justify-between mb-4">
              {daysOfWeek.map((day, index) => (
                <View key={index} className="w-12 items-center">
                  <Text className="text-sm font-rubik text-[#666876]">{day}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap justify-between">
              {days.flat().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  className={`w-12 h-12 items-center justify-center rounded-2xl mb-2 ${
                    day && isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), selectedDate)
                      ? 'bg-[#7C3AED]'
                      : 'bg-white'
                  }`}
                  onPress={() => day && handleDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  disabled={!day}
                  style={{
                    opacity: !day ? 0 : 1,
                    borderWidth: 1,
                    borderColor: day
                      ? (isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), selectedDate)
                          ? '#7C3AED'
                          : '#7C3AED20')
                      : 'transparent',
                  }}
                >
                  {day && (
                    <>
                      <Text
                        className={`text-base font-rubik-medium ${
                          isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), selectedDate)
                            ? 'text-white'
                            : 'text-[#1A1A1A]'
                        }`}
                      >
                        {day}
                      </Text>
                      {getTasksForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)).length > 0 && (
                        <View
                          className="w-1 h-1 rounded-full mt-1"
                          style={{
                            backgroundColor: isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), selectedDate)
                              ? 'white'
                              : '#7C3AED'
                          }}
                        />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedDateTasks.length > 0 ? (
            <View className="mt-4 mb-6">
              <Text className="font-rubik-medium text-base text-[#1A1A1A] mb-3">
                Tasks for {format(selectedDate, 'MMMM d, yyyy')}
              </Text>
              {selectedDateTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-8">
              <Text className="font-rubik text-base text-[#666876]">
                No tasks for {format(selectedDate, 'MMMM d')}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Calendar;
