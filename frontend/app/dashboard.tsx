import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  DashboardScreen,
  type DashboardAccountCard,
  type DashboardTransaction,
} from "@/components/screens/dashboard";
import { MaterialColors } from "@/constants/theme";
import { ApiError } from "@/services/http";
import { transactionsService } from "@/services/transactions";
import { clearAuthSession, getAuthSession, isOtpVerified } from "@/services/storage";
import { wealthService } from "@/services/wealth";

const formatCurrency = (value: number): string =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const categoryIcon = (category: string): string => {
  const key = category.toLowerCase();
  if (key.includes("salary") || key.includes("income")) {
    return "arrow-down";
  }
  if (key.includes("food") || key.includes("dining")) {
    return "silverware-fork-knife";
  }
  if (key.includes("shopping") || key.includes("retail")) {
    return "shopping";
  }
  if (key.includes("travel") || key.includes("fuel")) {
    return "car";
  }
  return "cash";
};

export default function DashboardScreenView() {
  const router = useRouter();
  const colors = MaterialColors.light;
  const [loading, setLoading] = useState(true);
  const [totalBalanceText, setTotalBalanceText] = useState<string>();
  const [balanceChangeText, setBalanceChangeText] = useState<string>();
  const [accountCards, setAccountCards] = useState<DashboardAccountCard[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
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
        const [dashboard, txRes] = await Promise.all([
          wealthService.getDashboard(),
          transactionsService.list({ page: 1, limit: 5 }),
        ]);

        if (!mounted) {
          return;
        }

        setTotalBalanceText(formatCurrency(dashboard.net_worth));
        setBalanceChangeText(
          `${dashboard.monthly_savings_rate.toFixed(1)}% monthly savings rate`,
        );

        setAccountCards([
          {
            id: "liquid-assets",
            type: "savings",
            title: "Liquid Assets",
            accountNumber: "Primary",
            balance: formatCurrency(dashboard.liquid_assets),
            icon: "bank",
          },
          {
            id: "sip-monthly",
            type: "checking",
            title: "Monthly SIP",
            accountNumber: `${dashboard.active_sips} active`,
            balance: formatCurrency(dashboard.sip_total_monthly),
            icon: "chart-line",
          },
        ]);

        setTransactions(
          txRes.items.map((tx) => ({
            id: tx.id,
            title:
              tx.merchant ||
              tx.description ||
              tx.category ||
              "Transaction",
            date: new Date(tx.timestamp).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            amount: `${tx.type === "DEBIT" ? "-" : "+"}${formatCurrency(tx.amount)}`,
            type: tx.type === "DEBIT" ? "expense" : "income",
            icon: categoryIcon(tx.category),
          })),
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearAuthSession();
          router.replace("/login");
          return;
        }

        Alert.alert("Error", "Unable to load dashboard data right now.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenProfile = useCallback(() => {
    router.push("/profile");
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

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <DashboardScreen
      onLogoutPress={handleOpenProfile}
      onNavigateToWealth={handleNavigateToWealth}
      onNavigateToPayments={handleNavigateToPayments}
      onNavigateToProfile={handleNavigateToProfile}
      totalBalanceText={totalBalanceText}
      balanceChangeText={balanceChangeText}
      accountCards={accountCards}
      transactions={transactions}
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
