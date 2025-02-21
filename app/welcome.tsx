import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#FFFFFF', '#CFE8F9', '#FAE1FA', '#FFF9FF']}
      locations={[0, 0.36, 0.70, 0.979]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/let\'s start_welcome.png')}
            style={styles.image}
            resizeMode="contain"
          />
          <View style={styles.imageOverlay} />
        </View>

        <Text style={styles.title}>Tiny Tasks</Text>

        <Text style={styles.subtitle}>
          {'Manage your\ntask and ideas quickly!'}
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/auth')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Let's Start</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
    zIndex: 1,
  },
  title: {
    fontFamily: 'Rubik-Bold',
    fontSize: 42,
    marginVertical: 20,
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: 1,
  },
  imageContainer: {
    position: 'relative',
    marginVertical: 20,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8, // Keep aspect ratio square
    opacity: 0.95,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 225, 250, 0.2)', // Subtle pink overlay to match gradient
    borderRadius: 20,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 40,
    maxWidth: '80%',
  },
  button: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    maxWidth: 400,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    marginRight: 8,
  },
  buttonArrow: {
    color: 'white',
    fontSize: 20,
  },
});

