import { View, Text, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';

import icons from '@/constants/icons'

const TabIcon = ({ focused, icon, title }: { focused: boolean; icon: any; title:string }) => (
  <View className='flex-1 mt-2 flex flex-col items-center'>
    <View className={`p-1.5 rounded-lg ${focused ? 'bg-[#7C3AED15]' : ''}`}>
      <Image 
        source={icon} 
        tintColor={focused ? '#7C3AED' : '#666876'} 
        resizeMode='contain' 
        style={{ width: 20, height: 20 }}
      />
    </View>
    <Text className={`${focused ? 'text-[#7C3AED] font-rubik-medium' : 'text-[#666876] font-rubik'} text-[10px] w-full text-center mt-1`}>
      {title}
    </Text>
  </View>
)

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'white',
          position: 'absolute',
          borderTopColor: '#7C3AED15',
          borderTopWidth: 1,
          minHeight: 65,
          paddingBottom: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint="light"
            intensity={95}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.home} focused={focused} title="Home"/>
          )
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.calendar} focused={focused} title="Calendar"/>
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.person} focused={focused} title="Profile"/>
          )
        }}
      />
    </Tabs>
  )
}

export default TabsLayout;