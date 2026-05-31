"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Curio Service Worker registered successfully:", reg.scope))
        .catch((err) => console.error("Curio Service Worker registration failed:", err));
    }
  }, []);

  return null;
}
