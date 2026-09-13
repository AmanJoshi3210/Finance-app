import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken") || null);
  const [tokenExpiry, setTokenExpiry] = useState(parseInt(localStorage.getItem("tokenExpiry") || 0));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // axiosInstance can't reach useNavigate directly (it's a plain module, not a
  // component), so it signals an expired session via this event instead of
  // hard-redirecting with window.location.href, which used to force a full
  // page reload on every dashboard/API call that hit an expired token.
  useEffect(() => {
    const handleSessionExpired = () => {
      setAccessToken(null);
      setTokenExpiry(0);
      setUser(null);
      navigate("/login", { replace: true });
    };

    window.addEventListener("auth:sessionExpired", handleSessionExpired);
    return () => window.removeEventListener("auth:sessionExpired", handleSessionExpired);
  }, [navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.get("/api/users/verify", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Auth verify error:", err);
        setAccessToken(null);
        setTokenExpiry(0);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("tokenExpiry");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [accessToken]);

  // accessToken stored in localStorage; refreshToken stored in HttpOnly cookie (secure)
  const login = (accessToken) => {
    setAccessToken(accessToken);
    localStorage.setItem("accessToken", accessToken);

    // accessToken expires in 15 minutes; calculate expiry timestamp
    const expiryTime = Date.now() + 15 * 60 * 1000;
    setTokenExpiry(expiryTime);
    localStorage.setItem("tokenExpiry", expiryTime.toString());
  };

  const logout = async () => {
    setAccessToken(null);
    setTokenExpiry(0);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenExpiry");

    // Clear refreshToken cookie on server
    try {
      await axiosInstance.post("/api/users/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Merge server-confirmed profile changes into cached user
  const updateUser = (fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  };

  return (
    <AuthContext.Provider value={{ accessToken, tokenExpiry, user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
