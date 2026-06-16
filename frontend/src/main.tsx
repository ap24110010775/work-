import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./index.css";
import App from "./App";

// Global Fetch Interceptor to automatically attach JWT token to all API requests
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = window.localStorage.getItem('workyaar.auth.token');
  const urlString = typeof input === 'string' ? input : input.toString();

  if (token && urlString.includes('/api/')) {
    init = init || {};
    init.headers = {
      ...init.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="983838819969-k6t7ehgcg7d292iqealp52kpibf7ebuo.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
