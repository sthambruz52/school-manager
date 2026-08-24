import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

// English & Mathematics pinned to top, rest alphabetical
const PRESET_SUBJECTS = [
  { name: "English", code: "ENG" },
  { name: "Mathematics", code: "MTH" },
  { name: "Agric Science", code: "AGR" },
  { name: "Basic Science", code: "BSC" },
  { name: "Basic Technology", code: "BTC" },
  { name: "Business Studies", code: "BUS" },
  { name: "Civic Education", code: "CIV" },
  { name: "Computer Studies", code: "CMP" },
  { name: "Creative Arts", code: "CRA" },
  { name: "French", code: "FRE" },
  { name: "PHE", code: "PHE" },
  { name: "Social Studies", code: "SOS" },
];

const OTHER_VALUE = "__OTHER__";

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subjects"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubjects(list);
    });
    return () => unsub();
  }, []);

  const isManual = selected === OTHER_VALUE;

  const addSubject = async () => {
    let name, code;

    if (isManual) {
      if (!manualName.trim()) return alert("Enter subject name");
      name = manualName.trim();
      code = manualCode.trim().toUpperCase();
    } else {
      if (!selected) return alert("Select a subject");
      const preset = PRESET_SUBJECTS.find(p => p.name === selected);
      name = preset.name;
      code = preset.code;
    }

    const exists = subjects.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert(`${name} is already in your subjects list.`);
      return;
    }

    await addDoc(collection(db, "subjects"), { name, code, createdAt: new Date() });
    setSelected("");
    setManualName("");
    setManualCode("");
  };

  const remove = async (id) => {
    if (confirm("Delete?")) await deleteDoc(doc(db, "subjects", id));
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h2 style={{ textAlign: 'center' }}>Subjects - {subjects.length}</h2>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', flex: 2, minWidth: '200px' }}
        >
          <option value="">Select subject</option>
          {PRESET_SUBJECTS.map(p => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
          <option value={OTHER_VALUE}>Other (type manually)</option>
        </select>

        {isManual && (
          <>
            <input
              value={manualName}
              onChange={e => setManualName(e.target.value)}
              placeholder="Subject name"
              style={{ padding: '8px', borderRadius: '6px', flex: 2, minWidth: '150px' }}
            />
            <input
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              placeholder="Code (e.g. MTH)"
              maxLength={5}
              style={{ padding: '8px', borderRadius: '6px', flex: 1, minWidth: '100px' }}
            />
          </>
        )}

        <button onClick={addSubject} style={{ background: '#1f4d3a', color: 'white', padding: '8px 16px', borderRadius: '6px' }}>Add Subject</button>
      </div>

      {subjects.map(s => (
        <div key={s.id} style={{ background: 'white', padding: '12px', margin: '8px 0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>{s.name} {s.code && <strong>({s.code})</strong>}</span>
          <button onClick={() => remove(s.id)} style={{ background: '#c2704e', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px' }}>x</button>
        </div>
      ))}
    </div>
  );
}