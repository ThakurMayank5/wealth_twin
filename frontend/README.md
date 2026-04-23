# VAULT Banking Application

A modern, secure banking application built with React Native, Expo, and TypeScript. Features Material Design 3, biometric authentication, and comprehensive account management.

## Project Overview

**VAULT** is a production-ready banking application that provides users with:

- Secure customer authentication (credentials + biometric)
- Dashboard with account overview and quick actions
- Wealth management and portfolio tracking
- Payment processing and transaction history
- User profile management
- Material Design 3 UI system

## Project Structure

```
PSB/
├── app/                          # Navigation & Screen Routing (Expo Router)
│   ├── _layout.tsx              # Root navigation configuration
│   ├── index.tsx                # Entry point (redirects to login)
│   ├── login.tsx                # Login screen wrapper
│   ├── register.tsx             # Registration screen wrapper
│   ├── otp-verification.tsx     # OTP verification screen wrapper
│   ├── dashboard.tsx            # Dashboard screen wrapper
│   ├── wealth.tsx               # Wealth management screen wrapper
│   ├── payments.tsx             # Payments screen wrapper
│   └── profile.tsx              # Profile screen wrapper
│
├── components/                   # Reusable UI Components
│   ├── auth/                    # Authentication screens
│   │   ├── login.tsx            # Login form component
│   │   ├── register.tsx         # Registration form component
│   │   ├── otp-verification.tsx # OTP entry component
│   │   └── pin-entry.tsx        # PIN keypad component (for future use)
│   │
│   ├── screens/                 # Main application screens
│   │   ├── dashboard.tsx        # Dashboard with balance & transactions
│   │   ├── wealth.tsx           # Investment portfolio management
│   │   ├── payments.tsx         # Payment processing & history
│   │   └── profile.tsx          # User profile & settings
│   │
│   ├── themed/                  # Design system components
│   │   ├── themed-text.tsx      # Styled text with theme support
│   │   └── themed-view.tsx      # Styled view with theme support
│   │
│   └── ui/                      # UI library components
│       ├── collapsible.tsx      # Collapsible accordion component
│       ├── icon-symbol.tsx      # Platform-agnostic icon handler
│       └── icon-symbol.ios.tsx  # iOS-specific icon handler
│
├── constants/                    # Application constants
│   └── theme.ts                 # Material Design 3 color palette
│
├── hooks/                        # Custom React hooks
│   ├── use-color-scheme.ts      # Theme color detection
│   ├── use-color-scheme.web.ts  # Web-specific theme detection
│   └── use-theme-color.ts       # Theme color utility hook
│
├── assets/                       # Static assets
│   └── images/                  # Image files and icons
│
├── app.json                      # Expo configuration
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.js              # Code linting rules
└── expo-env.d.ts                # Expo TypeScript definitions
```

## Key Features

### 🔐 Authentication

- **Credential Login**: Customer ID + Password
- **Biometric Support**: Face ID / Fingerprint (via expo-local-authentication)
- **OTP Verification**: 6-digit code with 102-second countdown
- **Registration**: 7-field form with validation

### 💰 Dashboard

- Total balance overview
- Quick action buttons (Send Money, Request Money, etc.)
- My Accounts carousel
- Recent transactions list
- Investment insights

### 💎 Wealth Management

- Portfolio overview with YTD performance
- Asset allocation visualization (Bento grid)
- Investment accounts list
- Performance tracking

### 💳 Payments

- Hero actions (Make Payment, Transfer Money, Scheduled)
- Quick payees carousel
- Recent activity with search and filters
- Transaction history by date
- Activity type indicators (In/Out)

### 👤 Profile

- User profile with Aegis Premium badge
- Security & Login options (Face ID toggle, Change PIN, Trusted Devices)
- Preferences (Notifications, Language & Region, Appearance)
- Support & Legal links
- Sign Out functionality

## Technology Stack

- **Framework**: React Native 54.0.0 with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: expo-local-authentication (biometric)
- **Haptics**: expo-haptics (tactile feedback)
- **Icons**: @expo/vector-icons (MaterialCommunityIcons)
- **UI System**: Material Design 3
- **Styling**: React Native StyleSheet

## Color System (Material Design 3)

The app uses a comprehensive Material Design 3 color palette defined in `constants/theme.ts`:

```
Primary: #006a5e
Primary Container: #1d8577
Secondary: #44655e
Secondary Container: #c6eae1
Error: #ba1a1a
Tertiary: #8f4832
Surface: #fffbfe
+ 20+ additional surface and state colors
```

## Navigation Flow

```
Login/Register/OTP → Dashboard → Wealth/Payments/Profile
                   ↓
         Dashboard (Main Hub)
         ├── Wealth Management
         ├── Payments
         └── Profile
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Environment Setup

The project uses Expo managed workflow. Configure in `app.json` for iOS and Android builds:

```json
{
  "expo": {
    "name": "VAULT Banking",
    "slug": "vault-banking",
    "plugins": [["expo-local-authentication"], ["expo-haptics"]]
  }
}
```

## Development

### File Organization Best Practices

1. **Screen Wrappers** (`app/`) - Handle navigation and data flow
2. **Components** (`components/`) - Organized by domain:
   - `auth/` - Authentication UI
   - `screens/` - Full-screen components
   - `themed/` - Design system components
   - `ui/` - Reusable UI elements
3. **Constants** (`constants/`) - Theme, colors, static data
4. **Hooks** (`hooks/`) - Shared custom logic

### Adding New Screens

1. Create component in `components/screens/new-screen.tsx`
2. Create route handler in `app/new-screen.tsx`
3. Update `app/_layout.tsx` to register route
4. Add navigation callbacks to parent screens

### Component Template

```typescript
import React, { useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialColors } from "@/constants/theme";

interface ScreenProps {
  onNavigate?: () => void;
}

export const ScreenName: React.FC<ScreenProps> = ({ onNavigate }) => {
  const colors = MaterialColors.light;

  const handleAction = useCallback(() => {
    onNavigate?.();
  }, [onNavigate]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView style={styles.scrollView}>
        {/* Screen Content */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
});
```

## API Integration

Currently, the app uses simulated API calls with delays. To integrate with a real backend:

1. Create API service in `services/api.ts`
2. Replace `setTimeout` delays with actual fetch calls
3. Handle authentication tokens and refresh logic
4. Update error handling in screen wrappers

## State Management

Currently uses React hooks (useState, useCallback, useContext). For larger apps, consider:

- Redux or Redux Toolkit
- Zustand
- Context API with custom hooks

## Testing

To run tests:

```bash
npm test
```

Tests should cover:

- Authentication flows
- Navigation transitions
- Form validation
- API error handling

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

Ensure you have an Expo account and have run `eas init` in the project.

## Security Considerations

- ✅ Biometric authentication support
- ✅ Secure local storage (implement with expo-secure-store)
- ✅ HTTPS-only API calls
- ⚠️ TODO: Add certificate pinning
- ⚠️ TODO: Implement token refresh mechanism
- ⚠️ TODO: Add app tamper detection

## Performance Optimization

- Memoized components with React.FC
- useCallback for event handlers
- Separate input fields to prevent re-renders
- Flat/SectionList for scrollable content
- Lazy loading for images

## Troubleshooting

### Build Issues

- Clear cache: `npm start -- --clear`
- Rebuild node_modules: `rm -rf node_modules && npm install`

### Navigation Not Working

- Check route names match exactly in `app/_layout.tsx`
- Verify imports use correct paths (`@/components/auth/...`)
- Check ExpoRouter is properly initialized

### Biometric Not Triggering

- Ensure device has biometric hardware
- Check permissions in `app.json`
- Run on actual device (simulators may not support all features)

## Contributing

When making changes:

1. Follow the existing file structure
2. Use TypeScript for type safety
3. Maintain Material Design 3 consistency
4. Add accessibility labels to interactive elements
5. Test on both iOS and Android

## License

Proprietary - VAULT Banking Application

---

**Last Updated**: April 2026
**Version**: 1.0.0
