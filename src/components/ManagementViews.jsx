import SchoolOverview from "./SchoolOverview";
import ReportCard from "./ReportCard";
import AttendanceAnalytics from "./AttendanceAnalytics";
import Fees from "./Fees";
import AdminStudents from "./AdminStudents";
import StaffDirectory from "./StaffDirectory";
import Gallery from "./Gallery";
import Activities from "./Activities";
import NoticeBoard from "./NoticeBoard";
import ContactUs from "./ContactUs";

export default function ManagementViews({ activeView, students }) {
  let content = null;

  if (activeView === "overview") content = <SchoolOverview />;
  else if (activeView === "reportcard") content = <ReportCard isAdmin readOnly />;
  else if (activeView === "attendanceanalytics") content = <AttendanceAnalytics />;
  else if (activeView === "fees") content = <Fees students={students} readOnly />;
  else if (activeView === "adminstudents") content = <AdminStudents isAdmin={false} />;
  else if (activeView === "staff") content = <StaffDirectory isAdmin={false} />;
  else if (activeView === "gallery") content = <Gallery isAdmin={false} />;
  else if (activeView === "activities") content = <Activities isAdmin={false} />;
  else if (activeView === "noticeboard") content = <NoticeBoard isAdmin={false} />;
  else if (activeView === "contactus") content = <ContactUs isAdmin={false} />;

  if (!content) return null;

  return <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 16px 20px" }}>{content}</div>;
}