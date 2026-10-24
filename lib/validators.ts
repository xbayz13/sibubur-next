/**
 * Validation functions for form fields
 * Each validator returns error message string or null if valid
 */

export const validateRequired = (value: string): string | null => {
  if (!value || value.trim() === '') {
    return 'Field ini wajib diisi';
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email wajib diisi';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Format email tidak valid';
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Nomor telepon wajib diisi';
  const phoneRegex = /^(\+62|0)[0-9]{9,12}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Format telepon tidak valid (cth: 082123456789)';
  }
  return null;
};

export const validateMinLength = (min: number) => (value: string): string | null => {
  if (!value) return null; // Let validateRequired handle empty
  if (value.length < min) {
    return `Minimal ${min} karakter`;
  }
  return null;
};

export const validateMaxLength = (max: number) => (value: string): string | null => {
  if (value.length > max) {
    return `Maksimal ${max} karakter`;
  }
  return null;
};

export const validatePrice = (price: string): string | null => {
  if (!price) return 'Harga wajib diisi';
  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) {
    return 'Harga harus berupa angka';
  }
  if (priceNum < 0) {
    return 'Harga tidak boleh negatif';
  }
  return null;
};

export const validateNumber = (value: string): string | null => {
  if (!value) return 'Field ini wajib diisi';
  if (isNaN(parseFloat(value))) {
    return 'Harus berupa angka';
  }
  return null;
};

/**
 * Combine multiple validators - returns first error found
 */
export const combineValidators =
  (...validators: Array<(value: string) => string | null>) =>
  (value: string): string | null => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
