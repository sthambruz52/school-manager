import { theme } from "../../theme";

export default function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={onClick ? "app-card" : ""}
      style={{
        background: theme.colors.card,
        borderRadius: theme.radius.md,
        boxShadow: theme.shadow,
        padding: "16px",
        margin: "10px 0",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
    >
      {children}
    </div>
  );
}