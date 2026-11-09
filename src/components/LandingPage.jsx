import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, doc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import {
  BarChart3, MessageCircle, CreditCard, ShieldCheck, UserPlus, FileEdit, ClipboardCheck, Rocket,
  ChevronDown, ChevronUp, MapPin, Phone, Mail, Clock, Briefcase
} from "lucide-react";
import { theme } from "../theme";
import Login from "./Login";
import PublicChatWidget from "./PublicChatWidget";

const quiet = () => {};

const ACTIVITY_COLORS = {
  Sports: "#16a34a",
  Awards: "#d97706",
  "Quiz Competition": "#9333ea",
  "Debate Competition": "#0284c7",
  Events: "#4f46e5"
};

const FEATURES = [
  {
    icon: BarChart3,
    tone: { bg: "#eef0ff", fg: "#4f46e5" },
    title: "Results You Can Trust",
    text: "Marks, averages and printable report cards are worked out automatically every term."
  },
  {
    icon: MessageCircle,
    tone: { bg: "#e0f2fe", fg: "#0284c7" },
    title: "Always Connected",
    text: "Parents follow progress, read school notices and chat with the school office any time."
  },
  {
    icon: CreditCard,
    tone: { bg: "#dcfce7", fg: "#16a34a" },
    title: "Fees Made Clear",
    text: "See what has been paid and what remains, and download a receipt in seconds."
  },
  {
    icon: ShieldCheck,
    tone: { bg: "#f3e8ff", fg: "#9333ea" },
    title: "Secure Accounts",
    text: "Every account is protected by a password, and staff accounts are approved by the school."
  }
];

const STEPS = [
  { icon: UserPlus, title: "Register", text: "Create an account as a Student or Parent in just a few minutes." },
  { icon: FileEdit, title: "Complete Profile", text: "Fill in class, subjects, and family details for your records." },
  { icon: ClipboardCheck, title: "Get Confirmed", text: "Our admin team reviews and confirms your enrollment." },
  { icon: Rocket, title: "Start Learning", text: "Access grades, attendance, fees, and more, right away." }
];

const card = { background: "white", borderRadius: theme.radius.md, boxShadow: theme.shadow };

function Section({ title, subtitle, children }) {
  return (
    <div style={{ padding: "46px 0 0" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 16px" }}>
        <div style={{ marginBottom: "22px", textAlign: "center" }}>
          <div role="heading" aria-level={2} style={{ fontSize: "24px", fontWeight: 800, color: theme.colors.text }}>
            {title}
          </div>
          {subtitle && <div style={{ fontSize: "14px", color: theme.colors.textMuted, marginTop: "6px" }}>{subtitle}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, tone, children }) {
  return (
    <div style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px", flex: "1 1 260px" }}>
      <div
        style={{
          width: "44px",
          height: "44px",
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
      <div style={{ fontSize: "14px", color: theme.colors.text, lineHeight: 1.5, wordBreak: "break-word", minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mode, setMode] = useState(null);
  const [school, setSchool] = useState(null);
  const [contact, setContact] = useState(null);
  const [subjectCount, setSubjectCount] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [staff, setStaff] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const list = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const subs = [
      onSnapshot(doc(db, "settings", "schoolInfo"), (s) => setSchool(s.exists() ? s.data() : null), quiet),
      onSnapshot(doc(db, "settings", "contactInfo"), (s) => setContact(s.exists() ? s.data() : null), quiet),
      onSnapshot(collection(db, "subjects"), (s) => setSubjectCount(s.size), quiet),
      onSnapshot(query(collection(db, "gallery"), orderBy("createdAt", "desc"), limit(8)), (s) => setPhotos(list(s)), quiet),
      onSnapshot(query(collection(db, "activities"), orderBy("createdAt", "desc"), limit(3)), (s) => setActivities(list(s)), quiet),
      onSnapshot(query(collection(db, "staff"), orderBy("createdAt", "desc"), limit(4)), (s) => setStaff(list(s)), quiet),
      onSnapshot(query(collection(db, "testimonials"), orderBy("createdAt", "desc"), limit(6)), (s) => setTestimonials(list(s)), quiet),
      onSnapshot(query(collection(db, "faqs"), orderBy("createdAt", "asc")), (s) => setFaqs(list(s)), quiet)
    ];
    return () => subs.forEach((u) => u());
  }, []);

  if (mode) {
    return <Login onLoginSuccess={() => {}} initialMode={mode} onBack={() => setMode(null)} />;
  }

  const heroPhoto = photos[0]?.imageURL;
  const digits = (v) => String(v || "").replace(/[^0-9+]/g, "");
  const hasContact = contact && (contact.address || contact.phone1 || contact.phone2 || contact.email || contact.officeHours);

  return (
    <div style={{ background: theme.colors.bg, minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          background: theme.gradient("#4338ca", "#7c3aed"),
          color: "#ffffff",
          padding: `34px 20px ${heroPhoto ? "96px" : "40px"}`,
          textAlign: "center"
        }}
      >
        <img
          src="/logo.jpg"
          alt=""
          style={{
            width: "84px",
            height: "84px",
            borderRadius: "20px",
            background: "white",
            objectFit: "contain",
            padding: "6px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)"
          }}
        />
        <div
          role="heading"
          aria-level={1}
          style={{
            fontSize: "clamp(22px, 5.5vw, 34px)",
            fontWeight: 800,
            textTransform: "uppercase",
            color: "#ffffff",
            maxWidth: "680px",
            margin: "16px auto 6px",
            lineHeight: 1.2
          }}
        >
          {school?.schoolName || "Welcome"}
        </div>
        {school?.tagline && (
          <div style={{ fontStyle: "italic", fontSize: "15px", color: "rgba(255,255,255,0.92)" }}>{school.tagline}</div>
        )}

        <div
          style={{
            display: "inline-block",
            marginTop: "16px",
            background: "rgba(255,255,255,0.18)",
            padding: "6px 16px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#ffffff"
          }}
        >
          Admissions Open
        </div>

        {school?.description && (
          <p style={{ maxWidth: "560px", margin: "16px auto 0", fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }}>
            {school.description}
          </p>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "22px" }}>
          <button
            onClick={() => setMode("signup")}
            style={{
              background: "white",
              color: theme.colors.primary,
              border: "none",
              borderRadius: theme.radius.md,
              padding: "14px 28px",
              fontWeight: 800,
              fontSize: "15px"
            }}
          >
            Register Now
          </button>
          <button
            onClick={() => setMode("login")}
            style={{
              background: "rgba(255,255,255,0.16)",
              color: "#ffffff",
              border: "1.5px solid rgba(255,255,255,0.6)",
              borderRadius: theme.radius.md,
              padding: "14px 28px",
              fontWeight: 800,
              fontSize: "15px"
            }}
          >
            Log In
          </button>
        </div>
      </div>

      {heroPhoto && (
        <div style={{ maxWidth: "720px", margin: "-64px auto 0", padding: "0 16px" }}>
          <img
            src={heroPhoto}
            alt=""
            style={{
              width: "100%",
              height: "clamp(180px, 40vw, 280px)",
              objectFit: "cover",
              borderRadius: theme.radius.lg,
              boxShadow: "0 12px 28px rgba(30,27,46,0.25)",
              display: "block"
            }}
          />
        </div>
      )}

      <div style={{ maxWidth: "720px", margin: "26px auto 0", padding: "0 16px", display: "flex", gap: "10px" }}>
        {[
          [subjectCount || "-", "Subjects"],
          ["Growing", "Community"],
          ["Dedicated", "Teachers"]
        ].map(([value, label]) => (
          <div key={label} style={{ ...card, flex: 1, textAlign: "center", padding: "16px 6px" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: theme.colors.primary }}>{value}</div>
            <div style={{ fontSize: "12px", color: theme.colors.textMuted, marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </div>

      <Section title="Why Choose Us" subtitle="Everything your family needs, in one simple app.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{ ...card, padding: "20px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: f.tone.bg,
                    color: f.tone.fg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Icon size={24} />
                </div>
                <div style={{ fontWeight: 800, fontSize: "16px", color: theme.colors.text, margin: "14px 0 6px" }}>{f.title}</div>
                <div style={{ fontSize: "14px", color: theme.colors.textMuted, lineHeight: 1.6 }}>{f.text}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {photos.length > 1 && (
        <Section title="Life at School" subtitle="A look at what happens here.">
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
            {photos.map((p) => (
              <div key={p.id} style={{ flexShrink: 0, width: "190px" }}>
                <img
                  src={p.imageURL}
                  alt={p.caption || ""}
                  style={{ width: "190px", height: "135px", objectFit: "cover", borderRadius: theme.radius.md, boxShadow: theme.shadow, display: "block" }}
                />
                {p.caption && <div style={{ fontSize: "12px", color: theme.colors.textMuted, marginTop: "6px" }}>{p.caption}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {activities.length > 0 && (
        <Section title="Latest Activities" subtitle="Sports, awards and events from our school community.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "14px" }}>
            {activities.map((a) => {
              const color = ACTIVITY_COLORS[a.category] || "#64748b";
              return (
                <div key={a.id} style={{ ...card, overflow: "hidden" }}>
                  {a.photoURL && (
                    <img src={a.photoURL} alt="" style={{ width: "100%", height: "150px", objectFit: "cover", display: "block" }} />
                  )}
                  <div style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        background: `${color}22`,
                        color,
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "999px"
                      }}
                    >
                      {a.category}
                    </span>
                    <div style={{ fontWeight: 800, fontSize: "16px", color: theme.colors.text, margin: "10px 0 4px" }}>{a.title}</div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: theme.colors.textMuted,
                        lineHeight: 1.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {a.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {staff.length > 0 && (
        <Section title="Meet Our Team" subtitle="The people dedicated to your child's growth.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px" }}>
            {staff.map((s) => (
              <div key={s.id} style={{ ...card, padding: "20px 12px", textAlign: "center" }}>
                {s.photoURL ? (
                  <img
                    src={s.photoURL}
                    alt=""
                    style={{ width: "76px", height: "76px", borderRadius: "50%", objectFit: "cover", margin: "0 auto", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "76px",
                      height: "76px",
                      borderRadius: "50%",
                      background: "#eef0ff",
                      color: theme.colors.primary,
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Briefcase size={28} />
                  </div>
                )}
                <div style={{ fontWeight: 800, fontSize: "14px", color: theme.colors.text, marginTop: "12px" }}>{s.name}</div>
                <div style={{ fontSize: "12px", color: theme.colors.primary, fontWeight: 600, marginTop: "2px" }}>{s.title}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="How to Join Us" subtitle="Getting your child enrolled is simple and quick.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} style={{ ...card, padding: "20px", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "16px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: theme.colors.primary,
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#eef0ff",
                    color: theme.colors.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Icon size={24} />
                </div>
                <div style={{ fontWeight: 800, fontSize: "16px", color: theme.colors.text, margin: "14px 0 6px" }}>{s.title}</div>
                <div style={{ fontSize: "14px", color: theme.colors.textMuted, lineHeight: 1.6 }}>{s.text}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {testimonials.length > 0 && (
        <Section title="What Our Families Say" subtitle="Real experiences from our school community.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
            {testimonials.map((t) => (
              <div key={t.id} style={{ ...card, padding: "20px" }}>
                <div style={{ color: "#d4a017", fontSize: "17px", letterSpacing: "2px" }}>★★★★★</div>
                <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7, fontStyle: "italic", margin: "10px 0 16px" }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: theme.colors.primary,
                      color: "#ffffff",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {(t.name || "?").charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: theme.colors.text }}>{t.name}</div>
                    <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {faqs.length > 0 && (
        <Section title="Frequently Asked Questions" subtitle="Everything you might want to know before registering.">
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.id} style={{ ...card, marginBottom: "10px", overflow: "hidden" }}>
                  <div
                    onClick={() => setOpenFaq(open ? null : i)}
                    style={{
                      padding: "16px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: theme.colors.text
                    }}
                  >
                    <span>{f.question}</span>
                    {open ? <ChevronUp size={18} color={theme.colors.primary} /> : <ChevronDown size={18} color={theme.colors.textMuted} />}
                  </div>
                  {open && (
                    <div style={{ padding: "0 16px 16px", fontSize: "14px", color: theme.colors.textMuted, lineHeight: 1.7 }}>
                      {f.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <div style={{ padding: "50px 16px 0" }}>
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            background: theme.gradient("#4338ca", "#7c3aed"),
            borderRadius: theme.radius.lg,
            padding: "34px 22px",
            textAlign: "center",
            boxShadow: "0 12px 28px rgba(67,56,202,0.35)"
          }}
        >
          <div role="heading" aria-level={2} style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff" }}>
            Ready to Join Our School Community?
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.9)", margin: "10px 0 20px" }}>
            Registration takes less than five minutes, for students, parents and teachers alike.
          </p>
          <button
            onClick={() => setMode("signup")}
            style={{
              background: "white",
              color: theme.colors.primary,
              border: "none",
              borderRadius: theme.radius.md,
              padding: "14px 32px",
              fontWeight: 800,
              fontSize: "15px"
            }}
          >
            Register Now
          </button>
        </div>
      </div>

      {hasContact && (
        <Section title="Get in Touch" subtitle="We would love to hear from you.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            {contact.address && (
              <ContactRow icon={MapPin} tone={{ bg: "#fee2e2", fg: "#dc2626" }}>
                {contact.address}
                <div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: theme.colors.primary, fontWeight: 700, fontSize: "13px", textDecoration: "none" }}
                  >
                    Open in Maps
                  </a>
                </div>
              </ContactRow>
            )}
            {(contact.phone1 || contact.phone2) && (
              <ContactRow icon={Phone} tone={{ bg: "#dcfce7", fg: "#16a34a" }}>
                {[contact.phone1, contact.phone2].filter(Boolean).map((p) => (
                  <div key={p}>
                    <a href={`tel:${digits(p)}`} style={{ color: theme.colors.primary, fontWeight: 700, textDecoration: "none" }}>{p}</a>
                  </div>
                ))}
              </ContactRow>
            )}
            {contact.email && (
              <ContactRow icon={Mail} tone={{ bg: "#e0f2fe", fg: "#0284c7" }}>
                <a href={`mailto:${contact.email}`} style={{ color: theme.colors.primary, fontWeight: 700, textDecoration: "none" }}>
                  {contact.email}
                </a>
              </ContactRow>
            )}
            {contact.officeHours && (
              <ContactRow icon={Clock} tone={{ bg: "#fef3c7", fg: "#d97706" }}>
                {contact.officeHours}
              </ContactRow>
            )}
          </div>
        </Section>
      )}

      <div
        style={{
          marginTop: "54px",
          background: "#1e1b4b",
          color: "rgba(255,255,255,0.75)",
          textAlign: "center",
          padding: "22px 16px",
          fontSize: "12px"
        }}
      >
        <div style={{ fontWeight: 700, color: "#ffffff", marginBottom: "4px", textTransform: "uppercase" }}>
          {school?.schoolName || ""}
        </div>
        Developed by EPIC TRIBE RESOURCES INT.
      </div>

      <PublicChatWidget />
    </div>
  );
}