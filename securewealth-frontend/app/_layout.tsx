import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/auth-store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const { isLoading, isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'fade',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="ai-chat" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="sips" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
