"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InquiryReplyForm({ inquiryId }: { inquiryId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Hi! Thanks for reaching out. We have availability on..."
        rows={6}
        maxLength={4000}
        className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900"
        required
      />
      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send reply →"}
      </button>
      <p className="text-[11px] muted">
        Customer receives a real email from no-reply@verifiedthai.com. They can reply directly to your contact email.
      </p>
    </form>
  );
}
