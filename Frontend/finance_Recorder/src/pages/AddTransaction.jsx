import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import TransactionFormModal from "../components/TransactionFormModal";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const AddTransaction = () => {
  const [open, setOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 transition-all duration-300">
        <Navbar title="New Entry" onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="flex justify-center items-start pt-6 md:pt-10 px-4 md:px-8 pb-10">
          <TransactionFormModal mode="add" onSaved={() => setOpen(true)} />
        </div>

        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setOpen(false)}
            sx={{ width: "100%", borderRadius: 2 }}
          >
            Transaction added successfully!
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default AddTransaction;
