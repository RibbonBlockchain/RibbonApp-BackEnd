export const addMinutesToDate = (minutes: number) => new Date(new Date().getTime() + minutes * 60000);

export const hasTimeExpired = (date?: Date, minutes = 0): boolean => {
  if (!date) return true;

  const currentTime = new Date();
  const expirationTime = new Date(new Date(date).getTime() + minutes * 60000);

  return currentTime >= expirationTime;
};

export const startOfDay = (dateStr: string) => {
  const dateObj = new Date(dateStr);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj.toISOString();
};

export const startOfYear = (dateStr: string) => {
  const dateObj = new Date(dateStr);
  dateObj.setMonth(0);
  dateObj.setDate(1);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj.toISOString();
};

export const endOfDay = (dateStr: string) => {
  const dateObj = new Date(dateStr);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj.toISOString();
};

export const oneYearAgo = (dateStr?: string): string => {
  const date = dateStr ? new Date(dateStr) : new Date();
  date.setFullYear(date.getFullYear() - 1);
  return startOfDay(date.toISOString());
};
