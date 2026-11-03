import Avatar from "./Avatar";
import ImagePicker from "./ImagePicker";
import { theme } from "../../theme";

export default function PhotoField({ name, photoURL, onChange, onBusyChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <Avatar name={name || "?"} photoURL={photoURL} size={132} />
      <ImagePicker
        label={photoURL ? "Change Photo" : "Upload Passport Photo"}
        onUploaded={onChange}
        onBusyChange={onBusyChange}
      />
      <div style={{ fontSize: "12px", color: theme.colors.textMuted, textAlign: "center" }}>
        A clear, passport-style photo works best.
      </div>
    </div>
  );
}