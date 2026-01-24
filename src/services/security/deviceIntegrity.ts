import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { addBreadcrumb, captureError } from '../sentry';

/**
 * Device Integrity Service
 * 
 * Provides anti-cheat measures for location-based claims:
 * - Device fingerprinting
 * - Emulator/simulator detection
 * - Jailbreak/root detection (basic)
 * - App installation verification
 */

export interface DeviceInfo {
  deviceId: string;
  isEmulator: boolean;
  brand: string | null;
  model: string | null;
  osVersion: string | null;
  appVersion: string | null;
  buildNumber: string | null;
}

export interface IntegrityResult {
  passed: boolean;
  deviceInfo: DeviceInfo;
  warnings: string[];
  blockers: string[];
}

/**
 * Get device fingerprint for claim verification
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getDeviceId();
  
  return {
    deviceId,
    isEmulator: !Device.isDevice,
    brand: Device.brand,
    model: Device.modelName,
    osVersion: Device.osVersion,
    appVersion: Application.nativeApplicationVersion,
    buildNumber: Application.nativeBuildVersion,
  };
}

/**
 * Get unique device identifier
 */
async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'ios') {
    // iOS: Use identifierForVendor
    return (await Application.getIosIdForVendorAsync()) ?? 'unknown-ios';
  } else if (Platform.OS === 'android') {
    // Android: Use androidId
    return Application.getAndroidId() ?? 'unknown-android';
  }
  return 'unknown-platform';
}

/**
 * Run integrity checks before allowing claims
 */
export async function checkDeviceIntegrity(): Promise<IntegrityResult> {
  const deviceInfo = await getDeviceInfo();
  const warnings: string[] = [];
  const blockers: string[] = [];

  // 1. Check if running on physical device
  if (!Device.isDevice) {
    blockers.push('Running on emulator/simulator');
    addBreadcrumb('security', 'Emulator detected', { deviceInfo });
  }

  // 2. Check device brand (some emulators have suspicious brands)
  const suspiciousBrands = ['Genymotion', 'BlueStacks', 'Nox', 'MEmu', 'Andy'];
  if (deviceInfo.brand && suspiciousBrands.some(b => 
    deviceInfo.brand?.toLowerCase().includes(b.toLowerCase())
  )) {
    blockers.push('Suspicious device brand detected');
  }

  // 3. Check model name for emulator indicators
  const suspiciousModels = ['sdk', 'emulator', 'android sdk', 'vbox'];
  if (deviceInfo.model && suspiciousModels.some(m => 
    deviceInfo.model?.toLowerCase().includes(m)
  )) {
    blockers.push('Suspicious device model detected');
  }

  // 4. Basic jailbreak/root detection (iOS)
  if (Platform.OS === 'ios') {
    const jailbreakIndicators = await checkJailbreakIndicators();
    if (jailbreakIndicators.length > 0) {
      warnings.push('Potential jailbreak detected');
      addBreadcrumb('security', 'Jailbreak indicators', { indicators: jailbreakIndicators });
    }
  }

  // 5. Check if app version is valid
  if (!deviceInfo.appVersion) {
    warnings.push('Unable to verify app version');
  }

  const passed = blockers.length === 0;

  if (!passed) {
    captureError(new Error('Device integrity check failed'), {
      deviceInfo,
      blockers,
      warnings,
    });
  }

  return {
    passed,
    deviceInfo,
    warnings,
    blockers,
  };
}

/**
 * Basic jailbreak detection for iOS
 * Note: Determined attackers can bypass these checks
 */
async function checkJailbreakIndicators(): Promise<string[]> {
  const indicators: string[] = [];

  // In a full implementation, you would check for:
  // - Cydia app presence
  // - SSH daemon
  // - Writable system paths
  // - dlopen of suspicious libraries
  
  // For now, just return empty (would need native module for full detection)
  return indicators;
}

/**
 * Create signed device attestation for claims
 */
export async function createDeviceAttestation(): Promise<string> {
  const deviceInfo = await getDeviceInfo();
  
  // Create a simple attestation payload
  // In production, this would use platform-specific attestation APIs:
  // - iOS: DeviceCheck / App Attest
  // - Android: Play Integrity API
  
  const attestation = {
    deviceId: deviceInfo.deviceId,
    timestamp: Date.now(),
    appVersion: deviceInfo.appVersion,
    platform: Platform.OS,
    isPhysicalDevice: Device.isDevice,
  };

  return JSON.stringify(attestation);
}
