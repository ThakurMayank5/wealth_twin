import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ProfileScreen, type ProfileData } from "@/components/screens/profile";
import { MaterialColors } from "@/constants/theme";
import { authService } from "@/services/auth";
import { ApiError } from "@/services/http";
import { clearAuthSession, getAuthSession, isOtpVerified } from "@/services/storage";
import { userService } from "@/services/user";

export default function ProfileScreenView() {
  const router = useRouter();
  const colors = MaterialColors.light;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
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
        return;
      }

      try {
        const response = await userService.getProfile();
        if (mounted) {
          setProfile(response.profile);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearAuthSession();
          router.replace("/login");
          return;
        }

        Alert.alert("Error", "Unable to load profile.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authService.logout();
          } catch {
            // Ignore logout API errors and clear local session regardless.
          }

          await clearAuthSession();
          router.replace("/login");
        },
      },
    ]);
  }, [router]);

  const handleNavigateToHome = useCallback(() => {
    router.replace("/dashboard");
  }, [router]);

  const handleNavigateToWealth = useCallback(() => {
    router.push("/wealth");
  }, [router]);

  const handleNavigateToPayments = useCallback(() => {
    router.push("/payments");
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ProfileScreen
      onLogoutPress={handleLogout}
      onNavigateToHome={handleNavigateToHome}
      onNavigateToWealth={handleNavigateToWealth}
      onNavigateToPayments={handleNavigateToPayments}
      profile={profile}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
