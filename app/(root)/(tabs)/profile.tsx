import { View, Text, ScrollView, Image, TouchableOpacity, ImageSourcePropType } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import icons from '@/constants/icons';
import images from '@/constants/icons';

interface SettingsItemProps {
  icon: ImageSourcePropType;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
}

const SettingsItem = ({ icon, title, subtitle, onPress, danger = false}: SettingsItemProps) => (
  <TouchableOpacity 
    onPress={onPress} 
    className='flex-row items-center bg-white rounded-2xl p-4 mb-3'
    style={{ 
      borderWidth: 1, 
      borderColor: danger ? '#FF4D4D20' : '#7C3AED20',
      shadowColor: danger ? '#FF4D4D' : '#7C3AED',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }}
  >
    <View 
      className={`${danger ? 'bg-[#FF4D4D15]' : 'bg-[#7C3AED15]'} p-2 rounded-lg mr-3`}
    >
      <Image 
        source={icon} 
        style={{ 
          width: 20, 
          height: 20,
          tintColor: danger ? '#FF4D4D' : '#7C3AED'
        }}
      />
    </View>
    <View className='flex-1'>
      <Text className={`font-rubik-medium text-base ${danger ? 'text-[#FF4D4D]' : 'text-[#1A1A1A]'}`}>
        {title}
      </Text>
      {subtitle && (
        <Text className='font-rubik text-sm text-[#666876]'>{subtitle}</Text>
      )}
    </View>
    {!danger && (
      <Image 
        source={icons.rightArrow} 
        style={{ 
          width: 16, 
          height: 16,
          tintColor: '#666876'
        }}
      />
    )}
  </TouchableOpacity>
)

export default function Profile() {
  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FF']}
      style={{ flex: 1 }}
    >
      <SafeAreaView className='h-full'>
        <ScrollView
          showsVerticalScrollIndicator={false}
          className='flex-1'
        >
          <View className='px-5'>
            {/* Header */}
            <View className='flex-row items-center justify-between mt-12 mb-8'>
              <Text className='text-xl font-rubik-bold text-[#1A1A1A]'>
                Profile
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

            {/* Profile Section */}
            <View className='items-center mb-8'>
              <View className='relative'>
                <View className='bg-[#7C3AED15] p-1 rounded-full'>
                  <Image 
                    source={images.avatar} 
                    style={{ 
                      width: 100, 
                      height: 100, 
                      borderRadius: 50,
                      borderWidth: 2, 
                      borderColor: '#7C3AED30' 
                    }}
                  />
                </View>
                <TouchableOpacity 
                  className='absolute bottom-0 right-0 bg-[#7C3AED] p-2 rounded-full'
                  style={{ 
                    borderWidth: 3, 
                    borderColor: '#FFFFFF',
                    shadowColor: '#7C3AED',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Image 
                    source={icons.edit} 
                    style={{ 
                      width: 16, 
                      height: 16,
                      tintColor: '#FFFFFF' 
                    }}
                  />
                </TouchableOpacity>
              </View>
              <Text className='text-lg font-rubik-medium text-[#1A1A1A] mt-4'>John Doe</Text>
              <Text className='text-sm font-rubik text-[#666876]'>john.doe@example.com</Text>
            </View>

            {/* Settings */}
            <View className='mb-24'>
              <Text className='text-base font-rubik-medium text-[#1A1A1A] mb-3'>Settings</Text>
              <SettingsItem 
                icon={icons.person} 
                title="Account Settings"
                subtitle="Privacy, security, language"
              />
              <SettingsItem 
                icon={icons.calendar} 
                title="My Tasks"
                subtitle="View and manage your tasks"
              />
              <SettingsItem 
                icon={icons.bell} 
                title="Notifications"
                subtitle="Customize your notifications"
              />
              <SettingsItem 
                icon={icons.logout} 
                title="Sign Out"
                danger
                onPress={handleSignOut}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}