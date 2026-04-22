export const Colors = {
  // Primary palette
  bg: '#0A0E1A',
  bgCard: '#111827',
  bgCardLight: '#1A2332',
  bgInput: '#1E293B',
  bgOverlay: 'rgba(10, 14, 26, 0.85)',

  // Accent gradient
  accentStart: '#06B6D4', // cyan
  accentEnd: '#8B5CF6',   // violet
  accentMid: '#3B82F6',   // blue

  // Semantic
  primary: '#06B6D4',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Borders
  border: '#1E293B',
  borderLight: '#334155',

  // Categories
  categoryRent: '#F97316',
  categoryFood: '#EF4444',
  categoryGroceries: '#10B981',
  categoryShopping: '#8B5CF6',
  categoryInvestment: '#06B6D4',
  categoryUtilities: '#F59E0B',
  categoryTransport: '#EC4899',
  categorySalary: '#22D3EE',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  hero: 36,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const categoryColor = (cat: string): string => {
  const map: Record<string, string> = {
    RENT: Colors.categoryRent,
    FOOD: Colors.categoryFood,
    GROCERIES: Colors.categoryGroceries,
    SHOPPING: Colors.categoryShopping,
    INVESTMENT: Colors.categoryInvestment,
    UTILITIES: Colors.categoryUtilities,
    TRANSPORT: Colors.categoryTransport,
    SALARY: Colors.categorySalary,
  };
  return map[cat?.toUpperCase()] || Colors.textMuted;
};
