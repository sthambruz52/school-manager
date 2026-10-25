import { ChevronLeft } from "lucide-react";
import { theme } from "../../theme";

export default function Header({ title, subtitle, onBack, rightSlot }) {
  return (
    <div style={{
      background: theme.gradient(theme.colors.primary, theme.colors.primaryDark),
      color: "white",
      padding: "20px 20px 28px",
      borderBottomLeftRadius: theme.radius.lg,
      borderBottomRightRadius: theme.radius.lg,
      display: "flex",
      alignItems: "center",
      gap: "14px"
    }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.18)",
            border: "none",
            borderRadius: theme.radius.sm,
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white"
          }}
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "700" }}>{title}</h2>
        {subtitle && <p style={{ margin: "2px 0 0", fontSize: "13px", opacity: 0.85 }}>{subtitle}</p>}
      </div>
      {rightSlot}
    </div>
  );
}