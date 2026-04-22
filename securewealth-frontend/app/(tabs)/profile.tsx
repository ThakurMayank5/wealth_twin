import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { userService, securityService } from '@/services/user';
import { useAuthStore } from '@/stores/auth-store';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const logout = useAuthStore(s => s.logout);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, eRes] = await Promise.all([
          userService.getProfile(), securityService.getEvents({ limit: 5 }),
        ]);
        setProfile(pRes.data.profile);
        setEvents(eRes.data.items || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const riskColors: Record<string, string> = { CONSERVATIVE: Colors.success, MODERATE: Colors.warning, AGGRESSIVE: Colors.danger };

  if (loading) return <SafeAreaView style={s.c}><View style={s.ld}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.c}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.hdr}>Profile</Text>

        <View style={s.profileCard}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{profile?.full_name?.[0] || '?'}</Text></View>
          <Text style={s.name}>{profile?.full_name}</Text>
          <Text style={s.email}>{profile?.email}</Text>
          <Text style={s.phone}>{profile?.phone}</Text>
          <View style={s.badges}>
            <View style={[s.badge, { backgroundColor: Colors.success + '20' }]}>
              <Text style={[s.badgeTxt, { color: Colors.success }]}>KYC: {profile?.kyc_status}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: (riskColors[profile?.risk_appetite] || Colors.warning) + '20' }]}>
              <Text style={[s.badgeTxt, { color: riskColors[profile?.risk_appetite] || Colors.warning }]}>{profile?.risk_appetite}</Text>
            </View>
          </View>
        </View>

        <View style={s.statsCard}>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Monthly Income</Text>
            <Text style={s.statVal}>₹{(profile?.avg_monthly_income || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Monthly Spend</Text>
            <Text style={s.statVal}>₹{(profile?.avg_monthly_spend || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Account Balance</Text>
            <Text style={[s.statVal, { color: Colors.success }]}>₹{(profile?.account_balance || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={s.menuSection}>
          <TouchableOpacity style={s.menuItem} onPress={() => router.push('/sips')}>
            <Ionicons name="repeat" size={22} color={Colors.primary} />
            <Text style={s.menuTxt}>Manage SIPs</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={s.menuItem} onPress={() => router.push('/ai-chat')}>
            <Ionicons name="chatbubble-ellipses" size={22} color={Colors.secondary} />
            <Text style={s.menuTxt}>AI Financial Advisor</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {events.length > 0 && (
          <View style={s.eventsSection}>
            <Text style={s.secTitle}>Recent Security Events</Text>
            {events.map((e: any) => (
              <View key={e.id} style={s.eventCard}>
                <Ionicons name={e.decision === 'ALLOW' ? 'checkmark-circle' : 'warning'} size={18}
                  color={e.decision === 'ALLOW' ? Colors.success : e.decision === 'BLOCK' ? Colors.danger : Colors.warning} />
                <View style={s.eventInfo}>
                  <Text style={s.eventType}>{e.action_type}</Text>
                  <Text style={s.eventDate}>{new Date(e.created_at).toLocaleString()}</Text>
                </View>
                <Text style={s.eventScore}>Score: {e.risk_score}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={s.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.bg },
  ld: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  hdr: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  profileCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary + '30', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  avatarTxt: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.primary },
  name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  phone: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  badgeTxt: { fontSize: FontSize.xs, fontWeight: '700' },
  statsCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statVal: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  menuSection: { marginBottom: Spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, gap: Spacing.md },
  menuTxt: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  eventsSection: { marginBottom: Spacing.lg },
  secTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, gap: Spacing.sm },
  eventInfo: { flex: 1 },
  eventType: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  eventDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  eventScore: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.danger + '40' },
  logoutTxt: { fontSize: FontSize.md, color: Colors.danger, fontWeight: '600' },
});
