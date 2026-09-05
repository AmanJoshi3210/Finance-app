import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "https://finance-app-nh7c.onrender.com";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Include cookies with every request
});

// Dedicated, interceptor-free client for the refresh call itself. Sending it
// through axiosInstance would re-enter this same request interceptor (same
// stale token/expiry still in localStorage), which would see "needs refresh"
// again and, since isRefreshing is already true, queue itself in failedQueue
// waiting on a processQueue() call that only fires once *this* request
// finishes — a deadlock where the refresh request never actually goes out
// and every queued call hangs forever.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

axiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  const tokenExpiry = parseInt(localStorage.getItem("tokenExpiry") || 0);

  // Check if token is about to expire (within 2 minutes)
  if (accessToken && tokenExpiry - Date.now() < 2 * 60 * 1000) {
    // Attempt refresh (refreshToken in HttpOnly cookie is sent automatically)
    if (!isRefreshing) {
      isRefreshing = true;

      return refreshClient.post("/api/users/refresh-token")
        .then(res => {
          const newAccessToken = res.data.accessToken;
          localStorage.setItem("accessToken", newAccessToken);
          // Update expiry: accessToken is 15 minutes
          const newExpiry = Date.now() + 15 * 60 * 1000;
          localStorage.setItem("tokenExpiry", newExpiry.toString());

          config.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return config;
        })
        .catch(err => {
          processQueue(err, null);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("tokenExpiry");
          window.location.href = "/login";
          return Promise.reject(err);
        });
    } else {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        })
        .catch(err => Promise.reject(err));
    }
  }

  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
}, (error) => Promise.reject(error));

// Handle 401 errors and clear tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthCall = url.includes("/api/users/login") || url.includes("/api/users/register") || url.includes("/api/users/refresh-token");

    if (status === 401 && !isAuthCall && localStorage.getItem("accessToken")) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("tokenExpiry");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
