import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { aiService } from '@/services/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: 'Hi! I\'m your TwinVest AI advisor. Ask me anything about investments, SIPs, goals, or spending.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recs, setRecs] = useState<any[]>([]);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    aiService.getRecommendations().then(r => setRecs(r.data.items || [])).catch(() => {});
  }, []);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const res = await aiService.chat(msg);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: res.data.response, source: res.data.source,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I couldn\'t process that. Please try again.' }]);
    } finally { setSending(false); }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[ms.bubble, item.role === 'user' ? ms.userBubble : ms.aiBubble]}>
      {item.role === 'assistant' && (
        <View style={ms.aiHeader}>
          <Ionicons name="sparkles" size={14} color={Colors.secondary} />
          <Text style={ms.aiLabel}>TwinVest AI</Text>
          {item.source && <Text style={ms.srcBadge}>{item.source}</Text>}
        </View>
      )}
      <Text style={[ms.bubbleTxt, item.role === 'user' ? ms.userTxt : ms.aiTxt]}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={ms.c}>
      <View style={ms.hdr}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={ms.hdrInfo}>
          <Text style={ms.hdrTitle}>AI Advisor</Text>
          <Text style={ms.hdrSub}>Powered by Gemma</Text>
        </View>
        <View style={ms.onlineDot} />
      </View>

      {recs.length > 0 && messages.length <= 1 && (
        <View style={ms.recsSection}>
          <Text style={ms.recsTitle}>Quick Insights</Text>
          {recs.slice(0, 2).map((r: any, i: number) => (
            <TouchableOpacity key={i} style={ms.recChip} onPress={() => setInput(r.message)}>
              <Ionicons name="bulb-outline" size={14} color={Colors.primary} />
              <Text style={ms.recTxt} numberOfLines={2}>{r.message}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList ref={flatRef} data={messages} renderItem={renderMessage} keyExtractor={i => i.id}
        contentContainerStyle={ms.list} showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={ms.inputBar}>
          <TextInput style={ms.input} placeholder="Ask about your finances..."
            placeholderTextColor={Colors.textMuted} value={input} onChangeText={setInput}
            multiline maxLength={500} onSubmitEditing={send}
          />
          <TouchableOpacity style={[ms.sendBtn, (!input.trim() || sending) && ms.sendDisabled]}
            onPress={send} disabled={!input.trim() || sending}>
            {sending ? <ActivityIndicator size="small" color={Colors.textInverse} /> :
              <Ionicons name="send" size={18} color={Colors.textInverse} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ms = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.bg },
  hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  hdrInfo: { flex: 1 },
  hdrTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  hdrSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  recsSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  recsTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  recChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xs },
  recTxt: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  list: { padding: Spacing.lg, paddingBottom: Spacing.md },
  bubble: { maxWidth: '85%', borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  aiLabel: { fontSize: FontSize.xs, color: Colors.secondary, fontWeight: '600' },
  srcBadge: { fontSize: 9, color: Colors.textMuted, backgroundColor: Colors.bgInput, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 4 },
  bubbleTxt: { fontSize: FontSize.md, lineHeight: 22 },
  userTxt: { color: Colors.textInverse },
  aiTxt: { color: Colors.textPrimary },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  input: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendDisabled: { opacity: 0.4 },
});
