export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
