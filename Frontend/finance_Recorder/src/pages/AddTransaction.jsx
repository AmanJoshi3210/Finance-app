import React, { useState } from "react";
import TransactionFormModal from "../components/TransactionFormModal";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const AddTransaction = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
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
    </>
  );
};

export default AddTransaction;
