import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { PinEntry } from "@/components/auth/pin-entry";
import { MaterialColors } from "@/constants/theme";

/**
 * PIN Entry Screen
 * User must enter 6-digit PIN after OTP verification
 * Shown after each login and on app resume if user is already authenticated
 */
export default function PinEntryScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const colors = MaterialColors.light;

  const handlePinComplete = async (pin: string) => {
    try {
      setIsLoading(true);

      // TODO: Replace with your actual PIN verification API call
      // Example:
      /*
      const response = await fetch('https://your-api.com/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: pin,
        }),
      });

      if (!response.ok) {
        throw new Error('PIN verification failed');
      }

      const data = await response.json();
      */

      // Simulated API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Example verification
      if (pin.length === 6) {
        // Successful PIN verification - navigate to dashboard
        Alert.alert("Success", "PIN verified successfully!", [
          {
            text: "OK",
            onPress: () => {
              router.replace("/dashboard");
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Invalid PIN. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      Alert.alert("Error", "PIN verification failed. Please try again.", [
        {
          text: "OK",
          onPress: () => setIsLoading(false),
        },
      ]);
    }
  };

  const handleForgotPin = async () => {
    try {
      // TODO: Implement PIN reset/recovery flow
      // This could show a modal or navigate to a PIN reset screen
      Alert.alert("PIN Recovery", "Contact support to reset your PIN.", [
        {
          text: "Call Support",
          onPress: () => {
            // TODO: Implement phone call to support
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("PIN recovery error:", error);
      Alert.alert("Error", "Could not initiate PIN recovery.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <PinEntry
        onPinComplete={handlePinComplete}
        maxPinLength={6}
        onForgotPin={handleForgotPin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
