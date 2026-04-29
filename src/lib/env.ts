export interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  GITHUB_REPO_OWNER: string;
  GITHUB_REPO_NAME: string;
  GITHUB_PAT: string;
  CRONJOB_API_KEY: string;
  CRON_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;
  // Optional GitHub App (preferred over PAT when configured)
  GITHUB_APP_ID?: string;
  GITHUB_APP_PRIVATE_KEY?: string;
  GITHUB_APP_INSTALLATION_ID?: string;
  // Optional Stripe vars (not required for self-hosting)
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
}

const requiredVars: (keyof EnvConfig)[] = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GITHUB_REPO_OWNER',
  'GITHUB_REPO_NAME',
  'GITHUB_PAT',
  'CRONJOB_API_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_APP_URL',
];

export function getEnvConfig(): EnvConfig {
  const missing: string[] = [];

  for (const key of requiredVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER!,
    GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME!,
    GITHUB_PAT: process.env.GITHUB_PAT!,
    CRONJOB_API_KEY: process.env.CRONJOB_API_KEY!,
    CRON_SECRET: process.env.CRON_SECRET!,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
    // Optional GitHub App
    GITHUB_APP_ID: process.env.GITHUB_APP_ID || undefined,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY || undefined,
    GITHUB_APP_INSTALLATION_ID: process.env.GITHUB_APP_INSTALLATION_ID || undefined,
    // Optional Stripe vars
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || undefined,
  };
}
