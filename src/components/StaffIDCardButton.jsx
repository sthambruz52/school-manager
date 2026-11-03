import { useState } from "react";
import { CreditCard } from "lucide-react";
import { theme } from "../theme";
import { ROLE_COLORS } from "../utils/generateIDCard";
import Button from "./ui/Button";
import IDCardView from "./ui/IDCardView";

export default function StaffIDCardButton({ staffMember }) {
  const [open, setOpen] = useState(false);

  const year = staffMember.createdAt?.toDate ? staffMember.createdAt.toDate().getFullYear() : new Date().getFullYear();
  const idNumber = staffMember.staffId || `STF-${year}-${String(staffMember.id).slice(0, 6).toUpperCase()}`;

  const options = {
    name: staffMember.name,
    photoURL: staffMember.photoURL,
    idNumber,
    roleLabel: staffMember.title || "Staff",
    dateOfBirth: staffMember.dateOfBirth,
    email: staffMember.email,
    accentColor: ROLE_COLORS.Staff,
    lines: [
      { label: "Title:", value: staffMember.title },
      { label: "Department:", value: staffMember.department },
      { label: "Phone:", value: staffMember.phone }
    ]
  };

  const fileBase = (staffMember.name || "staff").replace(/[^a-z0-9]+/gi, "-");

  return (
    <>
      <Button size="sm" variant="outline" icon={<CreditCard size={14} />} onClick={() => setOpen(true)}>
        ID Card
      </Button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 12, 41, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: theme.radius.lg,
              padding: "20px 16px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto"
            }}
          >
            <div style={{ fontWeight: "800", textAlign: "center", color: theme.colors.text, marginBottom: "14px" }}>
              {staffMember.name}'s ID Card
            </div>
            <IDCardView options={options} fileBase={fileBase} width={190} />
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}