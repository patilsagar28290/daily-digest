import React, { useEffect, Component, ErrorInfo } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/store/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { AgentService } from './src/services/agent';
import { StorageService } from './src/services/storage';

const BACKGROUND_FETCH_TASK = 'background-digest-fetch';

// Error Boundary to prevent white screen crashes
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>☀️</Text>
          <Text style={errorStyles.title}>Daily Digest</Text>
          <Text style={errorStyles.subtitle}>App encountered a display issue</Text>
          <Text style={errorStyles.message}>{this.state.error}</Text>
          <TouchableOpacity 
            style={errorStyles.button} 
            onPress={() => this.setState({ hasError: false, error: '' })}
          >
            <Text style={errorStyles.buttonText}>Restart Application</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6366F1', marginBottom: 16 },
  message: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 24, backgroundColor: '#1E293B', padding: 12, borderRadius: 8 },
  button: { backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 }
});

// Safely define background task without breaking startup if native modules differ
try {
  if (TaskManager && typeof TaskManager.defineTask === 'function') {
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      try {
        const prefs = await StorageService.getPreferences();
        if (!prefs || !prefs.isOnboarded || !prefs.aiProvider || !prefs.selectedInterests) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const today = new Date().toISOString().split('T')[0];
        const history = await StorageService.getDigestHistory();
        const todayRun = history ? history.find(h => h.id === today) : null;

        const hour = new Date().getHours();
        if (hour >= 7 && !todayRun) {
          const items = await AgentService.generateDailyDigest(prefs.selectedInterests, prefs.aiProvider);

          await StorageService.addDigestRun({
            id: today,
            date: new Date().toISOString(),
            status: 'success',
            items
          });

          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Your Daily Digest is ready ☀️",
                body: "Tap to view today's AI-curated insights.",
              },
              trigger: null as any,
            });
          } catch (notifErr) {
            console.log('Background notification schedule failed:', notifErr);
          }

          return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        return BackgroundFetch.BackgroundFetchResult.NoData;
      } catch (err) {
        console.error('Background task error:', err);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }
} catch (e) {
  console.log('Failed to define background task:', e);
}

export default function App() {
  useEffect(() => {
    initAppServices();
  }, []);

  const initAppServices = async () => {
    // 1. Setup notification handler safely
    try {
      if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      }

      if (Platform.OS === 'android' && Notifications && typeof Notifications.setNotificationChannelAsync === 'function') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
        });
      }

      if (Notifications && typeof Notifications.requestPermissionsAsync === 'function') {
        await Notifications.requestPermissionsAsync();
      }
    } catch (e) {
      console.log("Notification init failed:", e);
    }

    // 2. Register background fetch safely
    try {
      if (BackgroundFetch && typeof BackgroundFetch.registerTaskAsync === 'function') {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 60 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
    } catch (err) {
      console.log("Task Register failed:", err);
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <AppProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
