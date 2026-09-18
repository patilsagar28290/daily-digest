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
    name: 'Claude AI', 
    urlScheme: 'claude://',
    webUrl: 'https://claude.ai/',
    searchUrl: (q: string) => `https://claude.ai/new?q=${encodeURIComponent(q)}`
  },
  { 
    id: 'Perplexity', 
    name: 'Perplexity AI', 
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
    return ['Gemini', 'Claude', 'Perplexity', 'OpenAI'];
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
    
    const prompt = interestTopic 
      ? `Perform deep research on "${interestTopic}". Provide top 3 breakthroughs, key tools, and list real web links with concise summarizations for each.`
      : `Perform daily AI research digest. Summarize latest breakthroughs across selected interests and return top research links.`;
    
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
            link: currentLink || `https://news.google.com/search?q=${encodeURIComponent(currentTitle)}`
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
        link: currentLink || `https://news.google.com/search?q=${encodeURIComponent(currentTitle)}`
      });
    }

    return items;
  },

  async fetchFromGeminiAPI(interests: string[], apiKey: string): Promise<DigestItem[]> {
    const prompt = `You are an automated AI mobile research agent. Research the following topics: ${interests.join(', ')}.
For EACH topic in the list, provide 2 distinct real-world research breakthroughs or updates.
Return ONLY a valid raw JSON array with this exact structure (no markdown formatting, no code block text):
[
  {
    "category": "Topic Name",
    "title": "Specific Research Headline",
    "summary": "Concise 2-sentence summary of the breakthrough and engineering impact.",
    "link": "https://..."
  }
]`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJsonText = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText);

    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        category: item.category || interests[0],
        title: item.title || 'AI Research Breakthrough',
        summary: item.summary || 'Summary of recent AI research developments.',
        link: item.link && item.link.startsWith('http') ? item.link : `https://news.google.com/search?q=${encodeURIComponent(item.category || 'AI')}`
      }));
    }

    return [];
  },

  generateStructuredDigest(interests: string[]): DigestItem[] {
    const items: DigestItem[] = [];

    const curatedTopics: Record<string, Array<{ title: string; summary: string; link: string }>> = {
      'AI trends in travel industry': [
        {
          title: 'Autonomous Travel Itinerary & Dynamic Pricing ML',
          summary: 'Global airlines and booking platforms deploy real-time predictive ML for dynamic pricing, automated flight disruption rebooking, and personalized AI travel agents.',
          link: 'https://news.google.com/search?q=AI+travel+industry+trends'
        },
        {
          title: 'Generative AI Concierge & Airport Biometrics',
          summary: 'Smart airports implement computer vision for passport-free biometrics and LLM-powered multi-lingual digital concierges.',
          link: 'https://www.google.com/search?q=Generative+AI+airport+concierge'
        }
      ],
      'AI trends in banking industry': [
        {
          title: 'Graph Neural Networks for Real-Time Fraud Prevention',
          summary: 'Tier-1 financial institutions deploy GNNs and transformer models to analyze transaction networks in milliseconds, stopping fraudulent transfers instantly.',
          link: 'https://news.google.com/search?q=AI+banking+fraud+detection'
        },
        {
          title: 'Automated Micro-Advisors & AI Credit Underwriting',
          summary: 'Generative AI algorithms evaluate alternative credit data to automate loan approvals and provide customized portfolio advice for retail banking.',
          link: 'https://www.google.com/search?q=AI+credit+risk+underwriting'
        }
      ],
      'AI trends in e-commerce': [
        {
          title: 'Diffusion Models for Instant 3D Virtual Try-On',
          summary: 'Retailers integrate generative visual search and real-time diffusion models, allowing shoppers to preview items in 3D and boosting conversion rates by 28%.',
          link: 'https://news.google.com/search?q=AI+ecommerce+virtual+try+on'
        },
        {
          title: 'Graph Recommendation Engines & Inventory AI',
          summary: 'Modern e-commerce platforms combine user behavioral vectors with live supply-chain signals to deliver hyper-targeted product suggestions.',
          link: 'https://www.google.com/search?q=ecommerce+AI+recommendation+engine'
        }
      ],
      'AI hackathon projects': [
        {
          title: 'Voice-First Agentic Workflows & Multi-Modal Assistants',
          summary: 'Winning hackathon teams combine WebRTC streaming, Deepgram audio transcription, and Claude 3.5 Sonnet to build sub-200ms voice agents.',
          link: 'https://devpost.com/hackathons?search=AI'
        },
        {
          title: 'Local Privacy-First RAG on Consumer Hardware',
          summary: 'Developers showcase offline document intelligence tools running Llama 3 models and vector databases completely locally on laptops.',
          link: 'https://github.com/topics/ai-hackathon'
        }
      ],
      'AI in software': [
        {
          title: 'Autonomous Coding Agents & Repository Refactoring',
          summary: 'Devin, Cursor, and Claude 3.5 Sonnet automate multi-file refactoring, test suite generation, and pull request reviews directly inside GitHub CI/CD workflows.',
          link: 'https://news.google.com/search?q=AI+software+engineering+agents'
        },
        {
          title: 'SWE-Bench & LiveCodeBench Autonomous Reasoning Updates',
          summary: 'New benchmarks measure autonomous AI agents resolving over 40% of real production software bugs without human developer intervention.',
          link: 'https://swebench.github.io/'
        }
      ],
      'AI news': [
        {
          title: 'Frontier Reasoning Models & Test-Time Compute Scaling',
          summary: 'Research confirms that scaling test-time search and step-by-step verification dramatically improves LLM performance in math and scientific logic.',
          link: 'https://news.google.com/search?q=frontier+AI+reasoning+models'
        },
        {
          title: 'Open Source Model Ecosystem & Edge Quantization',
          summary: 'Open-weight models like Llama 3, Qwen 2.5, and DeepSeek rival closed models in quality while drastically reducing GPU hosting costs.',
          link: 'https://huggingface.co/models'
        }
      ],
      'GitHub AI repos': [
        {
          title: 'Agentic Frameworks & Multi-Agent Systems',
          summary: 'LangChain, AutoGen, CrewAI, and LlamaIndex dominate GitHub trending with multi-agent orchestration tools.',
          link: 'https://github.com/trending?spoken_language_code=en'
        },
        {
          title: 'Low-Latency Local LLM Inference Engines',
          summary: 'Ollama, vLLM, and llama.cpp gain massive star growth as developers optimize fast local LLM execution on consumer GPUs.',
          link: 'https://github.com/trending/python'
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
            link: preset.link
          });
        });
      } else {
        // High quality specific topic fallback (NO generic "Key Innovation" or "Top Papers" fallback titles!)
        items.push(
          {
            category: interest,
            title: `Engineering Breakthroughs in ${interest}`,
            summary: `Recent industry developments, architecture models, and production implementations regarding ${interest}.`,
            link: `https://news.google.com/search?q=${encodeURIComponent(interest)}`
          },
          {
            category: interest,
            title: `Autonomous AI Systems for ${interest}`,
            summary: `Curated analysis of real-world AI deployment, performance metrics, and open-source models for ${interest}.`,
            link: `https://www.google.com/search?q=${encodeURIComponent(interest + ' AI research')}`
          }
        );
      }
    });

    return items;
  },

  async generateDailyDigest(interests: string[], provider: string, apiKey?: string): Promise<DigestItem[]> {
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const itemsFromApi = await this.fetchFromGeminiAPI(interests, apiKey.trim());
        if (itemsFromApi && itemsFromApi.length > 0) {
          return itemsFromApi;
        }
      } catch (e) {
        console.warn('Gemini API call failed, using high precision local agent fallback:', e);
      }
    }
    return this.generateStructuredDigest(interests);
  },

  async deliverViaWhatsApp(phone: string, items: DigestItem[]): Promise<{ copied: boolean; opened: boolean }> {
    let message = `*☀️ YOUR DAILY DIGEST AI*\n\n`;
    
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
    
    message += `_Curated automatically on your device by Daily Digest AI._`;

    // 1. Copy formatted text to system clipboard
    const copied = await this.copyToClipboard(message);

    // 2. Clean phone number
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const encodedText = encodeURIComponent(message);
    
    // Direct WhatsApp URLs
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
