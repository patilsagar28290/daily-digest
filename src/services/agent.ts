import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
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
    installed.push('Gemini', 'Claude', 'Perplexity', 'OpenAI');
    return [...new Set(installed)];
  },

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch (e) {
      console.error('Clipboard error:', e);
      return false;
    }
  },

  async openAIProviderApp(providerId: string, interestTopic?: string) {
    const provider = AI_PROVIDERS.find(p => p.id.toLowerCase() === providerId.toLowerCase()) || AI_PROVIDERS[0];
    
    // Construct tailor-made prompt for AI research
    const prompt = interestTopic 
      ? `Perform deep research on "${interestTopic}". Provide top 3 breakthroughs, key tools, and list real web links with concise summarizations for each.`
      : `Perform daily AI research digest. Summarize latest breakthroughs across selected interests and return top research links.`;
    
    // Copy prompt to clipboard so user can instantly paste into Gemini/ChatGPT/Claude/Perplexity
    await this.copyToClipboard(prompt);

    const targetUrl = interestTopic ? provider.searchUrl(prompt) : provider.webUrl;

    try {
      if (provider.urlScheme && await Linking.canOpenURL(provider.urlScheme)) {
        await Linking.openURL(provider.urlScheme);
        return;
      }
    } catch (e) {
      console.log('Native scheme open failed, using web URL:', e);
    }

    try {
      await Linking.openURL(targetUrl);
    } catch (err) {
      console.error('Failed to open provider web URL:', err);
    }
  },

  async openURL(url: string) {
    if (!url) return;
    try {
      // Ensure proper protocol prefix
      let validUrl = url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      await Linking.openURL(validUrl);
    } catch (e) {
      console.error('Failed to open URL directly:', url, e);
      try {
        const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        await Linking.openURL(fallbackUrl);
      } catch (err) {
        console.error('Fallback URL search failed:', err);
      }
    }
  },

  // Intelligent parser for raw text copied from Gemini/ChatGPT/Claude
  parseImportedText(rawText: string, category: string): DigestItem[] {
    if (!rawText || !rawText.trim()) return [];
    
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const items: DigestItem[] = [];
    
    let currentTitle = '';
    let currentSummary = '';
    let currentLink = '';

    const urlRegex = /(https?:\/\/[^\s]+)/gi;

    lines.forEach(line => {
      const urls = line.match(urlRegex);
      if (urls && urls.length > 0 && !currentLink) {
        currentLink = urls[0].replace(/[\)\.\,]+$/, '');
      }

      if (line.startsWith('#') || line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
        if (currentTitle && currentSummary) {
          items.push({
            category,
            title: currentTitle.replace(/^[#•\-\*\d\.\s]+/, '').trim(),
            summary: currentSummary,
            link: currentLink || `https://www.google.com/search?q=${encodeURIComponent(currentTitle)}`
          });
          currentTitle = '';
          currentSummary = '';
          currentLink = '';
        }
        currentTitle = line.replace(/^[#•\-\*\d\.\s]+/, '').trim();
      } else if (currentTitle) {
        currentSummary += (currentSummary ? ' ' : '') + line;
      } else {
        currentTitle = line.slice(0, 60);
        currentSummary = line;
      }
    });

    if (currentTitle) {
      items.push({
        category,
        title: currentTitle.replace(/^[#•\-\*\d\.\s]+/, '').trim(),
        summary: currentSummary || 'Curated AI insight imported from external agent.',
        link: currentLink || `https://www.google.com/search?q=${encodeURIComponent(currentTitle)}`
      });
    }

    return items;
  },

  async generateDailyDigest(interests: string[], provider: string): Promise<DigestItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items: DigestItem[] = [];
        
        const curatedTopics: Record<string, Array<{ title: string; summary: string; searchQuery: string; defaultUrl?: string }>> = {
          'AI trends in travel industry': [
            {
              title: 'AI Autonomous Itinerary & Dynamic Pricing Engine',
              summary: 'Airlines and OTA platforms are deploying real-time predictive ML for dynamic seat pricing, automated flight disruption rebooking, and hyper-personalized travel agents.',
              searchQuery: 'AI trends travel industry dynamic pricing booking',
              defaultUrl: 'https://news.google.com/search?q=AI+travel+industry+trends'
            },
            {
              title: 'Generative AI Concierge & Smart Airport Automation',
              summary: 'Global airports implement computer vision for passport-free biometrics and LLM-powered multi-lingual digital assistants for passengers.',
              searchQuery: 'Generative AI airport concierge passenger automation',
              defaultUrl: 'https://www.google.com/search?q=Generative+AI+airport+concierge'
            }
          ],
          'AI trends in banking industry': [
            {
              title: 'Real-Time Fraud Detection & Anti-Money Laundering ML',
              summary: 'Banks are shifting to graph neural networks (GNNs) and transformer models to identify transaction fraud in milliseconds with 40% fewer false positives.',
              searchQuery: 'AI banking fraud detection graph neural networks',
              defaultUrl: 'https://news.google.com/search?q=AI+banking+fraud+detection'
            },
            {
              title: 'Autonomous Financial Advisors & Credit Risk AI',
              summary: 'Generative AI models analyze alternative data sources for credit scoring and offer automated micro-investment advice to retail banking clients.',
              searchQuery: 'AI credit risk modeling generative financial advisors',
              defaultUrl: 'https://www.google.com/search?q=AI+credit+risk+modeling'
            }
          ],
          'AI trends in e-commerce': [
            {
              title: 'Visual Search & Virtual Try-On Innovations',
              summary: 'Diffusion models enable instant 3D product try-ons and multimodal image search, boosting conversion rates by over 25% for top fashion retailers.',
              searchQuery: 'e-commerce visual search virtual try-on AI',
              defaultUrl: 'https://news.google.com/search?q=AI+ecommerce+virtual+try+on'
            },
            {
              title: 'Hyper-Personalized Recommendation Graphs',
              summary: 'Next-gen recommendation engines combine user behavioral embeddings with real-time inventory signals to maximize cart value.',
              searchQuery: 'ecommerce AI recommendation engine graph ML',
              defaultUrl: 'https://www.google.com/search?q=ecommerce+AI+recommendation+engine'
            }
          ],
          'AI hackathon projects': [
            {
              title: 'Voice-First AI Agents & Agentic Workflows',
              summary: 'Winning projects leverage WebRTC, Deepgram, and Claude 3.5 Sonnet to build zero-latency voice assistants for healthcare and customer support.',
              searchQuery: 'AI hackathon winning projects agentic workflows',
              defaultUrl: 'https://devpost.com/hackathons?search=AI'
            },
            {
              title: 'Local Multimodal RAG on Edge Devices',
              summary: 'Developers demonstrate full offline document research tools using Ollama, Llama 3, and vector storage running entirely on consumer laptops.',
              searchQuery: 'local RAG edge AI hackathon project Ollama',
              defaultUrl: 'https://github.com/topics/ai-hackathon'
            }
          ],
          'AI in software': [
            {
              title: 'Autonomous AI Pair Programmers & Refactoring Agents',
              summary: 'Devin, Cursor, and Claude 3.5 Sonnet drive multi-file refactoring, autonomous unit test generation, and pull request reviews directly in CI/CD pipelines.',
              searchQuery: 'AI software engineering coding agents Cursor Claude',
              defaultUrl: 'https://news.google.com/search?q=AI+software+engineering+agents'
            },
            {
              title: 'SWE-Bench & LiveCodeBench Autonomous Agent Benchmarks',
              summary: 'Latest benchmarks show AI coding agents solving over 40% of real GitHub issues completely unattended.',
              searchQuery: 'SWE-bench LiveCodeBench LLM coding evaluation',
              defaultUrl: 'https://swebench.github.io/'
            }
          ],
          'AI news': [
            {
              title: 'Frontier Reasoning Models & Test-Time Compute Scaling',
              summary: 'New research demonstrates that scaling test-time search and chain-of-thought verification significantly outperforms traditional model parameter scaling.',
              searchQuery: 'LLM test time compute reasoning models frontier AI news',
              defaultUrl: 'https://news.google.com/search?q=frontier+AI+reasoning+models'
            },
            {
              title: 'Open Source Model Frontier & Local Deployment',
              summary: 'Open-weight models like Llama 3, Qwen 2.5, and DeepSeek deliver enterprise-grade performance at a fraction of cloud inference costs.',
              searchQuery: 'open source LLM Llama Qwen DeepSeek frontier AI',
              defaultUrl: 'https://huggingface.co/models'
            }
          ],
          'GitHub AI repos': [
            {
              title: 'Open-Source Agent Frameworks & Tooling',
              summary: 'Repositories like LangChain, AutoGen, CrewAI, and LlamaIndex top GitHub trending with new multi-agent orchestrators.',
              searchQuery: 'GitHub trending AI repositories agent framework',
              defaultUrl: 'https://github.com/trending?spoken_language_code=en'
            },
            {
              title: 'Lightweight Local LLM Inference Engines',
              summary: 'Ollama, vLLM, and llama.cpp gain thousands of stars as developers optimize low-latency local inference on consumer GPUs.',
              searchQuery: 'GitHub trending local LLM inference llama.cpp vLLM',
              defaultUrl: 'https://github.com/trending/python'
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
                link: preset.defaultUrl || `https://www.google.com/search?q=${encodeURIComponent(preset.searchQuery)}`
              });
            });
          } else {
            const topics = [
              {
                title: `Key Innovations in ${interest}`,
                summary: `Latest breakthroughs, industry developments, and practical engineering applications regarding ${interest}.`,
                query: `${interest} latest research news trends`,
                url: `https://news.google.com/search?q=${encodeURIComponent(interest)}`
              },
              {
                title: `Top Papers & Tools in ${interest}`,
                summary: `Curated repository of top trending GitHub projects, whitepapers, and real-world implementations of ${interest}.`,
                query: `${interest} github research paper`,
                url: `https://www.google.com/search?q=${encodeURIComponent(interest + ' research paper')}`
              }
            ];
            topics.forEach(t => {
              items.push({
                category: interest,
                title: t.title,
                summary: t.summary,
                link: t.url
              });
            });
          }
        });

        resolve(items);
      }, 1000);
    });
  },

  async deliverViaWhatsApp(phone: string, items: DigestItem[]): Promise<{ copied: boolean; opened: boolean }> {
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
          message += `🔗 Link: ${item.link}\n`;
        }
        message += `\n`;
      });
    }
    
    message += `_Curated locally on your device by Daily Digest AI._`;

    // 1. Copy complete formatted text to system clipboard
    const copied = await this.copyToClipboard(message);

    // 2. Clean up phone number (remove +, spaces, dashes)
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const encodedText = encodeURIComponent(message);
    
    // Construct direct WhatsApp URLs
    const nativeUrl = cleanPhone 
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;
    
    const webUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    try {
      if (await Linking.canOpenURL(nativeUrl)) {
        await Linking.openURL(nativeUrl);
        return { copied, opened: true };
      }
    } catch (e) {
      console.log('Native whatsapp link failed, trying api fallback:', e);
    }

    try {
      await Linking.openURL(webUrl);
    } catch (err) {
      console.error('WhatsApp web link failed:', err);
    }

    return { copied, opened: true };
  }
};

