import { theme } from "../../theme";

export default function BottomNav({ items, activeKey, onSelect }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "14px",
      left: "50%",
      transform: "translateX(-50%)",
      background: theme.colors.card,
      borderRadius: "999px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
      display: "flex",
      padding: "6px",
      gap: "2px",
      zIndex: 50,
      maxWidth: "95vw",
      overflowX: "auto"
    }}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeKey === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              background: active ? theme.colors.primary : "transparent",
              color: active ? "white" : theme.colors.textMuted,
              border: "none",
              borderRadius: "999px",
              padding: "8px 14px",
              fontSize: "11px",
              fontWeight: active ? "700" : "500",
              minWidth: "60px"
            }}
          >
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}