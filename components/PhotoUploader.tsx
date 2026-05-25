"use client";
import { useState } from "react";

export default function PhotoUploader({
  placeId,
  initialPhotos,
}: {
  placeId: string;
  initialPhotos: string[];
}) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-uploading the same file
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch(`/api/listings/${encodeURIComponent(placeId)}/photo`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setPhotos(data.photos ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(url: string) {
    if (!confirm("Remove this photo?")) return;
    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(placeId)}/photo`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) setPhotos(data.photos ?? []);
      else setError(data.error ?? "Delete failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">Photos ({photos.length} / 10)</h3>
        <label className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
          {uploading ? "Uploading…" : "+ Add photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
            disabled={uploading || photos.length >= 10}
          />
        </label>
      </div>
      {error && (
        <div className="mb-2 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {photos.map((url) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onDelete(url)}
              aria-label="Delete photo"
              className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-ink-200 bg-ink-50 p-6 text-center text-xs muted dark:border-ink-700 dark:bg-ink-800">
            Add up to 10 photos. They&apos;ll replace the Google-scraped photos on your listing page.
          </div>
        )}
      </div>
      <p className="mt-2 text-[10px] muted">
        Max 5MB per photo. JPG / PNG / WebP. Shown to all visitors immediately.
      </p>
    </div>
  );
}
