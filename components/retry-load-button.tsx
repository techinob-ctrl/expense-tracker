"use client";

export default function RetryLoadButton() {
  return (
    <button type="button" onClick={() => window.location.reload()}
      className="mt-5 cursor-pointer rounded-lg bg-emerald-800 px-4 py-2 text-white">
      Retry
    </button>
  );
}
