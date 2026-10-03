export const portfolioUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${path}`;
export const isImage = (p?: string | null) => /\.(jpe?g|png|webp|gif|heic)$/i.test(p ?? "");
