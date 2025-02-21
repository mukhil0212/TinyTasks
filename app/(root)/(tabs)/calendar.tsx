import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<(number | null)[][]>([]);

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

  return (
    <LinearGradient colors={['#FFFFFF', '#F8F9FF']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 10 }}>
          {/* Header with Month & Year */}
          <View className="mt-12 mb-4">
            <Text className="text-xl font-rubik-bold text-[#1A1A1A] text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
          </View>

          {/* Days of the Week */}
          <View className="flex-row justify-between mb-2">
            {daysOfWeek.map((day, index) => (
              <Text key={index} className="text-sm font-bold text-[#666876] flex-1 text-center">
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid - Fully Responsive */}
          <View className="flex flex-col">
            {days.map((week, weekIndex) => (
              <View key={weekIndex} className="flex-row">
                {week.map((day, dayIndex) => (
                  <View
                    key={dayIndex}
                    className="flex-1 aspect-square justify-center items-center rounded-lg m-1"
                    style={{
                      backgroundColor: day !== null ? '#FFFFFF' : 'transparent',
                      borderWidth: day !== null ? 1 : 0,
                      borderColor: '#7C3AED20',
                      shadowColor: day !== null ? '#7C3AED' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {day !== null && (
                      <Text className="text-base font-rubik-medium text-[#1A1A1A]">{day}</Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Calendar;
