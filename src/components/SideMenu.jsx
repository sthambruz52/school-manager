import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Home as HomeIcon, LogOut, UserCog } from "lucide-react";
import { MENU_GROUPS, ICONS } from "../menuConfig";
import { theme } from "../theme";
import Avatar from "./ui/Avatar";

export default function SideMenu({ role, activeView, setActiveView, userData, userEmail, hasProfile, onProfile, onLogout, isOpen, setIsOpen }) {
  const groups = MENU_GROUPS[role] || [];
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (role === "Admin") return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "supportChats", uid), (snap) => {
      setHasUnread(snap.exists() && snap.data().unreadByUser === true);
    });
    return () => unsub();
  }, [role]);

  const go = (key) => {
    setActiveView(key);
    setIsOpen(false);
  };

  const rowStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 18px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: active ? "700" : "500",
    color: active ? "white" : "rgba(255,255,255,0.78)",
    background: active ? "rgba(255,255,255,0.14)" : "transparent",
    borderLeft: active ? "4px solid #a5b4fc" : "4px solid transparent"
  });

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15, 12, 41, 0.5)", zIndex: 40 }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "-300px",
          width: "280px",
          height: "100%",
          background: "linear-gradient(180deg, #312e81, #1e1b4b)",
          color: "white",
          transition: "left 0.25s ease",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto"
        }}
      >
        <div
          onClick={() => go("home")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "26px 16px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer"
          }}
        >
          <Avatar name={userData?.fullName || userEmail} photoURL={userData?.photoURL} size={84} />
          <div style={{ fontWeight: "800", fontSize: "16px", textAlign: "center" }}>{userData?.fullName || userEmail}</div>
          <div
            style={{
              background: "rgba(255,255,255,0.16)",
              padding: "3px 12px",
              borderRadius: "999px",
              fontWeight: "700",
              fontSize: "11px",
              letterSpacing: "1px"
            }}
          >
            {role?.toUpperCase()}
          </div>
        </div>

        <div style={{ flex: 1, padding: "10px 0" }}>
          <div onClick={() => go("home")} style={rowStyle(activeView === "home")}>
            <HomeIcon size={18} /> Home
          </div>

          {groups.map((g) => (
            <div key={g.group} style={{ marginTop: "12px" }}>
              <div
                style={{
                  padding: "6px 22px",
                  fontSize: "11px",
                  letterSpacing: "1.5px",
                  color: "rgba(255,255,255,0.45)",
                  textTransform: "uppercase",
                  fontWeight: "700"
                }}
              >
                {g.group}
              </div>
              {g.items.map((item) => {
                const Icon = ICONS[item.key];
                return (
                  <div key={item.key} onClick={() => go(item.key)} style={rowStyle(activeView === item.key)}>
                    {Icon && <Icon size={18} />}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.key === "supportchat" && hasUnread && (
                      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#fb923c" }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 16px 20px", borderTop: "1px solid rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", gap: "10px" }}>
          {hasProfile && (
            <button
              onClick={() => { onProfile(); setIsOpen(false); }}
              style={{
                background: "white",
                color: theme.colors.primary,
                border: "none",
                padding: "11px",
                borderRadius: theme.radius.sm,
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <UserCog size={17} /> My Profile
            </button>
          )}
          <button
            onClick={onLogout}
            style={{
              background: "rgba(251, 146, 60, 0.18)",
              color: "#fdba74",
              border: "1px solid rgba(251, 146, 60, 0.4)",
              padding: "11px",
              borderRadius: theme.radius.sm,
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </div>
    </>
  );
}