import React, { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        Alert.alert('Login Error', error.message)
      } else {
        Alert.alert('Success', 'Logged in successfully!')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    }
    setLoading(false)
  }

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }
    setLoading(true)
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.signUp({
        email: email,
        password: password,
      })

      if (error) {
        Alert.alert('Signup Error', error.message)
      } else if (!session) {
        Alert.alert('Success', 'Please check your inbox for email verification!')
        setEmail('')
        setPassword('')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope' }}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          leftIcon={{ type: 'font-awesome', name: 'lock' }}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize={'none'}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Sign in" disabled={loading} onPress={() => signInWithEmail()} />
      </View>
      <View style={styles.verticallySpaced}>
        <Button title="Sign up" disabled={loading} onPress={() => signUpWithEmail()} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
})
