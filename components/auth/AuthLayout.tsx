import React from 'react';
import { View } from 'react-native';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <View className="flex-1 justify-center px-4 bg-white">
      {children}
    </View>
  );
};

export default AuthLayout;
