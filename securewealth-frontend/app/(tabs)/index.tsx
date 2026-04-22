import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { wealthService } from '@/services/wealth';

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await wealthService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const formatCurrency = (v: number) =>
    `₹${v?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}`;

  const savingsRate = data?.monthly_savings_rate ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getGreeting()}</Text>
            <Text style={styles.headerTitle}>TwinVest</Text>
          </View>
          <TouchableOpacity style={styles.chatBtn} onPress={() => router.push('/ai-chat')}>
            <Ionicons name="chatbubble-ellipses" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Net Worth Card */}
        <View style={styles.netWorthCard}>
          <View style={styles.netWorthGlow} />
          <Text style={styles.netWorthLabel}>Total Net Worth</Text>
          <Text style={styles.netWorthValue}>{formatCurrency(data?.net_worth || 0)}</Text>
          <View style={styles.netWorthRow}>
            <View style={styles.netWorthItem}>
              <Text style={styles.netWorthItemLabel}>Liquid</Text>
              <Text style={styles.netWorthItemValue}>{formatCurrency(data?.liquid_assets || 0)}</Text>
            </View>
            <View style={styles.netWorthDivider} />
            <View style={styles.netWorthItem}>
              <Text style={styles.netWorthItemLabel}>Savings Rate</Text>
              <Text style={[styles.netWorthItemValue, { color: savingsRate >= 20 ? Colors.success : savingsRate >= 10 ? Colors.warning : Colors.danger }]}>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/sips')}>
            <Ionicons name="repeat" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{data?.active_sips ?? 0}</Text>
            <Text style={styles.statLabel}>Active SIPs</Text>
            <Text style={styles.statSub}>{formatCurrency(data?.sip_total_monthly || 0)}/mo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/goals')}>
            <Ionicons name="flag" size={24} color={Colors.secondary} />
            <Text style={styles.statValue}>{data?.goals?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Goals</Text>
            <Text style={styles.statSub}>Active</Text>
          </TouchableOpacity>
        </View>

        {/* Security Status */}
        <View style={styles.securityCard}>
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.securityText}>Wealth Protection: {data?.wealth_protection_status || 'ENABLED'}</Text>
          </View>
        </View>

        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {data.alerts.map((alert: string, i: number) => (
              <View key={i} style={styles.alertCard}>
                <Ionicons name="warning" size={18} color={Colors.warning} />
                <Text style={styles.alertText}>{alert}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {data?.top_recommendations && data.top_recommendations.length > 0 && (
          <View style={styles.recsSection}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {data.top_recommendations.map((rec: string, i: number) => (
              <View key={i} style={styles.recCard}>
                <Ionicons name="bulb" size={18} color={Colors.primary} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Goals Progress */}
        {data?.goals && data.goals.length > 0 && (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>Goal Progress</Text>
            {data.goals.slice(0, 3).map((goal: any) => {
              const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalPercent}>{progress.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                  <View style={styles.goalFooter}>
                    <Text style={styles.goalAmount}>{formatCurrency(goal.current_amount)}</Text>
                    <Text style={styles.goalTarget}>of {formatCurrency(goal.target_amount)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  chatBtn: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },

  netWorthCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.lg, overflow: 'hidden',
  },
  netWorthGlow: {
    position: 'absolute', top: -40, right: -40, width: 120, height: 120,
    borderRadius: 60, backgroundColor: Colors.primary, opacity: 0.08,
  },
  netWorthLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  netWorthValue: { fontSize: 38, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.xs },
  netWorthRow: { flexDirection: 'row', marginTop: Spacing.lg },
  netWorthItem: { flex: 1, alignItems: 'center' },
  netWorthDivider: { width: 1, backgroundColor: Colors.border },
  netWorthItemLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  netWorthItemValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  statSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  securityCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg,
  },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  securityText: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '600' },

  alertsSection: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  alertText: { flex: 1, color: Colors.warning, fontSize: FontSize.sm },

  recsSection: { marginBottom: Spacing.lg },
  recCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  recText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },

  goalsSection: { marginBottom: Spacing.lg },
  goalCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  goalName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  goalPercent: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: Colors.bgInput },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  goalAmount: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  goalTarget: { fontSize: FontSize.sm, color: Colors.textMuted },
});
