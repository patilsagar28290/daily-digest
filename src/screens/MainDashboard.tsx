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
  Key,
  Sun,
  Moon,
  Globe
} from 'lucide-react-native';

export default function MainDashboard({ navigation }: any) {
  const { preferences, history, updateHistory } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoStatus, setAutoStatus] = useState<string>('');
  const [copiedItemIndex, setCopiedItemIndex] = useState<string | null>(null);

  // Current slot view mode: 'morning' or 'evening'
  const currentHour = new Date().getHours();
  const defaultSlot: 'morning' | 'evening' = currentHour >= 18 ? 'evening' : 'morning';
  const [activeSlot, setActiveSlot] = useState<'morning' | 'evening'>(defaultSlot);

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [selectedImportCategory, setSelectedImportCategory] = useState('');

  const isConfigured = Boolean(
    preferences?.selectedInterests && 
    preferences.selectedInterests.length > 0 && 
    preferences?.aiProvider
  );

  const todayDateStr = new Date().toISOString().split('T')[0];
  const activeRunId = `${todayDateStr}-${activeSlot}`;
  const activeRun = history.find(h => h.id === activeRunId || (h.id === todayDateStr && activeSlot === 'morning'));

  // Run automated research workflow on mount if active slot is missing
  useEffect(() => {
    if (isConfigured && (!activeRun || activeRun.items.length === 0)) {
      runAutomatedDigestWorkflow(activeSlot);
    }
  }, [isConfigured, activeSlot]);

  const runAutomatedDigestWorkflow = async (slotOverride?: 'morning' | 'evening') => {
    if (!preferences?.selectedInterests || preferences.selectedInterests.length === 0) return;
    
    const slotToRun = slotOverride || activeSlot;
    const runId = `${todayDateStr}-${slotToRun}`;

    setIsGenerating(true);
    setAutoStatus(
      preferences.geminiApiKey 
        ? `Fetching ${slotToRun.toUpperCase()} research via Gemini API...` 
        : `Executing ${slotToRun.toUpperCase()} AI research agent...`
    );

    try {
      const items = await AgentService.generateDailyDigest(
        preferences.selectedInterests, 
        preferences.aiProvider || 'Gemini',
        preferences.geminiApiKey
      );

      await updateHistory({
        id: runId,
        date: new Date().toISOString(),
        slot: slotToRun,
        status: 'success',
        items
      });

      setAutoStatus(`${slotToRun === 'morning' ? 'Morning 8 AM' : 'Evening 8 PM'} edition compiled.`);

      // Automated WhatsApp delivery trigger
      if (preferences.whatsappNumber && preferences.autoDeliverWhatsApp !== false) {
        setAutoStatus(`Auto-dispatching ${slotToRun} digest to WhatsApp...`);
        setTimeout(async () => {
          try {
            await AgentService.deliverViaWhatsApp(
              preferences.whatsappNumber!, 
              items, 
              slotToRun === 'morning' ? 'Morning 8 AM' : 'Evening 8 PM'
            );
            setAutoStatus(`Digest copied & launched in WhatsApp.`);
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
    if (!activeRun || activeRun.items.length === 0) {
      await runAutomatedDigestWorkflow(activeSlot);
      return;
    }
    try {
      const slotTitle = activeSlot === 'morning' ? 'Morning (8:00 AM)' : 'Evening (8:00 PM)';
      const { copied } = await AgentService.deliverViaWhatsApp(
        preferences?.whatsappNumber || '', 
        activeRun.items,
        slotTitle
      );
      if (copied) {
        Alert.alert(
          'WhatsApp Delivery',
          `${slotTitle} digest copied to clipboard and targeted to ${preferences?.whatsappNumber ? preferences.whatsappNumber : 'WhatsApp'}.`
        );
      }
    } catch (e: any) {
      Alert.alert('Delivery Error', e.message || 'Could not open WhatsApp.');
    }
  };

  const copyItemText = async (item: DigestItem, key: string) => {
    const domain = AgentService.extractDomain(item.link);
    const textToCopy = `*${item.title}*\n${item.summary}\n${item.link ? `🔗 Source (${domain}): ${item.link}` : ''}`;
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
    if (!importText.trim()) return;

    const category = selectedImportCategory || preferences?.selectedInterests[0] || 'General AI Research';
    const newItems = AgentService.parseImportedText(importText, category);

    if (newItems.length === 0) {
      Alert.alert('Parse Error', 'Could not parse research items from text.');
      return;
    }

    const existingItems = activeRun ? activeRun.items : [];
    const updatedItems = [...existingItems, ...newItems];

    await updateHistory({
      id: activeRunId,
      date: new Date().toISOString(),
      slot: activeSlot,
      status: 'success',
      items: updatedItems
    });

    setIsImportModalOpen(false);
    setImportText('');
  };

  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bot color={theme.colors.primaryLight} size={22} />
            <Text style={styles.appTitle}>Daily Digest AI</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings color={theme.colors.text} size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.welcomeScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIconContainer}>
              <Zap color={theme.colors.primaryLight} size={36} />
            </View>
            <Text style={styles.welcomeTitle}>Automated Research Agent</Text>
            <Text style={styles.welcomeDescription}>
              Zero-intervention AI daily research agent. Configure your topics for automated twice-daily research (8 AM & 8 PM).
            </Text>

            <TouchableOpacity 
              style={styles.welcomeBtn} 
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.85}
            >
              <Sliders color="#fff" size={16} />
              <Text style={styles.welcomeBtnText}>Configure Setup</Text>
              <ArrowRight color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Group active slot items by interest topic
  const groupedItems: Record<string, DigestItem[]> = {};
  preferences.selectedInterests.forEach(interest => {
    groupedItems[interest] = [];
  });

  if (activeRun) {
    activeRun.items.forEach(item => {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = [];
      }
      groupedItems[item.category].push(item);
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sleek Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Daily Digest AI ☀️</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity 
            style={[styles.iconBtn, isGenerating && styles.iconBtnDisabled]} 
            onPress={() => runAutomatedDigestWorkflow(activeSlot)} 
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={theme.colors.primaryLight} />
            ) : (
              <RefreshCw color={theme.colors.text} size={16} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings color={theme.colors.text} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isGenerating} onRefresh={() => runAutomatedDigestWorkflow(activeSlot)} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Twice Daily Slot Switcher (8:00 AM Morning & 8:00 PM Evening) */}
        <View style={styles.slotSwitcherRow}>
          <TouchableOpacity
            style={[styles.slotTab, activeSlot === 'morning' && styles.slotTabActive]}
            onPress={() => setActiveSlot('morning')}
            activeOpacity={0.8}
          >
            <Sun color={activeSlot === 'morning' ? '#F59E0B' : theme.colors.textSecondary} size={15} />
            <Text style={[styles.slotTabText, activeSlot === 'morning' && styles.slotTabTextActive]}>
              Morning Brief (8 AM)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.slotTab, activeSlot === 'evening' && styles.slotTabActive]}
            onPress={() => setActiveSlot('evening')}
            activeOpacity={0.8}
          >
            <Moon color={activeSlot === 'evening' ? '#818CF8' : theme.colors.textSecondary} size={15} />
            <Text style={[styles.slotTabText, activeSlot === 'evening' && styles.slotTabTextActive]}>
              Evening Update (8 PM)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Bar */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.statusBadgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.statusBadgeTitle}>
                {activeSlot.toUpperCase()} EDITION • TWICE-DAILY AUTOMATION
              </Text>
            </View>

            {preferences.geminiApiKey ? (
              <View style={styles.apiActiveBadge}>
                <Key color={theme.colors.secondary} size={11} />
                <Text style={styles.apiActiveText}>Gemini API</Text>
              </View>
            ) : (
              <View style={styles.localActiveBadge}>
                <Cpu color={theme.colors.primaryLight} size={11} />
                <Text style={styles.localActiveText}>Local AI</Text>
              </View>
            )}
          </View>

          {autoStatus ? (
            <Text style={styles.autoStatusText}>⚡ {autoStatus}</Text>
          ) : null}
        </View>

        {/* Global Action Bar */}
        {activeRun && activeRun.items.length > 0 && !isGenerating && (
          <View style={styles.globalActionsRow}>
            <TouchableOpacity 
              style={styles.whatsappPrimaryBtn} 
              onPress={deliverDigest}
              activeOpacity={0.85}
            >
              <Send color="#fff" size={15} />
              <Text style={styles.whatsappPrimaryBtnText}>Send to WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.copyAllBtn} 
              onPress={async () => {
                let allText = `☀️ *DAILY DIGEST SUMMARY (${activeSlot.toUpperCase()} EDITION)*\n\n`;
                activeRun.items.forEach((item, i) => {
                  const domain = AgentService.extractDomain(item.link);
                  allText += `${i + 1}. *[${item.category}] ${item.title}*\n${item.summary}\n${item.link ? `🔗 Direct Link (${domain}): ${item.link}` : ''}\n\n`;
                });
                await AgentService.copyToClipboard(allText);
                Alert.alert('Copied!', 'Full research digest copied to clipboard.');
              }}
              activeOpacity={0.85}
            >
              <Copy color={theme.colors.text} size={14} />
              <Text style={styles.copyAllBtnText}>Copy All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SEPARATE SECTIONS FOR EACH INTEREST TOPIC */}
        <View style={styles.sectionsContainer}>
          {preferences.selectedInterests.map((interestCategory, catIdx) => {
            const categoryItems = groupedItems[interestCategory] || [];
            const hasItems = categoryItems.length > 0;

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
                      <Text style={styles.sectionSubtitle}>
                        {isGenerating 
                          ? 'Research in progress...' 
                          : hasItems 
                            ? `${categoryItems.length} direct updates` 
                            : 'Pending scheduled research'}
                      </Text>
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

                {/* DO NOT SHOW ANYTHING UNDER INTEREST SECTIONS UNTIL RESEARCH IS DONE! */}
                {isGenerating ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={theme.colors.primaryLight} />
                    <Text style={styles.loadingText}>Fetching direct AI research insights...</Text>
                  </View>
                ) : hasItems ? (
                  <View style={styles.categoryItemsList}>
                    {categoryItems.map((item, itemIdx) => {
                      const itemKey = `${interestCategory}-${itemIdx}`;
                      const isCopied = copiedItemIndex === itemKey;
                      const domainName = AgentService.extractDomain(item.link);

                      return (
                        <View key={itemIdx} style={styles.digestItem}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemSummary}>{item.summary}</Text>

                          <View style={styles.itemFooterRow}>
                            {item.link ? (
                              <TouchableOpacity 
                                style={styles.linkRow} 
                                onPress={() => AgentService.openURL(item.link!)}
                                activeOpacity={0.7}
                              >
                                <Globe color={theme.colors.primaryLight} size={12} />
                                <Text style={styles.linkText} numberOfLines={1}>{domainName}</Text>
                                <ExternalLink color={theme.colors.primaryLight} size={10} />
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
                ) : null}
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
                <Sparkles color={theme.colors.primaryLight} size={16} />
                <Text style={styles.modalTitle}>Import Topic Output</Text>
              </View>
              <TouchableOpacity onPress={() => setIsImportModalOpen(false)}>
                <X color={theme.colors.text} size={18} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Topic: <Text style={{ color: theme.colors.secondary, fontWeight: '700' }}>{selectedImportCategory}</Text>
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
                <PlusCircle color="#fff" size={14} />
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
  container: { flex: 1, backgroundColor: '#070A10' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: theme.spacing.md, 
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2640'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appTitle: { fontSize: 17, fontWeight: '800', color: '#F8FAFC' },
  greeting: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  date: { fontSize: 11, color: theme.colors.textSecondary },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 7, backgroundColor: '#1E2640', borderRadius: 8 },
  iconBtnDisabled: { opacity: 0.5 },
  welcomeScroll: { padding: theme.spacing.lg, flexGrow: 1, justifyContent: 'center' },
  welcomeCard: { backgroundColor: '#0F172A', padding: theme.spacing.lg, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1E2640' },
  welcomeIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${theme.colors.primary}20`, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.md },
  welcomeTitle: { fontSize: 18, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 4 },
  welcomeDescription: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.lg, lineHeight: 18 },
  welcomeBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' },
  welcomeBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  slotSwitcherRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.md },
  slotTab: { 
    flex: 1, 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    backgroundColor: '#0F172A', 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6,
    borderWidth: 1,
    borderColor: '#1E2640'
  },
  slotTabActive: { backgroundColor: '#1E2640', borderColor: theme.colors.primary },
  slotTabText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  slotTabTextActive: { color: '#F8FAFC', fontWeight: '700' },
  statusCard: { backgroundColor: '#0F172A', padding: theme.spacing.md, borderRadius: 12, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: '#1E2640' },
  statusHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: theme.colors.success },
  statusBadgeTitle: { fontSize: 10, fontWeight: '800', color: theme.colors.primaryLight, letterSpacing: 0.5 },
  apiActiveBadge: { backgroundColor: `${theme.colors.secondary}18`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  apiActiveText: { color: theme.colors.secondary, fontWeight: '700', fontSize: 10 },
  localActiveBadge: { backgroundColor: '#1E2640', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  localActiveText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 10 },
  autoStatusText: { fontSize: 11, color: theme.colors.secondary, marginTop: 6, fontWeight: '600' },
  globalActionsRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.md },
  whatsappPrimaryBtn: { flex: 2, backgroundColor: theme.colors.whatsapp, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  whatsappPrimaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  copyAllBtn: { flex: 1, backgroundColor: '#1E2640', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  copyAllBtnText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
  sectionsContainer: { gap: theme.spacing.md },
  interestSectionCard: { backgroundColor: '#0F172A', borderRadius: 12, padding: theme.spacing.md, borderWidth: 1, borderColor: '#1E2640' },
  sectionHeader: { marginBottom: 4 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionNumberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: `${theme.colors.primary}20`, justifyContent: 'center', alignItems: 'center' },
  sectionNumberText: { color: theme.colors.primaryLight, fontWeight: '800', fontSize: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#F8FAFC' },
  sectionSubtitle: { fontSize: 11, color: theme.colors.textSecondary },
  sectionImportBtn: { padding: 4, backgroundColor: `${theme.colors.secondary}15`, borderRadius: 6 },
  loadingBox: { paddingVertical: theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 12, color: theme.colors.textSecondary },
  categoryItemsList: { gap: 8, marginTop: theme.spacing.sm },
  digestItem: { backgroundColor: '#070A10', padding: theme.spacing.md, borderRadius: 8, borderWidth: 1, borderColor: '#1E2640' },
  itemTitle: { fontSize: 13, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  itemSummary: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  itemFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#1E2640' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  linkText: { color: theme.colors.primaryLight, fontSize: 11, fontWeight: '700' },
  itemCopyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1E2640', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  itemCopyText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: theme.spacing.md },
  modalContent: { backgroundColor: '#0F172A', borderRadius: 14, padding: theme.spacing.lg, borderWidth: 1, borderColor: '#1E2640' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 14, fontWeight: '700', color: '#F8FAFC' },
  modalSubtitle: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  modalTextInput: { backgroundColor: '#070A10', borderRadius: 8, padding: theme.spacing.md, color: theme.colors.text, fontSize: 12, height: 90, textAlignVertical: 'top', borderWidth: 1, borderColor: '#1E2640', marginBottom: theme.spacing.md },
  modalActionButtons: { flexDirection: 'row', gap: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1E2640', alignItems: 'center' },
  modalCancelBtnText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 12 },
  modalSubmitBtn: { flex: 2, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  modalSubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 }
});
