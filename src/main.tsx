import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);

// Register Service Worker only after the page is fully idle
// Never blocks rendering — uses requestIdleCallback with fallback
if ('serviceWorker' in navigator) {
    const registerSW = () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
            // Silently fail — SW is a progressive enhancement
        });
    };

    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(registerSW, { timeout: 4000 });
    } else {
        window.addEventListener('load', () => setTimeout(registerSW, 2000));
    }
}
