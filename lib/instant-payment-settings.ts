/**
 * Instant Payment Settings Utility
 * Manages instant payment setting (show payment form immediately after order creation)
 * Settings are stored in localStorage
 */

const STORAGE_KEY = 'sibubur_instant_payment_settings';

export interface InstantPaymentSettings {
  enabled: boolean;
}

const DEFAULT_SETTINGS: InstantPaymentSettings = {
  enabled: false,
};

/**
 * Get instant payment settings from localStorage
 */
export function getInstantPaymentSettings(): InstantPaymentSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        enabled: parsed.enabled ?? DEFAULT_SETTINGS.enabled,
      };
    }
  } catch (error) {
    console.error('Error reading instant payment settings:', error);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Save instant payment settings to localStorage
 */
export function saveInstantPaymentSettings(settings: Partial<InstantPaymentSettings>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getInstantPaymentSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving instant payment settings:', error);
  }
}

/**
 * Check if instant payment is enabled
 */
export function isInstantPaymentEnabled(): boolean {
  return getInstantPaymentSettings().enabled;
}

