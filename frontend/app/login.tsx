import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { LoginScreen } from "@/components/auth/login";
import { MaterialColors } from "@/constants/theme";

/**
 * Login Screen for App Authentication
 * Handles customer login with credentials or biometrics
 */
export default function LoginScreenView() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const colors = MaterialColors.light;

  const handleLogin = async (customerId: string, password: string) => {
    try {
      // TODO: Replace with your actual authentication logic
      // Example API call to verify credentials

      // Simulated API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Example validation - replace with actual backend call
      if (customerId && password.length >= 6) {
        // Successful login - navigate to OTP verification
        router.push("/otp-verification");
      } else {
        Alert.alert("Error", "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An error occurred during login. Please try again.");
    }
  };

  const handleBiometric = async () => {
    try {
      setIsLoading(true);

      // Check if biometric hardware is available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert(
          "Not Available",
          "Biometric authentication is not available on this device.",
        );
        return;
      }

      // Check if enrolled biometrics exist
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          "Not Enrolled",
          "Please enroll biometrics in your device settings.",
        );
        return;
      }

      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate with your fingerprint or face",
        fallbackLabel: "Use PIN instead",
        disableDeviceFallback: false,
      });

      if (result.success) {
        // TODO: Retrieve stored PIN or credentials
        // For now, we'll just navigate to OTP verification after biometric success
        router.push("/otp-verification");
      } else if (
        result.error === "user_cancel" ||
        result.error === "app_cancel"
      ) {
        // User cancelled, do nothing
      } else {
        Alert.alert(
          "Authentication Failed",
          "Biometric authentication failed. Please try again.",
        );
      }
    } catch (error) {
      console.error("Biometric error:", error);
      Alert.alert(
        "Error",
        "An error occurred during biometric authentication.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password screen or open password reset flow
    Alert.alert(
      "Forgot Password",
      "Please contact support or visit our website to reset your password.",
      [{ text: "OK" }],
    );
  };

  const handleBack = () => {
    // TODO: Navigate back to previous screen or splash screen
    router.back();
  };

  const handleSignUp = () => {
    // Navigate to register screen
    router.push("/register");
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <LoginScreen
        onLoginPress={handleLogin}
        onBiometricPress={handleBiometric}
        onForgotPasswordPress={handleForgotPassword}
        onBackPress={handleBack}
        onSignUpPress={handleSignUp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
