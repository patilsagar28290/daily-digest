import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl, 
  Linking, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../store/AppContext';
import { theme } from '../theme/theme';
import { AgentService } from '../services/agent';
import { 
  Settings, 
  RefreshCw, 
  Send, 
  Calendar, 
  Sparkles, 
  ExternalLink, 
  Bookmark, 
  Sliders, 
  ArrowRight 
} from 'lucide-react-native';

export default function MainDashboard({ navigation }: any) {
  const { preferences, history, updateHistory } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);

  const isConfigured = preferences?.selectedInterests && preferences.selectedInterests.length > 0 && preferences?.aiProvider;

  const today = new Date().toISOString().split('T')[0];
  const todayRun = history.find(h => h.id === today);

  const generateDigest = async () => {
    if (!preferences?.selectedInterests || preferences.selectedInterests.length === 0 || !preferences?.aiProvider) {
      Alert.alert('Configuration Required', 'Please configure your interests and AI provider in Settings first.', [
        { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }
      ]);
      return;
    }

    setIsGenerating(true);
    try {
      const items = await AgentService.generateDailyDigest(preferences.selectedInterests, preferences.aiProvider);
      await updateHistory({
        id: today,
        date: new Date().toISOString(),
        status: 'success',
        items
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate digest. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deliverDigest = async () => {
    if (!todayRun) {
      Alert.alert('No Digest', 'Please generate today\'s digest first.');
      return;
    }
    try {
      await AgentService.deliverViaWhatsApp(preferences?.whatsappNumber || '', todayRun.items);
    } catch (e: any) {
      Alert.alert('Delivery Error', e.message || 'Could not open WhatsApp.');
    }
  };

  // Render Welcome Screen if no preferences set yet
  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Daily Digest ☀️</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings color={theme.colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.welcomeScroll}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIconContainer}>
              <Sparkles color={theme.colors.primaryLight} size={48} />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to Daily Digest</Text>
            <Text style={styles.welcomeDescription}>
              Your intelligent AI research agent. Select your topics of interest and AI provider, and get a daily summary delivered straight to your device and WhatsApp.
            </Text>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                ⚠️ You haven't set up any topics or AI provider yet.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.welcomeBtn} 
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}
            >
              <Sliders color="#fff" size={22} />
              <Text style={styles.welcomeBtnText}>Configure Preferences & Settings</Text>
              <ArrowRight color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning ☀️</Text>
          <Text style={styles.date}>{new Date().toDateString()}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
          <Settings color={theme.colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isGenerating} onRefresh={generateDigest} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Configuration Summary Badge */}
        <TouchableOpacity 
          style={styles.configBadge} 
          onPress={() => AgentService.openAIProviderApp(preferences.aiProvider || 'Gemini')}
          activeOpacity={0.8}
        >
          <View style={styles.badgeRow}>
            <Sparkles color={theme.colors.primaryLight} size={16} />
            <Text style={styles.badgeText}>Agent: <Text style={{ color: '#fff', fontWeight: '700' }}>{preferences.aiProvider}</Text> (Tap to open app)</Text>
          </View>
          <View style={styles.tagsContainer}>
            {preferences.selectedInterests.map(interest => (
              <View key={interest} style={styles.tag}>
                <Text style={styles.tagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Today's Digest Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar color={theme.colors.primary} size={24} />
            <Text style={styles.cardTitle}>Today's Digest</Text>
          </View>

          {todayRun ? (
            <View>
              <Text style={styles.statusText}>✨ Curated by {preferences.aiProvider} ({todayRun.items.length} insights)</Text>

              {/* Items List */}
              <View style={styles.itemsList}>
                {todayRun.items.map((item, idx) => (
                  <View key={idx} style={styles.digestItem}>
                    <View style={styles.itemCategoryBadge}>
                      <Text style={styles.itemCategoryText}>{item.category}</Text>
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSummary}>{item.summary}</Text>
                    <View style={styles.linkActionContainer}>
                      {item.link && (
                        <TouchableOpacity 
                          style={styles.linkRow} 
                          onPress={() => AgentService.openURL(item.link!)}
                        >
                          <Text style={styles.linkText}>Read full research</Text>
                          <ExternalLink color={theme.colors.primaryLight} size={14} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={styles.aiLinkRow} 
                        onPress={() => AgentService.openAIProviderApp(preferences.aiProvider || 'Gemini', item.title)}
                      >
                        <Sparkles color={theme.colors.secondary} size={13} />
                        <Text style={styles.aiLinkText}>Ask {preferences.aiProvider || 'AI'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={deliverDigest}>
                  <Send color="#fff" size={20} />
                  <Text style={styles.btnText}>Send to WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={generateDigest} disabled={isGenerating}>
                  <RefreshCw color={theme.colors.text} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.statusText}>No digest generated for today yet.</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={generateDigest} disabled={isGenerating}>
                <RefreshCw color="#fff" size={20} />
                <Text style={styles.btnText}>{isGenerating ? 'Compiling Agent Insights...' : 'Generate Today\'s Digest Now'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* History Section */}
        {history.filter(h => h.id !== today).length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Previous Digests</Text>
            {history.filter(h => h.id !== today).map((h, i) => (
              <View key={i} style={styles.historyCard}>
                <Text style={styles.hDate}>{new Date(h.date).toDateString()}</Text>
                <Text style={styles.hStatus}>{h.items.length} items curated</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: theme.spacing.xl, 
    paddingVertical: theme.spacing.lg,
    alignItems: 'center' 
  },
  appTitle: { ...theme.typography.h1, fontSize: 24 },
  greeting: { ...theme.typography.h2 },
  date: { ...theme.typography.small, marginTop: 2 },
  iconBtn: { padding: 10, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.round },
  welcomeScroll: { padding: theme.spacing.xl, flexGrow: 1, justifyContent: 'center' },
  welcomeCard: { 
    backgroundColor: theme.colors.surface, 
    padding: theme.spacing.xl, 
    borderRadius: theme.borderRadius.xl, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border 
  },
  welcomeIconContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: `${theme.colors.primary}20`, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: theme.spacing.lg 
  },
  welcomeTitle: { ...theme.typography.h1, fontSize: 26, textAlign: 'center', marginBottom: theme.spacing.md },
  welcomeDescription: { ...theme.typography.body, textAlign: 'center', marginBottom: theme.spacing.xl, lineHeight: 22 },
  noticeBox: { backgroundColor: `${theme.colors.error}15`, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.xl, width: '100%' },
  noticeText: { ...theme.typography.small, color: theme.colors.error, textAlign: 'center' },
  welcomeBtn: { 
    backgroundColor: theme.colors.primary, 
    padding: theme.spacing.lg, 
    borderRadius: theme.borderRadius.xl, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12,
    width: '100%' 
  },
  welcomeBtnText: { ...theme.typography.h3, fontSize: 16, color: '#fff' },
  scroll: { padding: theme.spacing.xl },
  configBadge: { 
    backgroundColor: theme.colors.surface, 
    padding: theme.spacing.md, 
    borderRadius: theme.borderRadius.lg, 
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badgeText: { ...theme.typography.small, color: theme.colors.textSecondary },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: theme.colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.sm },
  tagText: { ...theme.typography.small, fontSize: 12, color: theme.colors.text },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: theme.spacing.md },
  cardTitle: { ...theme.typography.h3 },
  statusText: { ...theme.typography.body, marginBottom: theme.spacing.lg, color: theme.colors.textSecondary },
  itemsList: { gap: 14, marginBottom: theme.spacing.xl },
  digestItem: { backgroundColor: theme.colors.background, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
  itemCategoryBadge: { backgroundColor: `${theme.colors.primary}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  itemCategoryText: { ...theme.typography.small, fontSize: 11, color: theme.colors.primaryLight, fontWeight: '700' },
  itemTitle: { ...theme.typography.bodyMedium, fontSize: 16, marginBottom: 4 },
  itemSummary: { ...theme.typography.body, fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { ...theme.typography.small, color: theme.colors.primaryLight, fontSize: 12, fontWeight: '600' },
  linkActionContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 8 },
  aiLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${theme.colors.secondary}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  aiLinkText: { ...theme.typography.small, color: theme.colors.secondary, fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  primaryBtn: { flex: 1, backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryBtn: { backgroundColor: theme.colors.surfaceLight, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  btnText: { ...theme.typography.bodyMedium, color: '#fff', fontSize: 14 },
  sectionTitle: { ...theme.typography.h3, marginBottom: theme.spacing.md },
  historyCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hDate: { ...theme.typography.bodyMedium },
  hStatus: { ...theme.typography.small, color: theme.colors.success }
});
