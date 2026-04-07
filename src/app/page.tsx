import { redirect } from "next/navigation";

// Middleware handles the `/` redirect for both authenticated and
// unauthenticated users. This page is kept as a safety-net fallback
// and should not be reached in normal operation.
export default async function Home() {
  redirect("/auth");
}
