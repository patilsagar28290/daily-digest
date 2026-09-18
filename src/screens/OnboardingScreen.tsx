import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../store/AppContext';
import { theme } from '../theme/theme';
import { AgentService, AI_PROVIDERS } from '../services/agent';
import { CheckCircle2, ChevronRight, MessageCircle } from 'lucide-react-native';

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
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    AgentService.getInstalledProviders().then(setAvailableProviders);
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) return prev.filter(i => i !== interest);
      if (prev.length < 4) return [...prev, interest];
      return prev;
    });
  };

  const handleComplete = async () => {
    if (selectedInterests.length === 4 && selectedProvider && whatsapp) {
      await updatePreferences({
        selectedInterests,
        aiProvider: selectedProvider as any,
        whatsappNumber: whatsapp,
        isOnboarded: true
      });
    }
  };

  const renderStepOne = () => (
    <Animated.View style={styles.stepContainer}>
      <Text style={styles.title}>Curate your Digest</Text>
      <Text style={styles.subtitle}>Select exactly 4 topics you want to keep up with every morning.</Text>
      
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
              {isSelected && <CheckCircle2 color={theme.colors.success} size={20} />}
            </TouchableOpacity>
          )
        })}
      </View>

      <TouchableOpacity 
        style={[styles.button, selectedInterests.length !== 4 && styles.buttonDisabled]} 
        disabled={selectedInterests.length !== 4}
        onPress={() => setStep(2)}
      >
        <Text style={styles.buttonText}>Continue ({selectedInterests.length}/4)</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStepTwo = () => (
    <Animated.View style={styles.stepContainer}>
      <Text style={styles.title}>Choose your Agent</Text>
      <Text style={styles.subtitle}>Select the AI provider on your device to research your digest.</Text>
      
      <View style={styles.list}>
        {AI_PROVIDERS.filter(p => availableProviders.includes(p.id)).map(provider => {
          const isSelected = selectedProvider === provider.id;
          return (
            <TouchableOpacity 
              key={provider.id} 
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedProvider(provider.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{provider.name}</Text>
              {isSelected && <CheckCircle2 color={theme.colors.success} size={20} />}
            </TouchableOpacity>
          )
        })}
      </View>

      <TouchableOpacity 
        style={[styles.button, !selectedProvider && styles.buttonDisabled]} 
        disabled={!selectedProvider}
        onPress={() => setStep(3)}
      >
        <Text style={styles.buttonText}>Connect Agent <ChevronRight color="#fff" size={20} /></Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStepThree = () => (
    <Animated.View style={styles.stepContainer}>
      <MessageCircle color={theme.colors.whatsapp} size={48} style={{ marginBottom: 16 }} />
      <Text style={styles.title}>Where to deliver?</Text>
      <Text style={styles.subtitle}>Enter your WhatsApp number. Your digest will be generated locally and passed to WhatsApp.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="+1 234 567 8900"
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="phone-pad"
        value={whatsapp}
        onChangeText={setWhatsapp}
      />

      <TouchableOpacity 
        style={[styles.button, !whatsapp && styles.buttonDisabled]} 
        disabled={!whatsapp}
        onPress={handleComplete}
      >
        <Text style={styles.buttonText}>Finish Setup</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
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
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.xl, flexGrow: 1 },
  progress: { flexDirection: 'row', justifyContent: 'center', marginBottom: theme.spacing.xl, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.surfaceLight },
  activeDot: { backgroundColor: theme.colors.primary, width: 24 },
  stepContainer: { flex: 1 },
  title: { ...theme.typography.h1, marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, marginBottom: theme.spacing.xl },
  list: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  card: { padding: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  cardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceLight },
  cardText: { ...theme.typography.bodyMedium },
  cardTextSelected: { color: theme.colors.primaryLight },
  input: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg, ...theme.typography.bodyMedium, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border },
  button: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' },
  buttonDisabled: { backgroundColor: theme.colors.surfaceLight, opacity: 0.5 },
  buttonText: { ...theme.typography.h3, textAlign: 'center' }
});
