import React, { useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { OTPVerification } from "@/components/auth/otp-verification";
import { MaterialColors } from "@/constants/theme";
import { getAuthSession, markOtpVerified } from "@/services/storage";

/**
 * OTP Verification Screen
 * Verifies user identity through OTP sent to registered phone number
 */
export default function OTPVerificationScreen() {
  const router = useRouter();
  const colors = MaterialColors.light;

  useEffect(() => {
    let mounted = true;

    const ensureSession = async () => {
      const session = await getAuthSession();
      if (!mounted) {
        return;
      }

      if (!session) {
        router.replace("/login");
      }
    };

    ensureSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleVerify = async (otp: string) => {
    try {
      console.log("[AUTH][OTP] verify attempt", {
        otp,
      });

      // OTP backend verification is temporarily bypassed for debugging.
      // Default OTP is hardcoded to 123456 for now.
      if (otp.trim() !== "123456") {
        Alert.alert("Verification Failed", "Invalid OTP. Use 123456.");
        return;
      }

      await markOtpVerified(true);
      console.log("[AUTH][OTP] local verification success");
      router.push("/pin-entry");
    } catch (error) {
      console.error("[AUTH][OTP] verify failed", error);
      Alert.alert("Verification Failed", "Unable to verify OTP.");
    }
  };

  const handleResend = async () => {
	console.log("[AUTH][OTP] resend requested, returning default otp");
	Alert.alert("Development OTP", "Use 123456 to continue.", [{ text: "OK" }]);
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
