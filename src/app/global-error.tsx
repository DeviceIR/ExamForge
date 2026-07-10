"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          background: "#0a0e1a",
          color: "#e5e7eb",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ maxWidth: "28rem", color: "#9ca3af", fontSize: "0.875rem" }}>
          A critical error occurred while rendering the application.
        </p>
        <button
          onClick={reset}
          style={{
            borderRadius: "0.75rem",
            border: "none",
            background: "#7c3aed",
            color: "white",
            padding: "0.5rem 1.25rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
