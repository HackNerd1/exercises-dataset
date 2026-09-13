"use client";
import { useEffect } from "react";

export function LocaleDocument({ locale }: { locale: string }) {
  // Root layouts persist across client navigation. Initial HTML is already localized
  // by the server; update only the document attribute when the URL locale changes.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
