import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../store/AppContext';
import { theme } from '../theme/theme';
import { AI_PROVIDERS } from '../services/agent';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  MessageCircle, 
  Sparkles, 
  Bookmark, 
  Save,
  Key,
  Trash2,
  Clock,
  Sun,
  Moon
} from 'lucide-react-native';

const INITIAL_PRESETS = [
  'AI trends in travel industry',
  'AI trends in banking industry',
  'AI trends in e-commerce',
  'AI hackathon projects',
  'AI in software',
  'AI news',
  'GitHub AI repos'
];

export default function SettingsScreen({ navigation }: any) {
  const { preferences, updatePreferences } = useAppContext();

  const [selectedProvider, setSelectedProvider] = useState<string>('Gemini');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [allTopics, setAllTopics] = useState<string[]>(INITIAL_PRESETS);
  const [customInterest, setCustomInterest] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [autoDeliver, setAutoDeliver] = useState<boolean>(true);
  const [scheduleMode, setScheduleMode] = useState<'twice_daily' | 'daily'>('twice_daily');

  useEffect(() => {
    if (preferences) {
      if (preferences.aiProvider) setSelectedProvider(preferences.aiProvider);
      if (preferences.geminiApiKey) setGeminiApiKey(preferences.geminiApiKey);
      if (preferences.selectedInterests) {
        setSelectedInterests(preferences.selectedInterests);
        const combined = Array.from(new Set([...INITIAL_PRESETS, ...preferences.selectedInterests]));
        setAllTopics(combined);
      }
      if (preferences.whatsappNumber) setWhatsapp(preferences.whatsappNumber);
      if (preferences.autoDeliverWhatsApp !== undefined) setAutoDeliver(preferences.autoDeliverWhatsApp);
      if (preferences.scheduleFrequency) setScheduleMode(preferences.scheduleFrequency);
    }
  }, [preferences]);

  const toggleInterest = (topic: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      } else {
        return [...prev, topic];
      }
    });
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (!allTopics.includes(trimmed)) {
      setAllTopics(prev => [...prev, trimmed]);
    }
    if (!selectedInterests.includes(trimmed)) {
      setSelectedInterests(prev => [...prev, trimmed]);
    }
    setCustomInterest('');
  };

  const removeTopicCompletely = (topic: string) => {
    Alert.alert('Remove Topic', `Are you sure you want to remove "${topic}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: () => {
          setAllTopics(prev => prev.filter(t => t !== topic));
          setSelectedInterests(prev => prev.filter(t => t !== topic));
        }
      }
    ]);
  };

  const handleSave = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one interest topic for your Daily Digest.');
      return;
    }

    await updatePreferences({
      selectedInterests,
      aiProvider: selectedProvider as any,
      geminiApiKey: geminiApiKey.trim(),
      whatsappNumber: whatsapp.trim(),
      autoDeliverWhatsApp: autoDeliver,
      scheduleFrequency: scheduleMode,
      digestTime: scheduleMode === 'twice_daily' ? '08:00 & 20:00' : '08:00',
      isOnboarded: true
    });

    Alert.alert('Settings Saved', 'Preferences updated successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#F8FAFC" size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Schedule</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Save color="#fff" size={16} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Research Schedule (Twice Daily 8 AM & 8 PM) */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Clock color={theme.colors.primaryLight} size={16} />
            <Text style={styles.sectionTitle}>Automated Research Schedule</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Twice daily morning and evening research cycles:</Text>

          <View style={styles.scheduleCardsRow}>
            <TouchableOpacity 
              style={[styles.scheduleCard, scheduleMode === 'twice_daily' && styles.scheduleCardSelected]}
              onPress={() => setScheduleMode('twice_daily')}
              activeOpacity={0.7}
            >
              <View style={styles.scheduleCardHeader}>
                <Sun color="#F59E0B" size={16} />
                <Text style={styles.plusSymbol}>+</Text>
                <Moon color="#818CF8" size={16} />
              </View>
              <Text style={styles.scheduleTitle}>Twice Daily</Text>
              <Text style={styles.scheduleTimeBadge}>8:00 AM & 8:00 PM</Text>
              {scheduleMode === 'twice_daily' && <CheckCircle2 color={theme.colors.primaryLight} size={15} style={styles.checkPos} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.scheduleCard, scheduleMode === 'daily' && styles.scheduleCardSelected]}
              onPress={() => setScheduleMode('daily')}
              activeOpacity={0.7}
            >
              <Sun color="#F59E0B" size={16} />
              <Text style={styles.scheduleTitle}>Once Daily</Text>
              <Text style={styles.scheduleTimeBadge}>8:00 AM Morning</Text>
              {scheduleMode === 'daily' && <CheckCircle2 color={theme.colors.primaryLight} size={15} style={styles.checkPos} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: AI Intelligence Model */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Sparkles color={theme.colors.primaryLight} size={16} />
            <Text style={styles.sectionTitle}>AI Intelligence Engine</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Primary model for automated background research:</Text>
          
          <View style={styles.gridContainer}>
            {AI_PROVIDERS.map(p => {
              const isSelected = selectedProvider === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.providerCard, isSelected && styles.providerCardSelected]}
                  onPress={() => setSelectedProvider(p.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.providerName, isSelected && styles.providerNameSelected]}>
                    {p.name}
                  </Text>
                  {isSelected && <CheckCircle2 color={theme.colors.primaryLight} size={15} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 3: Gemini API Key */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Key color={theme.colors.secondary} size={16} />
            <Text style={styles.sectionTitle}>Gemini API Key (Direct Online Research)</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Optional API key for live web search research generation:
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="AIzaSy... (Paste Gemini API key)"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            secureTextEntry={false}
            value={geminiApiKey}
            onChangeText={setGeminiApiKey}
          />
        </View>

        {/* Section 4: Topics of Interest with Provision to Remove */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Bookmark color={theme.colors.secondary} size={16} />
            <Text style={styles.sectionTitle}>Topics of Interest</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Tap to toggle. Tap 🗑️ to delete custom or unwanted topics:</Text>

          <View style={styles.interestsList}>
            {allTopics.map(topic => {
              const isSelected = selectedInterests.includes(topic);
              return (
                <View 
                  key={topic} 
                  style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                >
                  <TouchableOpacity
                    style={styles.interestChipTextTouch}
                    onPress={() => toggleInterest(topic)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                      {topic}
                    </Text>
                    {isSelected && <CheckCircle2 color={theme.colors.success} size={15} />}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.deleteTopicBtn}
                    onPress={() => removeTopicCompletely(topic)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 color="#EF4444" size={14} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Add New Custom Topic</Text>
          <View style={styles.customInputRow}>
            <TextInput
              style={styles.customInput}
              placeholder="e.g. Quantum Computing, Cyber Security"
              placeholderTextColor="#64748B"
              value={customInterest}
              onChangeText={setCustomInterest}
              onSubmitEditing={addCustomInterest}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addCustomInterest}>
              <Plus color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 5: WhatsApp Delivery Target */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MessageCircle color={theme.colors.whatsapp} size={16} />
            <Text style={styles.sectionTitle}>WhatsApp Automated Delivery</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Recipient phone number with country code:</Text>

          <TextInput
            style={styles.textInput}
            placeholder="+919876543210 (with country code)"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
            value={whatsapp}
            onChangeText={setWhatsapp}
          />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Auto-Dispatch Digest to WhatsApp</Text>
              <Text style={styles.toggleSubtitle}>Automate chat handoff on twice-daily schedule (8 AM & 8 PM)</Text>
            </View>
            <Switch
              value={autoDeliver}
              onValueChange={setAutoDeliver}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Save color="#fff" size={18} />
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A10' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: theme.spacing.md, 
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2640'
  },
  iconBtn: { padding: 8, backgroundColor: '#1E2640', borderRadius: 8 },
  saveHeaderBtn: { padding: 8, backgroundColor: theme.colors.primary, borderRadius: 8 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#F8FAFC' },
  scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  section: { 
    backgroundColor: '#0F172A', 
    padding: theme.spacing.md, 
    borderRadius: 14, 
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#1E2640'
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#F8FAFC' },
  sectionSubtitle: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  scheduleCardsRow: { flexDirection: 'row', gap: 8 },
  scheduleCard: { 
    flex: 1, 
    padding: theme.spacing.md, 
    backgroundColor: '#070A10', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#1E2640',
    position: 'relative'
  },
  scheduleCardSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` },
  scheduleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  plusSymbol: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '800' },
  scheduleTitle: { fontSize: 13, fontWeight: '700', color: '#F8FAFC', marginTop: 2 },
  scheduleTimeBadge: { fontSize: 11, color: theme.colors.secondary, fontWeight: '600', marginTop: 2 },
  checkPos: { position: 'absolute', top: 10, right: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  providerCard: { 
    width: '48%', 
    padding: theme.spacing.md, 
    backgroundColor: '#070A10', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#1E2640',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  providerCardSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}18` },
  providerName: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
  providerNameSelected: { color: '#F8FAFC', fontWeight: '700' },
  interestsList: { gap: 6, marginBottom: theme.spacing.md },
  interestChip: { 
    paddingHorizontal: theme.spacing.md, 
    paddingVertical: 8,
    backgroundColor: '#070A10', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#1E2640',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  interestChipSelected: { borderColor: theme.colors.secondary, backgroundColor: `${theme.colors.secondary}12` },
  interestChipTextTouch: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  interestText: { fontSize: 12, color: theme.colors.textSecondary },
  interestTextSelected: { color: '#F8FAFC', fontWeight: '600' },
  deleteTopicBtn: { padding: 4, marginLeft: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#F8FAFC', marginBottom: 6, marginTop: 4 },
  customInputRow: { flexDirection: 'row', gap: 8 },
  customInput: { 
    flex: 1, 
    backgroundColor: '#070A10', 
    paddingHorizontal: theme.spacing.md, 
    paddingVertical: 8, 
    borderRadius: 8, 
    color: '#F8FAFC', 
    fontSize: 12,
    borderWidth: 1, 
    borderColor: '#1E2640' 
  },
  addBtn: { backgroundColor: theme.colors.secondary, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  textInput: { 
    backgroundColor: '#070A10', 
    padding: theme.spacing.md, 
    borderRadius: 8, 
    color: '#F8FAFC', 
    fontSize: 12,
    borderWidth: 1, 
    borderColor: '#1E2640' 
  },
  toggleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E2640'
  },
  toggleTitle: { fontSize: 12, fontWeight: '700', color: '#F8FAFC' },
  toggleSubtitle: { fontSize: 10, color: theme.colors.textSecondary },
  saveBtn: { 
    backgroundColor: theme.colors.primary, 
    padding: 12, 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8,
    marginBottom: theme.spacing.xl
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' }
});
