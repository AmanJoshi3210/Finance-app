import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://finance-app-nh7c.onrender.com",
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
},
  (error) => Promise.reject(error)
);

// When the JWT expires mid-session, pages navigate to /login but the stale
// token stays in localStorage — Login then bounces straight back to
// /dashboard, which 401s again (an infinite redirect loop). Clearing the
// token here breaks the cycle before any page-level handler runs.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthCall = url.includes("/api/users/login") || url.includes("/api/users/register");

    if (status === 401 && !isAuthCall && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
