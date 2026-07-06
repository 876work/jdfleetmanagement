import mongoose from 'mongoose';

export const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
export const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || '').trim());
export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
export const toNumber = (value) => (value === '' || value === null || value === undefined ? undefined : Number(value));

export const sendValidationError = (res, message, fields = undefined) =>
  res.status(400).json({ message, ...(fields ? { fields } : {}) });

export const publicErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'value';
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  if (err?.name === 'ValidationError') {
    return Object.values(err.errors || {})
      .map((error) => error.message)
      .filter(Boolean)
      .join(' ') || fallback;
  }

  if (err?.name === 'CastError') return 'Invalid record identifier.';
  return fallback;
};
