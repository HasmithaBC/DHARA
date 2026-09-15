"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Currency = "LKR" | "USD";

interface CurrencyState {
  currency: Currency;
  rate: number;
  toggle: () => void;
}

const CurrencyContext = createContext<CurrencyState>({ currency: "LKR", rate: 300, toggle: () => {} });

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("LKR");
  const [rate, setRate] = useState(300);

  useEffect(() => {
    const stored = document.cookie.split("; ").find((c) => c.startsWith("dhara_currency="));
    if (stored?.split("=")[1] === "USD") setCurrency("USD");

    fetch(`${API_BASE}/settings/public`)
      .then((r) => r.json())
      .then((body) => {
        // /settings/public returns the settings map directly (no {data} envelope).
        const raw = (body?.data ?? body)?.usd_rate;
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (parsed?.rate) setRate(Number(parsed.rate));
        }
      })
      .catch(() => {});
  }, []);

  function toggle() {
    setCurrency((c) => {
      const next = c === "LKR" ? "USD" : "LKR";
      document.cookie = `dhara_currency=${next}; path=/; max-age=${60 * 60 * 24 * 30}`;
      return next;
    });
  }

  return <CurrencyContext.Provider value={{ currency, rate, toggle }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
