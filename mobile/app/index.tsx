import React from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* You can replace this URI with a local image later */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000' }} 
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>WORKOUT{"\n"}MANAGER</Text>
              <Text style={styles.tagline}>Track your progress. Conquer your goals.</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.signupButton} 
                onPress={() => router.push('/register')} // We will move your dashboard to /home
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginText}>Already have an account? Log In</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Darkens the image so text is readable
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 30,
  },
  textContainer: {
    marginTop: 100,
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tagline: {
    color: '#eee',
    fontSize: 18,
    marginTop: 10,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  signupButton: {
    backgroundColor: '#4facfe',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    width: '80%',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});