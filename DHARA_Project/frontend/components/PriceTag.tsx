"use client";

import { useCurrency } from "@/lib/currency-context";

export default function PriceTag({
  priceLkr,
  priceOnRequest,
  priceUnit,
}: {
  priceLkr: number | null;
  priceOnRequest: boolean;
  priceUnit?: string | null;
}) {
  const { currency, rate } = useCurrency();

  if (priceOnRequest || priceLkr == null) return <>Price on Request</>;

  const suffix = priceUnit === "PER_MONTH" ? " / month" : priceUnit === "PER_YEAR" ? " / year" : priceUnit === "PER_PERCH" ? " / perch" : "";

  if (currency === "USD") {
    return <>USD {Math.round(priceLkr / rate).toLocaleString("en-US")}{suffix} <span className="text-[10px] text-ink-soft">(indicative)</span></>;
  }
  return <>LKR {Math.round(priceLkr).toLocaleString("en-LK")}{suffix}</>;
}
