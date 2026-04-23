import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import { WealthScreen } from "@/components/screens/wealth";

export default function WealthScreenView() {
  const router = useRouter();

  const handleNavigateToAccount = useCallback((accountId: string) => {
    console.log("Navigate to account:", accountId);
    // TODO: Implement account details navigation
  }, []);

  const handleNavigateToHome = useCallback(() => {
    router.replace("/dashboard");
  }, [router]);

  const handleNavigateToPayments = useCallback(() => {
    router.push("/payments");
  }, [router]);

  const handleNavigateToProfile = useCallback(() => {
    router.push("/profile");
  }, [router]);

  return (
    <WealthScreen
      onNavigateToAccount={handleNavigateToAccount}
      onNavigateToHome={handleNavigateToHome}
      onNavigateToPayments={handleNavigateToPayments}
      onNavigateToProfile={handleNavigateToProfile}
    />
  );
}
