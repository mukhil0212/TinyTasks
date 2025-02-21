import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import SignIn from '../components/auth/SignIn';
import SignUp from '../components/auth/SignUp';
import AuthLayout from '../components/auth/AuthLayout';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: 16 }}>
        <Text style={{ fontSize: 20, fontFamily: 'Rubik-Bold', marginBottom: 16 }}>Welcome!</Text>
        <Text style={{ color: '#4b5563', fontFamily: 'Rubik-Regular' }}>User ID: {session.user.id}</Text>
        <TouchableOpacity 
          onPress={() => supabase.auth.signOut()}
          style={{
            marginTop: 16,
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: '#3b82f6',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontFamily: 'Rubik-Medium' }}>Sign Out</Text>
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
