import React, { useState, useCallback } from "react";
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

export interface RegistrationFormData {
  fullName: string;
  mobileNumber: string;
  email: string;
  cardNumber: string;
  cvv: string;
  password: string;
  confirmPassword: string;
}

interface RegisterProps {
  onContinuePress?: (formData: RegistrationFormData) => Promise<void>;
  onSignInPress?: () => void;
}

interface InputFieldProps {
  label: string;
  placeholder: string;
  icon: string;
  field: keyof RegistrationFormData;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  isLoading?: boolean;
}

// Separate component to prevent re-renders
const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  icon,
  value,
  onChangeText,
  keyboardType = "default",
  isLoading = false,
}) => {
  const colors = MaterialColors.light;

  return (
    <View style={styles.inputGroup}>
      <Text
        style={[
          styles.label,
          {
            color: colors.onSurfaceVariant,
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.outline}
          style={[
            styles.inputIcon,
            {
              opacity: 0.7,
            },
          ]}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceContainerHigh,
              color: colors.onSurface,
              paddingLeft: 36,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          value={value}
          onChangeText={onChangeText}
          editable={!isLoading}
          keyboardType={keyboardType}
          accessible={true}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
};

export const RegisterScreen: React.FC<RegisterProps> = ({
  onContinuePress,
  onSignInPress,
}) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: "",
    mobileNumber: "",
    email: "",
    cardNumber: "",
    cvv: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const colors = MaterialColors.light;

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

  const validateForm = (): boolean => {
    const {
      fullName,
      cardNumber,
      mobileNumber,
      email,
      cvv,
      password,
      confirmPassword,
    } = formData;

    if (!fullName.trim()) {
      return false;
    }

    if (!cardNumber.trim() || cardNumber.length < 13) {
      return false;
    }

    if (!mobileNumber.trim()) {
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    if (!cvv.trim() || cvv.length !== 3) {
      return false;
    }

    if (!password.trim() || password.length < 6) {
      return false;
    }

    if (password !== confirmPassword) {
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsLoading(true);
    triggerHaptic("Light");

    try {
      await onContinuePress?.(formData);
    } catch (error) {
      console.error("Registration error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = useCallback(() => {
    triggerHaptic("Light");
    onSignInPress?.();
  }, [onSignInPress]);

  const handleInputChange = useCallback(
    (field: keyof RegistrationFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.primaryContainer,
              },
            ]}
          >
            Welcome to Punjab Sind Bank
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            Secure your future today.
          </Text>
        </View>

        {/* Registration Form Card */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.surfaceContainerLowest,
            },
          ]}
        >
          {/* Top Gradient Bar */}
          <View style={styles.topBar}>
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

          {/* Form Header */}
          <View style={styles.formHeader}>
            <Text
              style={[
                styles.formTitle,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              Create Account
            </Text>
            <Text
              style={[
                styles.formSubtitle,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Please fill in your details to register.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <InputField
              label="Full Name"
              placeholder="John Doe"
              icon="account"
              field="fullName"
              value={formData.fullName}
              onChangeText={(text) => handleInputChange("fullName", text)}
              isLoading={isLoading}
            />

            <InputField
              label="Mobile Number"
              placeholder="+1 (555) 000-0000"
              icon="phone"
              field="mobileNumber"
              value={formData.mobileNumber}
              onChangeText={(text) => handleInputChange("mobileNumber", text)}
              keyboardType="phone-pad"
              isLoading={isLoading}
            />

            <InputField
              label="Email Address"
              placeholder="john.doe@example.com"
              icon="email"
              field="email"
              value={formData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              keyboardType="email-address"
              isLoading={isLoading}
            />

            <InputField
              label="Card Number"
              placeholder="0000 0000 0000 0000"
              icon="credit-card"
              field="cardNumber"
              value={formData.cardNumber}
              onChangeText={(text) => handleInputChange("cardNumber", text)}
              keyboardType="numeric"
              isLoading={isLoading}
            />

            <InputField
              label="CVV (3-digit)"
              placeholder="123"
              icon="lock"
              field="cvv"
              value={formData.cvv}
              onChangeText={(text) => handleInputChange("cvv", text)}
              keyboardType="numeric"
              isLoading={isLoading}
            />

            <InputField
              label="Password"
              placeholder="Enter password"
              icon="lock"
              field="password"
              value={formData.password}
              onChangeText={(text) => handleInputChange("password", text)}
              keyboardType="default"
              isLoading={isLoading}
            />

            <InputField
              label="Confirm Password"
              placeholder="Confirm password"
              icon="lock-check"
              field="confirmPassword"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                handleInputChange("confirmPassword", text)
              }
              keyboardType="default"
              isLoading={isLoading}
            />

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleContinue}
              disabled={isLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Continue to next step"
              accessibilityState={{ disabled: isLoading }}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  {
                    color: colors.onPrimary,
                  },
                ]}
              >
                Continue
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color={colors.onPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text
              style={[
                styles.signInText,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Already have an account?{" "}
              <Text
                style={[
                  styles.signInLink,
                  {
                    color: colors.primary,
                  },
                ]}
                onPress={handleSignIn}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://example.com/help")}
          >
            <Text
              style={[
                styles.helpLink,
                {
                  color: colors.primary,
                },
              ]}
            >
              Need Help?
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
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "400",
  },
  formCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topBar: {
    flexDirection: "row",
    height: 4,
  },
  barSegment: {
    height: 4,
  },
  formHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    fontWeight: "400",
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputContainer: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: 14,
    zIndex: 1,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingRight: 12,
    fontSize: 14,
  },
  continueButton: {
    height: 48,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  signInContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  signInText: {
    fontSize: 14,
    fontWeight: "400",
  },
  signInLink: {
    fontWeight: "600",
  },
  helpSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  helpLink: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
