import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import { ProfileScreen } from "@/components/screens/profile";

export default function ProfileScreenView() {
  const router = useRouter();

  const handleLogout = useCallback(() => {
    router.replace("/");
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

  return (
    <ProfileScreen
      onLogoutPress={handleLogout}
      onNavigateToHome={handleNavigateToHome}
      onNavigateToWealth={handleNavigateToWealth}
      onNavigateToPayments={handleNavigateToPayments}
    />
  );
}
