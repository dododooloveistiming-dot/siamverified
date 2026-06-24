"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/types";

// Header link to the wishlist with a live count badge. Reads the same
// localStorage key WishlistButton writes ("verifiedthai.wishlist") and updates
// on the "wishlist-changed" event it dispatches (and cross-tab "storage").
// Closes the retention loop: save a place → see the count → return to the list.
export default function WishlistNavLink({ lang, label }: { lang: Lang; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("verifiedthai.wishlist");
        const arr = raw ? JSON.parse(raw) : [];
        setCount(Array.isArray(arr) ? arr.length : 0);
      } catch {
        setCount(0);
      }
    };
    read();
    window.addEventListener("wishlist-changed", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("wishlist-changed", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return (
    <Link
      href={`/${lang}/wishlist/`}
      aria-label={label}
      title={label}
      className="relative inline-flex items-center rounded-md px-2 py-1.5 text-base text-ink-600 transition hover:text-rose-600 dark:text-ink-300 dark:hover:text-rose-400"
    >
      <span aria-hidden>{count > 0 ? "❤️" : "🤍"}</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-rose-600 px-1 text-center text-[10px] font-black leading-4 text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
