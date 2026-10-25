import { theme } from "../../theme";

export default function ProgressBar({ value, max = 100, color, height = 8 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color || (pct >= 80 ? theme.colors.success : pct >= 50 ? theme.colors.warning : theme.colors.danger);

  return (
    <div style={{ width: "100%", background: theme.colors.border, borderRadius: "999px", height, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`,
        height: "100%",
        background: barColor,
        borderRadius: "999px",
        transition: "width 0.3s ease"
      }} />
    </div>
  );
}