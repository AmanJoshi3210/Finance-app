import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function Settings() {
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); // ✅ Snackbar state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosInstance.get("/api/transactions/monthly-limit");
        setMonthlyLimit(res.data.monthlyLimit || "");
      } catch (error) {
        if (error.response?.status === 401) navigate("/login");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [navigate]);

  const handleSave = async () => {
    try {
      await axiosInstance.put("/api/transactions/monthly-limit", {
        monthlyLimit,
      });
      setOpen(true); // ✅ show snackbar
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.error("Error updating monthly limit:", error);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar title="Settings" />

        <div className="p-6 max-w-md mx-auto bg-white shadow rounded-xl mt-8">
          <label className="block mb-2 text-gray-600">
            Monthly Limit (₹)
          </label>

          <input
            type="number"
            className="w-full border rounded-lg p-2 mb-4"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
          />

          <Button
            onClick={handleSave}
            variant="contained"
            fullWidth
            sx={{
              py: 1.2,
              borderRadius: "0.75rem",
              backgroundColor: "#2563eb",
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            Save
          </Button>
        </div>

        {/* ✅ Snackbar must be here */}
        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="success"
            onClose={() => setOpen(false)}
            sx={{ width: "100%" }}
          >
            Monthly limit updated!
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}
