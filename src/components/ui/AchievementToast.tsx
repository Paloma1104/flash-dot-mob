import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useUserStore } from '@/stores/userStore';
import { GlassCard } from './GlassCard';

export function AchievementToast() {
  const { achievements, newAchievements, dismissNewAchievements } = useUserStore();
  const [visible, setVisible] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<any>(null);
  const slideAnim = useState(new Animated.Value(-200))[0];

  useEffect(() => {
    if (newAchievements.length > 0 && !visible) {
      // Show the first new achievement
      const achievement = achievements.find((a) => a.id === newAchievements[0]);
      if (achievement) {
        setCurrentAchievement(achievement);
        setVisible(true);

        // Slide in
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();

        // Auto dismiss after 4 seconds
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            setCurrentAchievement(null);
            dismissNewAchievements();
          });
        }, 4000);
      }
    }
  }, [newAchievements, visible, achievements, slideAnim, dismissNewAchievements]);

  if (!visible || !currentAchievement) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <GlassCard style={styles.card} intensity={80} variant="accent">
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{currentAchievement.icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>🎉 Achievement Unlocked!</Text>
            <Text style={styles.title}>{currentAchievement.name}</Text>
            <Text style={styles.description}>{currentAchievement.description}</Text>
          </View>
        </View>
        <View style={styles.monadBadge}>
          <Text style={styles.monadText}>⚡ MONAD</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#836EF9',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(131, 110, 249, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: '#00D9FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  description: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  monadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(131, 110, 249, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#836EF9',
  },
  monadText: {
    color: '#836EF9',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

