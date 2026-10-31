import { useState } from "react";
import { Camera } from "lucide-react";
import { theme } from "../../theme";
import { uploadToCloudinary } from "../../utils/uploadImage";

export default function ImagePicker({ label = "Add Photo", onUploaded, onBusyChange, disabled }) {
  const [busy, setBusy] = useState(false);

  const setState = (v) => {
    setBusy(v);
    if (onBusyChange) onBusyChange(v);
  };

  const handle = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setState(true);
    try {
      onUploaded(await uploadToCloudinary(file));
    } catch (err) {
      alert("Photo upload failed. Check your connection and try again.");
    }
    setState(false);
  };

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "white",
        color: theme.colors.primary,
        border: `1.5px solid ${theme.colors.primary}`,
        padding: "8px 14px",
        borderRadius: theme.radius.sm,
        fontWeight: "700",
        fontSize: "13px",
        cursor: busy || disabled ? "not-allowed" : "pointer",
        opacity: busy || disabled ? 0.6 : 1
      }}
    >
      <Camera size={16} /> {busy ? "Uploading..." : label}
      <input type="file" accept="image/*" onChange={handle} disabled={busy || disabled} style={{ display: "none" }} />
    </label>
  );
}