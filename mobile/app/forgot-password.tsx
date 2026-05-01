import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const API_URL = `${API_BASE_URL}/api/users/forgot-password`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        Alert.alert("Sent", "Check MailBox for your OTP!");
        setStep(2);
      } else {
        Alert.alert("Error", "Email not found");
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert("Invalid Password", "Must be 8+ chars with 1 Capital, 1 Number & 1 Special char (@, -, etc)");
      return;
    }

    setLoading(true);
    try {
      const API_URL = `${API_BASE_URL}/api/users/reset-password`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      if (response.ok) {
        Alert.alert("Success", "Password updated!", [{ text: "Login", onPress: () => router.push('/login') }]);
      } else {
        Alert.alert("Error", "Invalid OTP or expired");
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>{step === 1 ? "Forgot Password?" : "Reset Password"}</Text>
        <Text style={styles.subHeader}>
          {step === 1 ? "Enter your email to receive an OTP code." : "Enter the OTP code and your new password."}
        </Text>

        {step === 1 ? (
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="OTP Code"
              placeholderTextColor="#999"
              value={otp} onChangeText={setOtp}
              keyboardType="number-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

          </>
        )}

        <TouchableOpacity style={styles.button} onPress={step === 1 ? handleSendOTP : handleResetPassword}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{step === 1 ? "Send OTP" : "Update Password"}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, justifyContent: 'center', flex: 1 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  subHeader: { fontSize: 16, color: '#666', marginBottom: 30, marginTop: 5 },
  input: { backgroundColor: '#F2F2F7', padding: 18, borderRadius: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#4facfe', padding: 20, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});