import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../store/AppContext';
import { theme } from '../theme/theme';
import { AI_PROVIDERS } from '../services/agent';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  MessageCircle, 
  Sparkles, 
  Bookmark, 
  Save 
} from 'lucide-react-native';

const PRESET_INTERESTS = [
  'AI trends in travel industry',
  'AI trends in banking industry',
  'AI trends in e-commerce',
  'AI hackathon projects',
  'AI in software engineering',
  'Latest AI news & papers',
  'GitHub trending AI repos',
  'Mobile & React Native dev',
  'LLMs & Autonomous Agents'
];

export default function SettingsScreen({ navigation }: any) {
  const { preferences, updatePreferences } = useAppContext();

  const [selectedProvider, setSelectedProvider] = useState<string>('Gemini');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [digestTime, setDigestTime] = useState<string>('07:00');

  useEffect(() => {
    if (preferences) {
      if (preferences.aiProvider) setSelectedProvider(preferences.aiProvider);
      if (preferences.selectedInterests) setSelectedInterests(preferences.selectedInterests);
      if (preferences.whatsappNumber) setWhatsapp(preferences.whatsappNumber);
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
    if (!selectedProvider) {
      Alert.alert('AI Provider Required', 'Please select an AI provider.');
      return;
    }

    await updatePreferences({
      selectedInterests,
      aiProvider: selectedProvider as any,
      whatsappNumber: whatsapp,
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
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences & Setup</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Save color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: AI Provider Selection */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Sparkles color={theme.colors.primaryLight} size={20} />
            <Text style={styles.sectionTitle}>AI Research Agent</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Choose which AI model curates your daily digest:</Text>
          
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
                  {isSelected && <CheckCircle2 color={theme.colors.primaryLight} size={18} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Monitored Interests */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Bookmark color={theme.colors.secondary} size={20} />
            <Text style={styles.sectionTitle}>Topics of Interest</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Select any number of topics to track every morning (no limit):</Text>

          {/* Preset list */}
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

          {/* Custom Interest Input */}
          <Text style={styles.fieldLabel}>Add Custom Topic</Text>
          <View style={styles.customInputRow}>
            <TextInput
              style={styles.customInput}
              placeholder="e.g. Quantum Computing, Rust, Cyber Security"
              placeholderTextColor={theme.colors.textSecondary}
              value={customInterest}
              onChangeText={setCustomInterest}
              onSubmitEditing={addCustomInterest}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addCustomInterest}>
              <Plus color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: WhatsApp Integration */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MessageCircle color={theme.colors.whatsapp} size={20} />
            <Text style={styles.sectionTitle}>WhatsApp Integration</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Receive your summary directly on WhatsApp:</Text>

          <TextInput
            style={styles.textInput}
            placeholder="+1234567890 (with country code)"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
            value={whatsapp}
            onChangeText={setWhatsapp}
          />
        </View>

        {/* Section 4: Digest Time */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Preferred Morning Time</Text>
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
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Save color="#fff" size={22} />
          <Text style={styles.saveBtnText}>Save Preferences & Update Digest</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: theme.spacing.xl, 
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface
  },
  iconBtn: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.round },
  saveHeaderBtn: { padding: 8, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.round },
  headerTitle: { ...theme.typography.h2, fontSize: 20 },
  scrollContent: { padding: theme.spacing.xl },
  section: { 
    backgroundColor: theme.colors.surface, 
    padding: theme.spacing.lg, 
    borderRadius: theme.borderRadius.xl, 
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sectionTitle: { ...theme.typography.h3, fontSize: 18 },
  sectionSubtitle: { ...theme.typography.small, marginBottom: theme.spacing.md },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  providerCard: { 
    width: '48%', 
    padding: theme.spacing.md, 
    backgroundColor: theme.colors.background, 
    borderRadius: theme.borderRadius.lg, 
    borderWidth: 1, 
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  providerCardSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}20` },
  providerName: { ...theme.typography.bodyMedium, fontSize: 14, color: theme.colors.textSecondary },
  providerNameSelected: { color: theme.colors.text, fontWeight: '700' },
  interestsList: { gap: 8, marginBottom: theme.spacing.lg },
  interestChip: { 
    padding: theme.spacing.md, 
    backgroundColor: theme.colors.background, 
    borderRadius: theme.borderRadius.lg, 
    borderWidth: 1, 
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  interestChipSelected: { borderColor: theme.colors.secondary, backgroundColor: `${theme.colors.secondary}15` },
  interestText: { ...theme.typography.body, fontSize: 14, color: theme.colors.textSecondary },
  interestTextSelected: { color: theme.colors.text, fontWeight: '600' },
  fieldLabel: { ...theme.typography.bodyMedium, fontSize: 14, marginBottom: 8, marginTop: 4 },
  customInputRow: { flexDirection: 'row', gap: 10 },
  customInput: { 
    flex: 1, 
    backgroundColor: theme.colors.background, 
    paddingHorizontal: theme.spacing.md, 
    paddingVertical: theme.spacing.sm, 
    borderRadius: theme.borderRadius.md, 
    color: theme.colors.text, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  addBtn: { backgroundColor: theme.colors.secondary, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: theme.borderRadius.md },
  textInput: { 
    backgroundColor: theme.colors.background, 
    padding: theme.spacing.md, 
    borderRadius: theme.borderRadius.lg, 
    color: theme.colors.text, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  timeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  timeChip: { flex: 1, padding: theme.spacing.sm, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  timeChipSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  timeText: { ...theme.typography.small, color: theme.colors.textSecondary },
  timeTextSelected: { color: '#fff', fontWeight: '700' },
  saveBtn: { 
    backgroundColor: theme.colors.primary, 
    padding: theme.spacing.lg, 
    borderRadius: theme.borderRadius.xl, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10,
    marginBottom: theme.spacing.xxl
  },
  saveBtnText: { ...theme.typography.h3, fontSize: 18, color: '#fff' }
});
