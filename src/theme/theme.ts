export const theme = {
  colors: {
    background: '#0F172A', // slate-950
    surface: '#1E293B',    // slate-800
    surfaceLight: '#334155', // slate-700
    primary: '#3B82F6',    // blue-500
    primaryDark: '#2563EB', // blue-600
    primaryLight: '#60A5FA', // blue-400
    secondary: '#10B981',  // emerald-500
    text: '#F8FAFC',       // slate-50
    textSecondary: '#94A3B8', // slate-400
    border: '#334155',
    error: '#EF4444',
    success: '#10B981',
    whatsapp: '#25D366'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '800' as const, color: '#F8FAFC' },
    h2: { fontSize: 24, fontWeight: '700' as const, color: '#F8FAFC' },
    h3: { fontSize: 20, fontWeight: '600' as const, color: '#F8FAFC' },
    body: { fontSize: 16, fontWeight: '400' as const, color: '#94A3B8' },
    bodyMedium: { fontSize: 16, fontWeight: '500' as const, color: '#F8FAFC' },
    small: { fontSize: 14, fontWeight: '400' as const, color: '#94A3B8' },
  }
};
