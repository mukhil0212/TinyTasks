import { View, Text, ScrollView, Image, TouchableOpacity, ImageSourcePropType, ActivityIndicator, Alert, RefreshControl, Platform, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { router } from 'expo-router';
import { notificationService } from '../../../lib/notifications';
import icons from '@/constants/icons';
import images from '@/constants/icons';

interface SettingsItemProps {
  icon: ImageSourcePropType;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
}

const SettingsItem = ({ icon, title, subtitle, onPress, danger = false}: SettingsItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    className='flex-row items-center bg-white rounded-2xl p-4 mb-3'
    style={{
      borderWidth: 1,
      borderColor: danger ? '#FF4D4D20' : '#7C3AED20',
      shadowColor: danger ? '#FF4D4D' : '#7C3AED',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }}
  >
    <View
      className={`${danger ? 'bg-[#FF4D4D15]' : 'bg-[#7C3AED15]'} p-2 rounded-lg mr-3`}
    >
      <Image
        source={icon}
        style={{
          width: 20,
          height: 20,
          tintColor: danger ? '#FF4D4D' : '#7C3AED'
        }}
      />
    </View>
    <View className='flex-1'>
      <Text className={`font-rubik-medium text-base ${danger ? 'text-[#FF4D4D]' : 'text-[#1A1A1A]'}`}>
        {title}
      </Text>
      {subtitle && (
        <Text className='font-rubik text-sm text-[#666876]'>{subtitle}</Text>
      )}
    </View>
    {!danger && (
      <Image
        source={icons.rightArrow}
        style={{
          width: 16,
          height: 16,
          tintColor: '#666876'
        }}
      />
    )}
  </TouchableOpacity>
)

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userMetadata, setUserMetadata] = useState<any>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch user profile from Supabase
  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (user) {
        // Set user email
        setUserEmail(user.email || '');

        // Set user metadata
        setUserMetadata(user.user_metadata);

        // Set user name from metadata if available
        if (user.user_metadata && user.user_metadata.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user.user_metadata && user.user_metadata.name) {
          setUserName(user.user_metadata.name);
        } else if (user.email) {
          // Use email username as fallback
          const emailName = user.email.split('@')[0];
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (fullName: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;

      setUserName(fullName);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    // iOS uses Alert.prompt which is not available on Android
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Edit Profile',
        'Enter your name:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Save',
            onPress: (name) => {
              if (name && name.trim()) {
                updateUserProfile(name.trim());
              }
            },
          },
        ],
        'plain-text',
        userName,
      );
    } else {
      // For Android, we'll just show a simple alert for now
      // In a real app, you would create a custom modal with a text input
      Alert.alert(
        'Edit Profile',
        'This feature will be available soon on Android!'
      );
    }
  };

  // Handle account settings
  const handleAccountSettings = () => {
    Alert.alert(
      'Account Settings',
      'Would you like to change your account settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Name',
          onPress: handleEditProfile
        },
        {
          text: 'Change Password',
          onPress: () => {
            Alert.alert(
              'Reset Password',
              'A password reset link will be sent to your email.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send Link',
                  onPress: async () => {
                    try {
                      setLoading(true);
                      const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
                      if (error) throw error;
                      Alert.alert('Success', 'Password reset link has been sent to your email.');
                    } catch (error) {
                      console.error('Error sending reset password link:', error);
                      Alert.alert('Error', 'Failed to send password reset link. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  // Handle my tasks
  const handleMyTasks = () => {
    router.push('/(root)/(tabs)/home');
  };

  // Handle header notification bell
  const handleHeaderNotification = () => {
    Alert.alert(
      'Notifications',
      'You have no new notifications.',
      [{ text: 'OK' }]
    );
  };

  // Handle notifications settings
  const handleNotifications = () => {
    Alert.alert(
      'Notifications',
      'Would you like to manage your notification settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable All',
          onPress: () => {
            Alert.alert('Success', 'All notifications have been enabled.');
          }
        },
        {
          text: 'Disable All',
          onPress: () => {
            Alert.alert('Success', 'All notifications have been disabled.');
          }
        },
        {
          text: 'Test Notification',
          onPress: testNotification
        }
      ]
    );
  };

  // Test notification with personalized message
  const testNotification = async () => {
    try {
      setLoading(true);

      // Request notification permissions
      const permissionGranted = await notificationService.requestPermissions();
      if (!permissionGranted) {
        Alert.alert('Error', 'Notification permissions are required to test notifications.');
        return;
      }

      // Show options for notification delay
      Alert.alert(
        'Test Notification',
        'When would you like to receive the test notification?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: '5 seconds',
            onPress: async () => {
              const result = await notificationService.scheduleTestNotification({
                userName,
                delaySeconds: 5
              });

              if (result.success) {
                Alert.alert('Success', result.message);
              } else {
                Alert.alert('Error', result.message);
              }
            }
          },
          {
            text: '10 seconds',
            onPress: async () => {
              const result = await notificationService.scheduleTestNotification({
                userName,
                delaySeconds: 10
              });

              if (result.success) {
                Alert.alert('Success', result.message);
              } else {
                Alert.alert('Error', result.message);
              }
            }
          },
          {
            text: '30 seconds',
            onPress: async () => {
              const result = await notificationService.scheduleTestNotification({
                userName,
                delaySeconds: 30
              });

              if (result.success) {
                Alert.alert('Success', result.message);
              } else {
                Alert.alert('Error', result.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error testing notification:', error);
      Alert.alert('Error', 'Failed to test notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            supabase.auth.signOut();
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FF']}
      style={{ flex: 1 }}
    >
      {loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      )}
      <SafeAreaView className='h-full'>
        <ScrollView
          showsVerticalScrollIndicator={false}
          className='flex-1'
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7C3AED']} // Android
              tintColor="#7C3AED" // iOS
              title="Pull to refresh" // iOS
              titleColor="#7C3AED" // iOS
            />
          }
        >
          <View className='px-5'>
            {/* Header */}
            <View className='flex-row items-center justify-between mt-12 mb-8'>
              <Text className='text-xl font-rubik-bold text-[#1A1A1A]'>
                Profile
              </Text>
              <TouchableOpacity
                className='bg-[#7C3AED15] p-2 rounded-lg'
                style={{ borderWidth: 1, borderColor: '#7C3AED20' }}
                onPress={handleHeaderNotification}
              >
                <Image
                  source={icons.bell}
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: '#7C3AED'
                  }}
                />
              </TouchableOpacity>
            </View>

            {/* Profile Section */}
            <View className='items-center mb-8'>
              {loading ? (
                <ActivityIndicator size="large" color="#7C3AED" />
              ) : (
                <>
                  <View className='relative'>
                    <View className='bg-[#7C3AED15] p-1 rounded-full'>
                      <Image
                        source={images.avatar}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 50,
                          borderWidth: 2,
                          borderColor: '#7C3AED30'
                        }}
                      />
                    </View>
                    <TouchableOpacity
                      className='absolute bottom-0 right-0 bg-[#7C3AED] p-2 rounded-full'
                      style={{
                        borderWidth: 3,
                        borderColor: '#FFFFFF',
                        shadowColor: '#7C3AED',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 4,
                      }}
                      onPress={handleEditProfile}
                    >
                      <Image
                        source={icons.edit}
                        style={{
                          width: 16,
                          height: 16,
                          tintColor: '#FFFFFF'
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text className='text-lg font-rubik-medium text-[#1A1A1A] mt-4'>{userName}</Text>
                  <Text className='text-sm font-rubik text-[#666876]'>{userEmail}</Text>
                </>
              )}
            </View>

            {/* Settings */}
            <View className='mb-24'>
              <Text className='text-base font-rubik-medium text-[#1A1A1A] mb-3'>Settings</Text>
              <SettingsItem
                icon={icons.person}
                title="Account Settings"
                subtitle="Privacy, security, language"
                onPress={handleAccountSettings}
              />
              <SettingsItem
                icon={icons.calendar}
                title="My Tasks"
                subtitle="View and manage your tasks"
                onPress={handleMyTasks}
              />
              <SettingsItem
                icon={icons.bell}
                title="Notifications"
                subtitle="Customize your notifications"
                onPress={handleNotifications}
              />
              <SettingsItem
                icon={icons.bell}
                title="Test Notification"
                subtitle="Test personalized notifications"
                onPress={testNotification}
              />
              <SettingsItem
                icon={icons.logout}
                title="Sign Out"
                danger
                onPress={handleSignOut}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}