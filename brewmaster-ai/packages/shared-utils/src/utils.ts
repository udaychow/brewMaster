export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const parseNumber = (value: string): number | null => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};