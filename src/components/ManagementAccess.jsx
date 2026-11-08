import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, setDoc, writeBatch } from "firebase/firestore";
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
  const [pendingAll, setPendingAll] = useState([]);
  const [requireApproval, setRequireApproval] = useState(false);
  const [switching, setSwitching] = useState(false);

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

  useEffect(() => {
    const q = query(collection(db, "users"), where("approved", "==", false));
    const unsub = onSnapshot(q, (snap) => setPendingAll(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "security"), (snap) =>
      setRequireApproval(snap.exists() && snap.data().requireApproval === true)
    );
    return () => unsub();
  }, []);

  const approvedMembers = members.filter((m) => m.approved !== false);
  const waiting = pendingAll.filter((m) => m.status !== "disabled");
  const declined = pendingAll.filter((m) => m.status === "disabled");

  const toggleSwitch = async () => {
    setSwitching(true);
    try {
      await setDoc(doc(db, "settings", "security"), { requireApproval: !requireApproval }, { merge: true });
    } catch (err) {
      alert("Could not save that setting. Please try again.");
    }
    setSwitching(false);
  };

  const approve = async (m) => {
    try {
      await updateDoc(doc(db, "users", m.id), { approved: true, status: "active" });
    } catch (err) {
      alert("Could not approve. Please try again.");
    }
  };

  const approveAll = async () => {
    if (!confirm(`Approve all ${waiting.length} waiting accounts? Only do this if you recognise everyone on the list.`)) return;
    try {
      const batch = writeBatch(db);
      waiting.forEach((m) => batch.update(doc(db, "users", m.id), { approved: true }));
      await batch.commit();
    } catch (err) {
      alert("Could not approve everyone. Please try again.");
    }
  };

  const decline = async (m) => {
    if (!confirm(`Decline ${m.fullName || m.email}? Their account will be disabled. You can approve it later from this list.`)) return;
    try {
      await updateDoc(doc(db, "users", m.id), { status: "disabled" });
    } catch (err) {
      alert("Could not decline. Please try again.");
    }
  };

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
            ? "That person has already asked for access. Approve them in the waiting list above."
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

  const revoke = async (m) => {
    const back = m.previousRole && m.previousRole !== "Management" ? m.previousRole : "Parent";
    if (!confirm(`Remove view-only access for ${m.fullName || m.email}? Their account will go back to ${back}.`)) return;
    try {
      await updateDoc(doc(db, "users", m.id), { role: back, previousRole: "", managementTitle: "" });
    } catch (err) {
      alert("Could not remove access. Please try again.");
    }
  };

  const roleLabel = (m) => (m.role === "Management" ? m.managementTitle || "Management" : m.role || "Account");
  const muted = { fontSize: "13px", color: theme.colors.textMuted, margin: 0, lineHeight: 1.6 };

  const requestRow = (m, i, isDeclined) => (
    <div key={m.id} style={{ padding: "12px 0", borderTop: i > 0 ? `1px solid ${theme.colors.border}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Avatar name={m.fullName || m.email} photoURL={m.photoURL} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "700", color: theme.colors.text }}>{m.fullName || "(no name yet)"}</div>
          <div style={{ fontSize: "12px", color: theme.colors.textMuted, wordBreak: "break-all" }}>{m.email}</div>
          <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <StatusPill label={roleLabel(m)} variant="warning" />
            {m.classLevel && <StatusPill label={m.classLevel} variant="info" />}
            {isDeclined && <StatusPill label="Declined" variant="danger" />}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
        <Button size="sm" icon={<Check size={14} />} onClick={() => approve(m)}>Approve</Button>
        {!isDeclined && (
          <Button size="sm" variant="danger" icon={<X size={14} />} onClick={() => decline(m)}>Decline</Button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: "10px" }}>
      <Header title="Approvals & Management" subtitle="Approve new accounts and give view-only access" />

      {waiting.length > 0 && (
        <Card style={{ marginTop: "14px", border: `1.5px solid ${theme.colors.primary}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <div style={{ fontWeight: "800", color: theme.colors.text }}>Waiting for approval ({waiting.length})</div>
            {waiting.length > 1 && <Button size="sm" variant="outline" onClick={approveAll}>Approve all</Button>}
          </div>
          <p style={{ ...muted, margin: "4px 0 6px" }}>Only approve people you recognise.</p>
          {waiting.map((m, i) => requestRow(m, i, false))}
        </Card>
      )}

      <Card style={{ marginTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "800", color: theme.colors.text }}>Approve new Student and Parent accounts</div>
            <p style={{ ...muted, marginTop: "4px" }}>
              Recommended. When on, new students and parents see a waiting screen until you approve them. Teacher and Management sign-ups always need approval. Existing accounts are not affected.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={requireApproval}
            aria-label="Approve new Student and Parent accounts"
            onClick={toggleSwitch}
            disabled={switching}
            style={{
              width: "52px",
              height: "30px",
              borderRadius: "999px",
              border: "none",
              padding: "3px",
              display: "flex",
              justifyContent: requireApproval ? "flex-end" : "flex-start",
              background: requireApproval ? theme.colors.primary : "#d1d5db",
              flexShrink: 0
            }}
          >
            <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
          </button>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: "800", color: theme.colors.text, marginBottom: "10px" }}>Give an existing account view-only access</div>
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
        Management accounts ({approvedMembers.length})
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

      {declined.length > 0 && (
        <Card>
          <div style={{ fontWeight: "800", color: theme.colors.text }}>Declined ({declined.length})</div>
          <p style={{ ...muted, margin: "4px 0 6px" }}>Approve one of these if you change your mind.</p>
          {declined.map((m, i) => requestRow(m, i, true))}
        </Card>
      )}
    </div>
  );
}