import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import LoginScreenView from "./login";
import PinEntryScreen from "./pin-entry";

/**
 * App Entry Point
 * Handles navigation based on authentication state:
 * - If user is already logged in → Show PIN Entry
 * - If user is not logged in → Show Login Screen
 */
export default function Index() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // TODO: Replace with your actual authentication state check
    // This should check if user token exists in secure storage
    // Example:
    /*
    const checkAuthStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuthStatus();
    */

    // For now, check if user data exists in app state
    // This is simulated - replace with actual logic
    const checkAuth = async () => {
      // Simulate check delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Default to false (show login)
      // TODO: Check secure storage for auth token
      setIsAuthenticated(false);
    };

    checkAuth();
  }, []);

  // Show login screen while checking auth state
  if (isAuthenticated === null) {
    return <LoginScreenView />;
  }

  // Show PIN entry if user is already authenticated
  if (isAuthenticated) {
    return <PinEntryScreen />;
  }

  // Show login screen if user is not authenticated
  return <LoginScreenView />;
}
