import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");

    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim();
      if (key && value) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.warn("Could not load .env.local:", error);
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables:");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✓" : "✗");
  throw new Error("Missing Supabase environment variables");
}

// Extract database connection info from Supabase URL
// Format: https://[project-ref].supabase.co
const dbUrl = supabaseUrl.replace(
  "https://",
  "postgresql://postgres:[YOUR-PASSWORD]@"
);

async function runMigration() {
  const migration = readFileSync(
    join(
      process.cwd(),
      "supabase/migrations/0014_add_github_fields_to_issues.sql"
    ),
    "utf-8"
  );

  // Since we can't easily extract the DB password, let's use Supabase client
  // We'll need to run this manually through the Supabase dashboard or CLI
  console.log("Migration SQL prepared:");
  console.log(migration);
  console.log("\n" + "=".repeat(60));
  console.log("To run this migration, use one of these methods:");
  console.log("=".repeat(60));
  console.log("\n1. Supabase Dashboard SQL Editor:");
  console.log("   - Go to https://app.supabase.com/project/_/sql");
  console.log("   - Paste the SQL above and run it\n");
  console.log("2. Supabase CLI (if linked):");
  console.log("   supabase db push\n");
  console.log("3. Using the MCP server (if available):\n");
}

runMigration();
