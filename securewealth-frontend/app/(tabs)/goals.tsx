import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { goalService } from '@/services/goals';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', goal_type: 'SAVINGS', target_amount: '', target_date: '', monthly_contribution: '' });
  const [creating, setCreating] = useState(false);
  const [projection, setProjection] = useState<any>(null);
  const [projId, setProjId] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      const res = await goalService.list();
      setGoals(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchGoals(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchGoals(); }, []);
  const fmt = (v: number) => `₹${v?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}`;

  const handleCreate = async () => {
    if (!form.name || !form.target_amount || !form.target_date) {
      Alert.alert('Error', 'Name, target amount, and target date are required');
      return;
    }
    setCreating(true);
    try {
      await goalService.create({
        name: form.name, goal_type: form.goal_type,
        target_amount: parseFloat(form.target_amount),
        target_date: form.target_date,
        monthly_contribution: parseFloat(form.monthly_contribution) || 0,
      });
      setShowModal(false);
      setForm({ name: '', goal_type: 'SAVINGS', target_amount: '', target_date: '', monthly_contribution: '' });
      fetchGoals();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to create goal');
    } finally { setCreating(false); }
  };

  const showProjection = async (id: string) => {
    try {
      const res = await goalService.getProjection(id);
      setProjection(res.data);
      setProjId(id);
    } catch { Alert.alert('Error', 'Failed to load projection'); }
  };

  const renderGoal = ({ item }: { item: any }) => {
    const pct = item.target_amount > 0 ? (item.current_amount / item.target_amount) * 100 : 0;
    return (
      <TouchableOpacity style={s.card} onPress={() => showProjection(item.id)} activeOpacity={0.7}>
        <View style={s.cardTop}>
          <View style={s.goalIcon}><Ionicons name="flag" size={20} color={Colors.secondary} /></View>
          <View style={s.goalInfo}>
            <Text style={s.goalName}>{item.name}</Text>
            <Text style={s.goalType}>{item.goal_type}</Text>
          </View>
          <Text style={s.goalPct}>{pct.toFixed(0)}%</Text>
        </View>
        <View style={s.progBg}><View style={[s.progFill, { width: `${Math.min(pct, 100)}%` }]} /></View>
        <View style={s.cardBot}>
          <Text style={s.cardVal}>{fmt(item.current_amount)} <Text style={s.cardSub}>of {fmt(item.target_amount)}</Text></Text>
          <Text style={s.cardSub}>{fmt(item.monthly_contribution)}/mo</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={s.c}><View style={s.ld}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.c}>
      <View style={s.hdr}>
        <Text style={s.hdrTxt}>Goals</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList data={goals} renderItem={renderGoal} keyExtractor={i => i.id}
        contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="flag-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyTxt}>No goals yet. Create one!</Text></View>}
      />

      {/* Projection Modal */}
      <Modal visible={!!projId} transparent animationType="slide" onRequestClose={() => setProjId(null)}>
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <View style={s.modalHdr}>
              <Text style={s.modalTitle}>Goal Projection</Text>
              <TouchableOpacity onPress={() => setProjId(null)}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
            </View>
            {projection && (
              <>
                <Text style={s.projLabel}>Target: {fmt(projection.target_amount)} • {projection.months_left} months left</Text>
                {['current', 'optimistic', 'pessimistic'].map(k => (
                  <View key={k} style={s.projRow}>
                    <Text style={s.projName}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                    <Text style={s.projVal}>{fmt(projection.scenarios?.[k]?.projected_value || 0)}</Text>
                    <Text style={[s.projGap, { color: (projection.scenarios?.[k]?.gap || 0) <= 0 ? Colors.success : Colors.danger }]}>
                      Gap: {fmt(projection.scenarios?.[k]?.gap || 0)}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <View style={s.modalHdr}>
              <Text style={s.modalTitle}>New Goal</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
            </View>
            <TextInput style={s.inp} placeholder="Goal name" placeholderTextColor={Colors.textMuted} value={form.name} onChangeText={v => setForm({...form, name: v})} />
            <TextInput style={s.inp} placeholder="Target amount" placeholderTextColor={Colors.textMuted} value={form.target_amount} onChangeText={v => setForm({...form, target_amount: v})} keyboardType="numeric" />
            <TextInput style={s.inp} placeholder="Target date (YYYY-MM-DD)" placeholderTextColor={Colors.textMuted} value={form.target_date} onChangeText={v => setForm({...form, target_date: v})} />
            <TextInput style={s.inp} placeholder="Monthly contribution" placeholderTextColor={Colors.textMuted} value={form.monthly_contribution} onChangeText={v => setForm({...form, monthly_contribution: v})} keyboardType="numeric" />
            <TouchableOpacity style={[s.createBtn, creating && { opacity: 0.6 }]} onPress={handleCreate} disabled={creating}>
              {creating ? <ActivityIndicator color={Colors.textInverse} /> : <Text style={s.createTxt}>Create Goal</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.bg },
  ld: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  hdrTxt: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  goalIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.secondary + '20', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  goalInfo: { flex: 1 },
  goalName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  goalType: { fontSize: FontSize.xs, color: Colors.textMuted },
  goalPct: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  progBg: { height: 6, borderRadius: 3, backgroundColor: Colors.bgInput },
  progFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  cardBot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  cardVal: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  cardSub: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '400' },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyTxt: { color: Colors.textMuted, marginTop: Spacing.md },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '80%' },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  inp: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  createBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm },
  createTxt: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: '700' },
  projLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  projRow: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  projName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  projVal: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  projGap: { fontSize: FontSize.sm, marginTop: 2 },
});
