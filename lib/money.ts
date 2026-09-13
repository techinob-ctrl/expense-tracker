// Parse decimal text directly rather than multiplying a floating-point dollar value.
export function parseMoneyToCents(value: string): number {
  const text = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error("Enter a positive USD amount with up to 2 decimal places.");
  }
  const [dollars, fraction = ""] = text.split(".");
  const cents = BigInt(dollars) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount must be positive and within the supported range.");
  }
  return Number(cents);
}

export function formatMoney(amountInCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountInCents / 100);
}
