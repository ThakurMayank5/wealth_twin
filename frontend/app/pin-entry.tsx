import React, { useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { PinEntry } from "@/components/auth/pin-entry";
import { MaterialColors } from "@/constants/theme";
import {
  clearAuthSession,
  getAppPin,
  getAuthSession,
  isOtpVerified,
  saveAppPin,
} from "@/services/storage";

/**
 * PIN Entry Screen
 * User must enter 6-digit PIN after OTP verification
 * Shown after each login and on app resume if user is already authenticated
 */
export default function PinEntryScreen() {
  const router = useRouter();
  const colors = MaterialColors.light;

  useEffect(() => {
    let mounted = true;

    const ensureReadyForPin = async () => {
      const [session, otpDone] = await Promise.all([
        getAuthSession(),
        isOtpVerified(),
      ]);

      if (!mounted) {
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      if (!otpDone) {
        router.replace("/otp-verification");
      }
    };

    ensureReadyForPin();

    return () => {
      mounted = false;
    };
  }, []);

  const handlePinComplete = async (pin: string) => {
    try {
      const existingPin = await getAppPin();
      if (!existingPin) {
        await saveAppPin(pin);
        router.replace("/dashboard");
        return;
      }

      if (existingPin !== pin) {
        Alert.alert("Incorrect PIN", "Please try again.");
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      Alert.alert("Error", "PIN verification failed. Please try again.");
    }
  };

  const handleForgotPin = async () => {
    try {
      await clearAuthSession();
      Alert.alert("PIN Reset", "Please sign in again to set a new PIN.", [
        {
          text: "Go to Login",
          onPress: () => {
            router.replace("/login");
          },
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
