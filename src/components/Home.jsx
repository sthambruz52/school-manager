import { ChevronRight } from "lucide-react";
import { MENU_GROUPS, ICONS } from "../menuConfig";
import { theme } from "../theme";
import Avatar from "./ui/Avatar";

const SUBTITLES = {
  rollcall: "Mark daily attendance",
  grades: "Enter and track marks",
  periodictest: "Test 1, 2 and 3 scores",
  assignments: "Post and grade assignments",
  subjects: "Manage school subjects",
  classteachers: "Assign teachers to classes",
  classes: "Class lists and roll numbers",
  reportcard: "Termly results and remarks",
  attendanceanalytics: "Attendance rates by class",
  noticeboard: "School announcements",
  contactus: "School address and phone",
  adminstudents: "Students, parents and teachers",
  fees: "Payments, balances and receipts",
  staff: "Teachers and management",
  gallery: "School photos",
  activities: "Sports, awards and events",
  schoolinfo: "School name and introduction",
  testimonialsadmin: "Manage testimonials",
  faqadmin: "Manage FAQs",
  supportchat: "Message the admin office",
  accountsettings: "Password and notifications",
  dashboard: "Grades, fees and attendance",
  mysubjects: "Your subjects and teachers",
  idcard: "View and download your ID card"
};

const FAMILY_SUBTITLES = {
  assignments: "What's due and the scores",
  reportcard: "Termly results"
};

const TILE_COLORS = [
  { bg: "#eef0ff", fg: "#4f46e5" },
  { bg: "#e0f2fe", fg: "#0284c7" },
  { bg: "#f3e8ff", fg: "#9333ea" },
  { bg: "#dcfce7", fg: "#16a34a" },
  { bg: "#fef3c7", fg: "#d97706" },
  { bg: "#fee2e2", fg: "#dc2626" }
];

function profileLine(role, d, email) {
  if (role === "Student") return `Student • ${d.regNumber || "—"}`;
  if (role === "Teacher") return `Teacher • ${d.staffId || "—"}`;
  return `${role} • ${email}`;
}

function statsFor(role, d) {
  if (role === "Student") {
    return [["Class", d.classLevel || "-"], ["Term", d.term || "-"], ["Session", d.session || "-"]];
  }
  if (role === "Teacher") {
    return [
      ["Subjects", (d.subjects || []).length],
      ["Role", "Teacher"],
      ["Staff ID", d.staffId ? d.staffId.split("-").pop() : "-"]
    ];
  }
  if (role === "Parent") {
    return [["Wards", (d.children || []).length], ["Role", "Parent"]];
  }
  return [["Role", role || "-"]];
}

export default function Home({ role, userData, userEmail, setActiveView }) {
  const groups = MENU_GROUPS[role] || [];
  const data = userData || {};
  const name = data.fullName || userEmail;
  const stats = statsFor(role, data);
  const isFamily = role === "Student" || role === "Parent";
  let tileIndex = 0;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px 16px 120px" }}>
      <div style={{ background: "white", borderRadius: theme.radius.lg, boxShadow: theme.shadow, overflow: "hidden" }}>
        <div style={{ height: "96px", background: theme.gradient("#4338ca", "#7c3aed") }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "-60px", padding: "0 16px 18px" }}>
          <div style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.22)", borderRadius: "5px", lineHeight: 0 }}>
            <Avatar name={name} photoURL={data.photoURL} size={116} />
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: theme.colors.text, marginTop: "12px", textAlign: "center" }}>
            {name}
          </div>
          <div style={{ fontSize: "14px", color: theme.colors.textMuted, marginTop: "2px", textAlign: "center" }}>
            {profileLine(role, data, userEmail)}
          </div>
        </div>
        <div style={{ display: "flex", borderTop: `1px solid ${theme.colors.border}` }}>
          {stats.map(([label, value], i) => (
            <div
              key={label}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "14px 6px",
                borderRight: i < stats.length - 1 ? `1px solid ${theme.colors.border}` : "none"
              }}
            >
              <div style={{ fontWeight: "800", fontSize: "16px", color: theme.colors.text }}>{value}</div>
              <div style={{ fontSize: "12px", color: theme.colors.textMuted }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.group}>
          <div style={{
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "1.5px",
            color: "#64748b",
            textTransform: "uppercase",
            margin: "24px 4px 10px"
          }}>
            {g.group}
          </div>
          <div style={{ background: "white", borderRadius: theme.radius.md, boxShadow: theme.shadow, overflow: "hidden" }}>
            {g.items.map((item, i) => {
              const Icon = ICONS[item.key];
              const color = TILE_COLORS[tileIndex++ % TILE_COLORS.length];
              const subtitle = (isFamily && FAMILY_SUBTITLES[item.key]) || SUBTITLES[item.key] || "";
              return (
                <div
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    borderTop: i > 0 ? `1px solid ${theme.colors.border}` : "none"
                  }}
                >
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: color.bg,
                    color: color.fg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {Icon && <Icon size={22} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "700", fontSize: "15px", color: theme.colors.text }}>{item.label}</div>
                    <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>{subtitle}</div>
                  </div>
                  <ChevronRight size={18} color="#9ca3af" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}