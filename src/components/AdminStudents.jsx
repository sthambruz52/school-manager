import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Download, ChevronDown, ChevronUp, Pencil, UserX, UserCheck, Users } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";
import EmptyState from "./ui/EmptyState";
import StudentProfile from "./StudentProfile";
import ParentProfile from "./ParentProfile";
import TeacherProfile from "./TeacherProfile";
import { exportToCSV } from "../utils/exportCSV";

const TABS = [["students", "Students"], ["parents", "Parents"], ["teachers", "Teachers"]];
const ROLE_OF = { students: "Student", parents: "Parent", teachers: "Teacher" };

const addr = (a) => [a?.street, a?.lga, a?.city, a?.state, a?.country].filter(Boolean).join(", ");

const prettyDate = (v) => {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "-";
};

function Detail({ label, children }) {
  return (
    <div style={{ display: "flex", gap: "10px", fontSize: "13px", padding: "4px 0" }}>
      <span style={{ width: "108px", flexShrink: 0, color: theme.colors.textMuted }}>{label}</span>
      <span style={{ flex: 1, color: theme.colors.text, wordBreak: "break-word" }}>{children || "-"}</span>
    </div>
  );
}

function PhoneLink({ value }) {
  if (!value) return "-";
  const digits = String(value).replace(/[^0-9+]/g, "");
  return <a href={`tel:${digits}`} style={{ color: theme.colors.primary, fontWeight: "600" }}>{value}</a>;
}

export default function AdminStudents({ isAdmin = true }) {
  const [tab, setTab] = useState("students");
  const [lists, setLists] = useState({ students: [], parents: [], teachers: [] });
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const unsubs = Object.entries(ROLE_OF).map(([key, role]) => {
      const q = query(collection(db, "users"), where("role", "==", role));
      return onSnapshot(q, (snap) => {
        setLists((prev) => ({ ...prev, [key]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
      });
    });
    return () => unsubs.forEach((u) => u());
  }, []);

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    if (!confirm(`${newStatus === "disabled" ? "Disable" : "Enable"} this account?`)) return;
    try {
      await updateDoc(doc(db, "users", userId), { status: newStatus });
    } catch (err) {
      alert("Could not update the account. Please try again.");
    }
  };

  const handleExport = () => {
    if (tab === "students") {
      exportToCSV(
        "students.csv",
        ["Full Name", "Reg. Number", "Class", "Session", "Term", "Date of Birth", "Sex", "Subjects", "Email", "Parent Name", "Parent Phone", "Parent Email", "Status"],
        lists.students.map((s) => [
          s.fullName || "", s.regNumber || "", s.classLevel || "", s.session || "", s.term || "",
          s.dateOfBirth || "", s.sex || "", (s.subjects || []).join("; "), s.email || "",
          s.parentName || "", s.parentPhone || "", s.parentEmail || "", s.status || "active"
        ])
      );
    } else if (tab === "parents") {
      exportToCSV(
        "parents.csv",
        ["Full Name", "Phone", "Email", "Children", "Status"],
        lists.parents.map((p) => [
          p.fullName || "", p.phone || "", p.email || "",
          (p.children || []).map((c) => c.name).join("; "), p.status || "active"
        ])
      );
    } else {
      exportToCSV(
        "teachers.csv",
        ["Full Name", "Staff ID", "Phone", "Email", "Date of Birth", "Sex", "Subjects", "Status"],
        lists.teachers.map((t) => [
          t.fullName || "", t.staffId || "", t.phone || "", t.email || "",
          t.dateOfBirth || "", t.sex || "", (t.subjects || []).join("; "), t.status || "active"
        ])
      );
    }
  };

  if (editingUser) {
    const Comp =
      editingUser.role === "Student" ? StudentProfile : editingUser.role === "Teacher" ? TeacherProfile : ParentProfile;
    return <Comp existingData={editingUser.data} targetUid={editingUser.uid} onComplete={() => setEditingUser(null)} />;
  }

  const subtitleFor = (p) => {
    if (tab === "students") return `${p.classLevel || "No class set"}${p.regNumber ? ` • ${p.regNumber}` : ""}`;
    if (tab === "parents") return p.children?.length ? `Ward: ${p.children.map((c) => c.name).join(", ")}` : "No ward linked";
    return p.subjects?.length ? p.subjects.join(", ") : "No subjects set";
  };

  const current = lists[tab]
    .filter((p) => !search || (p.fullName || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="People"
        subtitle={`${lists.students.length} students • ${lists.parents.length} parents • ${lists.teachers.length} teachers`}
        rightSlot={isAdmin ? <HeaderAction icon={<Download size={16} />} label="Export" onClick={handleExport} /> : null}
      />

      <div style={{ display: "flex", background: "#e6e8f5", borderRadius: theme.radius.md, padding: "4px", margin: "14px 0 6px" }}>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setExpandedId(null); }}
            style={{
              flex: 1,
              border: "none",
              borderRadius: theme.radius.sm,
              padding: "10px 4px",
              fontWeight: "700",
              fontSize: "13px",
              background: tab === key ? theme.colors.primary : "transparent",
              color: tab === key ? "white" : theme.colors.textMuted
            }}
          >
            {label} ({lists[key].length})
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name..."
        style={{ ...field, width: "100%", margin: "8px 0 4px" }}
      />

      {current.length === 0 ? (
        <EmptyState icon={Users} text={search ? "No one matches that search." : `No ${tab} registered yet.`} />
      ) : (
        current.map((p) => {
          const open = expandedId === p.id;
          const disabled = p.status === "disabled";
          return (
            <Card key={p.id} style={{ padding: 0, overflow: "hidden" }}>
              <div
                onClick={() => setExpandedId(open ? null : p.id)}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", cursor: "pointer" }}
              >
                <Avatar name={p.fullName} photoURL={p.photoURL} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "700", color: theme.colors.text }}>{p.fullName || "(no name)"}</div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{subtitleFor(p)}</div>
                </div>
                {disabled && <StatusPill label="Disabled" variant="danger" />}
                {open ? <ChevronUp size={20} color={theme.colors.textMuted} /> : <ChevronDown size={20} color={theme.colors.textMuted} />}
              </div>

              {open && (
                <div style={{ borderTop: `1px solid ${theme.colors.border}`, padding: "10px 14px 14px" }}>
                  {tab === "students" && (
                    <>
                      
                      <Detail label="Date of birth">{prettyDate(p.dateOfBirth)}</Detail>
                      <Detail label="Sex">{p.sex}</Detail>
                      <Detail label="Session / Term">{[p.session, p.term].filter(Boolean).join(" • ")}</Detail>
                      <Detail label="Subjects">{p.subjects?.length ? p.subjects.join(", ") : ""}</Detail>
                      <Detail label="Email">{p.email}</Detail>
                      <Detail label="Address">{addr(p.address)}</Detail>
                      <Detail label="Parent">{p.parentName}</Detail>
                      <Detail label="Parent phone"><PhoneLink value={p.parentPhone} /></Detail>
                      <Detail label="Parent email">{p.parentEmail}</Detail>
                      <Detail label="Parent address">{addr(p.parentAddress)}</Detail>
                    </>
                  )}

                  {tab === "parents" && (
                    <>
                      <Detail label="Phone"><PhoneLink value={p.phone} /></Detail>
                      <Detail label="Email">{p.email}</Detail>
                      <Detail label="Ward(s)">{p.children?.length ? p.children.map((c) => c.name).join(", ") : ""}</Detail>
                    </>
                  )}

                  {tab === "teachers" && (
                    <>
                      <Detail label="Staff ID">{p.staffId}</Detail>
                      <Detail label="Phone"><PhoneLink value={p.phone} /></Detail>
                      <Detail label="Email">{p.email}</Detail>
                      <Detail label="Date of birth">{prettyDate(p.dateOfBirth)}</Detail>
                      <Detail label="Sex">{p.sex}</Detail>
                      <Detail label="Address">{addr(p.address)}</Detail>
                    </>
                  )}

                  {isAdmin && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Pencil size={14} />}
                        onClick={() => setEditingUser({ uid: p.id, role: ROLE_OF[tab], data: p })}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={disabled ? "primary" : "danger"}
                        icon={disabled ? <UserCheck size={14} /> : <UserX size={14} />}
                        onClick={() => toggleStatus(p.id, p.status)}
                      >
                        {disabled ? "Enable Account" : "Disable Account"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}