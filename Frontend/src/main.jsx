import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />

    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      toastOptions={{
        duration: 3000,

        style: {
          background: "#ffffff",
          color: "#111827",
          borderRadius: "14px",
          padding: "14px 18px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          fontSize: "14px",
          fontWeight: "500",
        },

        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#ffffff",
          },
        },

        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },

        loading: {
          iconTheme: {
            primary: "#2563eb",
            secondary: "#ffffff",
          },
        },
      }}
    />
  </StrictMode>
);