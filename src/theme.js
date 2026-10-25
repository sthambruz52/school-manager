export const theme = {
  colors: {
    primary: "#4338ca",
    primaryDark: "#3730a3",
    primaryLight: "#6366f1",
    bg: "#f4f5fb",
    card: "#ffffff",
    text: "#1e1b2e",
    textMuted: "#6b7280",
    success: "#16a34a",
    successBg: "#dcfce7",
    warning: "#d97706",
    warningBg: "#fef3c7",
    danger: "#dc2626",
    dangerBg: "#fee2e2",
    info: "#2563eb",
    infoBg: "#dbeafe",
    border: "#e5e7eb"
  },
  shadow: "0 2px 10px rgba(30, 27, 46, 0.08)",
  radius: {
    sm: "8px",
    md: "14px",
    lg: "20px"
  },
  gradient: (from, to) => `linear-gradient(135deg, ${from}, ${to})`
};

export const formatNaira = (amount) =>
  "₦" + Number(amount || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 });