import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialColors } from "@/constants/theme";

interface ProfileProps {
  onLogoutPress?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToWealth?: () => void;
  onNavigateToPayments?: () => void;
}

interface SecurityOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  toggle?: boolean;
}

interface PreferenceOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const SECURITY_OPTIONS: SecurityOption[] = [
  {
    id: "1",
    label: "Face ID / Biometrics",
    description: "Fast, secure login",
    icon: "face",
    toggle: true,
  },
  {
    id: "2",
    label: "Change PIN",
    description: "Update your access code",
    icon: "lock",
  },
  {
    id: "3",
    label: "Trusted Devices",
    description: "Manage active sessions",
    icon: "devices",
  },
];

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    id: "1",
    label: "Notifications",
    description: "Alerts, updates, and offers",
    icon: "bell-outline",
  },
  {
    id: "2",
    label: "Language & Region",
    description: "English (US), USD",
    icon: "earth",
  },
  {
    id: "3",
    label: "Appearance",
    description: "System default",
    icon: "moon",
  },
];

export const ProfileScreen: React.FC<ProfileProps> = ({
  onLogoutPress,
  onNavigateToHome,
  onNavigateToWealth,
  onNavigateToPayments,
}) => {
  const colors = MaterialColors.light;
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  const handleLogout = useCallback(() => {
    onLogoutPress?.();
  }, [onLogoutPress]);

  const renderSecurityOption = (item: SecurityOption) => (
    <View key={item.id} style={styles.optionContainer}>
      <View style={styles.optionContent}>
        <View
          style={[
            styles.optionIcon,
            {
              backgroundColor: colors.surfaceContainer,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionLabel, { color: colors.onSurface }]}>
            {item.label}
          </Text>
          <Text
            style={[
              styles.optionDescription,
              { color: colors.onSurfaceVariant },
            ]}
          >
            {item.description}
          </Text>
        </View>
      </View>
      {item.toggle ? (
        <Switch
          value={biometricsEnabled}
          onValueChange={setBiometricsEnabled}
          trackColor={{
            false: colors.surfaceDim,
            true: colors.primary,
          }}
          thumbColor={
            biometricsEnabled ? colors.primary : colors.onSurfaceVariant
          }
        />
      ) : (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.onSurfaceVariant}
        />
      )}
    </View>
  );

  const renderPreferenceOption = (item: PreferenceOption) => (
    <TouchableOpacity
      key={item.id}
      style={styles.optionContainer}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={styles.optionContent}>
        <View
          style={[
            styles.optionIcon,
            {
              backgroundColor: colors.surfaceContainer,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionLabel, { color: colors.onSurface }]}>
            {item.label}
          </Text>
          <Text
            style={[
              styles.optionDescription,
              { color: colors.onSurfaceVariant },
            ]}
          >
            {item.description}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.onSurfaceVariant}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View
          style={[
            styles.profileHeader,
            {
              backgroundColor: colors.surfaceContainerLowest,
            },
          ]}
        >
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.surfaceContainer,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="account"
                size={48}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.onSurface }]}>
              Alex Mercer
            </Text>
            <View style={styles.emailContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                size={16}
                color={colors.primary}
              />
              <Text
                style={[
                  styles.profileEmail,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                alex.mercer@example.com
              </Text>
            </View>
            <View
              style={[
                styles.memberBadge,
                {
                  backgroundColor: colors.secondaryContainer,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color={colors.onSecondaryContainer}
              />
              <Text
                style={[
                  styles.memberBadgeText,
                  {
                    color: colors.onSecondaryContainer,
                  },
                ]}
              >
                Aegis Premium Member
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.editButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <MaterialCommunityIcons
              name="pencil"
              size={18}
              color={colors.onPrimary}
            />
            <Text
              style={[
                styles.editButtonText,
                {
                  color: colors.onPrimary,
                },
              ]}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Security & Login */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Security & Login
            </Text>
            <View
              style={[
                styles.optionsCard,
                {
                  backgroundColor: colors.surfaceContainer,
                },
              ]}
            >
              {SECURITY_OPTIONS.map((option, index) => (
                <View key={option.id}>
                  {renderSecurityOption(option)}
                  {index < SECURITY_OPTIONS.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        {
                          backgroundColor: colors.surfaceDim,
                        },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Preferences
            </Text>
            <View
              style={[
                styles.optionsCard,
                {
                  backgroundColor: colors.surfaceContainer,
                },
              ]}
            >
              {PREFERENCE_OPTIONS.map((option, index) => (
                <View key={option.id}>
                  {renderPreferenceOption(option)}
                  {index < PREFERENCE_OPTIONS.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        {
                          backgroundColor: colors.surfaceDim,
                        },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Support & Legal */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Support & Legal
            </Text>
            <View
              style={[
                styles.supportCard,
                {
                  backgroundColor: colors.surfaceContainerLow,
                },
              ]}
            >
              <View style={styles.supportButtonsContainer}>
                <TouchableOpacity
                  style={styles.supportButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Help Center"
                >
                  <MaterialCommunityIcons
                    name="help-circle-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.supportButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    Help Center
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.supportButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Privacy Policy"
                >
                  <MaterialCommunityIcons
                    name="shield-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.supportButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.signOutButton,
                  {
                    backgroundColor: colors.error,
                  },
                ]}
                onPress={handleLogout}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={18}
                  color={colors.onError}
                />
                <Text
                  style={[
                    styles.signOutButtonText,
                    {
                      color: colors.onError,
                    },
                  ]}
                >
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderTopColor: colors.outlineVariant,
          },
        ]}
      >
        {[
          {
            label: "Home",
            icon: "home",
            active: false,
            onPress: onNavigateToHome,
          },
          {
            label: "Wealth",
            icon: "wallet-outline",
            active: false,
            onPress: onNavigateToWealth,
          },
          {
            label: "Payments",
            icon: "credit-card",
            active: false,
            onPress: onNavigateToPayments,
          },
          {
            label: "Profile",
            icon: "account",
            active: true,
            onPress: undefined,
          },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            style={[
              styles.navItem,
              item.active && [
                styles.navItemActive,
                {
                  backgroundColor: colors.primary,
                },
              ],
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: item.active }}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={item.active ? colors.onPrimary : colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.navLabel,
                {
                  color: item.active
                    ? colors.onPrimary
                    : colors.onSurfaceVariant,
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    borderRadius: 16,
    margin: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  profileEmail: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  optionsCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  supportCard: {
    borderRadius: 12,
    padding: 16,
  },
  supportButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  supportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  signOutButtonText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bottomSpacing: {
    height: 80,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  navItemActive: {
    opacity: 0.9,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
