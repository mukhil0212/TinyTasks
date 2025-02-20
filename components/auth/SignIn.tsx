import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface SignInProps {
  onSignUpPress: () => void;
}

const SignIn = ({ onSignUpPress }: SignInProps) => {
  return (
    <View>
      <Text className="text-2xl font-bold mb-8 text-center">Sign In</Text>
      {/* Sign In Form will go here */}
      <View className="mt-4 flex-row justify-center">
        <Text className="text-gray-600">Don't have an account? </Text>
        <TouchableOpacity onPress={onSignUpPress}>
          <Text className="text-blue-500 active:text-blue-700">Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignIn;
