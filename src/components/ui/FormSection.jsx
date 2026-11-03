import Card from "./Card";
import { theme } from "../../theme";

export default function FormSection({ title, hint, children }) {
  return (
    <Card>
      <div style={{ fontWeight: "800", color: theme.colors.text }}>{title}</div>
      {hint && <div style={{ fontSize: "12px", color: theme.colors.textMuted, marginTop: "2px" }}>{hint}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>{children}</div>
    </Card>
  );
}