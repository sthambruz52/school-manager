import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { Plus, X, Pencil, Trash2, Users } from "lucide-react";
import { theme, field } from "../theme";
import Header from "./ui/Header";
import HeaderAction from "./ui/HeaderAction";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import EmptyState from "./ui/EmptyState";
import ImagePicker from "./ui/ImagePicker";
import StaffIDCardButton from "./StaffIDCardButton";

export default function StaffDirectory({ isAdmin }) {
  const [staff, setStaff] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "staff"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Teacher"));
    const unsub = onSnapshot(q, (snap) => {
      setTeachers(
        snap.docs
          .filter((d) => d.data().status !== "disabled")
          .map((d) => ({
            id: d.id,
            name: d.data().fullName || "(no name)",
            title: "Teacher",
            department: (d.data().subjects || []).join(", "),
            phone: d.data().phone || "",
            email: "",
            dateOfBirth: d.data().dateOfBirth || "",
            sex: d.data().sex || "",
            photoURL: d.data().photoURL || "",
                        staffId: d.data().staffId || "",
            createdAt: d.data().createdAt || null,
            isTeacherAccount: true
          }))
      );
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTitle("");
    setDepartment("");
    setPhone("");
    setEmail("");
    setDateOfBirth("");
    setSex("");
    setPhotoURL("");
    setShowForm(false);
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setName(s.name || "");
    setTitle(s.title || "");
    setDepartment(s.department || "");
    setPhone(s.phone || "");
    setEmail(s.email || "");
    setDateOfBirth(s.dateOfBirth || "");
    setSex(s.sex || "");
    setPhotoURL(s.photoURL || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveStaff = async () => {
    if (!name.trim() || !title.trim()) return alert("Enter at least a name and a title/position.");
    setSaving(true);
    const payload = {
      name: name.trim(),
      title: title.trim(),
      department: department.trim(),
      phone: phone.trim(),
      email: email.trim(),
      dateOfBirth,
      sex,
      photoURL
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, "staff", editingId), payload);
      } else {
        await addDoc(collection(db, "staff"), { ...payload, createdAt: new Date() });
      }
      resetForm();
    } catch (err) {
      alert("Could not save. Please try again.");
    }
    setSaving(false);
  };

  const removeStaff = async (id) => {
    if (confirm("Remove this staff member?")) await deleteDoc(doc(db, "staff", id));
  };

  const combined = [...staff, ...teachers]
    .filter((s) => !search || (s.name || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return (
    <div style={{ marginTop: "10px" }}>
      <Header
        title="Staff & Management"
        subtitle={`${staff.length + teachers.length} people`}
        rightSlot={
          isAdmin ? (
            <HeaderAction
              icon={showForm ? <X size={16} /> : <Plus size={16} />}
              label={showForm ? "Close" : "Add Staff"}
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
            />
          ) : null
        }
      />

      {isAdmin && showForm && (
        <Card style={{ marginTop: "14px" }}>
          <div style={{ fontWeight: "800", marginBottom: "4px", color: theme.colors.text }}>
            {editingId ? `Editing ${name || "staff member"}` : "Add a staff member"}
          </div>
          <p style={{ fontSize: "12px", color: theme.colors.textMuted, margin: "0 0 12px" }}>
            Use this for staff without a login (Principal, Bursar and so on). Registered teachers appear here automatically.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
            <Avatar name={name || "?"} photoURL={photoURL} size={96} />
            <ImagePicker
              label={photoURL ? "Change Photo" : "Upload Photo"}
              onUploaded={setPhotoURL}
              onBusyChange={setUploading}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ ...field, flex: "1 1 160px" }} />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Principal, Bursar)" style={{ ...field, flex: "1 1 160px" }} />
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department (optional)" style={{ ...field, flex: "1 1 160px" }} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={{ ...field, flex: "1 1 160px" }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ ...field, flex: "1 1 160px" }} />
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} style={{ ...field, flex: "1 1 160px" }} />
            <select value={sex} onChange={(e) => setSex(e.target.value)} style={{ ...field, flex: "1 1 160px" }}>
              <option value="">Select sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <Button full onClick={saveStaff} disabled={saving || uploading}>
              {saving ? "Saving..." : editingId ? "Update Staff Member" : "Add Staff Member"}
            </Button>
            {editingId && <Button variant="ghost" onClick={resetForm}>Cancel</Button>}
          </div>
        </Card>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name..."
        style={{ ...field, width: "100%", margin: "14px 0 4px" }}
      />

      {combined.length === 0 ? (
        <EmptyState icon={Users} text={search ? "No one matches that search." : "No staff added yet."} />
      ) : (
        combined.map((s) => (
          <Card key={s.id}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Avatar name={s.name} photoURL={s.photoURL} size={64} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "800", color: theme.colors.text }}>{s.name}</div>
                <div style={{ fontSize: "13px", color: theme.colors.primary, fontWeight: "600" }}>
                  {s.title}{s.department ? ` • ${s.department}` : ""}
                </div>
                {(s.phone || s.email) && (
                  <div style={{ fontSize: "12px", color: theme.colors.textMuted, marginTop: "2px", wordBreak: "break-word" }}>
                    {[s.phone, s.email].filter(Boolean).join(" • ")}
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <StaffIDCardButton staffMember={s} />
                {!s.isTeacherAccount && (
                  <>
                    <Button size="sm" variant="outline" icon={<Pencil size={14} />} onClick={() => startEdit(s)}>Edit</Button>
                    <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => removeStaff(s.id)}>Delete</Button>
                  </>
                )}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}