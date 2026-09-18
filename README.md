# Daily Digest by Sagar Patil ☀️

An on-device AI research agent that curates a personalized morning digest and delivers it via WhatsApp.

## 🚀 Architecture (No Backend)

*   **Framework:** React Native / Expo
*   **Navigation:** React Navigation (Native Stack)
*   **State / Storage:** Local AppContext wrapping `@react-native-async-storage/async-storage` for pure on-device persistence.
*   **Background Jobs:** Managed by `expo-background-fetch` and `expo-task-manager`. Wakes every morning >=7 AM.
*   **UI/UX:** Native vector icons (`lucide-react-native`) + polished Slate/Blue/Emerald modern UI styling. 
*   **Handoffs:** `expo-linking` is used to send standard protocol buffers payload to WhatsApp with pre-filled curations.

## 📱 Features Built

1.  **Onboarding Core:**
    *   Explicit constraint enforcing exactly **4 topics** out of 7 categories.
    *   Automated scan of installed providers (Gemini, Claude, Perplexity, OpenAI).
    *   Secure localized saving of WhatsApp delivery destination.
2.  **Daily Cron Agent:** Scheduled background hook that compiles trending reports.
3.  **Local Push Agent:** Uses `expo-notifications` for lightweight pinging if user doesn't use WhatsApp fallback.

## 🛠 Running the App

1. Install dependencies: `npm install`
2. Start Expo server: `npx expo start`
3. Scan QR code in Expo Go or run on Android/iOS Emulator

Enjoy a smarter morning! ☕
