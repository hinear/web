const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

async function runMigration() {
  const migration = fs.readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/0014_add_github_fields_to_issues.sql"
    ),
    "utf-8"
  );

  try {
    // Use Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ sql: migration }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Migration failed:", error);
      process.exit(1);
    }

    console.log("Migration completed successfully!");
    console.log("Added GitHub fields to issues table");
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  }
}

runMigration();
