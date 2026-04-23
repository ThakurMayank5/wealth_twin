import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialColors } from "@/constants/theme";

interface DashboardProps {
  onLogoutPress?: () => void;
  onNavigateToWealth?: () => void;
  onNavigateToPayments?: () => void;
  onNavigateToProfile?: () => void;
  totalBalanceText?: string;
  balanceChangeText?: string;
  accountCards?: DashboardAccountCard[];
  transactions?: DashboardTransaction[];
}

export interface DashboardAccountCard {
  id: string;
  type: "savings" | "checking" | "other";
  title: string;
  accountNumber: string;
  balance: string;
  icon: string;
}

export interface DashboardTransaction {
  id: string;
  title: string;
  date: string;
  amount: string;
  type: "expense" | "income";
  icon: string;
}

const ACCOUNT_CARDS: DashboardAccountCard[] = [
  {
    id: "1",
    type: "savings",
    title: "Savings Account",
    accountNumber: "**** 4589",
    balance: "$28,450.50",
    icon: "piggy-bank",
  },
  {
    id: "2",
    type: "checking",
    title: "Checking Account",
    accountNumber: "**** 1290",
    balance: "$14,139.50",
    icon: "bank",
  },
];

const TRANSACTIONS: DashboardTransaction[] = [
  {
    id: "1",
    title: "Netflix Subscription",
    date: "Oct 24, 2023",
    amount: "-$15.99",
    type: "expense",
    icon: "movie",
  },
  {
    id: "2",
    title: "Salary Deposit",
    date: "Oct 22, 2023",
    amount: "+$4,250.00",
    type: "income",
    icon: "arrow-down",
  },
  {
    id: "3",
    title: "Starbucks",
    date: "Oct 21, 2023",
    amount: "-$4.50",
    type: "expense",
    icon: "coffee",
  },
];

const QUICK_ACTIONS = [
  { id: "1", label: "Transfer", icon: "swap-horizontal" },
  { id: "2", label: "Pay Bills", icon: "receipt" },
  { id: "3", label: "Scan & Pay", icon: "qrcode" },
  { id: "4", label: "Add Money", icon: "plus" },
];

export const DashboardScreen: React.FC<DashboardProps> = ({
  onLogoutPress,
  onNavigateToWealth,
  onNavigateToPayments,
  onNavigateToProfile,
  totalBalanceText,
  balanceChangeText,
  accountCards,
  transactions,
}) => {
  const colors = MaterialColors.light;
  const heroBalance = totalBalanceText || "$42,590.00";
  const heroDelta = balanceChangeText || "+2.4% from last month";
  const accounts = accountCards && accountCards.length > 0 ? accountCards : ACCOUNT_CARDS;
  const recentTransactions =
    transactions && transactions.length > 0 ? transactions : TRANSACTIONS;

  const handleLogout = useCallback(() => {
    onLogoutPress?.();
  }, [onLogoutPress]);

  const renderAccountCard = ({ item }: { item: DashboardAccountCard }) => (
    <View
      style={[
        styles.accountCard,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.outline,
        },
      ]}
    >
      <View style={styles.accountHeader}>
        <View style={styles.accountInfo}>
          <Text
            style={[
              styles.accountTitle,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.accountNumber,
              {
                color: colors.outline,
              },
            ]}
          >
            {item.accountNumber}
          </Text>
        </View>
        <View
          style={[
            styles.accountIcon,
            {
              backgroundColor:
                item.type === "savings"
                  ? colors.secondaryContainer
                  : colors.surfaceContainerHigh,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={
              item.type === "savings"
                ? colors.onSecondaryContainer
                : colors.primary
            }
          />
        </View>
      </View>
      <Text
        style={[
          styles.accountBalance,
          {
            color: colors.onSurface,
          },
        ]}
      >
        {item.balance}
      </Text>
    </View>
  );

  const renderTransaction = ({ item }: { item: DashboardTransaction }) => (
    <View
      style={[
        styles.transactionItem,
        {
          borderBottomColor: colors.surfaceContainerLow,
        },
      ]}
    >
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            {
              backgroundColor:
                item.type === "income"
                  ? colors.secondaryContainer
                  : colors.surfaceContainerHigh,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={
              item.type === "income"
                ? colors.onSecondaryContainer
                : colors.onSurface
            }
          />
        </View>
        <View>
          <Text
            style={[
              styles.transactionTitle,
              {
                color: colors.onSurface,
              },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.transactionDate,
              {
                color: colors.outline,
              },
            ]}
          >
            {item.date}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          {
            color: item.type === "income" ? colors.primary : colors.onSurface,
          },
        ]}
      >
        {item.amount}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surfaceContainerLow,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerButton}
            accessible={true}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="shield"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.primaryContainer,
              },
            ]}
          >
            Punjab Sind Bank
          </Text>
          <TouchableOpacity
            style={[
              styles.profileButton,
              {
                backgroundColor: colors.surfaceContainerHigh,
              },
            ]}
            onPress={handleLogout}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="User profile and logout"
          >
            <MaterialCommunityIcons
              name="account-circle"
              size={32}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Hero Balance Card */}
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Toggle balance visibility"
            >
              <MaterialCommunityIcons
                name="eye-outline"
                size={20}
                color={colors.onPrimary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{heroBalance}</Text>
          <View style={styles.balanceChange}>
            <MaterialCommunityIcons
              name="trending-up"
              size={16}
              color={colors.onPrimary}
            />
            <Text style={styles.balanceChangeText}>{heroDelta}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickAction}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <View
                style={[
                  styles.quickActionButton,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={action.icon}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.quickActionLabel,
                  {
                    color: colors.onSurface,
                  },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Accounts Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.onSurface,
              },
            ]}
          >
            My Accounts
          </Text>
          <FlatList
            data={accounts}
            renderItem={renderAccountCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountsListContent}
          />
        </View>

        {/* Recent Transactions */}
        <View
          style={[
            styles.transactionsCard,
            {
              backgroundColor: colors.surfaceContainerLowest,
            },
          ]}
        >
          <View style={styles.transactionsHeader}>
            <Text
              style={[
                styles.transactionsTitle,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              Recent Transactions
            </Text>
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="See all transactions"
            >
              <Text
                style={[
                  styles.seeAllLink,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentTransactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Insights Banner */}
        <View
          style={[
            styles.insightsBanner,
            {
              backgroundColor: colors.surfaceContainerHigh,
            },
          ]}
        >
          <View style={styles.insightsContent}>
            <Text
              style={[
                styles.insightsTitle,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              Boost your savings
            </Text>
            <Text
              style={[
                styles.insightsDescription,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Earn 4.5% APY on our new high-yield savings account. Open in
              minutes.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.insightsButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Apply now for savings account"
          >
            <Text
              style={[
                styles.insightsButtonText,
                {
                  color: colors.onPrimary,
                },
              ]}
            >
              Apply Now
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderTopColor: colors.outlineVariant,
          },
        ]}
      >
        {[
          { label: "Home", icon: "home", active: true, onPress: undefined },
          {
            label: "Wealth",
            icon: "wallet-outline",
            active: false,
            onPress: onNavigateToWealth,
          },
          {
            label: "Payments",
            icon: "credit-card",
            active: false,
            onPress: onNavigateToPayments,
          },
          {
            label: "Profile",
            icon: "account",
            active: false,
            onPress: onNavigateToProfile,
          },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            style={[
              styles.navItem,
              item.active && [
                styles.navItemActive,
                {
                  backgroundColor: colors.primary,
                },
              ],
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: item.active }}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={item.active ? colors.onPrimary : colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.navLabel,
                {
                  color: item.active
                    ? colors.onPrimary
                    : colors.onSurfaceVariant,
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  balanceCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
  },
  balanceChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  balanceChangeText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#ffffff",
    opacity: 0.9,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  quickActionButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  accountsListContent: {
    gap: 12,
  },
  accountCard: {
    width: 280,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 12,
    fontWeight: "400",
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  accountBalance: {
    fontSize: 24,
    fontWeight: "700",
  },
  transactionsCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: "600",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: "400",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  insightsBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  insightsContent: {
    flex: 1,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  insightsDescription: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  insightsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  insightsButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 20,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingBottom: 8,
  },
  navItem: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
  },
  navItemActive: {
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
});
