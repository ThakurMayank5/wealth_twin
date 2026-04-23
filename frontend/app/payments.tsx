import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  PaymentsScreen,
  type PaymentTransaction,
  type PaymentTransactionSection,
} from "@/components/screens/payments";
import { MaterialColors } from "@/constants/theme";
import { ApiError } from "@/services/http";
import { clearAuthSession, getAuthSession, isOtpVerified } from "@/services/storage";
import { transactionsService } from "@/services/transactions";

const formatCurrency = (value: number): string =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const transactionIcon = (category: string): string => {
  const key = category.toLowerCase();
  if (key.includes("food") || key.includes("dining")) {
    return "silverware-fork-knife";
  }
  if (key.includes("utility") || key.includes("bill")) {
    return "lightning-bolt";
  }
  if (key.includes("salary") || key.includes("income")) {
    return "cash-plus";
  }
  if (key.includes("investment") || key.includes("sip")) {
    return "chart-line";
  }
  return "cash";
};

const toSectionTitle = (timestamp: string): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dateString = date.toDateString();
  if (dateString === today.toDateString()) {
    return "TODAY";
  }
  if (dateString === yesterday.toDateString()) {
    return "YESTERDAY";
  }

  return date
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
};

export default function PaymentsScreenView() {
  const router = useRouter();
  const colors = MaterialColors.light;
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<PaymentTransactionSection[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadTransactions = async () => {
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
        const response = await transactionsService.list({ page: 1, limit: 50 });
        const grouped = new Map<string, PaymentTransaction[]>();

        const sortedItems = [...response.items].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        for (const tx of sortedItems) {
          const section = toSectionTitle(tx.timestamp);
          const item: PaymentTransaction = {
            id: tx.id,
            title:
              tx.merchant ||
              tx.description ||
              tx.category ||
              "Transaction",
            category: `${tx.category || "General"} • ${new Date(tx.timestamp).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            amount: `${tx.type === "DEBIT" ? "-" : "+"}${formatCurrency(tx.amount)}`,
            type: tx.type === "DEBIT" ? "expense" : "income",
            icon: transactionIcon(tx.category || ""),
            time: tx.timestamp,
          };

          const existing = grouped.get(section) || [];
          existing.push(item);
          grouped.set(section, existing);
        }

        if (mounted) {
          setSections(
            Array.from(grouped.entries()).map(([title, data]) => ({
              title,
              data,
            })),
          );
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearAuthSession();
          router.replace("/login");
          return;
        }

        Alert.alert("Error", "Unable to load transactions.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      mounted = false;
    };
  }, []);

  const handleNavigateToHome = useCallback(() => {
    router.replace("/dashboard");
  }, [router]);

  const handleNavigateToWealth = useCallback(() => {
    router.push("/wealth");
  }, [router]);

  const handleNavigateToProfile = useCallback(() => {
    router.push("/profile");
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <PaymentsScreen
      onNavigateToHome={handleNavigateToHome}
      onNavigateToWealth={handleNavigateToWealth}
      onNavigateToProfile={handleNavigateToProfile}
      transactionSections={sections}
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
