import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://finance-app-nh7c.onrender.com",
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
},
  (error) => Promise.reject(error)
);

export default axiosInstance;
