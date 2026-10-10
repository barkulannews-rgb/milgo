// The store prices, charges and reports in pounds sterling (head office: London).
export const BASE_CURRENCY = 'GBP';
export const CURRENCY_SYMBOL = '£';

const formatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: BASE_CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return formatter.format(Number.isFinite(amount) ? amount : 0);
}

// Rate used once to convert catalogue and ledger figures recorded in USD before the move to GBP.
export const LEGACY_USD_TO_GBP = 0.79;
