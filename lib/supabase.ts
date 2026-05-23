// Supabase client stub. Not loaded at build time — only when needed in client components.
// To activate: `npm i @supabase/supabase-js` and uncomment the import.
// import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Lead capture table schema (run in Supabase SQL editor):
// create table leads (
//   id uuid primary key default gen_random_uuid(),
//   email text not null,
//   procedure text,
//   budget text,
//   lang text,
//   utm jsonb,
//   created_at timestamptz default now()
// );
// alter table leads enable row level security;
// create policy "insert-only-anon" on leads for insert to anon with check (true);

export const supabase = SUPABASE_URL && SUPABASE_ANON
  ? null // createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

export type Lead = {
  email: string;
  procedure: string;
  budget: string;
  lang: string;
  utm?: Record<string, string>;
};

export async function captureLead(lead: Lead) {
  if (!supabase) {
    console.log("[lead-capture stub]", lead);
    return { ok: true, stub: true };
  }
  // const { data, error } = await supabase.from("leads").insert(lead);
  // return { ok: !error, error };
  return { ok: true };
}
