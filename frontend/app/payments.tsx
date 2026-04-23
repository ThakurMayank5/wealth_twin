import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import { PaymentsScreen } from "@/components/screens/payments";

export default function PaymentsScreenView() {
  const router = useRouter();

  const handleNavigateToHome = useCallback(() => {
    router.replace("/dashboard");
  }, [router]);

  const handleNavigateToWealth = useCallback(() => {
    router.push("/wealth");
  }, [router]);

  const handleNavigateToProfile = useCallback(() => {
    router.push("/profile");
  }, [router]);

  return (
    <PaymentsScreen
      onNavigateToHome={handleNavigateToHome}
      onNavigateToWealth={handleNavigateToWealth}
      onNavigateToProfile={handleNavigateToProfile}
    />
  );
}
