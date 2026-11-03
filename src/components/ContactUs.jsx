import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { MapPin, Phone, Mail, Clock, Pencil, X } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";

const EMPTY = { address: "", phone1: "", phone2: "", email: "", officeHours: "" };

const link = { color: theme.colors.primary, fontWeight: "600", textDecoration: "none" };
const digitsOf = (v) => String(v || "").replace(/[^0-9+]/g, "");

function Row({ icon: Icon, tone, label, children }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "12px",
            background: tone.bg,
            color: tone.fg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Icon size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12px", color: theme.colors.textMuted, fontWeight: "700", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            {label}
          </div>
          <div style={{ fontSize: "15px", color: theme.colors.text, marginTop: "2px", wordBreak: "break-word", lineHeight: 1.5 }}>
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ContactUs({ isAdmin }) {
  const [info, setInfo] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contactInfo"), (snap) => {
      setInfo(snap.exists() ? { ...EMPTY, ...snap.data() } : EMPTY);
    });
    return () => unsub();
  }, []);

  const hasAny = Object.values(info).some((v) => v);
  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const startEdit = () => {
    setForm({ ...info });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "contactInfo"),
        {
          address: form.address.trim(),
          phone1: form.phone1.trim(),
          phone2: form.phone2.trim(),
          email: form.email.trim(),
          officeHours: form.officeHours.trim()
        },
        { merge: true }
      );
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Could not save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Contact Us"
        subtitle="Reach the school office"
        rightSlot={
          isAdmin ? (
            <HeaderAction
              icon={editing ? <X size={16} /> : <Pencil size={16} />}
              label={editing ? "Cancel" : "Edit"}
              onClick={() => (editing ? setEditing(false) : startEdit())}
            />
          ) : null
        }
      />

      {saved && (
        <div style={{ background: theme.colors.successBg, color: theme.colors.success, fontWeight: "700", fontSize: "13px", padding: "10px 14px", borderRadius: theme.radius.sm, margin: "14px 0 0" }}>
          Contact details saved.
        </div>
      )}

      {isAdmin && editing && (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <textarea
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="School address"
              rows={2}
              style={{ ...field, resize: "vertical", fontFamily: "Arial" }}
            />
            <input value={form.phone1} onChange={(e) => setField("phone1", e.target.value)} placeholder="Phone number" style={field} />
            <input value={form.phone2} onChange={(e) => setField("phone2", e.target.value)} placeholder="Second phone number (optional)" style={field} />
            <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="School email" style={field} />
            <input value={form.officeHours} onChange={(e) => setField("officeHours", e.target.value)} placeholder="Office hours (e.g. Mon-Fri, 8am - 4pm)" style={field} />
            <Button full onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Contact Details"}</Button>
          </div>
        </Card>
      )}

      {!hasAny ? (
        <p style={{ textAlign: "center", color: theme.colors.textMuted, margin: "36px 0", fontSize: "14px" }}>
          {isAdmin ? "No contact details yet. Tap Edit to add them." : "Contact details have not been added yet."}
        </p>
      ) : (
        <div style={{ marginTop: "14px" }}>
          {info.address && (
            <Row icon={MapPin} tone={{ bg: "#fee2e2", fg: "#dc2626" }} label="Address">
              {info.address}
              <div style={{ marginTop: "4px" }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...link, fontSize: "13px" }}
                >
                  Open in Maps
                </a>
              </div>
            </Row>
          )}
          {(info.phone1 || info.phone2) && (
            <Row icon={Phone} tone={{ bg: "#dcfce7", fg: "#16a34a" }} label="Phone">
              {[info.phone1, info.phone2].filter(Boolean).map((p) => (
                <div key={p}><a href={`tel:${digitsOf(p)}`} style={link}>{p}</a></div>
              ))}
            </Row>
          )}
          {info.email && (
            <Row icon={Mail} tone={{ bg: "#e0f2fe", fg: "#0284c7" }} label="Email">
              <a href={`mailto:${info.email}`} style={link}>{info.email}</a>
            </Row>
          )}
          {info.officeHours && (
            <Row icon={Clock} tone={{ bg: "#fef3c7", fg: "#d97706" }} label="Office Hours">
              {info.officeHours}
            </Row>
          )}
        </div>
      )}
    </div>
  );
}