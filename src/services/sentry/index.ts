import * as Sentry from '@sentry/react-native';

// Initialize Sentry - get DSN from sentry.io
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry for crash reporting and performance monitoring
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Enable performance monitoring
    tracesSampleRate: 0.2, // 20% of transactions
    
    // Enable profiling
    profilesSampleRate: 0.1, // 10% of transactions
    
    // Environment
    environment: __DEV__ ? 'development' : 'production',
    
    // Capture unhandled promise rejections
    enableCaptureFailedRequests: true,
    
    // Attach user info (will be set on login)
    attachStacktrace: true,
    
    // Breadcrumbs config
    maxBreadcrumbs: 50,
    
    // Filter sensitive data
    beforeSend(event) {
      // Remove any wallet private keys if accidentally logged
      if (event.extra) {
        delete event.extra.privateKey;
        delete event.extra.mnemonic;
      }
      return event;
    },
  });

  console.log('[Sentry] Initialized successfully');
}

/**
 * Set user context for Sentry (call after wallet connection)
 */
export function setSentryUser(walletAddress: string | null) {
  if (walletAddress) {
    Sentry.setUser({
      id: walletAddress,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for user actions
 */
export function addBreadcrumb(
  category: 'claim' | 'navigation' | 'wallet' | 'location' | 'security',
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

/**
 * Capture exception with extra context
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Create a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startInactiveSpan({ name, op });
}

// Export Sentry for direct access if needed
export { Sentry };
