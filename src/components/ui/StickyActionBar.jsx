import { theme } from "../../theme";

export default function StickyActionBar({ children }) {
  return (
    <div style={{
      position: "sticky",
      bottom: 0,
      background: theme.colors.card,
      borderTop: `1px solid ${theme.colors.border}`,
      padding: "12px 16px",
      boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
      zIndex: 10
    }}>
      {children}
    </div>
  );
}