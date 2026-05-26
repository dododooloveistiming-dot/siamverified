"use client";
import { useState } from "react";

type Service = { name: string; price_thb?: number; duration_min?: number };

/**
 * Direct booking form — customer requests a specific date/time/service at a
 * venue, owner approves in their dashboard. No commission, no third-party
 * checkout. Shares the /api/listings/[id]/inquiry endpoint with kind="booking"
 * so the owner has a unified inbox.
 */
export default function BookingForm({
  placeId,
  placeName,
  lang,
  services = [],
}: {
  placeId: string;
  placeName: string;
  lang: string;
  services?: Service[];
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
      kind: "booking" as const,
      customer_name: String(fd.get("customer_name") ?? ""),
      customer_email: String(fd.get("customer_email") ?? ""),
      customer_phone: String(fd.get("customer_phone") ?? ""),
      preferred_date: String(fd.get("preferred_date") ?? ""),
      requested_time: String(fd.get("requested_time") ?? ""),
      requested_service: String(fd.get("requested_service") ?? ""),
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
        className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-emerald-700"
      >
        📅 Request booking — 0% commission →
      </button>
    );
  }

  if (result && "ok" in result) {
    return (
      <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-700 dark:bg-emerald-950/30">
        <div className="text-base font-black text-emerald-900 dark:text-emerald-200">
          ✅ Booking request sent
        </div>
        <p className="mt-1.5 text-xs text-emerald-800 dark:text-emerald-300">
          {placeName} will confirm your booking by email — usually within 24 hours.
          No payment was charged. You&apos;ll pay the venue directly at full retail price (no booking platform markup).
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border-2 border-emerald-300 bg-white p-4 dark:border-emerald-700 dark:bg-ink-900"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-black">Direct booking request</div>
          <div className="text-[11px] muted">Goes straight to {placeName} · No commission · No payment now</div>
        </div>
        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
          0% fee
        </span>
      </div>

      {/* Service select (only when owner has set up services) */}
      {services.length > 0 && (
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide muted">
            Service
          </span>
          <select
            name="requested_service"
            required
            defaultValue=""
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          >
            <option value="" disabled>Choose a service…</option>
            {services.map((s, i) => (
              <option key={i} value={s.name}>
                {s.name}
                {s.price_thb != null ? ` · ฿${s.price_thb.toLocaleString()}` : ""}
                {s.duration_min ? ` · ${s.duration_min}min` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide muted">
            Date *
          </span>
          <input
            name="preferred_date"
            type="date"
            required
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide muted">
            Time
          </span>
          <input
            name="requested_time"
            type="time"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
          />
        </label>
      </div>

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
          placeholder="WhatsApp / phone (optional)"
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
        />
        <input
          name="party_size"
          maxLength={40}
          placeholder="Party size (e.g. 2 people)"
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950"
        />
      </div>
      <textarea
        name="message"
        required
        maxLength={2000}
        rows={3}
        placeholder="Any notes? (allergies, skill level, special requests…)"
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
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "📅 Request booking →"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-ink-200 px-3 py-3 text-xs dark:border-ink-700"
        >
          Cancel
        </button>
      </div>
      <p className="text-[10px] text-ink-500">
        Your contact info is shared with {placeName} only. We don&apos;t take a commission, and we don&apos;t sell your data.
      </p>
    </form>
  );
}
