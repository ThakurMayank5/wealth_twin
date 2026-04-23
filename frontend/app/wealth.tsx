import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  WealthScreen,
  type WealthAssetAllocation,
  type WealthInvestmentAccount,
} from "@/components/screens/wealth";
import { MaterialColors } from "@/constants/theme";
import { ApiError } from "@/services/http";
import { clearAuthSession, getAuthSession, isOtpVerified } from "@/services/storage";
import { wealthService } from "@/services/wealth";

const formatCurrency = (value: number): string =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toTitle = (assetType: string): string =>
  assetType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const toAssetIcon = (assetType: string): string => {
  const key = assetType.toLowerCase();
  if (key.includes("equity") || key.includes("stock")) {
    return "chart-line";
  }
  if (key.includes("bank") || key.includes("cash")) {
    return "bank";
  }
  if (key.includes("gold")) {
    return "gold";
  }
  if (key.includes("bond") || key.includes("debt")) {
    return "file-document-outline";
  }
  return "wallet-outline";
};

export default function WealthScreenView() {
  const router = useRouter();
  const colors = MaterialColors.light;
  const [loading, setLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState<number>();
  const [growthText, setGrowthText] = useState<string>();
  const [allocations, setAllocations] = useState<WealthAssetAllocation[]>([]);
  const [accounts, setAccounts] = useState<WealthInvestmentAccount[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadWealthData = async () => {
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
        const [netWorth, dashboard] = await Promise.all([
          wealthService.getNetWorth(),
          wealthService.getDashboard(),
        ]);

        if (!mounted) {
          return;
        }

        setPortfolioValue(netWorth.total_net_worth);
        setGrowthText(`${dashboard.monthly_savings_rate.toFixed(1)}% monthly savings rate`);

        const breakdown = [...netWorth.breakdown].sort((a, b) => b.value - a.value);
        const total = netWorth.total_net_worth > 0 ? netWorth.total_net_worth : 1;

        setAllocations(
          breakdown.slice(0, 3).map((item, index) => ({
            id: `${item.asset_type}-${index}`,
            name: toTitle(item.asset_type),
            percentage: Math.round((item.value / total) * 100),
            amount: formatCurrency(item.value),
            icon: toAssetIcon(item.asset_type),
            color: "#006a5e",
          })),
        );

        setAccounts(
          breakdown.slice(0, 5).map((item, index) => ({
            id: `${item.asset_type}-${index}`,
            name: toTitle(item.asset_type),
            type: "Portfolio",
            accountNumber: `${index + 1}`.padStart(4, "0"),
            balance: formatCurrency(item.value),
            change: "Live",
            changeType: "neutral",
            icon: toAssetIcon(item.asset_type),
            iconBg: index === 0 ? "secondary" : "surface",
          })),
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearAuthSession();
          router.replace("/login");
          return;
        }

        Alert.alert("Error", "Unable to load wealth data.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadWealthData();

    return () => {
      mounted = false;
    };
  }, []);

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

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <WealthScreen
      onNavigateToAccount={handleNavigateToAccount}
      onNavigateToHome={handleNavigateToHome}
      onNavigateToPayments={handleNavigateToPayments}
      onNavigateToProfile={handleNavigateToProfile}
      portfolioValue={portfolioValue}
      growthText={growthText}
      assetAllocation={allocations}
      investmentAccounts={accounts}
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
