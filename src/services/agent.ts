import * as Linking from 'expo-linking';
import { DigestItem } from './storage';

export interface AIProviderConfig {
  id: string;
  name: string;
  urlScheme: string;
  webUrl: string;
  searchUrl: (query: string) => string;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  { 
    id: 'Gemini', 
    name: 'Google Gemini', 
    urlScheme: 'googleapp://',
    webUrl: 'https://gemini.google.com/app',
    searchUrl: (q: string) => `https://gemini.google.com/app` 
  },
  { 
    id: 'Claude', 
    name: 'Claude', 
    urlScheme: 'claude://',
    webUrl: 'https://claude.ai/',
    searchUrl: (q: string) => `https://claude.ai/new?q=${encodeURIComponent(q)}`
  },
  { 
    id: 'Perplexity', 
    name: 'Perplexity', 
    urlScheme: 'perplexity://',
    webUrl: 'https://www.perplexity.ai/',
    searchUrl: (q: string) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`
  },
  { 
    id: 'OpenAI', 
    name: 'ChatGPT', 
    urlScheme: 'chatgpt://',
    webUrl: 'https://chatgpt.com/',
    searchUrl: (q: string) => `https://chatgpt.com/?q=${encodeURIComponent(q)}`
  }
];

export const AgentService = {
  async getInstalledProviders(): Promise<string[]> {
    const installed: string[] = [];
    for (const provider of AI_PROVIDERS) {
      try {
        if (await Linking.canOpenURL(provider.urlScheme)) {
          installed.push(provider.id);
        }
      } catch (e) {
        console.log('Error checking URL scheme for:', provider.id, e);
      }
    }
    installed.push('OpenAI', 'Gemini', 'Claude', 'Perplexity');
    return [...new Set(installed)];
  },

  async openAIProviderApp(providerId: string, query?: string) {
    const provider = AI_PROVIDERS.find(p => p.id.toLowerCase() === providerId.toLowerCase()) || AI_PROVIDERS[0];
    
    try {
      if (provider.urlScheme && await Linking.canOpenURL(provider.urlScheme)) {
        await Linking.openURL(provider.urlScheme);
        return;
      }
    } catch (e) {
      console.log('Native scheme open failed:', e);
    }

    const targetUrl = query ? provider.searchUrl(query) : provider.webUrl;
    await Linking.openURL(targetUrl);
  },

  async openURL(url: string) {
    if (!url) return;
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.error('Failed to open URL:', url, e);
      await Linking.openURL(url);
    }
  },

  async generateDailyDigest(interests: string[], provider: string): Promise<DigestItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items: DigestItem[] = [];
        
        const curatedTopics: Record<string, Array<{ title: string; summary: string; searchQuery: string }>> = {
          'AI trends in software engineering': [
            {
              title: 'Autonomous AI Coding Agents & Pair Programmers',
              summary: 'Devin, Cursor, and Claude 3.5 Sonnet are transforming multi-file refactoring, autonomous bug fixing, and test generation in production software repositories.',
              searchQuery: 'AI software engineering coding agents Cursor Claude 3.5'
            },
            {
              title: 'LLM Code Generation Benchmarks & Evaluation',
              summary: 'HumanEval, SWE-bench, and LiveCodeBench updates highlight major improvements in reasoning and step-by-step logic verification for software engineering tasks.',
              searchQuery: 'SWE-bench HumanEval LLM code generation evaluation benchmark'
            },
            {
              title: 'Copilot Workspace & Contextual Dev Agents',
              summary: 'AI workspace tools now understand complete repository architecture, allowing developers to plan, issue-solve, and deploy PRs using natural language instructions.',
              searchQuery: 'GitHub Copilot Workspace repository context AI development'
            }
          ],
          'Latest AI news & papers': [
            {
              title: 'Breakthroughs in Reasoning Models & Test-Time Compute',
              summary: 'New research papers explore scaling test-time compute and chain-of-thought verification to achieve state-of-the-art performance in complex math and scientific logic.',
              searchQuery: 'LLM test time compute reasoning models paper research'
            },
            {
              title: 'Multimodal Vision-Language Frontier Models',
              summary: 'Recent model releases integrate native real-time audio, vision, and text processing with ultra-low latency for interactive agent applications.',
              searchQuery: 'Multimodal AI vision language frontier model research'
            },
            {
              title: 'Open Source Model Ecosystem Updates',
              summary: 'Llama 3, Mistral, and Qwen model families rival proprietary frontier models in efficiency, enabling local quantization and specialized domain fine-tuning.',
              searchQuery: 'Open source LLM Llama Qwen Mistral HuggingFace model'
            }
          ],
          'Mobile & React Native dev': [
            {
              title: 'React Native New Architecture & Fabric Engine',
              summary: 'React Native 0.76+ default enables the New Architecture (Fabric & TurboModules), delivering synchronous layout measurements and superior native UI performance.',
              searchQuery: 'React Native New Architecture Fabric TurboModules 0.76'
            },
            {
              title: 'Expo SDK 52 & AI Integration Capabilities',
              summary: 'Expo SDK 52 introduces enhanced React Compiler compatibility, native webview DOM components, and seamless background task scheduling for mobile AI apps.',
              searchQuery: 'Expo SDK 52 React Native background tasks'
            },
            {
              title: 'On-Device AI Models for iOS & Android',
              summary: 'Running LLMs natively on mobile hardware using ExecuTorch, MediaPipe, and Apple Neural Engine enables offline privacy-first AI intelligence.',
              searchQuery: 'On-device LLM mobile ExecuTorch Apple Neural Engine Android'
            }
          ]
        };

        interests.forEach(interest => {
          const presetList = curatedTopics[interest];
          if (presetList && presetList.length > 0) {
            presetList.forEach(preset => {
              items.push({
                category: interest,
                title: preset.title,
                summary: preset.summary,
                link: `https://news.google.com/search?q=${encodeURIComponent(preset.searchQuery)}`
              });
            });
          } else {
            const topics = [
              {
                title: `Key Innovations in ${interest}`,
                summary: `Latest breakthroughs, industry developments, and practical engineering applications regarding ${interest}.`,
                query: `${interest} latest research news trends`
              },
              {
                title: `Top Papers & Tools in ${interest}`,
                summary: `Curated repository of top trending GitHub projects, whitepapers, and real-world implementations of ${interest}.`,
                query: `${interest} github research paper`
              }
            ];
            topics.forEach(t => {
              items.push({
                category: interest,
                title: t.title,
                summary: t.summary,
                link: `https://www.google.com/search?q=${encodeURIComponent(t.query)}`
              });
            });
          }
        });

        resolve(items);
      }, 1500);
    });
  },

  async deliverViaWhatsApp(phone: string, items: DigestItem[]) {
    let message = `*☀️ YOUR DAILY DIGEST*\n\n`;
    
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, DigestItem[]>);
    
    for (const [cat, catItems] of Object.entries(grouped)) {
      message += `*📌 ${cat.toUpperCase()}*\n`;
      catItems.forEach(item => {
        message += `• *${item.title}*\n${item.summary}\n`;
        if (item.link) {
          message += `🔗 Research: ${item.link}\n`;
        }
        message += `\n`;
      });
    }
    
    message += `_Curated locally on your device by Daily Digest AI._`;

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const encodedText = encodeURIComponent(message);
    
    const nativeUrl = cleanPhone 
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;
    
    const webUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    try {
      if (await Linking.canOpenURL(nativeUrl)) {
        await Linking.openURL(nativeUrl);
        return;
      }
    } catch (e) {
      console.log('Native whatsapp link failed, trying web fallback:', e);
    }

    await Linking.openURL(webUrl);
  }
};
