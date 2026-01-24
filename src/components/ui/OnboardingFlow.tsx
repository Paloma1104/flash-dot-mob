import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from './GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: 1,
    icon: '🗺️',
    title: 'Welcome to Flash.Mob',
    subtitle: 'Turn Your City Into a Treasure Hunt',
    description: 'Discover crypto drops at real physical locations. Walk around your city, find drops on the map, and earn $MON tokens instantly.',
    monadFeature: 'Powered by Monad - the fastest blockchain',
  },
  {
    id: 2,
    icon: '⚡',
    title: 'Lightning-Fast Claims',
    subtitle: 'Built on Monad Blockchain',
    description: 'Monad processes 10,000+ transactions per second with 1-second finality. Your claims are instant - no waiting, no congestion.',
    monadFeature: 'Experience the power of parallel execution',
  },
  {
    id: 3,
    icon: '💸',
    title: 'Zero Gas Fees',
    subtitle: 'Keep 100% of Your Rewards',
    description: 'Thanks to Monad\'s ultra-low fees and our meta-transaction system, you claim drops for FREE. No native tokens needed.',
    monadFeature: 'Gasless transactions = More earnings for you',
  },
  {
    id: 4,
    icon: '🎮',
    title: 'Compete & Earn',
    subtitle: 'Achievements, Leaderboards & More',
    description: 'Unlock achievements, climb the global leaderboard, and compete with players worldwide. The more you explore, the more you earn.',
    monadFeature: 'Real-time updates powered by Monad',
  },
  {
    id: 5,
    icon: '🏆',
    title: 'Ready to Start?',
    subtitle: 'Your Adventure Awaits',
    description: 'Connect your wallet, enable location, and start claiming drops near you. Join thousands of players earning crypto by exploring their city.',
    monadFeature: 'Be a Monad Pioneer 🎖️',
  },
];

export function OnboardingFlow({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentSlide + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlide(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => (
    <View style={styles.slideContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>

      <GlassCard style={styles.card} intensity={40}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>
        
        <View style={styles.featureBadge}>
          <IconSymbol name="bolt.fill" size={14} color="#836EF9" />
          <Text style={styles.featureText}>{item.monadFeature}</Text>
        </View>
      </GlassCard>

      {/* Slide Indicators */}
      <View style={styles.indicators}>
        {SLIDES.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.indicator,
              idx === currentSlide && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      {/* Features Grid (only on first slide) */}
      {index === 0 && (
        <View style={styles.featuresGrid}>
          <GlassCard style={styles.featureCard} intensity={20}>
            <Text style={styles.featureIcon}>🚀</Text>
            <Text style={styles.featureTitle}>10,000 TPS</Text>
          </GlassCard>
          <GlassCard style={styles.featureCard} intensity={20}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>1-Sec Finality</Text>
          </GlassCard>
          <GlassCard style={styles.featureCard} intensity={20}>
            <Text style={styles.featureIcon}>💎</Text>
            <Text style={styles.featureTitle}>No Gas Fees</Text>
          </GlassCard>
          <GlassCard style={styles.featureCard} intensity={20}>
            <Text style={styles.featureIcon}>🔗</Text>
            <Text style={styles.featureTitle}>EVM Compatible</Text>
          </GlassCard>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D0D0F', '#1A1A25', '#836EF9', '#00D9FF']}
        locations={[0, 0.4, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.monadBadge}>
            <Text style={styles.monadText}>⚡ MONAD</Text>
          </View>
          {currentSlide < SLIDES.length - 1 && (
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Swipeable Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
        />

        {/* Bottom CTA */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>
              {currentSlide < SLIDES.length - 1 ? 'Continue' : 'Get Started'}
            </Text>
            <IconSymbol 
              name={currentSlide < SLIDES.length - 1 ? 'arrow.right' : 'checkmark.circle.fill'} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          {currentSlide === SLIDES.length - 1 && (
            <Text style={styles.disclaimerText}>
              By continuing, you agree to our Terms & Privacy Policy
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  monadBadge: {
    backgroundColor: 'rgba(131, 110, 249, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#836EF9',
  },
  monadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  skipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(131, 110, 249, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: 'rgba(131, 110, 249, 0.5)',
  },
  icon: {
    fontSize: 64,
  },
  card: {
    padding: 24,
    width: '100%',
    borderRadius: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(131, 110, 249, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  featureText: {
    color: '#836EF9',
    fontSize: 13,
    fontWeight: '700',
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#836EF9',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for navigation bar
  },
  primaryButton: {
    backgroundColor: '#836EF9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
