const PALETTE = ["#e0e7ff", "#fce7f3", "#dcfce7", "#fef3c7", "#e0f2fe"];
const TEXT_PALETTE = ["#4338ca", "#be185d", "#16a34a", "#b45309", "#0369a1"];

function colorIndex(name) {
  const str = name || "?";
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
  return sum % PALETTE.length;
}

export default function Avatar({ name, photoURL, size = 40 }) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt=""
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
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
      width: size,
      height: size,
      borderRadius: "50%",
      background: PALETTE[idx],
      color: TEXT_PALETTE[idx],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "700",
      fontSize: size * 0.38,
      flexShrink: 0
    }}>
      {initials}
    </div>
  );
}