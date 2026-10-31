import { theme } from "../../theme";

const VARIANTS = {
  primary: { background: theme.colors.primary, color: "white", border: "none" },
  outline: { background: "white", color: theme.colors.primary, border: `1.5px solid ${theme.colors.primary}` },
  danger: { background: theme.colors.dangerBg, color: theme.colors.danger, border: "none" },
  ghost: { background: "transparent", color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }
};

export default function Button({ children, variant = "primary", size = "md", full = false, icon, onClick, disabled, type = "button", style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const small = size === "sm";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        width: full ? "100%" : "auto",
        padding: small ? "7px 12px" : "12px 18px",
        borderRadius: small ? theme.radius.sm : theme.radius.md,
        fontWeight: "700",
        fontSize: small ? "13px" : "15px",
        ...style
      }}
    >
      {icon}{children}
    </button>
  );
}