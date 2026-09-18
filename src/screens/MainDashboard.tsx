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
  Sliders, 
  ArrowRight,
  Copy,
  PlusCircle,
  X,
  Cpu,
  Check,
  Zap,
  Bot,
  Key
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

  // Auto-run daily workflow on component mount with ZERO human intervention
  useEffect(() => {
    if (isConfigured && (!todayRun || todayRun.items.length === 0)) {
      runAutomatedDigestWorkflow();
    }
  }, [isConfigured]);

  const runAutomatedDigestWorkflow = async () => {
    if (!preferences?.selectedInterests || preferences.selectedInterests.length === 0) return;
    setIsGenerating(true);
    setAutoStatus(preferences.geminiApiKey ? 'Calling Gemini API for live research...' : 'Running automated AI research agent...');

    try {
      const items = await AgentService.generateDailyDigest(
        preferences.selectedInterests, 
        preferences.aiProvider || 'Gemini',
        preferences.geminiApiKey
      );

      await updateHistory({
        id: today,
        date: new Date().toISOString(),
        status: 'success',
        items
      });

      setAutoStatus('Research compiled successfully.');

      // Automated WhatsApp delivery trigger with ZERO human intervention
      if (preferences.whatsappNumber && preferences.autoDeliverWhatsApp !== false) {
        setAutoStatus('Auto-dispatching digest to WhatsApp...');
        setTimeout(async () => {
          try {
            await AgentService.deliverViaWhatsApp(preferences.whatsappNumber!, items);
            setAutoStatus('Digest dispatched to WhatsApp automatically.');
          } catch (err) {
            console.log('Automated WhatsApp dispatch notice:', err);
          }
        }, 1200);
      }
    } catch (e) {
      console.error('Automated digest workflow error:', e);
      setAutoStatus('Research process encountered an error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deliverDigest = async () => {
    if (!todayRun || todayRun.items.length === 0) {
      Alert.alert('No Research Data', 'Generating today\'s digest automatically now...');
      await runAutomatedDigestWorkflow();
      return;
    }
    try {
      const { copied } = await AgentService.deliverViaWhatsApp(preferences?.whatsappNumber || '', todayRun.items);
      if (copied) {
        Alert.alert(
          'Automated WhatsApp Delivery',
          `Daily Digest research copied to clipboard and launched in WhatsApp${preferences?.whatsappNumber ? ` for ${preferences.whatsappNumber}` : ''}.`
        );
      }
    } catch (e: any) {
      Alert.alert('Delivery Error', e.message || 'Could not open WhatsApp.');
    }
  };

  const copyItemText = async (item: DigestItem, key: string) => {
    const textToCopy = `*${item.title}*\n${item.summary}\n${item.link ? `🔗 Source: ${item.link}` : ''}`;
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
      Alert.alert('Empty Input', 'Please paste the AI output text.');
      return;
    }

    const category = selectedImportCategory || preferences?.selectedInterests[0] || 'General AI Research';
    const newItems = AgentService.parseImportedText(importText, category);

    if (newItems.length === 0) {
      Alert.alert('Parse Error', 'Could not parse research items from text.');
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
  };

  // Welcome / Unconfigured state
  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bot color={theme.colors.primaryLight} size={24} />
            <Text style={styles.appTitle}>Daily Digest AI</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings color={theme.colors.text} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.welcomeScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIconContainer}>
              <Zap color={theme.colors.primaryLight} size={40} />
            </View>
            <Text style={styles.welcomeTitle}>Automated Research Agent</Text>
            <Text style={styles.welcomeDescription}>
              Zero-intervention daily AI research summary engine. Select topics of interest and optional Gemini API Key to run automated research.
            </Text>

            <TouchableOpacity 
              style={styles.welcomeBtn} 
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.85}
            >
              <Sliders color="#fff" size={18} />
              <Text style={styles.welcomeBtnText}>Configure Preferences</Text>
              <ArrowRight color="#fff" size={16} />
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
      {/* Sleek Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Daily Digest AI ☀️</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity 
            style={[styles.iconBtn, isGenerating && styles.iconBtnDisabled]} 
            onPress={runAutomatedDigestWorkflow} 
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={theme.colors.primaryLight} />
            ) : (
              <RefreshCw color={theme.colors.text} size={18} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings color={theme.colors.text} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isGenerating} onRefresh={runAutomatedDigestWorkflow} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Executive Auto-Pilot Status Bar */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.statusBadgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.statusBadgeTitle}>ZERO-INTERVENTION AUTOMATION</Text>
            </View>

            {preferences.geminiApiKey ? (
              <View style={styles.apiActiveBadge}>
                <Key color={theme.colors.secondary} size={12} />
                <Text style={styles.apiActiveText}>Gemini API Active</Text>
              </View>
            ) : (
              <View style={styles.localActiveBadge}>
                <Cpu color={theme.colors.primaryLight} size={12} />
                <Text style={styles.localActiveText}>Local AI Agent</Text>
              </View>
            )}
          </View>

          <View style={styles.agentMetaRow}>
            <View style={styles.agentMetaPill}>
              <Text style={styles.agentMetaText}>Model: <Text style={styles.agentMetaHighlight}>{preferences.aiProvider || 'Gemini'}</Text></Text>
            </View>

            {preferences.whatsappNumber ? (
              <View style={styles.agentMetaPill}>
                <Send color={theme.colors.whatsapp} size={12} />
                <Text style={styles.agentMetaText}>Target: <Text style={styles.agentMetaHighlight}>{preferences.whatsappNumber}</Text></Text>
              </View>
            ) : null}
          </View>

          {autoStatus ? (
            <Text style={styles.autoStatusText}>⚡ {autoStatus}</Text>
          ) : null}
        </View>

        {/* Global One-Tap WhatsApp Dispatch Button */}
        {todayRun && todayRun.items.length > 0 && (
          <View style={styles.globalActionsRow}>
            <TouchableOpacity 
              style={styles.whatsappPrimaryBtn} 
              onPress={deliverDigest}
              activeOpacity={0.85}
            >
              <Send color="#fff" size={16} />
              <Text style={styles.whatsappPrimaryBtnText}>Direct WhatsApp Delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.copyAllBtn} 
              onPress={async () => {
                let allText = `☀️ *DAILY DIGEST SUMMARY*\n\n`;
                todayRun.items.forEach((item, i) => {
                  allText += `${i + 1}. *[${item.category}] ${item.title}*\n${item.summary}\n${item.link ? `🔗 Link: ${item.link}` : ''}\n\n`;
                });
                await AgentService.copyToClipboard(allText);
                Alert.alert('Copied!', 'Full research digest copied to clipboard.');
              }}
              activeOpacity={0.85}
            >
              <Copy color={theme.colors.text} size={15} />
              <Text style={styles.copyAllBtnText}>Copy All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SEPARATE SECTIONS FOR EACH INTEREST TOPIC */}
        <View style={styles.sectionsContainer}>
          {preferences.selectedInterests.map((interestCategory, catIdx) => {
            const categoryItems = groupedItems[interestCategory] || [];

            return (
              <View key={interestCategory} style={styles.interestSectionCard}>
                {/* Section Header */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionNumberBadge}>
                      <Text style={styles.sectionNumberText}>0{catIdx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle} numberOfLines={1}>{interestCategory}</Text>
                      <Text style={styles.sectionSubtitle}>{categoryItems.length} research updates</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.sectionImportBtn}
                      onPress={() => openImportModal(interestCategory)}
                      activeOpacity={0.8}
                    >
                      <PlusCircle color={theme.colors.secondary} size={14} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Category Items */}
                {categoryItems.length > 0 ? (
                  <View style={styles.categoryItemsList}>
                    {categoryItems.map((item, itemIdx) => {
                      const itemKey = `${interestCategory}-${itemIdx}`;
                      const isCopied = copiedItemIndex === itemKey;

                      return (
                        <View key={itemIdx} style={styles.digestItem}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemSummary}>{item.summary}</Text>

                          {/* Footer Link & Copy Actions */}
                          <View style={styles.itemFooterRow}>
                            {item.link ? (
                              <TouchableOpacity 
                                style={styles.linkRow} 
                                onPress={() => AgentService.openURL(item.link!)}
                                activeOpacity={0.7}
                              >
                                <ExternalLink color={theme.colors.primaryLight} size={13} />
                                <Text style={styles.linkText} numberOfLines={1}>Source Article</Text>
                              </TouchableOpacity>
                            ) : <View />}

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
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptySectionBox}>
                    <Text style={styles.emptySectionText}>Compiling insights for this topic...</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* IMPORT AI RESPONSE MODAL */}
      <Modal visible={isImportModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles color={theme.colors.primaryLight} size={18} />
                <Text style={styles.modalTitle}>Import Topic Output</Text>
              </View>
              <TouchableOpacity onPress={() => setIsImportModalOpen(false)}>
                <X color={theme.colors.text} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Paste research output under topic: <Text style={{ color: theme.colors.secondary, fontWeight: '700' }}>{selectedImportCategory}</Text>
            </Text>

            <TextInput
              style={styles.modalTextInput}
              multiline
              numberOfLines={6}
              placeholder="Paste research output here..."
              placeholderTextColor="#64748B"
              value={importText}
              onChangeText={setImportText}
            />

            <View style={styles.modalActionButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsImportModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleImportAIResponse}>
                <PlusCircle color="#fff" size={15} />
                <Text style={styles.modalSubmitBtnText}>Add Items</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: theme.spacing.md, 
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC' },
  greeting: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  date: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 8, backgroundColor: '#1E293B', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  iconBtnDisabled: { opacity: 0.6 },
  welcomeScroll: { padding: theme.spacing.lg, flexGrow: 1, justifyContent: 'center' },
  welcomeCard: { backgroundColor: '#131C2E', padding: theme.spacing.lg, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#22324D' },
  welcomeIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${theme.colors.primary}25`, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.md },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: theme.spacing.sm },
  welcomeDescription: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.lg, lineHeight: 20 },
  welcomeBtn: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
  welcomeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  statusCard: { backgroundColor: '#131C2E', padding: theme.spacing.md, borderRadius: 14, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: '#22324D' },
  statusHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success },
  statusBadgeTitle: { fontSize: 11, fontWeight: '800', color: theme.colors.primaryLight, letterSpacing: 0.5 },
  apiActiveBadge: { backgroundColor: `${theme.colors.secondary}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: `${theme.colors.secondary}40` },
  apiActiveText: { color: theme.colors.secondary, fontWeight: '700', fontSize: 10 },
  localActiveBadge: { backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#334155' },
  localActiveText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 10 },
  agentMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  agentMetaPill: { backgroundColor: '#0B132B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#1E293B' },
  agentMetaText: { fontSize: 11, color: theme.colors.textSecondary },
  agentMetaHighlight: { color: '#F8FAFC', fontWeight: '700' },
  autoStatusText: { fontSize: 12, color: theme.colors.secondary, marginTop: 8, fontWeight: '600' },
  globalActionsRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.md },
  whatsappPrimaryBtn: { flex: 2, backgroundColor: theme.colors.whatsapp, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  whatsappPrimaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  copyAllBtn: { flex: 1, backgroundColor: '#1E293B', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#334155' },
  copyAllBtnText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
  sectionsContainer: { gap: theme.spacing.md },
  interestSectionCard: { backgroundColor: '#131C2E', borderRadius: 14, padding: theme.spacing.md, borderWidth: 1, borderColor: '#22324D' },
  sectionHeader: { marginBottom: theme.spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionNumberBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: `${theme.colors.primary}25`, justifyContent: 'center', alignItems: 'center' },
  sectionNumberText: { color: theme.colors.primaryLight, fontWeight: '800', fontSize: 11 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  sectionSubtitle: { fontSize: 11, color: theme.colors.textSecondary },
  sectionImportBtn: { padding: 6, backgroundColor: `${theme.colors.secondary}20`, borderRadius: 6, borderWidth: 1, borderColor: `${theme.colors.secondary}40` },
  categoryItemsList: { gap: 8 },
  digestItem: { backgroundColor: '#0B132B', padding: theme.spacing.md, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B' },
  itemTitle: { fontSize: 13, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  itemSummary: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  itemFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#1E293B' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${theme.colors.primary}18`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: `${theme.colors.primary}30` },
  linkText: { color: theme.colors.primaryLight, fontSize: 11, fontWeight: '700' },
  itemCopyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  itemCopyText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' },
  emptySectionBox: { backgroundColor: '#0B132B', padding: theme.spacing.md, borderRadius: 10, alignItems: 'center' },
  emptySectionText: { fontSize: 12, color: theme.colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: theme.spacing.md },
  modalContent: { backgroundColor: '#131C2E', borderRadius: 16, padding: theme.spacing.lg, borderWidth: 1, borderColor: '#22324D' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  modalSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  modalTextInput: { backgroundColor: '#0B132B', borderRadius: 10, padding: theme.spacing.md, color: theme.colors.text, fontSize: 12, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#1E293B', marginBottom: theme.spacing.md },
  modalActionButtons: { flexDirection: 'row', gap: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1E293B', alignItems: 'center' },
  modalCancelBtnText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 12 },
  modalSubmitBtn: { flex: 2, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  modalSubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 }
});
