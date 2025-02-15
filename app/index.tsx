import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Auth from '../components/Auth';
import TestTailwind from '../components/TestTailwind';

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking connection...');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.from('test').select('*').limit(1);
        if (error) {
          setConnectionStatus('Connection Error: ' + error.message);
          console.error('Connection Error:', error.message);
        } else {
          setConnectionStatus('Connected to Supabase');
        }
      } catch (error) {
        setConnectionStatus('Connection Error: ' + (error as Error).message);
        console.error('Connection Error:', (error as Error).message);
      }
    }
    
    testConnection();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-gray-100 p-4">
      <Text className="mb-4 text-gray-600">{connectionStatus}</Text>
      <TestTailwind />
      <View className="mt-8 w-full">
        <Auth />
        {session && session.user && (
          <Text className="mt-4 text-gray-600 text-center">User ID: {session.user.id}</Text>
        )}
      </View>
    </View>
  );
}
