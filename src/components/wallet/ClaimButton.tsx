import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
} from 'react-native-reanimated';

import { useClaim } from '@/hooks/useClaim';
import { useWallet } from '@/hooks/useWallet';
import { formatDistance } from '@/utils/geo';

interface ClaimButtonProps {
  dropId: string;
  amount: number;
  distance: number | null;
  isInRange: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClaimButton({ dropId, amount, distance, isInRange }: ClaimButtonProps) {
  const { claim, isClaiming, lastClaimResult } = useClaim();
  const { isConnected, connect, isConnecting } = useWallet();
  
  // Animation values
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  // Pulse animation when in range
  useEffect(() => {
    if (isInRange && !isClaiming) {
      pulse.value = withRepeat(
        withSequence(
          withSpring(1.05, { damping: 10 }),
          withSpring(1, { damping: 10 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [isInRange, isClaiming]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const handlePress = async () => {
    if (isClaiming || isConnecting) return;

    // Animate press
    scale.value = withSpring(0.95, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });

    if (!isConnected) {
      await connect();
      return;
    }

    if (isInRange) {
      await claim(dropId);
    }
  };

  // Determine button state and text
  const getButtonContent = () => {
    if (isClaiming) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FFFFFF" size="small" />
          <Text style={styles.buttonText}>Claiming...</Text>
        </View>
      );
    }

    if (!isConnected) {
      return <Text style={styles.buttonText}>Connect Wallet</Text>;
    }

    if (!isInRange && distance !== null) {
      return (
        <Text style={styles.buttonTextDisabled}>
          {formatDistance(distance)} away
        </Text>
      );
    }

    return (
      <Text style={styles.buttonText}>
        Claim {amount} $MON
      </Text>
    );
  };

  const isDisabled = isClaiming || isConnecting || (isConnected && !isInRange);

  return (
    <AnimatedPressable
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        isInRange && isConnected && styles.buttonActive,
        animatedStyle,
      ]}
      onPress={handlePress}
      disabled={isClaiming || isConnecting}
    >
      {getButtonContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#836EF9',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#836EF9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#2A2A35',
    shadowOpacity: 0,
  },
  buttonActive: {
    backgroundColor: '#00D9FF',
    shadowColor: '#00D9FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

