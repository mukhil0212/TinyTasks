import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function TestTailwind() {
  return (
    <View className="p-4 bg-white rounded-lg shadow-md">
      <Text className="text-xl font-bold text-primary mb-2">
        Tailwind CSS Test
      </Text>
      <Text className="text-secondary mb-4">
        This component tests Tailwind CSS styling
      </Text>
      <TouchableOpacity 
        className="bg-primary p-3 rounded-lg active:bg-primary/80"
        onPress={() => alert('Button pressed!')}
      >
        <Text className="text-white text-center font-semibold">
          Test Button
        </Text>
      </TouchableOpacity>
    </View>
  );
}
