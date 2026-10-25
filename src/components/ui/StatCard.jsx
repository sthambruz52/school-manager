import { theme } from "../../theme";

export default function StatCard({ label, value, subLabel, badge, stats = [], gradientFrom, gradientTo }) {
  return (
    <div style={{
      background: theme.gradient(gradientFrom || theme.colors.primary, gradientTo || theme.colors.primaryDark),
      borderRadius: theme.radius.lg,
      padding: "22px",
      color: "white",
      boxShadow: theme.shadow
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "12px", letterSpacing: "1px", opacity: 0.8, textTransform: "uppercase" }}>{label}</span>
        {badge && (
          <span style={{ background: "rgba(255,255,255,0.25)", padding: "3px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>
            {badge}
          </span>
        )}
      </div>

      <div style={{ textAlign: "center", margin: "18px 0" }}>
        <div style={{
          width: "150px", height: "150px", borderRadius: "50%",
          border: "6px solid rgba(255,255,255,0.25)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          margin: "0 auto"
        }}>
          <div style={{ fontSize: "32px", fontWeight: "800" }}>{value}</div>
          {subLabel && <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "4px" }}>{subLabel}</div>}
        </div>
      </div>

      {stats.length > 0 && (
        <div style={{ display: "flex", background: "rgba(255,255,255,0.12)", borderRadius: theme.radius.sm, overflow: "hidden" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.18)" : "none" }}>
              <div style={{ fontWeight: "700", fontSize: "15px" }}>{s.value}</div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}