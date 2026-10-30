import { auth } from "../firebase";
import Header from "./ui/Header";
import StudentOverview from "./StudentOverview";

export default function StudentDashboard({ userData }) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  return (
    <div style={{ maxWidth: "700px", margin: "10px auto 0", padding: "0 16px" }}>
      <Header title="My Dashboard" subtitle={`${userData.classLevel || ""} • your term at a glance`} />
      <StudentOverview studentId={uid} showExtras />
    </div>
  );
}