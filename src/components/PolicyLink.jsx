import { useState } from "react";
import PrivacyPolicy from "./PrivacyPolicy";

export default function PolicyLink({ label = "Privacy Policy", style = {} }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        style={{ cursor: "pointer", textDecoration: "underline", ...style }}
      >
        {label}
      </span>
      {open && <PrivacyPolicy onClose={() => setOpen(false)} />}
    </>
  );
}