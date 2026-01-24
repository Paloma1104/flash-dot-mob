import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GlassDock } from '@/components/navigation/GlassDock';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <GlassDock {...props} />}
      screenOptions={{
        headerShown: false,
        // Hide default tab bar style since we use custom
        tabBarStyle: { display: 'none' }, // Just in case
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Leaderboard',
        }}
      />
    </Tabs>
  );
}

