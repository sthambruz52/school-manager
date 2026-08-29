import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, collection, query, where, orderBy, limit, onSnapshot as onSnap } from "firebase/firestore";
import { GraduationCap, Users, BookOpen, ShieldCheck, Heart, Award, MapPin, Phone, Mail, Clock, ArrowRight, Trophy, Briefcase, UserPlus, FileEdit, ClipboardCheck, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import Login from "./Login";
import PublicChatWidget from "./PublicChatWidget";
export default function LandingPage() {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [heroPhotos, setHeroPhotos] = useState([]);
  const [latestActivities, setLatestActivities] = useState([]);
  const [staffPreview, setStaffPreview] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [subjectCount, setSubjectCount] = useState(0);
  const [mode, setMode] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "schoolInfo"), (docSnap) => {
      if (docSnap.exists()) setSchoolInfo(docSnap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contactInfo"), (docSnap) => {
      if (docSnap.exists()) setContactInfo(docSnap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"), limit(5));
    const unsub = onSnap(q, (snap) => setHeroPhotos(snap.docs.map((d) => d.data().imageURL)));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"), limit(3));
    const unsub = onSnap(q, (snap) => setLatestActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);
  useEffect(() => {
    const q = query(collection(db, "staff"), orderBy("createdAt", "desc"), limit(4));
    const unsub = onSnap(q, (snap) => setStaffPreview(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);
  useEffect(() => {
    const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"), limit(6));
    const unsub = onSnap(q, (snap) => setTestimonials(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "faqs"), orderBy("createdAt", "asc"));
    const unsub = onSnap(q, (snap) => setFaqs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnap(collection(db, "subjects"), (snap) => setSubjectCount(snap.size));
    return () => unsub();
  }, []);

  if (mode) {
    return (
      <div style={{ background: "#fdf6e9", minHeight: "100vh" }}>
        <div style={{ maxWidth: "420px", margin: "0 auto", padding: "20px" }}>
          <p onClick={() => setMode(null)} style={{ color: "#1f4d3a", cursor: "pointer", fontWeight: "bold", marginBottom: "0" }}>
            ← Back
          </p>
          <Login onLoginSuccess={() => {}} initialMode={mode} />
        </div>
      </div>
    );
  }

  const heroImage = heroPhotos[0];
  const schoolName = schoolInfo?.schoolName || "Our School";

  const FEATURES = [
    { icon: GraduationCap, title: "Quality Education", text: "A curriculum built to challenge, inspire, and prepare every child for what's next." },
    { icon: Heart, title: "Dedicated Teachers", text: "Experienced educators who know each child by name, not just by number." },
    { icon: ShieldCheck, title: "Safe Environment", text: "A secure, nurturing campus where every child is free to learn and grow." },
    { icon: Award, title: "Holistic Development", text: "Academics, sports, arts, and character — we build the whole child." },
  ];

  const sectionTitleStyle = { textAlign: "center", color: "#1f4d3a", fontSize: "24px", marginBottom: "8px" };
  const sectionSubStyle = { textAlign: "center", color: "#888", fontSize: "14px", marginBottom: "30px" };

  return (
    <div style={{ background: "#fdf6e9", minHeight: "100vh", fontFamily: "Arial" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "white", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
        <span style={{ fontWeight: "bold", color: "#1f4d3a", fontSize: "17px" }}>{schoolName}</span>
        <button onClick={() => setMode("login")} style={{ background: "#1f4d3a", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
          Login
        </button>
      </div>

      <div style={{
        position: "relative",
        minHeight: "520px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "white",
        padding: "50px 20px",
        backgroundImage: heroImage
          ? `linear-gradient(rgba(31,77,58,0.78), rgba(31,77,58,0.9)), url(${heroImage})`
          : "linear-gradient(135deg, #1f4d3a, #2e6b4f)",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}>
        <div style={{ maxWidth: "560px" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", marginBottom: "18px" }}>
            🎓 Admissions Open — Enroll Today
          </div>
          <h1 style={{
            fontSize: "clamp(26px, 6vw, 42px)",
            margin: "0 0 14px",
            lineHeight: "1.25",
            color: "#ffffff",
            fontWeight: "800",
            letterSpacing: "0.5px",
            textShadow: "0 2px 10px rgba(0,0,0,0.35)"
          }}>
            {schoolName}
          </h1>
          <p style={{
            fontSize: "16px",
            color: "#f2d98a",
            margin: "0 0 8px",
            fontStyle: "italic",
            fontWeight: "600",
            letterSpacing: "0.3px"
          }}>
            {schoolInfo?.tagline || "Nurturing minds, shaping futures"}
          </p>
          <p style={{ fontSize: "15px", lineHeight: "1.7", opacity: 0.9, margin: "0 0 30px" }}>
            {schoolInfo?.description || "We're committed to giving every child the foundation, confidence, and character they need to thrive — in the classroom and beyond."}
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setMode("signup")}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", color: "#1f4d3a", border: "none", padding: "13px 28px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }}
            >
              Register Now <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setMode("login")}
              style={{ background: "transparent", color: "white", border: "2px solid white", padding: "13px 28px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }}
            >
              Login
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "26px 20px", display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1f4d3a" }}>{subjectCount}+</div>
          <div style={{ fontSize: "13px", color: "#666" }}>Subjects Offered</div>
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1f4d3a" }}>Growing</div>
          <div style={{ fontSize: "13px", color: "#666" }}>Student Community</div>
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1f4d3a" }}>Dedicated</div>
          <div style={{ fontSize: "13px", color: "#666" }}>Teaching Staff</div>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "20px auto 0", padding: "20px" }}>
        <h2 style={sectionTitleStyle}>Why Families Choose Us</h2>
        <p style={sectionSubStyle}>Everything your child needs to succeed, in one place.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{ background: "white", borderRadius: "12px", padding: "22px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "#1f4d3a" }}>
                  <Icon size={32} />
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#666", lineHeight: "1.5" }}>{f.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {heroPhotos.length > 1 && (
        <div style={{ maxWidth: "900px", margin: "50px auto 0", padding: "0 20px" }}>
          <h2 style={sectionTitleStyle}>Life at {schoolName}</h2>
          <p style={sectionSubStyle}>A glimpse into our everyday moments.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
            {heroPhotos.slice(1).map((url, i) => (
              <img key={i} src={url} alt="" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "10px" }} />
            ))}
          </div>
        </div>
      )}

      {latestActivities.length > 0 && (
        <div style={{ maxWidth: "900px", margin: "50px auto 0", padding: "0 20px" }}>
          <h2 style={sectionTitleStyle}>Latest Happenings</h2>
          <p style={sectionSubStyle}>Sports, awards, and everything in between.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {latestActivities.map((a) => (
              <div key={a.id} style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                {a.photoURL && <img src={a.photoURL} alt="" style={{ width: "100%", height: "130px", objectFit: "cover" }} />}
                <div style={{ padding: "14px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#1f4d3a", color: "white", fontSize: "11px", fontWeight: "bold", padding: "2px 10px", borderRadius: "10px" }}>
                    <Trophy size={12} /> {a.category}
                  </span>
                  <h4 style={{ margin: "8px 0 4px", fontSize: "15px" }}>{a.title}</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>{a.description?.slice(0, 90)}{a.description?.length > 90 ? "…" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
            {staffPreview.length > 0 && (
        <div style={{ maxWidth: "900px", margin: "50px auto 0", padding: "0 20px" }}>
          <h2 style={sectionTitleStyle}>Meet Our Team</h2>
          <p style={sectionSubStyle}>The people dedicated to your child's growth.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
            {staffPreview.map((s) => (
              <div key={s.id} style={{ background: "white", borderRadius: "12px", padding: "18px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                {s.photoURL ? (
                  <img src={s.photoURL} alt="" style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px" }} />
                ) : (
                  <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#fdf6e9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "#1f4d3a" }}>
                    <Briefcase size={26} />
                  </div>
                )}
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{s.name}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{s.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {testimonials.length > 0 && (
      <div style={{ maxWidth: "900px", margin: "50px auto 0", padding: "0 20px" }}>
        <h2 style={sectionTitleStyle}>What Our Families Say</h2>
        <p style={sectionSubStyle}>Real experiences from our school community.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {testimonials.map((t) => (
            <div key={t.id} style={{ background: "white", borderRadius: "12px", padding: "22px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ color: "#d4a017", fontSize: "18px", marginBottom: "10px" }}>★★★★★</div>
              <p style={{ fontSize: "14px", color: "#444", lineHeight: "1.6", fontStyle: "italic", margin: "0 0 14px" }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  background: "#1f4d3a", color: "white", fontWeight: "bold", fontSize: "15px",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "14px", color: "#1f4d3a" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      <div style={{ maxWidth: "900px", margin: "50px auto 0", padding: "0 20px" }}>
        <h2 style={sectionTitleStyle}>How to Join Us</h2>
        <p style={sectionSubStyle}>Getting your child enrolled is simple and quick.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {[
            { icon: UserPlus, step: "1", title: "Register", text: "Create an account as a Student or Parent in just a few minutes." },
            { icon: FileEdit, step: "2", title: "Complete Profile", text: "Fill in class, subjects, and family details for your records." },
            { icon: ClipboardCheck, step: "3", title: "Get Confirmed", text: "Our admin team reviews and confirms your enrollment." },
            { icon: Rocket, step: "4", title: "Start Learning", text: "Access grades, attendance, fees, and more, right away." },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} style={{ background: "white", borderRadius: "12px", padding: "22px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", position: "relative" }}>
                <div style={{ position: "absolute", top: "12px", right: "16px", fontSize: "13px", fontWeight: "bold", color: "#d4a017" }}>
                  {s.step}
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "#1f4d3a" }}>
                  <Icon size={30} />
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "15px" }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#666", lineHeight: "1.5" }}>{s.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {faqs.length > 0 && (
      <div style={{ maxWidth: "700px", margin: "50px auto 0", padding: "0 20px" }}>
        <h2 style={sectionTitleStyle}>Frequently Asked Questions</h2>
        <p style={sectionSubStyle}>Everything you might want to know before registering.</p>
        {faqs.map((item, i) => (
          <div key={item.id} style={{ background: "white", borderRadius: "10px", marginBottom: "10px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ padding: "16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", color: "#1f4d3a", fontSize: "14px" }}
            >
              {item.question}
              {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            {openFaq === i && (
              <div style={{ padding: "0 16px 16px", fontSize: "13px", color: "#666", lineHeight: "1.6" }}>
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
      )}
      <div style={{ background: "#1f4d3a", color: "white", marginTop: "50px", padding: "40px 20px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>Ready to Join Our School Community?</h2>
          <p style={{ opacity: 0.9, marginBottom: "20px", fontSize: "14px" }}>
            Registration takes less than five minutes — for students, parents, and teachers alike.
          </p>
          <button
            onClick={() => setMode("signup")}
            style={{ background: "white", color: "#1f4d3a", border: "none", padding: "13px 30px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }}
          >
            Register Now
          </button>
        </div>
      </div>

      {contactInfo && (contactInfo.address || contactInfo.phone1 || contactInfo.email) && (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "36px 20px", display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "center" }}>
          {contactInfo.address && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", maxWidth: "220px" }}>
              <MapPin size={18} color="#1f4d3a" />
              <span style={{ fontSize: "13px", color: "#444" }}>{contactInfo.address}</span>
            </div>
          )}
          {contactInfo.phone1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Phone size={18} color="#1f4d3a" />
              <span style={{ fontSize: "13px", color: "#444" }}>{contactInfo.phone1}</span>
            </div>
          )}
          {contactInfo.email && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} color="#1f4d3a" />
              <span style={{ fontSize: "13px", color: "#444" }}>{contactInfo.email}</span>
            </div>
          )}
          {contactInfo.officeHours && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#1f4d3a" />
              <span style={{ fontSize: "13px", color: "#444" }}>{contactInfo.officeHours}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: "12px", borderTop: "1px solid #eee" }}>
        Developed by EPIC TRIBE RESOURCES INT.
      </div>

      <PublicChatWidget />
    </div>
  );
}