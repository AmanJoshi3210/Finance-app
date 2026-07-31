import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://finance-app-nh7c.onrender.com",
  withCredentials: true, // Include cookies with every request
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

      return axiosInstance.post("/api/users/refresh-token")
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
