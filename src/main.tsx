import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import "./index.css";

// Initialise Sentry without letting a failure block the app
try {
  import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env['VITE_SENTRY_DSN'] as string | undefined,
      environment: import.meta.env.MODE,
    });
  }).catch(() => { /* Sentry unavailable — continue without it */ });
} catch {
  // Sentry unavailable — continue without it
}

// Lightweight error boundary that does NOT interfere with React's dispatcher
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page to try again.</p>
          <button onClick={() => this.setState({ hasError: false })} style={{ marginTop: 16, padding: "8px 20px", cursor: "pointer" }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <AppWrapper>
      <App />
    </AppWrapper>
  </AppErrorBoundary>
);
