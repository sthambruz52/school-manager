import { theme } from "../../theme";

export default function EmptyState({ icon: Icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 16px", color: theme.colors.textMuted }}>
      {Icon && <div style={{ marginBottom: "10px", opacity: 0.5 }}><Icon size={40} /></div>}
      <div style={{ fontSize: "14px" }}>{text}</div>
    </div>
  );
}