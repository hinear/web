function readRequiredEnv(name: string): string {
  const value =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      : name === "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
        : name === "SUPABASE_SERVICE_ROLE_KEY"
          ? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
          : undefined;

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}

export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseServiceRoleKey(): string {
  return readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}
