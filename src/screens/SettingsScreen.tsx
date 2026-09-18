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
  Zap
} from 'lucide-react-native';

const PRESET_INTERESTS = [
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
  const [customInterest, setCustomInterest] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [autoDeliver, setAutoDeliver] = useState<boolean>(true);
  const [digestTime, setDigestTime] = useState<string>('07:00');

  useEffect(() => {
    if (preferences) {
      if (preferences.aiProvider) setSelectedProvider(preferences.aiProvider);
      if (preferences.geminiApiKey) setGeminiApiKey(preferences.geminiApiKey);
      if (preferences.selectedInterests) setSelectedInterests(preferences.selectedInterests);
      if (preferences.whatsappNumber) setWhatsapp(preferences.whatsappNumber);
      if (preferences.autoDeliverWhatsApp !== undefined) setAutoDeliver(preferences.autoDeliverWhatsApp);
      if (preferences.digestTime) setDigestTime(preferences.digestTime);
    }
  }, [preferences]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (!selectedInterests.includes(trimmed)) {
      setSelectedInterests(prev => [...prev, trimmed]);
    }
    setCustomInterest('');
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
      digestTime,
      isOnboarded: true
    });

    Alert.alert('Settings Saved', 'Your Daily Digest preferences have been updated!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#F8FAFC" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences & Setup</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Save color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: AI Provider Selection */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Sparkles color={theme.colors.primaryLight} size={18} />
            <Text style={styles.sectionTitle}>AI Model Selection</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Select primary model for automated research:</Text>
          
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
                  {isSelected && <CheckCircle2 color={theme.colors.primaryLight} size={16} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Gemini API Key (Direct Zero-Intervention Execution) */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Key color={theme.colors.secondary} size={18} />
            <Text style={styles.sectionTitle}>Google Gemini API Key (Direct Automation)</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Enter your free Gemini API key to run live online AI research in background without launching app:
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

        {/* Section 3: Monitored Interests */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Bookmark color={theme.colors.secondary} size={18} />
            <Text style={styles.sectionTitle}>Topics of Interest</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Select topics to track daily (each topic gets its own section):</Text>

          <View style={styles.interestsList}>
            {PRESET_INTERESTS.map(interest => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <TouchableOpacity
                  key={interest}
                  style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                  onPress={() => toggleInterest(interest)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                    {interest}
                  </Text>
                  {isSelected && <CheckCircle2 color={theme.colors.success} size={16} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Add Custom Topic</Text>
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
              <Plus color="#fff" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 4: WhatsApp Automated Delivery */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MessageCircle color={theme.colors.whatsapp} size={18} />
            <Text style={styles.sectionTitle}>Automated WhatsApp Delivery</Text>
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
              <Text style={styles.toggleSubtitle}>Trigger direct message dispatch when daily digest compiles</Text>
            </View>
            <Switch
              value={autoDeliver}
              onValueChange={setAutoDeliver}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Section 5: Schedule */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Preferred Schedule Time</Text>
          <View style={styles.timeRow}>
            {['06:00', '07:00', '08:00', '09:00'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, digestTime === t && styles.timeChipSelected]}
                onPress={() => setDigestTime(t)}
              >
                <Text style={[styles.timeText, digestTime === t && styles.timeTextSelected]}>
                  {t} AM
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Save color="#fff" size={20} />
          <Text style={styles.saveBtnText}>Save Preferences & Apply</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: theme.spacing.lg, 
    paddingVertical: theme.spacing.md,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  iconBtn: { padding: 8, backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  saveHeaderBtn: { padding: 8, backgroundColor: theme.colors.primary, borderRadius: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC' },
  scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  section: { 
    backgroundColor: '#131C2E', 
    padding: theme.spacing.md, 
    borderRadius: 16, 
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#22324D'
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  sectionSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  providerCard: { 
    width: '48%', 
    padding: theme.spacing.md, 
    backgroundColor: '#0B132B', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  providerCardSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}20` },
  providerName: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
  providerNameSelected: { color: '#F8FAFC', fontWeight: '700' },
  interestsList: { gap: 8, marginBottom: theme.spacing.md },
  interestChip: { 
    padding: theme.spacing.md, 
    backgroundColor: '#0B132B', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  interestChipSelected: { borderColor: theme.colors.secondary, backgroundColor: `${theme.colors.secondary}15` },
  interestText: { fontSize: 13, color: theme.colors.textSecondary },
  interestTextSelected: { color: '#F8FAFC', fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#F8FAFC', marginBottom: 6, marginTop: 4 },
  customInputRow: { flexDirection: 'row', gap: 8 },
  customInput: { 
    flex: 1, 
    backgroundColor: '#0B132B', 
    paddingHorizontal: theme.spacing.md, 
    paddingVertical: 10, 
    borderRadius: 10, 
    color: '#F8FAFC', 
    fontSize: 13,
    borderWidth: 1, 
    borderColor: '#1E293B' 
  },
  addBtn: { backgroundColor: theme.colors.secondary, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  textInput: { 
    backgroundColor: '#0B132B', 
    padding: theme.spacing.md, 
    borderRadius: 10, 
    color: '#F8FAFC', 
    fontSize: 13,
    borderWidth: 1, 
    borderColor: '#1E293B' 
  },
  toggleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B'
  },
  toggleTitle: { fontSize: 13, fontWeight: '700', color: '#F8FAFC' },
  toggleSubtitle: { fontSize: 11, color: theme.colors.textSecondary },
  timeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  timeChip: { flex: 1, padding: theme.spacing.sm, backgroundColor: '#0B132B', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  timeChipSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  timeText: { fontSize: 12, color: theme.colors.textSecondary },
  timeTextSelected: { color: '#fff', fontWeight: '700' },
  saveBtn: { 
    backgroundColor: theme.colors.primary, 
    padding: theme.spacing.md, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8,
    marginBottom: theme.spacing.xl
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' }
});
