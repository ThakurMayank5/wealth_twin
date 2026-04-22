import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), phone.trim(), fullName.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your wealth journey with TwinVest</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl },
  header: { marginBottom: Spacing.lg },
  backBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  titleSection: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  formCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  inputGroup: { gap: Spacing.md },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  registerBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    height: 52, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  loginText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  loginLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
});
