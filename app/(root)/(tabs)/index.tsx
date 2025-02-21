import { View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import SignIn from '../../../components/auth/SignIn';
import SignUp from '../../../components/auth/SignUp';
import AuthLayout from '../../../components/auth/AuthLayout';
import images from '@/constants/icons';
import icons from '@/constants/icons';

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Mock session for testing
    setSession({
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
      },
    } as Session);
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setSession(session);
    // });

    // supabase.auth.onAuthStateChange((_event, session) => {
    //   setSession(session);
    // });
  }, []);

  if (session && session.user) {
    return (
      <SafeAreaView className='bg-white h-full'>
        <View className='px-5'>
          <View className='flex flex-row items-start justify-between mt-16'>
            <View className='flex flex-row items-center'>
              <Image source={images.avatar} className='size-12 rounded-full'/>

              <View className='flex flex-col items-start ml-2 justify-center'>
                <Text className='text-xs font-rubik text-black-100'>Good Morning</Text>
                <Text className='text-base font-rubik-medium text-black-300'>Your Name Here</Text>
              </View>
              
            </View>
            <Image source={icons.bell} className='size-6'></Image>
          </View>
          
          <View className='my-5'>
            <View className='flex flex-row items-center justify-between'>
              <Text className='text-xl font-rubik-bold text-black-300'>Today's Tasks</Text>
              <TouchableOpacity>
                <text>See All</text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </SafeAreaView>
      // <View className="flex-1 items-center justify-center bg-gray-100 p-4">
      //   <Text className="text-xl font-bold mb-4">Welcome!</Text>
      //   <Text className="text-gray-600">User ID: {session.user.id}</Text>
      //   <TouchableOpacity 
      //     onPress={() => supabase.auth.signOut()}
      //     className="mt-4 py-2 px-4 bg-blue-500 rounded-lg active:bg-blue-600"
      //   >
      //     <Text className="text-white font-medium">Sign Out</Text>
      //   </TouchableOpacity>
      // </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-bold">Loading...</Text>
    </View>
    // <AuthLayout>
    //   {isSignUp ? (
    //     <SignUp onSignInPress={() => setIsSignUp(false)} />
    //   ) : (
    //     <SignIn onSignUpPress={() => setIsSignUp(true)} />
    //   )}
    // </AuthLayout>
  );
}
