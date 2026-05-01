import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    let newErrors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(form.password)) {
      newErrors.password = "Must be 8+ chars with 1 Capital, 1 Number & 1 Special char (@, -, etc)";
    }

    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const API_URL = `${API_BASE_URL}/api/users/register`; 

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Auto-login the user
        if (data.token && data.user) {
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.setItem('userId', data.user.id);
          await AsyncStorage.setItem('firstName', data.user.firstName);
          router.replace('/home');
        } else {
          Alert.alert("Success", "Account created successfully! Please login.", [
            { text: "OK", onPress: () => router.replace('/login') }
          ]);
        }
      } else {
        // Backend returned an error (e.g., User already exists)
        Alert.alert("Registration Failed", data.message || "Something went wrong");
      }
    } catch (error) {
      // Network error (e.g., Server is down or wrong IP)
      console.error(error);
      Alert.alert(
        "Connection Error", 
        "Could not connect to the server. Make sure your backend is running and you are using the correct IP address."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. This hides the default Expo "register" header bar */}
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1a1a1a" />
          </TouchableOpacity>

          <Text style={styles.header}>Create Account</Text>
          <Text style={styles.subHeader}>Join the community and start your journey</Text>
          
          <View style={styles.inputGroup}>
            {/* First Name */}
            <TextInput 
              style={[styles.input, errors.firstName && styles.inputError]} 
              placeholder="First Name" 
              placeholderTextColor="#999" // Fixed invisible placeholder
              value={form.firstName}
              onChangeText={(text) => {
                setForm({...form, firstName: text});
                if (errors.firstName) setErrors({...errors, firstName: null});
              }}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

            {/* Last Name */}
            <TextInput 
              style={[styles.input, errors.lastName && styles.inputError]} 
              placeholder="Last Name" 
              placeholderTextColor="#999"
              value={form.lastName}
              onChangeText={(text) => {
                setForm({...form, lastName: text});
                if (errors.lastName) setErrors({...errors, lastName: null});
              }}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

            {/* Email */}
            <TextInput 
              style={[styles.input, errors.email && styles.inputError]} 
              placeholder="Email Address" 
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => {
                setForm({...form, email: text.trim()});
                if (errors.email) setErrors({...errors, email: null});
              }}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Password */}
            <TextInput 
              style={[styles.input, errors.password && styles.inputError]} 
              placeholder="Password" 
              placeholderTextColor="#999"
              secureTextEntry 
              value={form.password}
              onChangeText={(text) => {
                setForm({...form, password: text});
                if (errors.password) setErrors({...errors, password: null});
              }}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {/* Confirm Password */}
            <TextInput 
              style={[styles.input, errors.confirmPassword && styles.inputError]} 
              placeholder="Confirm Password" 
              placeholderTextColor="#999"
              secureTextEntry 
              value={form.confirmPassword}
              onChangeText={(text) => {
                setForm({...form, confirmPassword: text});
                if (errors.confirmPassword) setErrors({...errors, confirmPassword: null});
              }}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Creating Account..." : "Sign Up"}</Text>
          </TouchableOpacity>

          {/* 2. Added Footer back in with forced colors */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.link}>Log In</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 10,
    marginBottom: 20,
    width: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a', // Forced black
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F2F2F7',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#000', // Forced black text for typing
  },
  button: {
    backgroundColor: '#4facfe',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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
    color: '#666', // Forced gray
    fontSize: 15,
  },
  link: {
    color: '#4facfe', // Brand blue
    fontWeight: 'bold',
    fontSize: 15,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
    marginTop: -12,
  },
});