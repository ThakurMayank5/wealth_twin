import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { OTPVerification } from "@/components/auth/otp-verification";
import { MaterialColors } from "@/constants/theme";

/**
 * OTP Verification Screen
 * Verifies user identity through OTP sent to registered phone number
 */
export default function OTPVerificationScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const colors = MaterialColors.light;

  const handleVerify = async (otp: string) => {
    try {
      setIsLoading(true);

      // TODO: Replace with your actual OTP verification API call
      // Example:
      /*
      const response = await fetch('https://your-api.com/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: otp,
          phone: '+1(***) ***-8924',
        }),
      });

      if (!response.ok) {
        throw new Error('OTP verification failed');
      }

      const data = await response.json();
      */

      // Simulated API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Example verification
      if (otp.length === 6) {
        // Successful verification - navigate to PIN entry
        Alert.alert("Success", "Identity verified successfully!", [
          {
            text: "OK",
            onPress: () => {
              router.push("/pin-entry");
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Invalid OTP. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Verification error:", error);
      Alert.alert("Error", "Verification failed. Please try again.", [
        {
          text: "OK",
          onPress: () => setIsLoading(false),
        },
      ]);
    }
  };

  const handleResend = async () => {
    try {
      // TODO: Replace with your actual resend OTP API call
      // Example:
      /*
      const response = await fetch('https://your-api.com/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '+1(***) ***-8924',
        }),
      });

      if (!response.ok) {
        throw new Error('Resend failed');
      }
      */

      // Simulated API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Success", "Code resent to your phone!", [{ text: "OK" }]);
    } catch (error) {
      console.error("Resend error:", error);
      Alert.alert("Error", "Failed to resend code. Please try again.");
      throw error;
    }
  };

  const handleGetHelp = () => {
    // TODO: Navigate to help center or contact support
    Alert.alert(
      "Need Help?",
      "Please contact our support team or visit the help center for assistance.",
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Contact Support",
          onPress: () => {
            // Open contact email or support URL
            // Linking.openURL('mailto:support@vault.com');
          },
        },
      ],
    );
  };

  const handleBack = () => {
    // Navigate back to previous screen
    router.back();
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
      <OTPVerification
        onVerifyPress={handleVerify}
        onResendPress={handleResend}
        onGetHelpPress={handleGetHelp}
        onBackPress={handleBack}
        phoneNumber="+1 (***) ***-8924"
        initialTimeLeft={102}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
