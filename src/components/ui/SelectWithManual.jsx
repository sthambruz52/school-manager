import { useState } from "react";
import { field } from "../../theme";

const OTHER = "__OTHER__";

export default function SelectWithManual({ value, onChange, options, placeholder, manualPlaceholder, style = {} }) {
  const [manual, setManual] = useState(() => !!value && !options.includes(value));
  const base = { ...field, flex: "1 1 150px", ...style };

  return (
    <>
      <select
        value={manual ? OTHER : value}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setManual(true);
            onChange("");
          } else {
            setManual(false);
            onChange(e.target.value);
          }
        }}
        style={base}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER}>Manual Input</option>
      </select>
      {manual && (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={manualPlaceholder} style={base} />
      )}
    </>
  );
}