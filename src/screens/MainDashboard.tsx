import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl, 
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../store/AppContext';
import { theme } from '../theme/theme';
import { AgentService } from '../services/agent';
import { DigestItem } from '../services/storage';
import { 
  Settings, 
  RefreshCw, 
  Send, 
  Calendar, 
  Sparkles, 
  ExternalLink, 
  Bookmark, 
  Sliders, 
  ArrowRight,
  Copy,
  PlusCircle,
  X,
  Cpu,
  Check,
  Zap,
  Bot,
  Compass
} from 'lucide-react-native';

export default function MainDashboard({ navigation }: any) {
  const { preferences, history, updateHistory } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoStatus, setAutoStatus] = useState<string>('');
  const [copiedItemIndex, setCopiedItemIndex] = useState<string | null>(null);

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [selectedImportCategory, setSelectedImportCategory] = useState('');

  const isConfigured = Boolean(
    preferences?.selectedInterests && 
    preferences.selectedInterests.length > 0 && 
    preferences?.aiProvider
  );

  const today = new Date().toISOString().split('T')[0];
  const todayRun = history.find(h => h.id === today);

  // Auto-run digest generation on mount if not already created for today
  useEffect(() => {
    if (isConfigured && (!todayRun || todayRun.items.length === 0)) {
      autoRunDailyWorkflow();
    }
  }, [isConfigured]);

  const autoRunDailyWorkflow = async () => {
    if (!preferences?.selectedInterests || preferences.selectedInterests.length === 0) return;
    setIsGenerating(true);
    setAutoStatus('Running automated AI research agent...');

    try {
      const items = await AgentService.generateDailyDigest(
        preferences.selectedInterests, 
        preferences.aiProvider || 'Gemini'
      );

      await updateHistory({
        id: today,
        date: new Date().toISOString(),
        status: 'success',
        items
      });

      setAutoStatus('Research complete. Ready for WhatsApp delivery.');

      // Auto-deliver via WhatsApp if number configured
      if (preferences.whatsappNumber) {
        setTimeout(async () => {
          try {
            await AgentService.deliverViaWhatsApp(preferences.whatsappNumber, items);
          } catch (err) {
            console.log('Auto WhatsApp delivery trigger note:', err);
          }
        }, 1500);
      }
    } catch (e) {
      console.error('Auto workflow error:', e);
      setAutoStatus('Auto research encountered an issue.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDigest = async () => {
    if (!preferences?.selectedInterests || preferences.selectedInterests.length === 0 || !preferences?.aiProvider) {
      Alert.alert('Configuration Required', 'Please configure your interests and AI provider in Settings first.', [
        { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }
      ]);
      return;
    }

    setIsGenerating(true);
    setAutoStatus('Scanning web sources & compiling AI insights...');

    try {
      const items = await AgentService.generateDailyDigest(preferences.selectedInterests, preferences.aiProvider);
      await updateHistory({
        id: today,
        date: new Date().toISOString(),
        status: 'success',
        items
      });

      setAutoStatus('Digest generated successfully.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate digest. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deliverDigest = async () => {
    if (!todayRun || todayRun.items.length === 0) {
      Alert.alert('No Digest Available', 'Please generate today\'s research digest first.');
      return;
    }
    try {
      const { copied } = await AgentService.deliverViaWhatsApp(preferences?.whatsappNumber || '', todayRun.items);
      if (copied) {
        Alert.alert(
          'WhatsApp Automated Handoff',
          `Daily Digest has been copied to your clipboard and WhatsApp chat was launched${preferences?.whatsappNumber ? ` for ${preferences.whatsappNumber}` : ''}.`
        );
      }
    } catch (e: any) {
      Alert.alert('Delivery Error', e.message || 'Could not open WhatsApp.');
    }
  };

  const copyItemText = async (item: DigestItem, key: string) => {
    const textToCopy = `*${item.title}*\n${item.summary}\n${item.link ? `🔗 Research: ${item.link}` : ''}`;
    await AgentService.copyToClipboard(textToCopy);
    setCopiedItemIndex(key);
    setTimeout(() => setCopiedItemIndex(null), 2000);
  };

  const openImportModal = (category: string) => {
    setSelectedImportCategory(category);
    setImportText('');
    setIsImportModalOpen(true);
  };

  const handleImportAIResponse = async () => {
    if (!importText.trim()) {
      Alert.alert('Empty Input', 'Please paste the response copied from your AI agent.');
      return;
    }

    const category = selectedImportCategory || preferences?.selectedInterests[0] || 'General AI Research';
    const newItems = AgentService.parseImportedText(importText, category);

    if (newItems.length === 0) {
      Alert.alert('Parse Error', 'Could not parse structured research items from the text.');
      return;
    }

    const existingItems = todayRun ? todayRun.items : [];
    const updatedItems = [...existingItems, ...newItems];

    await updateHistory({
      id: today,
      date: new Date().toISOString(),
      status: 'success',
      items: updatedItems
    });

    setIsImportModalOpen(false);
    setImportText('');
    Alert.alert('Imported Successfully', `Added ${newItems.length} new items under "${category}".`);
  };

  // Welcome Screen if not configured
  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bot color={theme.colors.primaryLight} size={28} />
            <Text style={styles.appTitle}>Daily Digest AI</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings color={theme.colors.text} size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.welcomeScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIconContainer}>
              <Zap color={theme.colors.primaryLight} size={48} />
            </View>
            <Text style={styles.welcomeTitle}>Automated AI Research Suite</Text>
            <Text style={styles.welcomeDescription}>
              Configure your topics of interest and primary AI provider (Gemini, Claude, ChatGPT, or Perplexity) to receive automated daily research intelligence.
            </Text>

            <TouchableOpacity 
              style={styles.welcomeBtn} 
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.85}
            >
              <Sliders color="#fff" size={20} />
              <Text style={styles.welcomeBtnText}>Setup Interests & AI Agent</Text>
              <ArrowRight color="#fff" size={18} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Group today's items by interest topic section
  const groupedItems: Record<string, DigestItem[]> = {};
  preferences.selectedInterests.forEach(interest => {
    groupedItems[interest] = [];
  });

  if (todayRun) {
    todayRun.items.forEach(item => {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = [];
      }
      groupedItems[item.category].push(item);
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sleek Professional Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Daily Digest AI ☀️</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity 
            style={[styles.iconBtn, isGenerating && styles.iconBtnDisabled]} 
            onPress={generateDigest} 
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={theme.colors.primaryLight} />
            ) : (
              <RefreshCw color={theme.colors.text} size={18} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings color={theme.colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isGenerating} onRefresh={generateDigest} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Executive Auto-Pilot Status Bar */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.statusBadgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.statusBadgeTitle}>AUTOMATED AGENT ACTIVE</Text>
            </View>

            <TouchableOpacity 
              style={styles.launchAiHeaderBtn} 
              onPress={() => AgentService.openAIProviderApp(preferences.aiProvider || 'Gemini')}
              activeOpacity={0.8}
            >
              <Sparkles color="#fff" size={13} />
              <Text style={styles.launchAiHeaderBtnText}>Launch {preferences.aiProvider}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.agentMetaRow}>
            <View style={styles.agentMetaPill}>
              <Cpu color={theme.colors.primaryLight} size={14} />
              <Text style={styles.agentMetaText}>Agent: <Text style={styles.agentMetaHighlight}>{preferences.aiProvider}</Text></Text>
            </View>

            {preferences.whatsappNumber ? (
              <View style={styles.agentMetaPill}>
                <Send color={theme.colors.whatsapp} size={13} />
                <Text style={styles.agentMetaText}>WhatsApp: <Text style={styles.agentMetaHighlight}>{preferences.whatsappNumber}</Text></Text>
              </View>
            ) : null}
          </View>

          {autoStatus ? (
            <Text style={styles.autoStatusText}>⚡ {autoStatus}</Text>
          ) : null}
        </View>

        {/* Global One-Tap Automated WhatsApp Dispatcher */}
        {todayRun && todayRun.items.length > 0 && (
          <View style={styles.globalActionsRow}>
            <TouchableOpacity 
              style={styles.whatsappPrimaryBtn} 
              onPress={deliverDigest}
              activeOpacity={0.85}
            >
              <Send color="#fff" size={18} />
              <Text style={styles.whatsappPrimaryBtnText}>Automated WhatsApp Delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.copyAllBtn} 
              onPress={async () => {
                let allText = `☀️ *DAILY DIGEST SUMMARY*\n\n`;
                todayRun.items.forEach((item, i) => {
                  allText += `${i + 1}. *[${item.category}] ${item.title}*\n${item.summary}\n${item.link ? `🔗 Link: ${item.link}` : ''}\n\n`;
                });
                await AgentService.copyToClipboard(allText);
                Alert.alert('Copied!', 'Full Daily Digest research summary copied to clipboard.');
              }}
              activeOpacity={0.85}
            >
              <Copy color={theme.colors.text} size={16} />
              <Text style={styles.copyAllBtnText}>Copy Digest</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SEPARATE SECTIONS FOR EACH INTEREST TOPIC */}
        <View style={styles.sectionsContainer}>
          {preferences.selectedInterests.map((interestCategory, catIdx) => {
            const categoryItems = groupedItems[interestCategory] || [];

            return (
              <View key={interestCategory} style={styles.interestSectionCard}>
                {/* Section Header Banner */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionNumberBadge}>
                      <Text style={styles.sectionNumberText}>0{catIdx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle} numberOfLines={1}>{interestCategory}</Text>
                      <Text style={styles.sectionSubtitle}>
                        {categoryItems.length} curated research insights
                      </Text>
                    </View>
                  </View>

                  {/* Section AI Launcher & Import Actions */}
                  <View style={styles.sectionActionsRow}>
                    <TouchableOpacity 
                      style={styles.sectionAiBtn}
                      onPress={() => AgentService.openAIProviderApp(preferences.aiProvider || 'Gemini', interestCategory)}
                      activeOpacity={0.8}
                    >
                      <Sparkles color={theme.colors.primaryLight} size={13} />
                      <Text style={styles.sectionAiBtnText}>Deep Research ({preferences.aiProvider})</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.sectionImportBtn}
                      onPress={() => openImportModal(interestCategory)}
                      activeOpacity={0.8}
                    >
                      <PlusCircle color={theme.colors.secondary} size={13} />
                      <Text style={styles.sectionImportBtnText}>Import</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Category Research Items List */}
                {categoryItems.length > 0 ? (
                  <View style={styles.categoryItemsList}>
                    {categoryItems.map((item, itemIdx) => {
                      const itemKey = `${interestCategory}-${itemIdx}`;
                      const isCopied = copiedItemIndex === itemKey;

                      return (
                        <View key={itemIdx} style={styles.digestItem}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemSummary}>{item.summary}</Text>

                          {/* Item Card Actions & Link Button */}
                          <View style={styles.itemFooterRow}>
                            {item.link ? (
                              <TouchableOpacity 
                                style={styles.linkRow} 
                                onPress={() => AgentService.openURL(item.link!)}
                                activeOpacity={0.7}
                              >
                                <ExternalLink color={theme.colors.primaryLight} size={13} />
                                <Text style={styles.linkText} numberOfLines={1}>Open Source Link</Text>
                              </TouchableOpacity>
                            ) : <View />}

                            <View style={styles.itemBtnsGroup}>
                              <TouchableOpacity 
                                style={styles.itemCopyBtn}
                                onPress={() => copyItemText(item, itemKey)}
                                activeOpacity={0.7}
                              >
                                {isCopied ? (
                                  <Check color={theme.colors.success} size={12} />
                                ) : (
                                  <Copy color={theme.colors.textSecondary} size={12} />
                                )}
                                <Text style={[styles.itemCopyText, isCopied && { color: theme.colors.success }]}>
                                  {isCopied ? 'Copied' : 'Copy'}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity 
                                style={styles.itemAskAiBtn}
                                onPress={() => AgentService.openAIProviderApp(preferences.aiProvider || 'Gemini', item.title)}
                                activeOpacity={0.7}
                              >
                                <Sparkles color={theme.colors.secondary} size={12} />
                                <Text style={styles.itemAskAiText}>AI Dive</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptySectionBox}>
                    <Text style={styles.emptySectionText}>No research insights generated for this topic yet.</Text>
                    <TouchableOpacity style={styles.generateSectionBtn} onPress={generateDigest} disabled={isGenerating}>
                      <RefreshCw color="#fff" size={13} />
                      <Text style={styles.generateSectionBtnText}>Run Topic Research</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Previous History Section */}
        {history.filter(h => h.id !== today).length > 0 && (
          <View style={{ marginTop: theme.spacing.xl }}>
            <Text style={styles.historySectionTitle}>Previous Research History</Text>
            {history.filter(h => h.id !== today).map((h, i) => (
              <View key={i} style={styles.historyCard}>
                <View>
                  <Text style={styles.hDate}>{new Date(h.date).toDateString()}</Text>
                  <Text style={styles.hStatus}>{h.items.length} research insights compiled</Text>
                </View>
                <Calendar color={theme.colors.textSecondary} size={16} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* IMPORT AI RESPONSE MODAL */}
      <Modal visible={isImportModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles color={theme.colors.primaryLight} size={18} />
                <Text style={styles.modalTitle}>Import External AI Output</Text>
              </View>
              <TouchableOpacity onPress={() => setIsImportModalOpen(false)}>
                <X color={theme.colors.text} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Paste research output from <Text style={{ color: '#fff', fontWeight: '700' }}>{preferences.aiProvider || 'AI Provider'}</Text> under topic: <Text style={{ color: theme.colors.secondary, fontWeight: '700' }}>{selectedImportCategory}</Text>
            </Text>

            <TextInput
              style={styles.modalTextInput}
              multiline
              numberOfLines={8}
              placeholder="Paste AI response here (urls and bullet points will be parsed automatically)..."
              placeholderTextColor={theme.colors.textSecondary}
              value={importText}
              onChangeText={setImportText}
            />

            <View style={styles.modalActionButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsImportModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleImportAIResponse}>
                <PlusCircle color="#fff" size={16} />
                <Text style={styles.modalSubmitBtnText}>Add to Topic Section</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#090D16' 
  },
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  appTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#F8FAFC' 
  },
  greeting: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#F8FAFC' 
  },
  date: { 
    fontSize: 12, 
    color: theme.colors.textSecondary,
    marginTop: 1
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconBtn: { 
    padding: 8, 
    backgroundColor: '#1E293B', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  iconBtnDisabled: {
    opacity: 0.6
  },
  welcomeScroll: { 
    padding: theme.spacing.xl, 
    flexGrow: 1, 
    justifyContent: 'center' 
  },
  welcomeCard: { 
    backgroundColor: '#1E293B', 
    padding: theme.spacing.xl, 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155' 
  },
  welcomeIconContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: `${theme.colors.primary}25`, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: theme.spacing.lg 
  },
  welcomeTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#F8FAFC',
    textAlign: 'center', 
    marginBottom: theme.spacing.md 
  },
  welcomeDescription: { 
    fontSize: 14, 
    color: theme.colors.textSecondary,
    textAlign: 'center', 
    marginBottom: theme.spacing.xl, 
    lineHeight: 22 
  },
  welcomeBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingVertical: 14, 
    paddingHorizontal: 20,
    borderRadius: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    width: '100%' 
  },
  welcomeBtnText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#fff' 
  },
  scrollContent: { 
    padding: theme.spacing.md, 
    paddingBottom: theme.spacing.xxl 
  },
  statusCard: { 
    backgroundColor: '#131C2E', 
    padding: theme.spacing.md, 
    borderRadius: 16, 
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#22324D'
  },
  statusHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  statusBadgeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  liveDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: theme.colors.success 
  },
  statusBadgeTitle: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: theme.colors.primaryLight,
    letterSpacing: 0.5
  },
  launchAiHeaderBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5 
  },
  launchAiHeaderBtnText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 11 
  },
  agentMetaRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
    marginTop: 2
  },
  agentMetaPill: { 
    backgroundColor: '#1E293B', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  agentMetaText: { 
    fontSize: 12, 
    color: theme.colors.textSecondary 
  },
  agentMetaHighlight: { 
    color: '#F8FAFC', 
    fontWeight: '700' 
  },
  autoStatusText: { 
    fontSize: 12, 
    color: theme.colors.secondary, 
    marginTop: 8,
    fontWeight: '600'
  },
  globalActionsRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: theme.spacing.md 
  },
  whatsappPrimaryBtn: { 
    flex: 2, 
    backgroundColor: theme.colors.whatsapp, 
    paddingVertical: 12, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8 
  },
  whatsappPrimaryBtnText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  copyAllBtn: { 
    flex: 1, 
    backgroundColor: '#1E293B', 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 6, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  copyAllBtnText: { 
    color: theme.colors.text, 
    fontSize: 13,
    fontWeight: '600'
  },
  sectionsContainer: { 
    gap: theme.spacing.lg 
  },
  interestSectionCard: { 
    backgroundColor: '#131C2E', 
    borderRadius: 18, 
    padding: theme.spacing.md, 
    borderWidth: 1, 
    borderColor: '#22324D' 
  },
  sectionHeader: { 
    marginBottom: theme.spacing.md 
  },
  sectionTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginBottom: 8 
  },
  sectionNumberBadge: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    backgroundColor: `${theme.colors.primary}25`, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sectionNumberText: { 
    color: theme.colors.primaryLight, 
    fontWeight: '800', 
    fontSize: 12 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#F8FAFC' 
  },
  sectionSubtitle: { 
    fontSize: 12, 
    color: theme.colors.textSecondary 
  },
  sectionActionsRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 4 
  },
  sectionAiBtn: { 
    flex: 2, 
    backgroundColor: `${theme.colors.primary}20`, 
    paddingVertical: 7, 
    paddingHorizontal: 10, 
    borderRadius: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    borderWidth: 1, 
    borderColor: `${theme.colors.primary}40` 
  },
  sectionAiBtnText: { 
    color: theme.colors.primaryLight, 
    fontWeight: '700', 
    fontSize: 11 
  },
  sectionImportBtn: { 
    flex: 1, 
    backgroundColor: `${theme.colors.secondary}20`, 
    paddingVertical: 7, 
    paddingHorizontal: 10, 
    borderRadius: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    borderWidth: 1, 
    borderColor: `${theme.colors.secondary}40` 
  },
  sectionImportBtnText: { 
    color: theme.colors.secondary, 
    fontWeight: '700', 
    fontSize: 11 
  },
  categoryItemsList: { 
    gap: 10 
  },
  digestItem: { 
    backgroundColor: '#0B132B', 
    padding: theme.spacing.md, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#1E293B' 
  },
  itemTitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#F8FAFC', 
    marginBottom: 4 
  },
  itemSummary: { 
    fontSize: 12, 
    color: theme.colors.textSecondary, 
    lineHeight: 18, 
    marginBottom: 8 
  },
  itemFooterRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#1E293B' 
  },
  linkRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: `${theme.colors.primary}18`, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: `${theme.colors.primary}30`,
    maxWidth: '50%'
  },
  linkText: { 
    color: theme.colors.primaryLight, 
    fontSize: 11, 
    fontWeight: '700' 
  },
  itemBtnsGroup: { 
    flexDirection: 'row', 
    gap: 6, 
    alignItems: 'center' 
  },
  itemCopyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: '#1E293B', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  itemCopyText: { 
    fontSize: 11, 
    color: theme.colors.textSecondary,
    fontWeight: '600'
  },
  itemAskAiBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: `${theme.colors.secondary}20`, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  itemAskAiText: { 
    fontSize: 11, 
    color: theme.colors.secondary, 
    fontWeight: '700' 
  },
  emptySectionBox: { 
    backgroundColor: '#0B132B', 
    padding: theme.spacing.md, 
    borderRadius: 12, 
    alignItems: 'center', 
    gap: 8 
  },
  emptySectionText: { 
    fontSize: 12, 
    color: theme.colors.textSecondary 
  },
  generateSectionBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  generateSectionBtnText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 12
  },
  historySectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#F8FAFC', 
    marginBottom: theme.spacing.sm 
  },
  historyCard: { 
    backgroundColor: '#131C2E', 
    padding: theme.spacing.md, 
    borderRadius: 12, 
    marginBottom: theme.spacing.xs, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#22324D' 
  },
  hDate: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#F8FAFC' 
  },
  hStatus: { 
    fontSize: 11, 
    color: theme.colors.textSecondary 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    padding: theme.spacing.md 
  },
  modalContent: { 
    backgroundColor: '#131C2E', 
    borderRadius: 20, 
    padding: theme.spacing.lg, 
    borderWidth: 1, 
    borderColor: '#22324D' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  modalTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#F8FAFC' 
  },
  modalSubtitle: { 
    fontSize: 12, 
    color: theme.colors.textSecondary, 
    marginBottom: theme.spacing.md 
  },
  modalTextInput: { 
    backgroundColor: '#0B132B', 
    borderRadius: 12, 
    padding: theme.spacing.md, 
    color: theme.colors.text, 
    fontSize: 12, 
    height: 120, 
    textAlignVertical: 'top', 
    borderWidth: 1, 
    borderColor: '#1E293B', 
    marginBottom: theme.spacing.lg 
  },
  modalActionButtons: { 
    flexDirection: 'row', 
    gap: 10 
  },
  modalCancelBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 10, 
    backgroundColor: '#1E293B', 
    alignItems: 'center' 
  },
  modalCancelBtnText: { 
    color: theme.colors.textSecondary, 
    fontWeight: '600',
    fontSize: 13 
  },
  modalSubmitBtn: { 
    flex: 2, 
    paddingVertical: 10, 
    borderRadius: 10, 
    backgroundColor: theme.colors.primary, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 6 
  },
  modalSubmitBtnText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 13 
  }
});
