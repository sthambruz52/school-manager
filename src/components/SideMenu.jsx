import { MENU_GROUPS, ICONS } from "../menuConfig";
import { Home as HomeIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
export default function SideMenu({ role, activeView, setActiveView, userData, userEmail, hasProfile, onProfile, onLogout, isOpen, setIsOpen }) {
  const groups = MENU_GROUPS[role] || [];
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (role === "Admin") return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "supportChats", uid), (docSnap) => {
      setHasUnread(docSnap.exists() && docSnap.data().unreadByUser === true);
    });
    return () => unsub();
  }, [role]);

  const handleSelect = (key) => {
    setActiveView(key);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "-260px",
          width: "260px",
          height: "100%",
          background: "#1f4d3a",
          color: "white",
          transition: "left 0.25s ease",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          padding: "20px 0",
          overflowY: "auto"
        }}
      >
        <div
          onClick={() => handleSelect("home")}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "0 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}
        >
          {userData?.photoURL ? (
            <img src={userData.photoURL} alt="Profile" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid white" }} />
          ) : (
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold", border: "2px solid white" }}>
              {(userData?.fullName || userEmail || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ fontWeight: "bold", fontSize: "15px", textAlign: "center" }}>{userData?.fullName || userEmail}</div>
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "2px 10px", borderRadius: "12px", fontWeight: "bold", fontSize: "12px" }}>
            {role?.toUpperCase()}
          </div>
        </div>

        <div style={{ flex: 1, padding: "12px 0" }}>
          <div
            onClick={() => handleSelect("home")}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              background: activeView === "home" ? "rgba(255,255,255,0.15)" : "transparent",
              fontWeight: activeView === "home" ? "bold" : "normal",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <HomeIcon size={18} /> Home
          </div>

          {groups.map((g) => (
            <div key={g.group} style={{ marginTop: "10px" }}>
              <div style={{ padding: "6px 20px", fontSize: "11px", letterSpacing: "1px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                {g.group}
              </div>
              {g.items.map((item) => {
                const IconComponent = ICONS[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => handleSelect(item.key)}
                    style={{
                      padding: "12px 20px",
                      cursor: "pointer",
                      background: activeView === item.key ? "rgba(255,255,255,0.15)" : "transparent",
                      fontWeight: activeView === item.key ? "bold" : "normal",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    {IconComponent && <IconComponent size={18} />} {item.label}
                    {item.key === "supportchat" && hasUnread && (
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#c2704e", marginLeft: "auto" }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", gap: "8px" }}>
          {hasProfile && (
            <button onClick={() => { onProfile(); setIsOpen(false); }} style={{ background: "white", color: "#1f4d3a", border: "none", padding: "8px", borderRadius: "6px", fontWeight: "bold" }}>
              My Profile
            </button>
          )}
          <button onClick={onLogout} style={{ background: "#c2704e", color: "white", border: "none", padding: "8px", borderRadius: "6px", fontWeight: "bold" }}>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}