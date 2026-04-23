import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MaterialColors } from "@/constants/theme";

interface OTPVerificationProps {
  onVerifyPress?: (otp: string) => Promise<void>;
  onResendPress?: () => Promise<void>;
  onBackPress?: () => void;
  onGetHelpPress?: () => void;
  phoneNumber?: string;
  initialTimeLeft?: number;
}

const OTP_LENGTH = 6;
const DEFAULT_TIMER = 102; // 1:42 in seconds

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  onVerifyPress,
  onResendPress,
  onBackPress,
  onGetHelpPress,
  phoneNumber = "+1 (***) ***-8924",
  initialTimeLeft = DEFAULT_TIMER,
}) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));
  const timerRef = useRef<NodeJS.Timeout>();

  const colors = MaterialColors.light;

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    triggerHaptic("Light");

    // Auto-focus to next field
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    index: number,
    event: { nativeEvent: { key: string } },
  ) => {
    const { key } = event.nativeEvent;

    // Handle backspace
    if (key === "Backspace" && !otp[index] && index > 0) {
      triggerHaptic("Light");
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  const handleVerify = async () => {
    if (!isOtpComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsLoading(true);
    triggerHaptic("Light");

    try {
      const otpCode = otp.join("");
      await onVerifyPress?.(otpCode);
    } catch (error) {
      console.error("Verification error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;

    setIsResending(true);
    triggerHaptic("Medium");

    try {
      await onResendPress?.();
      // Reset timer
      setTimeLeft(DEFAULT_TIMER);
      // Clear OTP
      setOtp(Array(OTP_LENGTH).fill(""));
      // Focus first input
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Resend error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    triggerHaptic("Light");
    onBackPress?.();
  };

  const handleGetHelp = () => {
    triggerHaptic("Light");
    onGetHelpPress?.();
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
      {/* Fixed Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.surfaceDim,
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
            styles.headerTitle,
            {
              color: colors.primary,
            },
          ]}
        >
          Punjab Sind Bank
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Decorative Background Elements */}
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
            backgroundColor: colors.secondaryContainer,
          },
        ]}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceContainerLowest,
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.surfaceContainerLow,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="lock-person"
              size={40}
              color={colors.primary}
            />
          </View>

          {/* Title & Description */}
          <Text
            style={[
              styles.title,
              {
                color: colors.onSurface,
              },
            ]}
          >
            Verify Identity
          </Text>

          <View style={styles.descriptionContainer}>
            <Text
              style={[
                styles.description,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              We've sent a 6-digit security code to
            </Text>
            <Text
              style={[
                styles.phoneNumber,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              {phoneNumber}
            </Text>
          </View>

          {/* OTP Input Fields */}
          <View
            style={styles.otpContainer}
            accessible={true}
            accessibilityRole="group"
            accessibilityLabel="One Time Password Input"
          >
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                    color: colors.onSurface,
                    borderColor: digit ? colors.primary : colors.outline,
                    borderWidth: digit ? 2 : 1,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleInputChange(index, text)}
                onKeyPress={(e) => handleKeyPress(index, e)}
                keyboardType="number-pad"
                maxLength={1}
                placeholder=""
                placeholderTextColor={colors.onSurfaceVariant}
                editable={!isLoading && !isResending}
                accessible={true}
                accessibilityLabel={`Digit ${index + 1}`}
              />
            ))}
          </View>

          {/* Timer and Resend */}
          <View style={styles.timerContainer}>
            <View
              style={[
                styles.timerLabel,
                {
                  opacity: timeLeft > 0 ? 1 : 0.5,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="timer"
                size={18}
                color={colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.timerText,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                {formatTime(timeLeft)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleResend}
              disabled={isResending || timeLeft > 0}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Resend code"
              accessibilityState={{ disabled: timeLeft > 0 }}
            >
              <Text
                style={[
                  styles.resendText,
                  {
                    color: timeLeft > 0 ? colors.outline : colors.primary,
                    opacity: timeLeft > 0 ? 0.5 : 1,
                  },
                ]}
              >
                Resend Code
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              {
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleVerify}
            disabled={isLoading || !isOtpComplete}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Verify identity"
            accessibilityState={{ disabled: isLoading || !isOtpComplete }}
          >
            <Text
              style={[
                styles.verifyButtonText,
                {
                  color: colors.onPrimary,
                },
              ]}
            >
              {isLoading ? "Verifying..." : "Verify Identity"}
            </Text>
            {!isLoading && (
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color={colors.onPrimary}
              />
            )}
          </TouchableOpacity>

          {/* Help Link */}
          <View style={styles.helpContainer}>
            <TouchableOpacity
              onPress={handleGetHelp}
              accessible={true}
              accessibilityRole="link"
              accessibilityLabel="Get help"
              style={styles.helpButton}
            >
              <MaterialCommunityIcons
                name="help-circle"
                size={18}
                color={colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.helpText,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                Having trouble? Get help
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  bgElement1: {
    position: "absolute",
    top: 0,
    right: -100,
    width: 600,
    height: 600,
    borderRadius: 300,
    opacity: 0.05,
    pointerEvents: "none",
  },
  bgElement2: {
    position: "absolute",
    bottom: 0,
    left: -100,
    width: 500,
    height: 500,
    borderRadius: 250,
    opacity: 0.1,
    pointerEvents: "none",
  },
  card: {
    borderRadius: 12,
    padding: 32,
    elevation: 4,
    shadowColor: "#181d1b",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: "center",
  },
  descriptionContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 4,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Manrope-Bold" : undefined,
  },
  timerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  timerLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  resendText: {
    fontSize: 14,
    fontWeight: "600",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  helpContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    paddingTop: 24,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
