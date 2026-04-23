import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialColors } from "@/constants/theme";

interface WealthProps {
  onNavigateToAccount?: (accountId: string) => void;
  onNavigateToHome?: () => void;
  onNavigateToPayments?: () => void;
  onNavigateToProfile?: () => void;
  portfolioValue?: number;
  growthText?: string;
  assetAllocation?: WealthAssetAllocation[];
  investmentAccounts?: WealthInvestmentAccount[];
}

export interface WealthInvestmentAccount {
  id: string;
  name: string;
  type: string;
  accountNumber: string;
  balance: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: string;
  iconBg: "secondary" | "surface";
}

export interface WealthAssetAllocation {
  id: string;
  name: string;
  percentage: number;
  amount: string;
  icon: string;
  color: string;
}

const INVESTMENT_ACCOUNTS: WealthInvestmentAccount[] = [
  {
    id: "1",
    name: "Main Brokerage",
    type: "Individual",
    accountNumber: "**** 4921",
    balance: "$1,850,200.00",
    change: "+0.8%",
    changeType: "positive",
    icon: "wallet-outline",
    iconBg: "secondary",
  },
  {
    id: "2",
    name: "Retirement IRA",
    type: "Traditional",
    accountNumber: "**** 8832",
    balance: "$450,000.45",
    change: "+0.2%",
    changeType: "positive",
    icon: "piggy-bank",
    iconBg: "surface",
  },
  {
    id: "3",
    name: "Global Emerging",
    type: "Managed",
    accountNumber: "**** 1094",
    balance: "$158,730.00",
    change: "-0.1%",
    changeType: "negative",
    icon: "globe",
    iconBg: "surface",
  },
];

const ASSET_ALLOCATION: WealthAssetAllocation[] = [
  {
    id: "1",
    name: "Equities",
    percentage: 65,
    amount: "$1,598,304.79",
    icon: "chart-line",
    color: "#006a5e",
  },
  {
    id: "2",
    name: "Fixed Income",
    percentage: 25,
    amount: "$614,732.61",
    icon: "bond",
    color: "#1d8577",
  },
  {
    id: "3",
    name: "Cash",
    percentage: 10,
    amount: "$245,893.05",
    icon: "cash",
    color: "#006a5e",
  },
];

export const WealthScreen: React.FC<WealthProps> = ({
  onNavigateToAccount,
  onNavigateToHome,
  onNavigateToPayments,
  onNavigateToProfile,
  portfolioValue,
  growthText,
  assetAllocation,
  investmentAccounts,
}) => {
  const colors = MaterialColors.light;
  const allocations =
    assetAllocation && assetAllocation.length > 0
      ? assetAllocation
      : ASSET_ALLOCATION;
  const accounts =
    investmentAccounts && investmentAccounts.length > 0
      ? investmentAccounts
      : INVESTMENT_ACCOUNTS;

  const totalPortfolio =
    typeof portfolioValue === "number" ? portfolioValue : 2458930.45;
  const [portfolioMain, portfolioFraction = "00"] = totalPortfolio
    .toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .split(".");

  const primaryAsset = allocations[0] || ASSET_ALLOCATION[0];
  const secondaryAsset = allocations[1] || ASSET_ALLOCATION[1];
  const tertiaryAsset = allocations[2] || ASSET_ALLOCATION[2];
  const growthBadgeText = growthText || "+₹12,450 (0.51%)";

  const renderAccountItem = ({ item }: { item: WealthInvestmentAccount }) => (
    <TouchableOpacity
      style={[
        styles.accountItem,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderBottomColor: colors.surfaceContainerLow,
        },
      ]}
      onPress={() => onNavigateToAccount?.(item.id)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.name} account with ${item.balance}`}
    >
      <View style={styles.accountLeft}>
        <View
          style={[
            styles.accountIcon,
            {
              backgroundColor:
                item.iconBg === "secondary"
                  ? colors.secondaryContainer
                  : colors.surfaceContainerHigh,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={
              item.iconBg === "secondary"
                ? colors.onSecondaryContainer
                : colors.onSurfaceVariant
            }
          />
        </View>
        <View>
          <Text
            style={[
              styles.accountName,
              {
                color: colors.onSurface,
              },
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.accountType,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            {item.type} {item.accountNumber}
          </Text>
        </View>
      </View>
      <View style={styles.accountRight}>
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
        <Text
          style={[
            styles.accountChange,
            {
              color:
                item.changeType === "positive"
                  ? colors.primary
                  : item.changeType === "negative"
                    ? colors.error
                    : colors.outline,
            },
          ]}
        >
          {item.change}
        </Text>
      </View>
    </TouchableOpacity>
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
        {/* Portfolio Header */}
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.headerLabel,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Total Portfolio Value
            </Text>
            <View style={styles.portfolioValueContainer}>
              <Text style={styles.portfolioValue}>₹{portfolioMain}</Text>
              <Text style={styles.portfolioDecimal}>.{portfolioFraction}</Text>
            </View>
          </View>
          <View
            style={[
              styles.growthBadge,
              {
                backgroundColor: colors.primaryFixedDim + "30",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="trending-up"
              size={16}
              color={colors.primary}
            />
            <Text
              style={[
                styles.growthText,
                {
                  color: colors.primary,
                },
              ]}
            >
              {growthBadgeText}
            </Text>
          </View>
        </View>

        {/* Performance Chart Section */}
        <View
          style={[
            styles.performanceCard,
            {
              backgroundColor: colors.surfaceContainerLow,
            },
          ]}
        >
          <View style={styles.performanceHeader}>
            <View>
              <Text
                style={[
                  styles.performanceTitle,
                  {
                    color: colors.onSurface,
                  },
                ]}
              >
                YTD Performance
              </Text>
              <Text
                style={[
                  styles.performanceSubtitle,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                Steady growth across core assets
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.detailedViewButton,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Detailed view"
            >
              <Text
                style={[
                  styles.detailedViewText,
                  {
                    color: colors.onSurface,
                  },
                ]}
              >
                Detailed View
              </Text>
            </TouchableOpacity>
          </View>
          {/* Placeholder for chart - gradient background */}
          <View
            style={[
              styles.chartPlaceholder,
              {
                backgroundColor: colors.primary + "15",
              },
            ]}
          />
        </View>

        {/* Asset Allocation Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.onSurface,
              },
            ]}
          >
            Asset Allocation
          </Text>

          {/* Equities - Large Card */}
          <View
            style={[
              styles.equitiesCard,
              {
                backgroundColor: colors.surfaceContainer,
              },
            ]}
          >
            <View style={styles.assetHeader}>
              <View style={styles.assetHeaderLeft}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.assetName,
                    {
                      color: colors.onSurface,
                    },
                  ]}
                >
                  {primaryAsset.name}
                </Text>
              </View>
              <Text
                style={[
                  styles.assetPercentage,
                  {
                    color: colors.onSurface,
                  },
                ]}
              >
                {primaryAsset.percentage}%
              </Text>
            </View>
            <Text
              style={[
                styles.assetAmount,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              {primaryAsset.amount}
            </Text>
            <View
              style={[
                styles.progressBarContainer,
                {
                  backgroundColor: colors.surfaceDim,
                },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.max(0, Math.min(primaryAsset.percentage, 100))}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Fixed Income & Cash - Small Cards */}
          <View style={styles.smallCardsContainer}>
            <View
              style={[
                styles.smallCard,
                {
                  backgroundColor: colors.surfaceContainerLow,
                },
              ]}
            >
              <View
                style={[
                  styles.smallCardHeader,
                  {
                    marginBottom: 8,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.smallCardLabel,
                    {
                      color: colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {secondaryAsset.name}
                </Text>
                <Text
                  style={[
                    styles.smallCardPercentage,
                    {
                      color: colors.onSurface,
                    },
                  ]}
                >
                  {secondaryAsset.percentage}%
                </Text>
              </View>
              <Text
                style={[
                  styles.smallCardAmount,
                  {
                    color: colors.onSurface,
                  },
                ]}
              >
                {secondaryAsset.amount}
              </Text>
            </View>
            <View
              style={[
                styles.smallCard,
                {
                  backgroundColor: colors.surfaceContainerLow,
                },
              ]}
            >
              <View style={styles.smallCardHeader}>
                <Text
                  style={[
                    styles.smallCardLabel,
                    {
                      color: colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {tertiaryAsset.name}
                </Text>
                <Text
                  style={[
                    styles.smallCardPercentage,
                    {
                      color: colors.onSurface,
                    },
                  ]}
                >
                  {tertiaryAsset.percentage}%
                </Text>
              </View>
              <Text
                style={[
                  styles.smallCardAmount,
                  {
                    color: colors.onSurface,
                  },
                ]}
              >
                {tertiaryAsset.amount}
              </Text>
            </View>
          </View>
        </View>

        {/* Investment Accounts Section */}
        <View style={styles.section}>
          <View style={styles.accountsHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              Investment Accounts
            </Text>
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View all accounts"
            >
              <Text
                style={[
                  styles.viewAllLink,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.accountsContainer,
              {
                backgroundColor: colors.surfaceContainerLowest,
              },
            ]}
          >
            <FlatList
              data={accounts}
              renderItem={renderAccountItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                    },
                  ]}
                />
              )}
            />
          </View>
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
          {
            label: "Home",
            icon: "home",
            active: false,
            onPress: onNavigateToHome,
          },
          {
            label: "Wealth",
            icon: "wallet-outline",
            active: true,
            onPress: undefined,
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
    marginBottom: 24,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  portfolioValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  portfolioValue: {
    fontSize: 48,
    fontWeight: "700",
    color: "#181d1b",
  },
  portfolioDecimal: {
    fontSize: 32,
    fontWeight: "700",
    color: "#bdc9c5",
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  growthText: {
    fontSize: 14,
    fontWeight: "600",
  },
  performanceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  performanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  performanceSubtitle: {
    fontSize: 14,
    fontWeight: "400",
  },
  detailedViewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailedViewText: {
    fontSize: 13,
    fontWeight: "600",
  },
  chartPlaceholder: {
    height: 160,
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  equitiesCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  assetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  assetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assetName: {
    fontSize: 16,
    fontWeight: "600",
  },
  assetPercentage: {
    fontSize: 16,
    fontWeight: "700",
  },
  assetAmount: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  smallCardsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  smallCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  smallCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallCardLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  smallCardPercentage: {
    fontSize: 13,
    fontWeight: "700",
  },
  smallCardAmount: {
    fontSize: 18,
    fontWeight: "600",
  },
  accountsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: "600",
  },
  accountsContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accountLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  accountName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  accountType: {
    fontSize: 12,
    fontWeight: "400",
  },
  accountRight: {
    alignItems: "flex-end",
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  accountChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
  },
  bottomSpacing: {
    height: 20,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  navItemActive: {
    opacity: 0.9,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
