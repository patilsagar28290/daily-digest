import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../store/AppContext';
import { theme } from '../theme/theme';
import { AgentService, AI_PROVIDERS } from '../services/agent';
import { CheckCircle2, ChevronRight, MessageCircle, Sparkles } from 'lucide-react-native';

const INTERESTS = [
  'AI trends in travel industry',
  'AI trends in banking industry',
  'AI trends in e-commerce',
  'AI hackathon projects',
  'AI in software',
  'AI news',
  'GitHub AI repos'
];

export default function OnboardingScreen() {
  const { updatePreferences } = useAppContext();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'AI trends in travel industry',
    'AI trends in banking industry',
    'AI trends in e-commerce',
    'AI in software'
  ]);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('Gemini');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    AgentService.getInstalledProviders().then(setAvailableProviders);
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) return prev.filter(i => i !== interest);
      return [...prev, interest];
    });
  };

  const handleComplete = async () => {
    if (selectedInterests.length > 0 && selectedProvider) {
      await updatePreferences({
        selectedInterests,
        aiProvider: selectedProvider as any,
        whatsappNumber: whatsapp,
        autoDeliverWhatsApp: true,
        isOnboarded: true
      });
    }
  };

  const renderStepOne = () => (
    <Animated.View style={styles.stepContainer}>
      <Text style={styles.title}>Select Research Topics</Text>
      <Text style={styles.subtitle}>Choose topics for your daily AI research summary:</Text>
      
      <View style={styles.list}>
        {INTERESTS.map(interest => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <TouchableOpacity 
              key={interest} 
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggleInterest(interest)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{interest}</Text>
              {isSelected && <CheckCircle2 color={theme.colors.success} size={18} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity 
        style={[styles.button, selectedInterests.length === 0 && styles.buttonDisabled]} 
        disabled={selectedInterests.length === 0}
        onPress={() => setStep(2)}
      >
        <Text style={styles.buttonText}>Continue ({selectedInterests.length} selected)</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStepTwo = () => (
    <Animated.View style={styles.stepContainer}>
      <Text style={styles.title}>Select AI Agent</Text>
      <Text style={styles.subtitle}>Choose your primary AI intelligence model:</Text>
      
      <View style={styles.list}>
        {AI_PROVIDERS.map(provider => {
          const isSelected = selectedProvider === provider.id;
          return (
            <TouchableOpacity 
              key={provider.id} 
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedProvider(provider.id)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Sparkles color={isSelected ? theme.colors.primaryLight : theme.colors.textSecondary} size={18} />
                <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{provider.name}</Text>
              </View>
              {isSelected && <CheckCircle2 color={theme.colors.success} size={18} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity 
        style={[styles.button, !selectedProvider && styles.buttonDisabled]} 
        disabled={!selectedProvider}
        onPress={() => setStep(3)}
      >
        <Text style={styles.buttonText}>Set Delivery Target <ChevronRight color="#fff" size={18} /></Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStepThree = () => (
    <Animated.View style={styles.stepContainer}>
      <MessageCircle color={theme.colors.whatsapp} size={40} style={{ marginBottom: 12 }} />
      <Text style={styles.title}>WhatsApp Delivery Target</Text>
      <Text style={styles.subtitle}>Enter your mobile phone number with country code for direct WhatsApp delivery:</Text>
      
      <TextInput
        style={styles.input}
        placeholder="+91 98765 43210 (or leave empty)"
        placeholderTextColor="#64748B"
        keyboardType="phone-pad"
        value={whatsapp}
        onChangeText={setWhatsapp}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleComplete}
      >
        <Text style={styles.buttonText}>Complete Setup & Launch</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          <View style={[styles.dot, step >= 1 && styles.activeDot]} />
          <View style={[styles.dot, step >= 2 && styles.activeDot]} />
          <View style={[styles.dot, step >= 3 && styles.activeDot]} />
        </View>
        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
        {step === 3 && renderStepThree()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  scroll: { padding: theme.spacing.lg, flexGrow: 1 },
  progress: { flexDirection: 'row', justifyContent: 'center', marginBottom: theme.spacing.lg, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E293B' },
  activeDot: { backgroundColor: theme.colors.primary, width: 24 },
  stepContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  list: { gap: 10, marginBottom: theme.spacing.lg },
  card: { padding: theme.spacing.md, backgroundColor: '#131C2E', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#22324D' },
  cardSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}20` },
  cardText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  cardTextSelected: { color: '#F8FAFC', fontWeight: '700' },
  input: { backgroundColor: '#131C2E', padding: theme.spacing.md, borderRadius: 12, fontSize: 14, color: '#F8FAFC', marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: '#22324D' },
  button: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 'auto' },
  buttonDisabled: { backgroundColor: '#1E293B', opacity: 0.5 },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#fff' }
});
