import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, categoryColor } from '@/constants/theme';
import { transactionService } from '@/services/transactions';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [txRes, sumRes] = await Promise.all([
        transactionService.list({ limit: 30 }),
        transactionService.summary(),
      ]);
      setTransactions(txRes.data.items || []);
      setSummary(sumRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, []);
  const fmt = (v: number) => `₹${v?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}`;

  const renderItem = ({ item }: { item: any }) => {
    const isCredit = item.type === 'CREDIT';
    return (
      <View style={s.txCard}>
        <View style={[s.txIcon, { backgroundColor: categoryColor(item.category) + '20' }]}>
          <Ionicons name={isCredit ? 'arrow-down' : 'arrow-up'} size={18} color={isCredit ? Colors.success : Colors.danger} />
        </View>
        <View style={s.txInfo}>
          <Text style={s.txMerchant}>{item.merchant || item.category || 'Transaction'}</Text>
          <Text style={s.txCat}>{item.category} • {new Date(item.timestamp).toLocaleDateString()}</Text>
        </View>
        <Text style={[s.txAmt, { color: isCredit ? Colors.success : Colors.textPrimary }]}>
          {isCredit ? '+' : '-'}{fmt(item.amount)}
        </Text>
      </View>
    );
  };

  if (loading) return <SafeAreaView style={s.c}><View style={s.ld}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.c}>
      <Text style={s.hdr}>Transactions</Text>
      {summary && (
        <View style={s.sumCard}>
          <Text style={s.sumLabel}>{summary.current_month?.month}</Text>
          <Text style={s.sumVal}>{fmt(summary.current_month?.spend || 0)}</Text>
          {summary.by_category?.slice(0, 4).map((c: any, i: number) => (
            <View key={i} style={s.catRow}>
              <View style={[s.catDot, { backgroundColor: categoryColor(c.category) }]} />
              <Text style={s.catName}>{c.category}</Text>
              <Text style={s.catAmt}>{fmt(c.amount)}</Text>
            </View>
          ))}
        </View>
      )}
      <FlatList data={transactions} renderItem={renderItem} keyExtractor={i => i.id}
        contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyTxt}>No transactions</Text></View>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.bg },
  ld: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hdr: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  sumCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, margin: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sumLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sumVal: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.danger, marginVertical: Spacing.xs },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  catName: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  catAmt: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  txIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  txInfo: { flex: 1 },
  txMerchant: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  txCat: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  txAmt: { fontSize: FontSize.md, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyTxt: { color: Colors.textMuted, fontSize: FontSize.md },
});
