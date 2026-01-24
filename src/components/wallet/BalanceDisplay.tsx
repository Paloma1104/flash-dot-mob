import { useWallet } from '@/hooks/useWallet';
import { useUserStore } from '@/stores/userStore';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface BalanceDisplayProps {
  variant?: 'full' | 'compact';
}

export function BalanceDisplay({ variant = 'full' }: BalanceDisplayProps) {
  const { balance, pendingBalance } = useUserStore();
  const { address, isConnected, disconnect } = useWallet();

  if (!isConnected) {
    return null;
  }

  // Format address to show first 4 and last 4 characters
  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : '';

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBalance}>
          <Text style={styles.compactAmount}>{balance.toFixed(0)}</Text>
          <Text style={styles.compactSymbol}>$MON</Text>
        </View>
        <Pressable onPress={disconnect} style={styles.compactAddress}>
           <Text style={styles.compactAddressText}>{shortAddress}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.balanceSection}>
        <Text style={styles.label}>Balance</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>{balance.toFixed(2)}</Text>
          <Text style={styles.symbol}>$MON</Text>
        </View>
        {pendingBalance > 0 && (
          <Text style={styles.pending}>+{pendingBalance} pending</Text>
        )}
      </View>

      <Pressable style={styles.addressContainer} onPress={disconnect}>
        <Text style={styles.address}>{shortAddress}</Text>
        <Text style={styles.disconnectHint}>Tap to disconnect</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(131, 110, 249, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(131, 110, 249, 0.3)',
  },
  balanceSection: {
    flex: 1,
  },
  label: {
    color: '#A594FF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  symbol: {
    color: '#A594FF',
    fontSize: 16,
    fontWeight: '600',
  },
  pending: {
    color: '#00D9FF',
    fontSize: 12,
    marginTop: 2,
  },
  addressContainer: {
    alignItems: 'flex-end',
  },
  address: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  disconnectHint: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
  },

  // Compact Styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  compactBalance: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 8,
  },
  compactAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 2,
  },
  compactSymbol: {
    color: '#A594FF',
    fontSize: 10,
    fontWeight: '600',
  },
  compactAddress: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactAddressText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

