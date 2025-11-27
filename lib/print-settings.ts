/**
 * Print Settings Utility
 * Manages print settings (auto print kitchen receipt, customer receipt)
 * Settings are stored in localStorage
 */

const STORAGE_KEY = 'sibubur_print_settings';

export interface PrintSettings {
  autoPrintKitchen: boolean;
  autoPrintCustomer: boolean;
}

const DEFAULT_SETTINGS: PrintSettings = {
  autoPrintKitchen: true,
  autoPrintCustomer: true,
};

/**
 * Get print settings from localStorage
 */
export function getPrintSettings(): PrintSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        autoPrintKitchen: parsed.autoPrintKitchen ?? DEFAULT_SETTINGS.autoPrintKitchen,
        autoPrintCustomer: parsed.autoPrintCustomer ?? DEFAULT_SETTINGS.autoPrintCustomer,
      };
    }
  } catch (error) {
    console.error('Error reading print settings:', error);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Save print settings to localStorage
 */
export function savePrintSettings(settings: Partial<PrintSettings>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getPrintSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving print settings:', error);
  }
}

/**
 * Check if auto print kitchen receipt is enabled
 */
export function isAutoPrintKitchenEnabled(): boolean {
  return getPrintSettings().autoPrintKitchen;
}

/**
 * Check if auto print customer receipt is enabled
 */
export function isAutoPrintCustomerEnabled(): boolean {
  return getPrintSettings().autoPrintCustomer;
}

/**
 * Check if print button should be shown for kitchen receipt
 */
export function shouldShowKitchenPrintButton(): boolean {
  return getPrintSettings().autoPrintKitchen;
}

/**
 * Check if print button should be shown for customer receipt
 */
export function shouldShowCustomerPrintButton(): boolean {
  return getPrintSettings().autoPrintCustomer;
}

