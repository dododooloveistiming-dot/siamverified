import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "@/drizzle/schema";

// NextAuth v5 (Auth.js). Magic-link via Resend.
// Required env:
//   AUTH_SECRET            (any long random string; `openssl rand -base64 32`)
//   AUTH_RESEND_KEY        (Resend API key, https://resend.com/api-keys)
//   AUTH_EMAIL_FROM        (verified sender, e.g. "no-reply@verifiedthai.com")
//   DATABASE_URL           (Neon connection string)
//   NEXTAUTH_URL           (production URL; auto-detected on Vercel)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? "no-reply@verifiedthai.com",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/check-email",
  },
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
        // Surface role on session for client-side admin checks.
        (session.user as { role?: string }).role = (user as { role?: string }).role ?? "user";
      }
      return session;
    },
  },
});
