import { theme } from "../../theme";

export default function HeaderAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.2)",
        color: "white",
        border: "none",
        borderRadius: theme.radius.sm,
        padding: "8px 12px",
        fontWeight: "700",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        gap: "4px"
      }}
    >
      {icon}{label}
    </button>
  );
}