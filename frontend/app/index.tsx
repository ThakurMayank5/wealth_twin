import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { MaterialColors } from "@/constants/theme";
import { getAuthSession, isOtpVerified } from "@/services/storage";

export default function Index() {
  const router = useRouter();
  const colors = MaterialColors.light;

  useEffect(() => {
    let mounted = true;

    const routeBySession = async () => {
      const session = await getAuthSession();
      const otpVerified = await isOtpVerified();

      if (!mounted) {
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      if (!otpVerified) {
        router.replace("/otp-verification");
        return;
      }

      router.replace("/pin-entry");
    };

    routeBySession();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
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
