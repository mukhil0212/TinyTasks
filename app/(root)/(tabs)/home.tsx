import { View, Text, TouchableOpacity, SafeAreaView, Image, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import images from '@/constants/icons';
import icons from '@/constants/icons';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

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
                    source={images.avatar} 
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
                    {session.user.email}
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

              {/* Empty State */}
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
            </View>

            {/* Quick Actions */}
            <View className='mt-8 mb-24'>
              <Text className='text-xl font-rubik-bold text-[#1A1A1A] mb-4'>Quick Actions</Text>
              <View className='flex-row justify-between'>
                <TouchableOpacity 
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
}