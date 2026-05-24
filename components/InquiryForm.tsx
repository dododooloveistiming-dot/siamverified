"use client";
import { useState } from "react";

export default function InquiryForm({
  placeId,
  placeName,
  lang,
}: {
  placeId: string;
  placeName: string;
  lang: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { ok: true } | { error: string }>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      customer_name: String(fd.get("customer_name") ?? ""),
      customer_email: String(fd.get("customer_email") ?? ""),
      customer_phone: String(fd.get("customer_phone") ?? ""),
      preferred_date: String(fd.get("preferred_date") ?? ""),
      party_size: String(fd.get("party_size") ?? ""),
      language: lang,
      message: String(fd.get("message") ?? ""),
    };
    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(placeId)}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({ ok: true });
      } else {
        setResult({ error: data.error ?? `HTTP ${res.status}` });
      }
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
      >
        📩 Send inquiry to {placeName} →
      </button>
    );
  }

  if (result && "ok" in result) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-700 dark:bg-emerald-950/30">
        <div className="font-bold text-emerald-900 dark:text-emerald-200">
          ✅ Inquiry sent!
        </div>
        <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
          {placeName} will reply to your email. We&apos;ll also forward the conversation
          to keep things organized.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900"
    >
      <div className="text-sm font-bold">Inquiry to {placeName}</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="customer_name"
          required
          maxLength={120}
          placeholder="Your name *"
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
        />
        <input
          name="customer_email"
          type="email"
          required
          maxLength={200}
          placeholder="Email *"
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
        />
        <input
          name="customer_phone"
          maxLength={50}
          placeholder="Phone / WhatsApp (optional)"
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
        />
        <input
          name="preferred_date"
          maxLength={120}
          placeholder="Preferred date (e.g. next Sat AM)"
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
        />
        <input
          name="party_size"
          maxLength={40}
          placeholder="Party size (e.g. 2 people)"
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950 sm:col-span-2"
        />
      </div>
      <textarea
        name="message"
        required
        maxLength={2000}
        rows={4}
        placeholder="What are you looking for? Any questions?"
        className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
      />
      {result && "error" in result && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {result.error}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send →"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-ink-200 px-4 py-2.5 text-xs dark:border-ink-700"
        >
          Cancel
        </button>
      </div>
      <p className="text-[10px] text-ink-500">
        Your contact info is shared with {placeName} only. We don&apos;t sell data.
      </p>
    </form>
  );
}
