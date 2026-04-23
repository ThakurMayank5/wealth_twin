import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  AccessibilityInfo,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MaterialColors } from "@/constants/theme";

interface PinEntryProps {
  onPinComplete?: (pin: string) => void;
  maxPinLength?: number;
  onForgotPin?: () => void;
}

const PIN_LENGTH = 6;
const WINDOW_WIDTH = Dimensions.get("window").width;

export const PinEntry: React.FC<PinEntryProps> = ({
  onPinComplete,
  maxPinLength = PIN_LENGTH,
  onForgotPin,
}) => {
  const [pin, setPin] = useState("");
  const keypadRef = useRef<ScrollView>(null);

  const colors = MaterialColors.light;

  const handleNumberPress = (number: string) => {
    if (pin.length < maxPinLength) {
      const newPin = pin + number;
      setPin(newPin);
      triggerHaptic("Light");

      if (newPin.length === maxPinLength) {
        setTimeout(() => {
          triggerHaptic("Success");
          onPinComplete?.(newPin);
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      triggerHaptic("Light");
    }
  };

  const handleFingerprint = () => {
    triggerHaptic("Heavy");
    // TODO: Implement biometric authentication
    console.log("Fingerprint authentication requested");
  };

  const triggerHaptic = (
    intensity: "Light" | "Medium" | "Heavy" | "Success" | "Warning" | "Error",
  ) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(
        intensity === "Light"
          ? Haptics.ImpactFeedbackStyle.Light
          : intensity === "Medium"
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy,
      );
    } else if (
      intensity === "Success" ||
      intensity === "Warning" ||
      intensity === "Error"
    ) {
      Haptics.notificationAsync(
        intensity === "Success"
          ? Haptics.NotificationFeedbackType.Success
          : intensity === "Warning"
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Error,
      );
    }
  };

  const renderPinDot = (index: number) => {
    const isEntered = index < pin.length;
    return (
      <View
        key={index}
        style={[
          styles.pinDot,
          {
            backgroundColor: isEntered
              ? colors.primary
              : colors.surfaceContainerHighest,
            borderColor: isEntered ? colors.primary : colors.outlineVariant,
            shadowColor: isEntered ? colors.primary : "transparent",
            shadowOpacity: isEntered ? 0.4 : 0,
          },
        ]}
        accessible={true}
        accessibilityLabel={`PIN dot ${index + 1}`}
        accessibilityLiveRegion="polite"
      />
    );
  };

  const KeypadButton = ({
    number,
    label,
    onPress,
    icon,
    iconName,
    variant = "default",
  }: {
    number?: string;
    label?: string;
    onPress: () => void;
    icon?: boolean;
    iconName?: string;
    variant?: "default" | "action";
  }) => {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              variant === "action"
                ? colors.surfaceContainerLowest
                : "transparent",
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label || number || "Action button"}
      >
        {icon && iconName ? (
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={colors.onSurface}
            style={{ opacity: variant === "action" ? 0.7 : 1 }}
          />
        ) : (
          <>
            <Text
              style={[
                styles.buttonNumber,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              {number}
            </Text>
            {label && (
              <Text
                style={[
                  styles.buttonLabel,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                {label}
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      ref={keypadRef}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={false}
    >
      {/* Background Gradient Effect */}
      <View
        style={[
          styles.backgroundGradient,
          {
            backgroundColor: colors.surfaceContainerLow,
          },
        ]}
      />

      {/* Blur Element Background */}
      <View
        style={[
          styles.blurElement,
          {
            backgroundColor: colors.primaryContainer,
          },
        ]}
      />

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Header / Brand */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.surfaceContainerHighest,
                shadowColor: colors.onSurface,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="security"
              size={32}
              color={colors.primary}
            />
          </View>

          <Text
            style={[
              styles.title,
              {
                color: colors.onSurface,
              },
            ]}
          >
            Punjab Sind Bank
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            Enter your secure PIN to access your accounts.
          </Text>
        </View>

        {/* PIN Dots Display */}
        <View style={styles.pinDotsContainer}>
          {Array.from({ length: maxPinLength }).map((_, index) =>
            renderPinDot(index),
          )}
        </View>

        {/* Keypad */}
        <View style={styles.keypadContainer}>
          {/* Row 1 */}
          <View style={styles.keypadRow}>
            <KeypadButton number="1" onPress={() => handleNumberPress("1")} />
            <KeypadButton
              number="2"
              label="ABC"
              onPress={() => handleNumberPress("2")}
            />
            <KeypadButton
              number="3"
              label="DEF"
              onPress={() => handleNumberPress("3")}
            />
          </View>

          {/* Row 2 */}
          <View style={styles.keypadRow}>
            <KeypadButton
              number="4"
              label="GHI"
              onPress={() => handleNumberPress("4")}
            />
            <KeypadButton
              number="5"
              label="JKL"
              onPress={() => handleNumberPress("5")}
            />
            <KeypadButton
              number="6"
              label="MNO"
              onPress={() => handleNumberPress("6")}
            />
          </View>

          {/* Row 3 */}
          <View style={styles.keypadRow}>
            <KeypadButton
              number="7"
              label="PQRS"
              onPress={() => handleNumberPress("7")}
            />
            <KeypadButton
              number="8"
              label="TUV"
              onPress={() => handleNumberPress("8")}
            />
            <KeypadButton
              number="9"
              label="WXYZ"
              onPress={() => handleNumberPress("9")}
            />
          </View>

          {/* Row 4 */}
          <View style={styles.keypadRow}>
            <KeypadButton
              icon
              iconName="fingerprint"
              variant="action"
              onPress={handleFingerprint}
              label="Biometric"
            />
            <KeypadButton number="0" onPress={() => handleNumberPress("0")} />
            <KeypadButton
              icon
              iconName="backspace"
              variant="action"
              onPress={handleBackspace}
              label="Delete"
            />
          </View>
        </View>

        {/* Footer */}
        <TouchableOpacity
          style={styles.forgotButton}
          onPress={onForgotPin}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Forgot PIN"
        >
          <Text
            style={[
              styles.forgotButtonText,
              {
                color: colors.primary,
              },
            ]}
          >
            Forgot PIN?
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    opacity: 0.5,
  },
  blurElement: {
    position: "absolute",
    width: 384,
    height: 384,
    borderRadius: 192,
    opacity: 0.1,
    top: -128,
    right: -128,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 48,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  pinDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginVertical: 40,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 6,
    elevation: 2,
  },
  keypadContainer: {
    gap: 24,
    marginVertical: 24,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonNumber: {
    fontSize: 22,
    fontWeight: "700",
  },
  buttonLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 1.2,
  },
  forgotButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  forgotButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
