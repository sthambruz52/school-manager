import { theme } from "../theme";
import { ROLE_COLORS } from "../utils/generateIDCard";
import Header from "./ui/Header";
import Card from "./ui/Card";
import IDCardView from "./ui/IDCardView";

export default function TeacherIDCard({ userData, teacherUid, teacherEmail }) {
  const year = userData.createdAt?.toDate ? userData.createdAt.toDate().getFullYear() : new Date().getFullYear();
  const staffId = userData.staffId || `STF-${year}-${teacherUid.slice(0, 6).toUpperCase()}`;
  const address = [userData.address?.street, userData.address?.lga, userData.address?.city, userData.address?.state, userData.address?.country]
    .filter(Boolean)
    .join(", ");

  const options = {
    name: userData.fullName,
    photoURL: userData.photoURL,
    idNumber: staffId,
    roleLabel: "Teacher",
    dateOfBirth: userData.dateOfBirth,
    email: teacherEmail,
    accentColor: ROLE_COLORS.Teacher,
    lines: [
      { label: "Phone:", value: userData.phone },
      { label: "Subjects Taught:", value: (userData.subjects || []).join(", ") },
      { label: "Address:", value: address }
    ]
  };

  const missing = !userData.dateOfBirth || !userData.photoURL;

  return (
    <div style={{ maxWidth: "700px", margin: "10px auto 0", padding: "0 16px 24px" }}>
      <Header title="My ID Card" subtitle="Front and back, ready to download" />
      <Card style={{ marginTop: "14px", padding: "20px 12px" }}>
        <IDCardView options={options} fileBase="id-card" />
      </Card>
      {missing && (
        <p style={{ fontSize: "13px", color: theme.colors.textMuted, textAlign: "center" }}>
          Some details are missing. Open My Profile from the menu to add your photo and date of birth.
        </p>
      )}
    </div>
  );
}