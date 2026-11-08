import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { X } from "lucide-react";
import { theme } from "../theme";

// Template only. A lawyer should review this before the school relies on it.
const UPDATED = "November 2026";

const heading = { fontWeight: "800", fontSize: "16px", color: theme.colors.text, margin: "22px 0 8px" };
const para = { fontSize: "14px", color: "#374151", lineHeight: 1.7, margin: "0 0 8px" };

function List({ items }) {
  return (
    <ul style={{ margin: "0 0 8px", paddingLeft: "20px" }}>
      {items.map((t) => (
        <li key={t} style={{ ...para, margin: "0 0 6px" }}>{t}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicy({ onClose }) {
  const [school, setSchool] = useState(null);
  const [contact, setContact] = useState(null);

  useEffect(() => {
    getDoc(doc(db, "settings", "schoolInfo")).then((s) => { if (s.exists()) setSchool(s.data()); }).catch(() => {});
    getDoc(doc(db, "settings", "contactInfo")).then((s) => { if (s.exists()) setContact(s.data()); }).catch(() => {});
  }, []);

  const name = school?.schoolName || "the school";
  const contactLines = [contact?.address, contact?.phone1, contact?.phone2, contact?.email].filter(Boolean);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: theme.colors.bg, overflowY: "auto" }}>
      <div
        style={{
          background: theme.gradient(theme.colors.primary, theme.colors.primaryDark),
          color: "#ffffff",
          padding: "18px 18px 30px"
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: "22px", color: "#ffffff" }}>Privacy Policy</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)", marginTop: "3px" }}>
              {name} • Last updated {UPDATED}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: "700px",
          margin: "-14px auto 40px",
          background: "white",
          borderRadius: theme.radius.lg,
          boxShadow: theme.shadow,
          padding: "10px 22px 24px"
        }}
      >
        <p style={{ ...para, marginTop: "14px" }}>
          This policy explains what personal information {name} (“the school”, “we”) collects through this app, why we collect it, who can see it, and the choices you have. The school is responsible for the information held in this app.
        </p>

        <div style={heading}>1. Information we collect</div>
        <List
          items={[
            "Account details: email address and role. Passwords are handled by our login provider, and the school cannot see them.",
            "Student details: full name, class, term and session, date of birth, sex, passport photo, home address and subjects.",
            "Parent or guardian details: name, phone number, email, address, and which children they are linked to.",
            "Staff details: name, phone number, date of birth, sex, photo, address and subjects taught.",
            "School records: attendance, assignment and test marks, report card remarks, fee records and receipts.",
            "Messages sent through the support chat.",
            "Basic technical data needed to run and install the app, such as the browser and device type."
          ]}
        />

        <div style={heading}>2. Why we use it</div>
        <List
          items={[
            "To run the school and keep accurate records of attendance, results and report cards.",
            "To communicate with parents, students and staff.",
            "To manage school fees and issue receipts.",
            "To produce ID cards.",
            "To keep the app secure and working.",
            "We do not sell personal information and we do not use it for advertising."
          ]}
        />

        <div style={heading}>3. Who can see it</div>
        <List
          items={[
            "School administrators can see and manage the records in the app.",
            "Teachers can see the class and academic information they need to teach.",
            "Parents can see their own children's records.",
            "Students can see their own records, and the names and photos of classmates.",
            "Management accounts (such as the owner, principal or director) can view records but cannot change them.",
            "Visitors to the public website only see what the school chooses to publish, such as school information, staff, photos, activities, testimonials and common questions.",
            "New accounts may need the administrator's approval before they can see anything."
          ]}
        />

        <div style={heading}>4. Services we use</div>
        <p style={para}>
          The app runs on services provided by other companies: Google Firebase (login and database), Render (website hosting) and Cloudinary (photo storage). They handle information for the school only to provide these services. Their servers may be outside Nigeria.
        </p>

        <div style={heading}>5. Children's information</div>
        <p style={para}>
          This app holds information about children. It is collected through parents, guardians and the school, and used only for schooling. Parents and guardians can ask to see or correct their child's information at any time.
        </p>

        <div style={heading}>6. How long we keep it</div>
        <p style={para}>
          We keep information while a student or staff member is with the school, and afterwards for as long as the school needs it for its records or the law requires. Where it is allowed, information can be deleted on request.
        </p>

        <div style={heading}>7. Keeping it safe</div>
        <p style={para}>
          Accounts are password protected, and what each person sees depends on their role. Information travels over secure connections. No system is perfectly secure, so please keep your password private, log out on shared devices, and tell the school at once if you think your account has been misused.
        </p>

        <div style={heading}>8. Your rights</div>
        <p style={para}>
          You may ask the school to show you the information it holds about you or your child, to correct it, to delete it, or to stop using it in a particular way. Contact the school using the details below. You can also complain to the Nigeria Data Protection Commission.
        </p>

        <div style={heading}>9. Cookies and storage on your device</div>
        <p style={para}>
          The app saves small files on your device to keep you logged in, remember your settings, and load faster when installed. We do not use advertising trackers.
        </p>

        <div style={heading}>10. Changes to this policy</div>
        <p style={para}>If we change this policy, the new version will appear here with a new date.</p>

        <div style={heading}>11. Contact</div>
        <p style={para}>
          {contactLines.length > 0
            ? contactLines.map((line) => (
                <span key={line} style={{ display: "block" }}>{line}</span>
              ))
            : `Please contact ${name} through the school office.`}
        </p>
      </div>
    </div>
  );
}