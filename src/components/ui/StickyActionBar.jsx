import { theme } from "../../theme";

export default function StickyActionBar({ children }) {
  return (
    <div style={{
      position: "sticky",
      bottom: "88px",
      background: theme.colors.card,
      borderRadius: theme.radius.md,
      padding: "10px",
      margin: "12px 0",
      boxShadow: "0 6px 18px rgba(30, 27, 46, 0.15)",
      zIndex: 10
    }}>
      {children}
    </div>
  );
}