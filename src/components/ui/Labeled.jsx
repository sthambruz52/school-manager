import { theme } from "../../theme";

export default function Labeled({ label, children, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 150px", minWidth: 0, ...style }}>
      <span style={{ fontSize: "12px", fontWeight: "700", color: theme.colors.textMuted }}>{label}</span>
      {children}
    </div>
  );
}