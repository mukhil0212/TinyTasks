import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface SignUpProps {
  onSignInPress: () => void;
}

const SignUp = ({ onSignInPress }: SignUpProps) => {
  return (
    <View>
      <Text className="text-2xl font-bold mb-8 text-center">Sign Up</Text>
      {/* Sign Up Form will go here */}
      <View className="mt-4 flex-row justify-center">
        <Text className="text-gray-600">Already have an account? </Text>
        <TouchableOpacity onPress={onSignInPress}>
          <Text className="text-blue-500 active:text-blue-700">Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignUp;
