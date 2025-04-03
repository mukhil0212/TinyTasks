import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { Task } from '../../../types/task';
import { format, isSameDay, isToday, parseISO } from 'date-fns';
import { nylasCalendarService } from '../../../lib/nylasCalendar';
import * as WebBrowser from 'expo-web-browser';
import icons from '@/constants/icons';
import { router, useFocusEffect } from 'expo-router';

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<(number | null)[][]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nylasConnected, setNylasConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nylasToken, setNylasToken] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const today = new Date();

  const handleNylasConnect = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.email) {
        throw new Error('No user email found');
      }

      const authUrl = await nylasCalendarService.authorize(session.session.user.email);
      const result = await WebBrowser.openAuthSessionAsync(authUrl);
      
      if (result.type === 'success' && result.url) {
        const code = new URL(result.url).searchParams.get('code');
        if (!code) throw new Error('No authorization code received');

        const token = await nylasCalendarService.exchangeCodeForToken(code);
        setNylasToken(token);
        setNylasConnected(true);
        Alert.alert('Success', 'Connected to Calendar!');
        await fetchTasks();
      }
    } catch (error) {
      console.error('Nylas Calendar Connection Error:', error);
      Alert.alert('Error', 'Failed to connect to Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const checkNylasConnection = useCallback(async () => {
    const token = await supabase
      .from('user_settings')
      .select('nylas_token')
      .single();
    
    if (token?.data?.nylas_token) {
      setNylasToken(token.data.nylas_token);
      setNylasConnected(true);
    } else {
      setNylasConnected(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    setTasks(data || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      checkNylasConnection();
      return () => {};
    }, [fetchTasks, checkNylasConnection])
  );

  useEffect(() => {
    generateCalendar(currentDate);
  }, [currentDate]);

  const generateCalendar = (date: Date) => {
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

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskStartDate = typeof task.start_date === 'string' ? parseISO(task.start_date) : task.start_date;
      return isSameDay(taskStartDate, date);
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FF', '#FAE1FA', '#FFF9FF']}
      locations={[0, 0.36, 0.70, 0.979]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}>
          {/* Header */}
          <View className="mt-12 mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-2xl font-rubik-bold text-[#1A1A1A]">
                {months[currentDate.getMonth()]}
              </Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity 
                  onPress={() => navigateMonth('prev')}
                  className="bg-[#7C3AED15] p-2 rounded-xl"
                  style={{ borderWidth: 1.5, borderColor: '#7C3AED20' }}
                >
                  <Image 
                    source={icons.backArrow} 
                    style={{ width: 18, height: 18, tintColor: '#7C3AED' }}
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => navigateMonth('next')}
                  className="bg-[#7C3AED15] p-2 rounded-xl"
                  style={{ borderWidth: 1.5, borderColor: '#7C3AED20' }}
                >
                  <Image 
                    source={icons.backArrow} 
                    style={{ width: 18, height: 18, transform: [{ rotate: '180deg' }], tintColor: '#7C3AED' }}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-base font-rubik text-[#666876]">{currentDate.getFullYear()}</Text>
          </View>

          {/* Google Calendar Integration */}
          {!nylasConnected && (
            <TouchableOpacity 
              onPress={handleNylasConnect}
              className="mb-4 bg-[#7C3AED15] p-4 rounded-2xl flex-row items-center justify-center"
              style={{ borderWidth: 1.5, borderColor: '#7C3AED30' }}
            >
              <Image 
                source={icons.calendar} 
                style={{ width: 20, height: 20, tintColor: '#7C3AED', marginRight: 8 }} 
              />
              <Text className="font-rubik-medium text-[#7C3AED]">Connect Calendar</Text>
            </TouchableOpacity>
          )}

          {/* Days of the Week */}
          <View 
            className="flex-row justify-between mb-4 mt-2 px-1 py-2 rounded-2xl bg-[#7C3AED08]"
            style={{ borderWidth: 1, borderColor: '#7C3AED15' }}
          >
            {daysOfWeek.map((day, index) => (
              <Text 
                key={index} 
                className={`text-xs font-rubik-medium flex-1 text-center ${index === 0 || index === 6 ? 'text-[#7C3AED]' : 'text-[#666876]'}`}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid - Fully Responsive */}
          <View className="flex flex-col">
            {days.map((week, weekIndex) => (
              <View key={weekIndex} className="flex-row mb-2">
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return (
                      <View
                        key={dayIndex}
                        className="flex-1 aspect-square m-1"
                      />
                    );
                  }

                  const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dayTasks = getTasksForDate(currentDay);
                  const isCurrentDay = isToday(currentDay);

                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      onPress={() => {
                        setSelectedDate(currentDay);
                        setIsModalVisible(true);
                      }}
                      className={`flex-1 aspect-square justify-center items-center rounded-2xl m-1 ${isCurrentDay ? 'bg-[#7C3AED]' : dayTasks.length > 0 ? 'bg-[#7C3AED08]' : 'bg-white'}`}
                      style={{
                        borderWidth: 1.5,
                        borderColor: isCurrentDay ? '#7C3AED' : dayTasks.length > 0 ? '#7C3AED30' : '#7C3AED15',
                        shadowColor: '#7C3AED',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 3,
                      }}
                    >
                      <View className="items-center">
                        <Text 
                          className={`text-base font-rubik-medium mb-1 ${isCurrentDay ? 'text-white' : dayTasks.length > 0 ? 'text-[#7C3AED]' : 'text-[#1A1A1A]'}`}
                        >
                          {day}
                        </Text>
                        {dayTasks.length > 0 && (
                          <View className="flex-row gap-1">
                            {dayTasks.slice(0, 3).map((_, i) => (
                              <View 
                                key={i} 
                                className={`w-1.5 h-1.5 rounded-full ${isCurrentDay ? 'bg-white' : 'bg-[#7C3AED]'} ${i === 1 ? 'opacity-70' : i === 2 ? 'opacity-40' : ''}`} 
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Tasks Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setIsModalVisible(false)}
            />
            <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-rubik-bold text-[#1A1A1A]">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  className="p-2"
                >
                  <Text className="text-[#7C3AED] font-rubik-medium">Close</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView className="flex-1">
                {selectedDate && getTasksForDate(selectedDate).length > 0 ? (
                  getTasksForDate(selectedDate).map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      onPress={() => {
                        setIsModalVisible(false);
                        router.push(`/task/${task.id}`);
                      }}
                      className="bg-[#7C3AED08] p-4 rounded-2xl mb-3"
                      style={{ borderWidth: 1, borderColor: '#7C3AED20' }}
                    >
                      <Text className="text-base font-rubik-medium text-[#1A1A1A] mb-1">
                        {task.name}
                      </Text>
                      {task.description && (
                        <Text className="text-sm font-rubik text-[#666876] mb-2">
                          {task.description}
                        </Text>
                      )}
                      <View className="flex-row items-center">
                        <View 
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: task.group_color || '#7C3AED' }}
                        />
                        <Text className="text-xs font-rubik text-[#666876]">
                          {task.group_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="flex-1 justify-center items-center py-8">
                    <Text className="text-base font-rubik text-[#666876] text-center">
                      No tasks scheduled for this day
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Calendar;
