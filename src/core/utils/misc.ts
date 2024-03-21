export const isProduction = process.env.NODE_ENV === 'production';

export const createSlug = (title: string, extra?: string) => {
  const slug = title.toLowerCase().replace(/\s+/g, '-');
  const cleanSlug = slug.replace(/[^\w\-]+/g, '');
  if (extra) return cleanSlug + extra;
  return cleanSlug;
};
