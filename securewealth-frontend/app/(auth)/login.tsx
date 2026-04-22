import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient' ;
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter phone and password');
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgGlow} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>TwinVest</Text>
          <Text style={styles.tagline}>Secure Wealth Management</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to your account</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <Text style={styles.demoHint}>
          Demo: +919876543210 / demo1234
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  bgGlow: {
    position: 'absolute', top: -100, right: -100,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.primary, opacity: 0.06,
  },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  logoSection: { alignItems: 'center', marginBottom: Spacing.xl },
  logoIcon: {
    width: 72, height: 72, borderRadius: BorderRadius.xl,
    backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  appName: { fontSize: FontSize.hero, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -1 },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  formCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  formTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  formSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  inputGroup: { gap: Spacing.md },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  eyeBtn: { padding: Spacing.xs },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    height: 52, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  registerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  registerLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  demoHint: {
    textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs,
    marginTop: Spacing.lg, fontStyle: 'italic',
  },
});
