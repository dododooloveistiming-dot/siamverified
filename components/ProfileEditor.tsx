"use client";
import { useState } from "react";

type Service = {
  name: string;
  price_thb?: number;
  duration_min?: number;
  description?: string;
};

type InitialProfile = {
  description?: string | null;
  hours?: string | null;
  whatsapp?: string | null;
  line_id?: string | null;
  contact_email?: string | null;
  korean_staff_note?: string | null;
  services?: Service[];
};

export default function ProfileEditor({
  placeId,
  initial,
}: {
  placeId: string;
  initial: InitialProfile;
}) {
  const [description, setDescription] = useState(initial.description ?? "");
  const [hours, setHours] = useState(initial.hours ?? "");
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ?? "");
  const [lineId, setLineId] = useState(initial.line_id ?? "");
  const [contactEmail, setContactEmail] = useState(initial.contact_email ?? "");
  const [koreanStaffNote, setKoreanStaffNote] = useState(initial.korean_staff_note ?? "");
  const [services, setServices] = useState<Service[]>(initial.services ?? []);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<null | "ok" | "error">(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function updateService(i: number, patch: Partial<Service>) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addService() {
    setServices((prev) => [...prev, { name: "" }]);
  }
  function removeService(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(placeId)}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          hours,
          whatsapp,
          line_id: lineId,
          contact_email: contactEmail,
          korean_staff_note: koreanStaffNote,
          services: services.filter((s) => s.name.trim().length > 0),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setResult("ok");
      else { setResult("error"); setErrorMsg(data.error ?? `HTTP ${res.status}`); }
    } catch (err) {
      setResult("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {/* About */}
      <section className="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <h3 className="mb-3 text-sm font-bold">About</h3>
        <Field
          label="Description (what makes you special, 1-3 sentences)"
          textarea
          value={description}
          onChange={setDescription}
          placeholder="e.g. Award-winning Muay Thai camp in Phuket, English & Korean instructors, beginner-friendly..."
        />
        <Field
          label="Hours"
          value={hours}
          onChange={setHours}
          placeholder="Mon-Sat 09:00-19:00, Sun 09:00-15:00"
        />
        <Field
          label="Korean-speaking staff (optional)"
          value={koreanStaffNote}
          onChange={setKoreanStaffNote}
          placeholder="2 Korean instructors weekends"
        />
      </section>

      {/* Contact channels */}
      <section className="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <h3 className="mb-3 text-sm font-bold">Contact channels</h3>
        <p className="mb-3 text-xs muted">
          We&apos;ll show one-click buttons on your listing page so customers reach you directly.
        </p>
        <Field
          label="📱 WhatsApp number (with country code, no + sign)"
          value={whatsapp}
          onChange={setWhatsapp}
          placeholder="66812345678"
        />
        <Field
          label="💬 LINE ID"
          value={lineId}
          onChange={setLineId}
          placeholder="your-line-id"
        />
        <Field
          label="📧 Contact email"
          type="email"
          value={contactEmail}
          onChange={setContactEmail}
          placeholder="bookings@yourbusiness.com"
        />
      </section>

      {/* Services / menu */}
      <section className="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Services & pricing</h3>
          <button
            type="button"
            onClick={addService}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            + Add service
          </button>
        </div>
        {services.length === 0 ? (
          <p className="text-xs muted">
            No services yet. Add at least one — your top customer question is &ldquo;how much?&rdquo;
          </p>
        ) : (
          <ul className="space-y-3">
            {services.map((s, i) => (
              <li
                key={i}
                className="rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-ink-800 dark:bg-ink-800"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_120px_auto]">
                  <input
                    placeholder="Service name (e.g. Group Muay Thai class)"
                    value={s.name}
                    onChange={(e) => updateService(i, { name: e.target.value })}
                    className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm dark:border-ink-700 dark:bg-ink-900"
                    maxLength={120}
                  />
                  <input
                    placeholder="Price (THB)"
                    type="number"
                    min={0}
                    value={s.price_thb ?? ""}
                    onChange={(e) => updateService(i, { price_thb: e.target.value ? Number(e.target.value) : undefined })}
                    className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm dark:border-ink-700 dark:bg-ink-900"
                  />
                  <input
                    placeholder="Duration (min)"
                    type="number"
                    min={0}
                    value={s.duration_min ?? ""}
                    onChange={(e) => updateService(i, { duration_min: e.target.value ? Number(e.target.value) : undefined })}
                    className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm dark:border-ink-700 dark:bg-ink-900"
                  />
                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    aria-label="Remove"
                    className="rounded-md px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    ✕
                  </button>
                </div>
                <input
                  placeholder="Optional 1-line description"
                  value={s.description ?? ""}
                  onChange={(e) => updateService(i, { description: e.target.value })}
                  className="mt-2 w-full rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs dark:border-ink-700 dark:bg-ink-900"
                  maxLength={500}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {result === "ok" && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ Saved. Changes are live on your listing page.
        </div>
      )}
      {result === "error" && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          ✗ {errorMsg ?? "Save failed"}
        </div>
      )}

      <div className="sticky bottom-4 z-10">
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile →"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-700 dark:text-ink-300">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900"
        />
      )}
    </label>
  );
}
