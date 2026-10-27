const PALETTE = ["#e0e7ff", "#fce7f3", "#dcfce7", "#fef3c7", "#e0f2fe"];
const TEXT_PALETTE = ["#4338ca", "#be185d", "#16a34a", "#b45309", "#0369a1"];

function colorIndex(name) {
  const str = name || "?";
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
  return sum % PALETTE.length;
}

export default function Avatar({ name, photoURL, size = 40 }) {
  const shape = {
    width: Math.round(size * 0.8),
    height: size,
    borderRadius: "5px",
    flexShrink: 0
  };

  if (photoURL) {
    return <img src={photoURL} alt="" style={{ ...shape, objectFit: "cover", display: "block" }} />;
  }

  const idx = colorIndex(name);
  const initials = (name || "?")
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{
      ...shape,
      background: PALETTE[idx],
      color: TEXT_PALETTE[idx],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "700",
      fontSize: size * 0.38
    }}>
      {initials}
    </div>
  );
}