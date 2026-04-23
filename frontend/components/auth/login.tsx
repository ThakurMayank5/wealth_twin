import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  SafeAreaView,
  Linking,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MaterialColors } from "@/constants/theme";

interface LoginProps {
  onLoginPress?: (customerId: string, password: string) => Promise<void>;
  onForgotPasswordPress?: () => void;
  onBiometricPress?: () => Promise<void>;
  onBackPress?: () => void;
  onSignUpPress?: () => void;
}

export const LoginScreen: React.FC<LoginProps> = ({
  onLoginPress,
  onForgotPasswordPress,
  onBiometricPress,
  onBackPress,
  onSignUpPress,
}) => {
  const [customerId, setCustomerId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowDimensions();

  const colors = MaterialColors.light;
  const isMobile = width < 768;

  const triggerHaptic = (intensity: "Light" | "Medium" | "Heavy") => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(
        intensity === "Light"
          ? Haptics.ImpactFeedbackStyle.Light
          : intensity === "Medium"
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy,
      );
    }
  };

  const handleLogin = async () => {
    if (!customerId.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsLoading(true);
    triggerHaptic("Light");

    try {
      await onLoginPress?.(customerId, password);
    } catch (error) {
      console.error("Login error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometric = async () => {
    setIsLoading(true);
    triggerHaptic("Medium");

    try {
      await onBiometricPress?.();
    } catch (error) {
      console.error("Biometric error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordVisibilityToggle = () => {
    setShowPassword(!showPassword);
    triggerHaptic("Light");
  };

  const handleForgotPassword = () => {
    triggerHaptic("Light");
    onForgotPasswordPress?.();
  };

  const handleBack = () => {
    triggerHaptic("Light");
    onBackPress?.();
  };
  const handleSignUp = () => {
    triggerHaptic("Light");
    onSignUpPress?.();
  };
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open url:", err),
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* Background Decorative Elements */}
      <View
        style={[
          styles.bgElement1,
          {
            backgroundColor: colors.primaryContainer,
          },
        ]}
      />
      <View
        style={[
          styles.bgElement2,
          {
            backgroundColor: colors.secondaryFixed,
          },
        ]}
      />

      {/* Mobile Header */}
      {isMobile && (
        <View
          style={[
            styles.mobileHeader,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.primary,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.mobileHeaderTitle,
              {
                color: colors.primary,
              },
            ]}
          >
            Punjab Sind Bank
          </Text>

          <View style={{ width: 40 }} />
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Web Header */}
        {!isMobile && (
          <View
            style={[
              styles.webHeader,
              {
                backgroundColor: colors.surfaceContainerLowest,
              },
            ]}
          >
            <Text
              style={[
                styles.webHeaderTitle,
                {
                  color: colors.primaryContainer,
                },
              ]}
            >
              Punjab Sind Bank
            </Text>
          </View>
        )}

        {/* Main Content */}
        <View
          style={[
            styles.loginContainer,
            {
              backgroundColor: colors.surfaceContainerLow,
            },
          ]}
        >
          {/* Header Text */}
          <View style={styles.headerText}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              Welcome Back
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Secure access to your financial sanctuary.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Customer ID Field */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={colors.onSurfaceVariant}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                    color: colors.onSurface,
                  },
                ]}
                placeholder="Customer ID"
                placeholderTextColor={colors.onSurfaceVariant}
                value={customerId}
                onChangeText={setCustomerId}
                editable={!isLoading}
                accessible={true}
                accessibilityLabel="Customer ID input"
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="key"
                size={20}
                color={colors.onSurfaceVariant}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                    color: colors.onSurface,
                    paddingRight: 48,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={colors.onSurfaceVariant}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                accessible={true}
                accessibilityLabel="Password input"
              />
              <TouchableOpacity
                onPress={handlePasswordVisibilityToggle}
                style={styles.visibilityButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={handleForgotPassword}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
              >
                <Text
                  style={[
                    styles.forgotPasswordText,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Log in"
              accessibilityState={{ disabled: isLoading }}
            >
              <Text
                style={[
                  styles.loginButtonText,
                  {
                    color: colors.onPrimary,
                  },
                ]}
              >
                {isLoading ? "Logging In..." : "Log In"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View
                style={[
                  styles.dividerLine,
                  {
                    backgroundColor: colors.outlineVariant,
                  },
                ]}
              />
              <Text
                style={[
                  styles.dividerText,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                OR
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  {
                    backgroundColor: colors.outlineVariant,
                  },
                ]}
              />
            </View>

            {/* Biometric Login Button */}
            <TouchableOpacity
              style={[
                styles.biometricButton,
                {
                  backgroundColor: colors.secondaryContainer,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleBiometric}
              disabled={isLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Log in with biometrics"
              accessibilityState={{ disabled: isLoading }}
            >
              <MaterialCommunityIcons
                name="fingerprint"
                size={20}
                color={colors.onSecondaryContainer}
              />
              <Text
                style={[
                  styles.biometricButtonText,
                  {
                    color: colors.onSecondaryContainer,
                  },
                ]}
              >
                Log in with Biometrics
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Decorative Bar */}
          <View style={styles.bottomBar}>
            <View
              style={[
                styles.barSegment,
                {
                  flex: 1,
                  backgroundColor: colors.primary,
                },
              ]}
            />
            <View
              style={[
                styles.barSegment,
                {
                  flex: 1,
                  backgroundColor: colors.primaryContainer,
                },
              ]}
            />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text
              style={[
                styles.signUpText,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={handleSignUp}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
            >
              <Text
                style={[
                  styles.signUpLink,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Sign up here
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => openLink("https://example.com/privacy")}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel="Privacy Policy"
          >
            <Text
              style={[
                styles.footerLink,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.footerDot,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            •
          </Text>

          <TouchableOpacity
            onPress={() => openLink("https://example.com/terms")}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel="Terms of Service"
          >
            <Text
              style={[
                styles.footerLink,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Terms of Service
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.footerDot,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            •
          </Text>

          <TouchableOpacity
            onPress={() => openLink("https://example.com/help")}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel="Help Center"
          >
            <Text
              style={[
                styles.footerLink,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Help Center
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  bgElement1: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.05,
    pointerEvents: "none",
  },
  bgElement2: {
    position: "absolute",
    bottom: -100,
    right: -50,
    width: 500,
    height: 500,
    borderRadius: 250,
    opacity: 0.1,
    pointerEvents: "none",
  },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  webHeader: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  webHeaderTitle: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  loginContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#181d1b",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  headerText: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 44,
    paddingRight: 16,
    borderRadius: 2,
    fontSize: 14,
    fontWeight: "400",
  },
  visibilityButton: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "500",
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 1.2,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 8,
  },
  biometricButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomBar: {
    flexDirection: "row",
    height: 8,
  },
  barSegment: {
    backgroundColor: "#006a5e",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 0,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: "400",
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: "400",
  },
  footerDot: {
    fontSize: 12,
    fontWeight: "400",
  },
});
