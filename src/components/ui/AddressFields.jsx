import { field } from "../../theme";

const full = { ...field, width: "100%" };
const half = { ...field, flex: "1 1 130px" };

export default function AddressFields({ value, onChange }) {
  const set = (key, v) => onChange({ ...value, [key]: v });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input value={value.street} onChange={(e) => set("street", e.target.value)} placeholder="Street" style={full} />
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input value={value.lga} onChange={(e) => set("lga", e.target.value)} placeholder="LGA" style={half} />
        <input value={value.city} onChange={(e) => set("city", e.target.value)} placeholder="City" style={half} />
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input value={value.state} onChange={(e) => set("state", e.target.value)} placeholder="State" style={half} />
        <input value={value.country} onChange={(e) => set("country", e.target.value)} placeholder="Country" style={half} />
      </div>
    </div>
  );
}