export const appName = import.meta.env.VITE_APP_NAME || "CrediSphere";

// Get the current hostname (for production) or use environment variable
const getBackendUrl = () => {
  // In production build
  if (import.meta.env.PROD) {
    // If we have an explicit environment variable, use that
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
    }

    // Otherwise, derive from current hostname
    const hostname = window.location.hostname;
    console.log(hostname);
    // If deployed to IP address or domain, use that
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}`;
    }
  }
  // Default for development
  return "http://localhost:3000/";
};

export const backendUrl = getBackendUrl();
export const allowRegistration =
  import.meta.env.VITE_ALLOW_REGISTRATION === "true";
