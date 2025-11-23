/**
 * Converts a decimal amount (e.g., 10.50) to integer cents (e.g., 1050).
 * Uses Math.round to handle floating point imprecision before casting.
 */
export const toCents = (amount: number): number => {
    return Math.round(amount * 100);
};

/**
 * Converts integer cents (e.g., 1050) to a decimal amount (e.g., 10.50).
 * Precision is kept to 2 decimal places.
 */
export const fromCents = (cents: number): number => {
    return Number((cents / 100).toFixed(2));
};
