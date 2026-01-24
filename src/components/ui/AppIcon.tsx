import { COLORS } from '@/constants/DesignTokens';
import React from 'react';
import { IconSymbol, IconSymbolName } from './icon-symbol';

export type AppIconName =
  | 'map'
  | 'wallet'
  | 'profile'
  | 'game'
  | 'send'
  | 'receive'
  | 'swap'
  | 'settings'
  | 'close'
  | 'check'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-right'
  | 'arrow-left'
  | 'star'
  | 'trophy'
  | 'chart'
  | 'clock'
  | 'location'
  | 'lock'
  | 'unlock'
  | 'person'
  | 'network'
  | 'refresh'
  | 'info'
  | 'warning'
  | 'error'
  | 'success';

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

const iconMapping: Record<AppIconName, IconSymbolName> = {
  map: 'map.fill',
  wallet: 'creditcard.fill',
  profile: 'person.crop.circle.fill',
  game: 'gamecontroller.fill',
  send: 'arrow.up.circle.fill',
  receive: 'arrow.down.circle.fill',
  swap: 'arrow.triangle.2.circlepath',
  settings: 'gearshape.fill',
  close: 'xmark.circle.fill',
  check: 'checkmark.circle.fill',
  'arrow-up': 'arrow.up',
  'arrow-down': 'arrow.down',
  'arrow-right': 'arrow.right',
  'arrow-left': 'arrow.left',
  star: 'star.fill',
  trophy: 'trophy.fill',
  chart: 'chart.bar.fill',
  clock: 'clock.fill',
  location: 'location.fill',
  lock: 'lock.fill',
  unlock: 'lock.open.fill',
  person: 'person.fill',
  network: 'network',
  refresh: 'arrow.clockwise',
  info: 'info.circle.fill',
  warning: 'exclamationmark.triangle.fill',
  error: 'xmark.octagon.fill',
  success: 'checkmark.circle.fill',
};

export function AppIcon({ name, size = 24, color = COLORS.textPrimary }: AppIconProps) {
  const sfSymbolName = iconMapping[name];
  
  if (!sfSymbolName) {
    console.warn(`Icon "${name}" not found in mapping`);
    return null;
  }

  return <IconSymbol name={sfSymbolName} size={size} color={color} />;
}
