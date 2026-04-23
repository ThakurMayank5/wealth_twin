import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  SectionList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialColors } from "@/constants/theme";

interface PaymentsProps {
  onNavigateToHome?: () => void;
  onNavigateToWealth?: () => void;
  onNavigateToProfile?: () => void;
  transactionSections?: PaymentTransactionSection[];
}

interface HeroAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: boolean;
}

interface Payee {
  id: string;
  name: string;
  icon?: string;
  avatar?: string;
  initials?: string;
}

export interface PaymentTransaction {
  id: string;
  title: string;
  category: string;
  amount: string;
  type: "expense" | "income";
  icon: string;
  time: string;
}

export interface PaymentTransactionSection {
  title: string;
  data: PaymentTransaction[];
}

const HERO_ACTIONS: HeroAction[] = [
  {
    id: "1",
    title: "Make a Payment",
    description: "Send to saved payees",
    icon: "send-money",
    gradient: true,
  },
  {
    id: "2",
    title: "Transfer Money",
    description: "Between your accounts",
    icon: "sync-alt",
    gradient: false,
  },
  {
    id: "3",
    title: "Scheduled",
    description: "Manage upcoming",
    icon: "calendar-clock",
    gradient: false,
  },
];

const PAYEES: Payee[] = [
  {
    id: "0",
    name: "New",
    icon: "plus",
  },
  {
    id: "1",
    name: "Sarah J.",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHzH1T1PgiCuqGftdOEgbP7nibYqLaqycnVGm3Ec9xr08SDrsfkOnoYi25cr5y8SXeLnRlgW_DmUziHTpTXqcChSADTmC67rPtY1YdGd6asa8LunVlkJvxD8Fbv-f5wZpWBJ2hzX56hq-e-JrewVbXekPPH67aaA4RxRBv4tdJLIO2yyAea_LtmGc9v2P4rM3PMUMQQMAlosqRyDR0WYmxICQyDeOKoWKjD8vxCZE8YafSHYHxk--z3u16K_qV7a02hflAyzk9UA",
  },
  {
    id: "2",
    name: "Marcus",
    initials: "M",
  },
  {
    id: "3",
    name: "Landlord",
    initials: "L",
  },
];

const TRANSACTIONS_BY_DATE: PaymentTransactionSection[] = [
  {
    title: "TODAY",
    data: [
      {
        id: "1",
        title: "Whole Foods Market",
        category: "Groceries • 14:23",
        amount: "-$142.50",
        type: "expense",
        icon: "shopping-cart",
        time: "14:23",
      },
      {
        id: "2",
        title: "Sarah J.",
        category: "Transfer • 09:15",
        amount: "+$50.00",
        type: "income",
        icon: "account-outline",
        time: "09:15",
      },
    ],
  },
  {
    title: "YESTERDAY",
    data: [
      {
        id: "3",
        title: "National Grid",
        category: "Utilities • Auto-pay",
        amount: "-$85.20",
        type: "expense",
        icon: "lightning-bolt",
        time: "auto",
      },
      {
        id: "4",
        title: "The Monolithic Cafe",
        category: "Dining • 12:45",
        amount: "-$24.00",
        type: "expense",
        icon: "silverware-fork-knife",
        time: "12:45",
      },
    ],
  },
];

export const PaymentsScreen: React.FC<PaymentsProps> = ({
  onNavigateToHome,
  onNavigateToWealth,
  onNavigateToProfile,
  transactionSections,
}) => {
  const colors = MaterialColors.light;
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const sourceSections =
    transactionSections && transactionSections.length > 0
      ? transactionSections
      : TRANSACTIONS_BY_DATE;

  const visibleSections = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return sourceSections
      .map((section) => ({
        ...section,
        data: section.data.filter((item) => {
          const matchesSearch =
            normalizedSearch.length === 0 ||
            item.title.toLowerCase().includes(normalizedSearch) ||
            item.category.toLowerCase().includes(normalizedSearch);

          const matchesFlow =
            activeFilter === "All" ||
            activeFilter === "Filter" ||
            (activeFilter === "In" && item.type === "income") ||
            (activeFilter === "Out" && item.type === "expense");

          return matchesSearch && matchesFlow;
        }),
      }))
      .filter((section) => section.data.length > 0);
  }, [sourceSections, searchText, activeFilter]);

  const renderHeroAction = ({ item }: { item: HeroAction }) => (
    <TouchableOpacity
      style={[
        styles.heroCard,
        item.gradient && {
          backgroundColor: colors.primary,
        },
        !item.gradient && {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.outlineVariant,
          borderWidth: 1,
        },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View
        style={[
          styles.heroIcon,
          item.gradient
            ? { backgroundColor: "rgba(255, 255, 255, 0.2)" }
            : { backgroundColor: colors.secondaryContainer },
        ]}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={24}
          color={item.gradient ? colors.onPrimary : colors.secondary}
        />
      </View>
      <View style={styles.heroContent}>
        <Text
          style={[
            styles.heroTitle,
            {
              color: item.gradient ? colors.onPrimary : colors.onSurface,
            },
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.heroDescription,
            {
              color: item.gradient
                ? "rgba(255, 255, 255, 0.8)"
                : colors.onSurfaceVariant,
            },
          ]}
        >
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPayee = ({ item }: { item: Payee }) => (
    <TouchableOpacity
      style={styles.payeeContainer}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      {item.id === "0" ? (
        <View
          style={[
            styles.payeeAvatar,
            {
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surfaceContainerLowest,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon!}
            size={24}
            color={colors.onSurfaceVariant}
          />
        </View>
      ) : item.avatar ? (
        <View
          style={[
            styles.payeeImage,
            {
              borderColor: colors.outline,
            },
          ]}
        >
          <View
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: colors.surfaceContainer,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="account-circle"
              size={32}
              color={colors.primary}
            />
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.payeeInitial,
            {
              backgroundColor: colors.secondaryContainer,
            },
          ]}
        >
          <Text
            style={[
              styles.payeeInitialText,
              {
                color: colors.onSecondaryContainer,
              },
            ]}
          >
            {item.initials}
          </Text>
        </View>
      )}
      <Text style={[styles.payeeName, { color: colors.onSurface }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: PaymentTransaction }) => (
    <TouchableOpacity
      style={[
        styles.transactionItem,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.outlineVariant,
        },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} ${item.amount}`}
    >
      <View
        style={[
          styles.transactionIcon,
          {
            backgroundColor: colors.surfaceContainer,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionTitle, { color: colors.onSurface }]}>
          {item.title}
        </Text>
        <Text
          style={[
            styles.transactionCategory,
            { color: colors.onSurfaceVariant },
          ]}
        >
          {item.category}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          {
            color: item.type === "income" ? colors.tertiary : colors.onSurface,
          },
        ]}
      >
        {item.amount}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({
    section,
  }: {
    section: PaymentTransactionSection;
  }) => (
    <Text style={[styles.dateHeader, { color: colors.onSurfaceVariant }]}>
      {section.title}
    </Text>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.primaryContainer,
            },
          ]}
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.onPrimaryContainer,
              },
            ]}
          >
            Payments
          </Text>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={styles.searchButton}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Hero Actions */}
          <FlatList
            data={HERO_ACTIONS}
            renderItem={renderHeroAction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            columnWrapperStyle={styles.heroGrid}
            numColumns={3}
            gap={12}
          />

          {/* Quick Transfer */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Quick Transfer
              </Text>
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="See all payees"
              >
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={PAYEES}
              renderItem={renderPayee}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              gap={16}
              contentContainerStyle={styles.payeesList}
            />
          </View>

          {/* Recent Activity */}
          <View
            style={[
              styles.activitySection,
              {
                backgroundColor: colors.surfaceContainerLow,
              },
            ]}
          >
            <View style={styles.activityHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Recent Activity
              </Text>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={16}
                  color={colors.onSurfaceVariant}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.onSurface }]}
                  placeholder="Search transactions..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              {["All", "In", "Out", "Filter"].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.filterButton,
                    activeFilter === filter
                      ? {
                          backgroundColor: colors.primary,
                        }
                      : {
                          backgroundColor: colors.secondaryFixedDim,
                        },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={filter}
                >
                  {filter === "Filter" && (
                    <MaterialCommunityIcons
                      name="tune"
                      size={14}
                      color={
                        activeFilter === filter
                          ? colors.onPrimary
                          : colors.onSecondaryFixed
                      }
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color:
                          activeFilter === filter
                            ? colors.onPrimary
                            : colors.onSecondaryFixed,
                      },
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transactions List */}
            <SectionList
              sections={visibleSections}
              keyExtractor={(item) => item.id}
              renderItem={renderTransaction}
              renderSectionHeader={renderSectionHeader}
              scrollEnabled={false}
              style={styles.transactionsList}
            />

            {/* Load More Button */}
            <TouchableOpacity
              style={styles.loadMoreButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Load more transactions"
            >
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Load More
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
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
            active: false,
            onPress: onNavigateToWealth,
          },
          {
            label: "Payments",
            icon: "credit-card",
            active: true,
            onPress: undefined,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  searchButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroGrid: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-between",
    minHeight: 160,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  heroContent: {
    gap: 4,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  heroDescription: {
    fontSize: 12,
    fontWeight: "400",
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  payeesList: {
    gap: 16,
    paddingBottom: 8,
  },
  payeeContainer: {
    alignItems: "center",
    gap: 8,
  },
  payeeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  payeeImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
  },
  payeeInitial: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  payeeInitialText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  payeeName: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  activitySection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  activityHeader: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
    padding: 0,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  transactionsList: {
    marginBottom: 12,
  },
  dateHeader: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginVertical: 12,
    marginHorizontal: 4,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  loadMoreButton: {
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  bottomSpacing: {
    height: 100,
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
