import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { LoginScreen } from "@/components/auth/login";
import { MaterialColors } from "@/constants/theme";
import { authService } from "@/services/auth";
import { ApiError } from "@/services/http";
import {
  ensureDeviceFingerprint,
  getAuthSession,
  isOtpVerified,
  markOtpVerified,
  saveAuthSession,
} from "@/services/storage";

/**
 * Login Screen for App Authentication
 * Handles customer login with credentials or biometrics
 */
export default function LoginScreenView() {
  const router = useRouter();
  const colors = MaterialColors.light;

  const toErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }
    return fallback;
  };

  const handleLogin = async (phone: string, password: string) => {
    try {
      console.log("[AUTH][LOGIN] attempt", {
        phone,
        passwordLength: password.length,
      });

      const deviceFingerprint = await ensureDeviceFingerprint();
      const authResponse = await authService.login({
        phone: phone.trim(),
        password,
        device_fingerprint: deviceFingerprint,
      });

      console.log("[AUTH][LOGIN] success", {
        userId: authResponse.user_id,
        trustedDevice: authResponse.is_trusted_device,
        expiresIn: authResponse.expires_in,
      });

      await saveAuthSession({
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        userId: authResponse.user_id,
      });
      await markOtpVerified(false);

		// OTP send is temporarily bypassed in app flow for local testing.
		// await authService.sendOtp();
      router.push("/otp-verification");
    } catch (error) {
		console.error("[AUTH][LOGIN] failed", error);
      Alert.alert(
        "Login Failed",
        toErrorMessage(error, "Unable to sign in. Please try again."),
      );
    }
  };

  const handleBiometric = async () => {
    try {
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
        const session = await getAuthSession();
        const otpVerified = await isOtpVerified();

        if (!session) {
          Alert.alert("Session Required", "Please sign in first.");
          return;
        }

        router.push(otpVerified ? "/pin-entry" : "/otp-verification");
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
