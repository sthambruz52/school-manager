import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from "firebase/firestore";
import { Search, UserMinus, ShieldCheck, Check, X } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import StatusPill from "./ui/StatusPill";
import EmptyState from "./ui/EmptyState";
import SelectWithManual from "./ui/SelectWithManual";

const TITLES = ["School Owner", "Proprietor", "Director", "Principal", "Vice Principal", "Head Teacher"];

export default function ManagementAccess() {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [found, setFound] = useState(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Management"));
    const unsub = onSnapshot(q, (snap) => setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const pending = members.filter((m) => m.approved === false);
  const approvedMembers = members.filter((m) => m.approved !== false);

  const findAccount = async () => {
    const wanted = email.trim().toLowerCase();
    setFound(null);
    setMessage("");
    if (!wanted) return setMessage("Type their email address first.");

    setSearching(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const match = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find((u) => (u.email || "").toLowerCase() === wanted);

      if (!match) {
        setMessage("No account with that email yet. Ask them to sign up on the website first, then search again.");
      } else if (match.role === "Admin") {
        setMessage("That account is already a full Admin.");
      } else if (match.role === "Management") {
        setMessage(
          match.approved === false
            ? "That person has already asked for access. Approve them in the Pending requests list above."
            : "That account already has management access."
        );
      } else {
        setFound(match);
        setName(match.fullName || "");
        setTitle("");
        setFormKey((k) => k + 1);
      }
    } catch (err) {
      setMessage("Could not search. Check your connection and try again.");
    }
    setSearching(false);
  };

  const grant = async () => {
    if (!found) return;
    if (!name.trim() || !title.trim()) return alert("Enter their name and choose a title.");

    if (
      (found.role === "Student" || found.role === "Teacher") &&
      !confirm(
        `This account is currently a ${found.role}. Making it a management account will remove it from class lists and teacher lists. Continue?`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", found.id), {
        role: "Management",
        managementTitle: title.trim(),
        fullName: name.trim(),
        previousRole: found.role || "Parent",
        approved: true
      });
      setMessage(`${name.trim()} now has view-only access. They can log in and will see the management dashboard.`);
      setFound(null);
      setEmail("");
      setName("");
      setTitle("");
    } catch (err) {
      alert("Could not grant access. Please try again.");
    }
    setSaving(false);
  };

  const approve = async (m) => {
    try {
      await updateDoc(doc(db, "users", m.id), { approved: true });
    } catch (err) {
      alert("Could not approve. Please try again.");
    }
  };

  const decline = async (m) => {
    if (
      !confirm(
        `Decline ${m.fullName || m.email}? Their account will be switched to an ordinary Parent account with no management access.`
      )
    ) {
      return;
    }
    try {
      await updateDoc(doc(db, "users", m.id), { role: "Parent", approved: true, managementTitle: "" });
    } catch (err) {
      alert("Could not decline. Please try again.");
    }
  };

  const revoke = async (m) => {
    const back = m.previousRole && m.previousRole !== "Management" ? m.previousRole : "Parent";
    if (!confirm(`Remove view-only access for ${m.fullName || m.email}? Their account will go back to ${back}.`)) return;
    try {
      await updateDoc(doc(db, "users", m.id), { role: back, previousRole: "", managementTitle: "" });
    } catch (err) {
      alert("Could not remove access. Please try again.");
    }
  };

  const muted = { fontSize: "13px", color: theme.colors.textMuted, margin: 0, lineHeight: 1.6 };

  return (
    <div style={{ marginTop: "10px" }}>
      <Header title="Management Access" subtitle="View-only accounts for owners and directors" />

      {pending.length > 0 && (
        <Card style={{ marginTop: "14px", border: `1.5px solid ${theme.colors.primary}` }}>
          <div style={{ fontWeight: "800", color: theme.colors.text, marginBottom: "4px" }}>
            Pending requests ({pending.length})
          </div>
          <p style={{ ...muted, marginBottom: "8px" }}>
            These people signed up for management access. Only approve someone you recognise.
          </p>
          {pending.map((m, i) => (
            <div
              key={m.id}
              style={{ padding: "12px 0", borderTop: i > 0 ? `1px solid ${theme.colors.border}` : "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Avatar name={m.fullName || m.email} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "700", color: theme.colors.text }}>{m.fullName || "(no name)"}</div>
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted, wordBreak: "break-all" }}>{m.email}</div>
                  <div style={{ marginTop: "6px" }}>
                    <StatusPill label={m.managementTitle || "Management"} variant="warning" />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <Button size="sm" icon={<Check size={14} />} onClick={() => approve(m)}>Approve</Button>
                <Button size="sm" variant="danger" icon={<X size={14} />} onClick={() => decline(m)}>Decline</Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginTop: "14px" }}>
        <div style={{ fontWeight: "800", color: theme.colors.text, marginBottom: "8px" }}>How it works</div>
        <p style={muted}>
          Owners and directors can sign up on the website by choosing Management. Their request appears above for you to approve.<br />
          You can also give access to an account that already exists by searching its email below.
        </p>
        <p style={{ ...muted, marginTop: "8px" }}>
          Management accounts can view everything but change nothing. Use a separate account for each person, not a real student's or teacher's account.
        </p>
      </Card>

      <Card>
        <div style={{ fontWeight: "800", color: theme.colors.text, marginBottom: "10px" }}>Give an existing account access</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && findAccount()}
            placeholder="Their email address"
            style={{ ...field, flex: 1 }}
          />
          <Button icon={<Search size={16} />} onClick={findAccount} disabled={searching}>
            {searching ? "..." : "Find"}
          </Button>
        </div>

        {message && (
          <div style={{ marginTop: "10px", background: "#eef0ff", color: theme.colors.primary, fontSize: "13px", fontWeight: "600", padding: "10px 12px", borderRadius: theme.radius.sm }}>
            {message}
          </div>
        )}

        {found && (
          <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${theme.colors.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar name={found.fullName || found.email} photoURL={found.photoURL} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", color: theme.colors.text }}>{found.fullName || "(no name yet)"}</div>
                <div style={{ fontSize: "12px", color: theme.colors.textMuted, wordBreak: "break-all" }}>{found.email}</div>
              </div>
              <StatusPill label={`Now: ${found.role || "Account"}`} variant="info" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={field} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <SelectWithManual
                  key={formKey}
                  value={title}
                  onChange={setTitle}
                  options={TITLES}
                  placeholder="Select title"
                  manualPlaceholder="Type their title"
                />
              </div>
              <Button full onClick={grant} disabled={saving}>
                {saving ? "Saving..." : "Grant view-only access"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div style={{ fontWeight: "800", color: theme.colors.text, margin: "18px 4px 4px" }}>
        Accounts with access ({approvedMembers.length})
      </div>

      {approvedMembers.length === 0 ? (
        <EmptyState icon={ShieldCheck} text="No management accounts yet." />
      ) : (
        approvedMembers.map((m) => (
          <Card key={m.id}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar name={m.fullName || m.email} photoURL={m.photoURL} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", color: theme.colors.text }}>{m.fullName || m.email}</div>
                <div style={{ fontSize: "12px", color: theme.colors.textMuted, wordBreak: "break-all" }}>{m.email}</div>
                <div style={{ marginTop: "6px" }}>
                  <StatusPill label={m.managementTitle || "Management"} variant="success" />
                </div>
              </div>
            </div>
            <div style={{ marginTop: "12px" }}>
              <Button size="sm" variant="danger" icon={<UserMinus size={14} />} onClick={() => revoke(m)}>
                Remove access
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}