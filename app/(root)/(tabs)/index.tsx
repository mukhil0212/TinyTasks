import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import SignIn from '../../../components/auth/SignIn';
import SignUp from '../../../components/auth/SignUp';
import AuthLayout from '../../../components/auth/AuthLayout';

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (session && session.user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 p-4">
        <Text className="text-xl font-bold mb-4">Welcome!</Text>
        <Text className="text-gray-600">User ID: {session.user.id}</Text>
        <TouchableOpacity 
          onPress={() => supabase.auth.signOut()}
          className="mt-4 py-2 px-4 bg-blue-500 rounded-lg active:bg-blue-600"
        >
          <Text className="text-white font-medium">Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <AuthLayout>
      {isSignUp ? (
        <SignUp onSignInPress={() => setIsSignUp(false)} />
      ) : (
        <SignIn onSignUpPress={() => setIsSignUp(true)} />
      )}
    </AuthLayout>
  );
}
