import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import { DashboardScreen } from "@/components/screens/dashboard";

export default function DashboardScreenView() {
  const router = useRouter();

  const handleLogout = useCallback(() => {
    router.replace("/");
  }, [router]);

  const handleNavigateToWealth = useCallback(() => {
    router.push("/wealth");
  }, [router]);

  const handleNavigateToPayments = useCallback(() => {
    router.push("/payments");
  }, [router]);

  const handleNavigateToProfile = useCallback(() => {
    router.push("/profile");
  }, [router]);

  return (
    <DashboardScreen
      onLogoutPress={handleLogout}
      onNavigateToWealth={handleNavigateToWealth}
      onNavigateToPayments={handleNavigateToPayments}
      onNavigateToProfile={handleNavigateToProfile}
    />
  );
}
