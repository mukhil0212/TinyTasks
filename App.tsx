import './global.css'
import 'react-native-url-polyfill/auto'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { View, Text } from 'react-native'
import { Session } from '@supabase/supabase-js'
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp'
import AuthLayout from './components/auth/AuthLayout'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (session && session.user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 p-4">
        <Text className="text-xl font-bold mb-4">Welcome!</Text>
        <Text className="text-gray-600">User ID: {session.user.id}</Text>
        <Text 
          className="mt-4 text-blue-500 active:text-blue-700"
          onPress={() => supabase.auth.signOut()}
        >
          Sign Out
        </Text>
      </View>
    )
  }

  return (
    <AuthLayout>
      {isSignUp ? (
        <SignUp onSignInPress={() => setIsSignUp(false)} />
      ) : (
        <SignIn onSignUpPress={() => setIsSignUp(true)} />
      )}
    </AuthLayout>
  )
}
