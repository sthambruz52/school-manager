import { theme } from "../../theme";

const VARIANTS = {
  success: { bg: theme.colors.successBg, text: theme.colors.success },
  warning: { bg: theme.colors.warningBg, text: theme.colors.warning },
  danger: { bg: theme.colors.dangerBg, text: theme.colors.danger },
  info: { bg: theme.colors.infoBg, text: theme.colors.info }
};

export default function StatusPill({ label, variant = "info", icon }) {
  const v = VARIANTS[variant] || VARIANTS.info;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      background: v.bg,
      color: v.text,
      fontWeight: "600",
      fontSize: "12px",
      padding: "4px 10px",
      borderRadius: "999px"
    }}>
      {icon}{label}
    </span>
  );
}