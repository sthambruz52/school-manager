import { MENU_GROUPS, ICONS } from "../menuConfig";

const TILE_COLORS = [
  "#1f4d3a", "#c2704e", "#3a6ea5", "#8e44ad", "#d4a017", "#2e8b57"
];

export default function Home({ role, userData, userEmail, setActiveView }) {
  const groups = MENU_GROUPS[role] || [];
  let colorIndex = 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px 20px 60px" }}>
      <div style={{
        background: "linear-gradient(135deg, #1f4d3a, #2e6b4f)",
        borderRadius: "16px",
        padding: "28px 24px",
        color: "white",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        gap: "16px"
      }}>
        {userData?.photoURL ? (
          <img src={userData.photoURL} alt="" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.5)" }} />
        ) : (
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "bold", border: "3px solid rgba(255,255,255,0.5)" }}>
            {(userData?.fullName || userEmail || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ fontSize: "14px", opacity: 0.85 }}>{greeting},</div>
          <div style={{ fontSize: "22px", fontWeight: "bold" }}>{userData?.fullName || userEmail}</div>
          <div style={{ display: "inline-block", marginTop: "6px", background: "rgba(255,255,255,0.2)", padding: "2px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
            {role?.toUpperCase()}
          </div>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.group} style={{ marginBottom: "26px" }}>
          <h3 style={{ color: "#1f4d3a", marginBottom: "12px", fontSize: "16px", letterSpacing: "0.5px" }}>{g.group}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px" }}>
            {g.items.map((item) => {
              const color = TILE_COLORS[colorIndex % TILE_COLORS.length];
              colorIndex++;
              const IconComponent = ICONS[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    padding: "20px 14px",
                    textAlign: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    transition: "transform 0.15s ease",
                    borderTop: `4px solid ${color}`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center", color }}>
                    {IconComponent && <IconComponent size={30} />}
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", marginTop: "10px", color: "#999", fontSize: "13px" }}>
        Tap any tile above, or use the ☰ menu anytime.
      </div>
    </div>
  );
}