import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { wealthService } from '@/services/wealth';
import { sipService } from '@/services/sips';

export default function SIPsScreen() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fund_id: '', fund_name: '', amount: '', start_date: '' });

  useEffect(() => {
    (async () => {
      try { const r = await wealthService.getDashboard(); setDashboard(r.data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.fund_id || !form.fund_name || !form.amount || !form.start_date) {
      Alert.alert('Error', 'All fields required'); return;
    }
    setCreating(true);
    try {
      const res = await sipService.create({
        fund_id: form.fund_id, fund_name: form.fund_name,
        amount: parseFloat(form.amount), start_date: form.start_date,
      });
      if (res.data.status === 'PENDING_CONFIRMATION') {
        Alert.alert('Confirmation Required', res.data.warning || 'Please confirm this action', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: async () => {
            try { await sipService.confirm(res.data.confirmation_token); Alert.alert('Success', 'SIP created'); }
            catch { Alert.alert('Error', 'Confirmation failed'); }
          }},
        ]);
      } else { Alert.alert('Success', 'SIP created successfully'); }
      setShowCreate(false);
      setForm({ fund_id: '', fund_name: '', amount: '', start_date: '' });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || err?.response?.data?.reason || 'Failed');
    } finally { setCreating(false); }
  };

  const fmt = (v: number) => `₹${v?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}`;

  if (loading) return <SafeAreaView style={s.c}><View style={s.ld}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.c}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hdr}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
          <Text style={s.hdrTxt}>SIP Mandates</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={s.summaryCard}>
          <Text style={s.sumLabel}>Active SIPs</Text>
          <Text style={s.sumVal}>{dashboard?.active_sips ?? 0}</Text>
          <Text style={s.sumSub}>Total monthly: {fmt(dashboard?.sip_total_monthly || 0)}</Text>
        </View>

        {dashboard?.goals?.map((g: any) => (
          <View key={g.id} style={s.sipCard}>
            <View style={s.sipIcon}><Ionicons name="repeat" size={20} color={Colors.primary} /></View>
            <View style={s.sipInfo}>
              <Text style={s.sipName}>{g.name}</Text>
              <Text style={s.sipMeta}>{g.goal_type} • {g.status}</Text>
            </View>
            <Text style={s.sipAmt}>{fmt(g.monthly_contribution)}<Text style={s.sipFreq}>/mo</Text></Text>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <View style={s.modalHdr}>
              <Text style={s.modalTitle}>New SIP</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
            </View>
            <TextInput style={s.inp} placeholder="Fund ID" placeholderTextColor={Colors.textMuted} value={form.fund_id} onChangeText={v => setForm({...form, fund_id: v})} />
            <TextInput style={s.inp} placeholder="Fund Name" placeholderTextColor={Colors.textMuted} value={form.fund_name} onChangeText={v => setForm({...form, fund_name: v})} />
            <TextInput style={s.inp} placeholder="Amount" placeholderTextColor={Colors.textMuted} value={form.amount} onChangeText={v => setForm({...form, amount: v})} keyboardType="numeric" />
            <TextInput style={s.inp} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor={Colors.textMuted} value={form.start_date} onChangeText={v => setForm({...form, start_date: v})} />
            <TouchableOpacity style={[s.createBtn, creating && { opacity: 0.6 }]} onPress={handleCreate} disabled={creating}>
              {creating ? <ActivityIndicator color={Colors.textInverse} /> : <Text style={s.createTxt}>Create SIP</Text>}
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
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  hdr: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  hdrTxt: { flex: 1, fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  summaryCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  sumLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sumVal: { fontSize: 36, fontWeight: '700', color: Colors.primary, marginTop: Spacing.xs },
  sumSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  sipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  sipIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  sipInfo: { flex: 1 },
  sipName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  sipMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  sipAmt: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  sipFreq: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '400' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  inp: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  createBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm },
  createTxt: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: '700' },
});
