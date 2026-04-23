import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  RegisterScreen,
  type RegistrationFormData,
} from "@/components/auth/register";
import { MaterialColors } from "@/constants/theme";

/**
 * Registration Screen for New Users
 * Collects user information for account creation
 */
export default function RegisterScreenView() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const colors = MaterialColors.light;

  const handleContinue = async (formData: RegistrationFormData) => {
    try {
      setIsLoading(true);

      // TODO: Replace with your actual registration API call
      // Example API call to create account
      /*
      const response = await fetch('https://your-api.com/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          accountNumber: formData.accountNumber,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      */

      // Simulated API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate successful registration
      if (formData.fullName && formData.email) {
        // Navigate to OTP verification
        router.push("/otp-verification");
      } else {
        Alert.alert("Error", "Please fill in all required fields.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Error",
        "An error occurred during registration. Please try again.",
        [
          {
            text: "OK",
            onPress: () => setIsLoading(false),
          },
        ],
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
