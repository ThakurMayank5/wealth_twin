import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  RegisterScreen,
  type RegistrationFormData,
} from "@/components/auth/register";
import { MaterialColors } from "@/constants/theme";
import { authService } from "@/services/auth";
import { ApiError } from "@/services/http";
import {
  ensureDeviceFingerprint,
  markOtpVerified,
  saveAuthSession,
} from "@/services/storage";

/**
 * Registration Screen for New Users
 * Collects user information for account creation
 */
export default function RegisterScreenView() {
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

  const handleContinue = async (formData: RegistrationFormData) => {
    try {
		console.log("[AUTH][REGISTER] attempt", {
			email: formData.email,
			phone: formData.mobileNumber,
			fullName: formData.fullName,
			passwordLength: formData.password.length,
		});

      const deviceFingerprint = await ensureDeviceFingerprint();
      const authResponse = await authService.register({
        email: formData.email.trim(),
        phone: formData.mobileNumber.trim(),
        full_name: formData.fullName.trim(),
        password: formData.password,
        device_fingerprint: deviceFingerprint,
      });

		console.log("[AUTH][REGISTER] success", {
			userId: authResponse.user_id,
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
		console.error("[AUTH][REGISTER] failed", error);
      Alert.alert(
        "Registration Failed",
        toErrorMessage(error, "An error occurred during registration."),
      );
    }
  };

  const handleSignIn = () => {
    // Navigate to login screen
    router.replace("/login");
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
      <RegisterScreen
        onContinuePress={handleContinue}
        onSignInPress={handleSignIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
