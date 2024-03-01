export const addMinutesToDate = (minutes: number) => new Date(new Date().getTime() + minutes * 60000);

export const hasTimeExpired = (date?: Date, minutes = 0): boolean => {
  if (!date) return true;

  const currentTime = new Date();
  const expirationTime = new Date(new Date(date).getTime() + minutes * 60000);

  return currentTime >= expirationTime;
};
