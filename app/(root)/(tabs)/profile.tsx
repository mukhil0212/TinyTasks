import { View, Text, ScrollView, Image, TouchableOpacity, ImageSourcePropType } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import icons from '@/constants/icons';
import images from '@/constants/icons';

interface SettingsItemProps {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textStyle?: String;
  showArrow?: boolean;
}

const SettingsItem = ({ icon, title, onPress, textStyle, showArrow = true}: SettingsItemProps) => (
  <TouchableOpacity onPress={onPress} className='flex flex-row items-center justify-between py-3'>
    <View className='flex flex-row items-center gap-3'>
      <Image source={icon} className='size-6'/>
      <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>{title}</Text>
    </View>

    {showArrow && <Image source={icons.rightArrow} className='size-5'/>}
  </TouchableOpacity>
)
const profile = () => {
  const handleLogout = async () => {};

  return (
    <SafeAreaView className='h-full bg-white'>
      <ScrollView
        showsVerticalScrollIndicator = {false}
        contentContainerClassName='pb-32 px-7'>
          <View className='flex flew-row items-center justify-between mt-5'>
            <Text className="text-xl font-rubik-bold">
              Profile
            </Text>
            <Image source={icons.bell} className='size-5'/>
          </View>

          <View className='flex-row justify-center flex mt-5'>
            <View className='flex=col items-center relative mt-5'>
              <Image source={images.avatar} className="size-44 relative rounded-full"></Image>

              <TouchableOpacity className='absolute bottom-11 right-2'>
                <Image source={icons.edit} className='size-9'></Image>
              </TouchableOpacity>
              <Text className='text-2xl font-rubik-bold'>Your Name Here</Text>
            </View>
          </View>

          <View>
            <View className='flex flex-col mt-10'>
              <SettingsItem icon={icons.calendar} title="My Bookings"/>
            </View>
          </View>
        </ScrollView>
    </SafeAreaView>
  )
}

export default profile;