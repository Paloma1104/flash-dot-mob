import { GlassCard } from '@/src/components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function GlassDock({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <GlassCard style={styles.dock} intensity={95} variant="accent">
        <View style={styles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const icon = 
              route.name === 'index' ? '🗺️' :
              route.name === 'wallet' ? '💳' :
              '🏆';

            const label = 
              route.name === 'index' ? 'Map' :
              route.name === 'wallet' ? 'Wallet' :
              'Profile';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tab}
              >
                <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                  {isFocused && (
                    <LinearGradient
                      colors={['#836EF9', '#00D9FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.activeGradient}
                    />
                  )}
                  <Text style={styles.iconText}>{icon}</Text>
                </View>
                <Text style={[styles.label, isFocused && styles.activeLabel]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    pointerEvents: 'box-none',
  },
  dock: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(131, 110, 249, 0.4)',
    shadowColor: '#836EF9',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: 'rgba(13, 13, 15, 0.85)',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    gap: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    position: 'relative',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(131, 110, 249, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(131, 110, 249, 0.6)',
  },
  activeGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 14,
    opacity: 0.15,
  },
  iconText: {
    fontSize: 24,
    zIndex: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
