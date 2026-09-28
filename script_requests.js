import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Server-side job: use the service-role key (kept in GitHub secrets, never in
// a browser), so the table can stay locked down with row-level security.
// SUPABASE_ANON_KEY is still accepted as a fallback for older local .env files.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY
);

const TABLE = "op_messages";

/**
 * Fetches the most recently stored Discord message ID.
 * Returns the message_id string, or null if none exists.
 */
export async function fetchLastMessageId() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("message_id")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // PGRST116 = no rows found, which is expected on first run
    if (error.code === "PGRST116") return null;
    console.error("[supabase] Failed to fetch last message ID:", error.message);
    return null;
  }

  return data.message_id;
}

/**
 * Persists a Discord message ID so we don't re-process it.
 */
export async function storeMessageId(messageId) {
  if (!messageId) return;

  const { error } = await supabase
    .from(TABLE)
    .insert({ message_id: messageId });

  if (error) {
    console.error("[supabase] Failed to store message ID:", error.message);
  }
}
