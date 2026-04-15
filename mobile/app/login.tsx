import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const validate = () => {
    let isValid = true;
    let newErrors: {email?: string; password?: string} = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      //your Computer's IP Address (not localhost)
      const API_URL = "http://192.168.8.184:5000/api/users/login"; 

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. Success! data.token and data.user come from your userController.js
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('firstName', data.user.firstName);
        console.log("Login Successful, Token:", data.token);
        
        // TODO: Store the token using expo-secure-store later
        
        router.push('/home');
      } else {
        // 3. Handle Backend errors (e.g., "Invalid credentials")
        Alert.alert("Login Failed", data.message || "Invalid email or password.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Check your server connection and IP address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.header}>Welcome Back</Text>
          <Text style={styles.subHeader}>Sign in to continue your progress</Text>
          
          <View style={styles.inputGroup}>
            {/* Email Field */}
            <View>
              <TextInput 
                style={[styles.input, errors.email && styles.inputError]} 
                placeholder="Email Address" 
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Field with Eye Icon */}
            <View style={styles.passwordContainer}>
              <TextInput 
                style={[styles.input, { flex: 1, marginBottom: 0 }, errors.password && styles.inputError]} 
                placeholder="Password" 
                placeholderTextColor="#999"
                secureTextEntry={!isPasswordVisible} 
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons 
                  name={isPasswordVisible ? "eye-off" : "eye"} 
                  size={22} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword} 
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, (loading || !email || !password) && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    zIndex: 1,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F2F2F7',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 16,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4facfe',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    minHeight: 62, // Keeps button height consistent during loading
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0D8FF',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#666',
    fontSize: 15,
  },
  link: {
    color: '#4facfe',
    fontWeight: 'bold',
    fontSize: 15,
  },
});