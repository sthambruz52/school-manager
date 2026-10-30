import { useState } from "react";
import { theme } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import StudentOverview from "./StudentOverview";

export default function ParentDashboard({ userData }) {
  const children = userData.children || [];
  const [selected, setSelected] = useState(children[0]?.uid || "");
  const active = children.find((c) => c.uid === selected) || children[0];

  return (
    <div style={{ maxWidth: "700px", margin: "10px auto 0", padding: "0 16px" }}>
      <Header title="My Child" subtitle={active ? active.name : "Grades, fees and attendance"} />

      {children.length === 0 ? (
        <Card>
          <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "10px 0" }}>
            No ward linked yet. Open "My Profile" from the menu to search for and link your child.
          </p>
        </Card>
      ) : (
        <>
          {children.length > 1 && (
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "14px 0 2px" }}>
              {children.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => setSelected(c.uid)}
                  style={{
                    flexShrink: 0,
                    border: "none",
                    borderRadius: "999px",
                    padding: "9px 16px",
                    fontSize: "13px",
                    fontWeight: "700",
                    background: active.uid === c.uid ? theme.colors.primary : "white",
                    color: active.uid === c.uid ? "white" : theme.colors.text,
                    boxShadow: theme.shadow
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <StudentOverview key={active.uid} studentId={active.uid} fallbackName={active.name} />
        </>
      )}
    </div>
  );
}