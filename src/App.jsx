import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Fees from "./components/Fees";
import Subjects from "./components/Subjects";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import StudentProfile from "./components/StudentProfile";
import TeacherProfile from "./components/TeacherProfile";
import ParentProfile from "./components/ParentProfile";
import ClassTeachers from "./components/ClassTeachers";
import Grades from "./components/Grades";
import StudentDashboard from "./components/StudentDashboard";
import ParentDashboard from "./components/ParentDashboard";
import SideMenu from "./components/SideMenu";
import StaffDirectory from "./components/StaffDirectory";
import Gallery from "./components/Gallery";
import AdminStudents from "./components/AdminStudents";
import Activities from "./components/Activities";
import Home from "./components/Home";
import SchoolInfo from "./components/SchoolInfo";
import ReportCard from "./components/ReportCard";
import NoticeBoard from "./components/NoticeBoard";
import ContactUs from "./components/ContactUs";
import MySubjects from "./components/MySubjects";
import Classes from "./components/Classes";
import PeriodicTest from "./components/PeriodicTest";
import Assignments from "./components/Assignments";
import SupportChat from "./components/SupportChat";
import AccountSettings from "./components/AccountSettings";
import TestimonialsAdmin from "./components/TestimonialsAdmin";
import FAQAdmin from "./components/FAQAdmin";
function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
    const [openRollCallClass, setOpenRollCallClass] = useState(null);
      const [rollCallDate, setRollCallDate] = useState(new Date().toISOString().split("T")[0]);
  const [pastAttendance, setPastAttendance] = useState({});
  const [activeView, setActiveView] = useState("");
  const [chatAlertShown, setChatAlertShown] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserRole("");
        setUserData(null);
        setAuthChecked(true);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserRole(data.role);
        setUserData(data);
        setAuthChecked(true);
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().fullName,
          classLevel: d.data().classLevel,
          session: d.data().session,
          term: d.data().term,
          present: d.data().present || false
        }))
      );
    });
    return () => unsub();
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "settings", "schoolInfo"), (docSnap) => {
      if (docSnap.exists()) setSchoolInfo(docSnap.data());
    });
    return () => unsub();
  }, [user]);
  useEffect(() => {
    if (!userRole) return;
    if (!activeView) {
      setActiveView("home");
    }
  }, [userRole, activeView]);
    const today = new Date().toISOString().split("T")[0];
  const isViewingToday = rollCallDate === today;

  useEffect(() => {
    if (!user || isViewingToday) return;
    const q = query(collection(db, "attendance"), where("date", "==", rollCallDate));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => { map[d.data().studentId] = d.data().status; });
      setPastAttendance(map);
    });
    return () => unsub();
  }, [user, rollCallDate, isViewingToday]);
  useEffect(() => {
    if (!user || userRole === "Admin") return;
    const unsub = onSnapshot(doc(db, "supportChats", user.uid), (docSnap) => {
      const unread = docSnap.exists() && docSnap.data().unreadByUser === true;
      if (unread && !chatAlertShown && activeView !== "supportchat") {
        setChatAlertShown(true);
        if (Notification.permission === "granted" && userData?.notificationsEnabled !== false) {
          new Notification("New message from Admin", { body: docSnap.data().lastMessage || "" });
        }
      }
      if (!unread) setChatAlertShown(false);
    });
    return () => unsub();
  }, [user, userRole, activeView, chatAlertShown, userData]);

  useEffect(() => {
    if (!user || userRole !== "Admin") return;
    const unsub = onSnapshot(collection(db, "supportChats"), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const data = change.doc.data();
          if (data.unreadByAdmin && activeView !== "supportchat" && Notification.permission === "granted" && userData?.notificationsEnabled !== false) {
            new Notification(`New message from ${data.userName || "a user"}`, { body: data.lastMessage || "" });
          }
        }
      });
    });
    return () => unsub();
  }, [user, userRole, activeView, userData]);

  useEffect(() => {
    if (user && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);
  const togglePresent = async (student) => {
    const newPresent = !student.present;
    await updateDoc(doc(db, "users", student.id), { present: newPresent });

    const today = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "attendance", `${student.id}_${today}`), {
      studentId: student.id,
      date: today,
      status: newPresent ? "Present" : "Absent",
      classLevel: student.classLevel || "",
      session: student.session || "",
      term: student.term || ""
    }, { merge: true });
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const presentCount = students.filter((s) => s.present).length;

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: '4px solid #e5e0d0', borderTopColor: '#1f4d3a',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#1f4d3a', fontWeight: 'bold', margin: 0 }}>Loading...</p>
      </div>
    );
  }

    if (!user) {
    return <LandingPage />;
  }

  if (userData?.status === "disabled") {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>Account Disabled</h2>
        <p>Your account has been disabled by the school administrator.<br />Please contact the school for assistance.</p>
        <button onClick={handleLogout} style={{ background: '#c2704e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', marginTop: '10px' }}>Logout</button>
      </div>
    );
  }

  if (userRole === "Student" && userData && !userData.profileComplete) {
    return <StudentProfile onComplete={() => {}} />;
  }

  if (userRole === "Student" && editingProfile) {
    return <StudentProfile existingData={userData} onComplete={() => setEditingProfile(false)} />;
  }

  if (userRole === "Teacher" && userData && !userData.profileComplete) {
    return <TeacherProfile onComplete={() => {}} />;
  }

  if (userRole === "Teacher" && editingProfile) {
    return <TeacherProfile existingData={userData} onComplete={() => setEditingProfile(false)} />;
  }

  if (userRole === "Parent" && userData && !userData.profileComplete) {
    return <ParentProfile onComplete={() => {}} />;
  }

  if (userRole === "Parent" && editingProfile) {
    return <ParentProfile existingData={userData} onComplete={() => setEditingProfile(false)} />;
  }

  const hasProfile = userRole === "Student" || userRole === "Teacher" || userRole === "Parent";

  return (
    <div style={{ background: '#fdf6e9', minHeight: '100vh', fontFamily: 'Arial' }}>
      <SideMenu
        role={userRole}
        activeView={activeView}
        setActiveView={setActiveView}
        userData={userData}
        userEmail={user.email}
        hasProfile={hasProfile}
        onProfile={() => setEditingProfile(true)}
        onLogout={handleLogout}
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
      />

      <div style={{ background: '#1f4d3a', color: 'white', padding: '16px 20px', display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center' }}>
        <button
          onClick={() => setMenuOpen(true)}
          style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', justifySelf: 'start' }}
        >
          ☰
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(15px, 4vw, 20px)',
            fontWeight: '800',
            letterSpacing: '0.4px',
            color: '#ffffff',
            textShadow: '0 1px 6px rgba(0,0,0,0.25)'
          }}>
            {schoolInfo?.schoolName || "School Management System"}
          </h1>
          {schoolInfo?.tagline && (
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#f2d98a', fontStyle: 'italic', fontWeight: '600' }}>
              {schoolInfo.tagline}
            </p>
          )}
        </div>
        <div></div>
      </div>

      {activeView === "home" && (
        <Home role={userRole} userData={userData} userEmail={user.email} setActiveView={setActiveView} />
      )}
            {activeView !== "home" && (
        <div style={{ maxWidth: '700px', margin: '16px auto 0', padding: '0 20px' }}>
          <span
            onClick={() => setActiveView("home")}
            style={{ color: '#1f4d3a', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
          >
            ← Back to Home
          </span>
        </div>
      )}
            {activeView === "supportchat" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          <SupportChat isAdmin={userRole === "Admin"} userName={userData?.fullName || user.email} userRole={userRole} />
        </div>
      )}
            {activeView === "accountsettings" && (
        <AccountSettings userData={userData} />
      )}
      {activeView === "classes" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          <Classes isAdmin={userRole === "Admin"} />
        </div>
      )}
      {userRole === "Student" && userData && activeView === "dashboard" && <StudentDashboard userData={userData} />}
      {userRole === "Parent" && userData && activeView === "dashboard" && <ParentDashboard userData={userData} />}

      {(userRole === "Student" || userRole === "Parent") && activeView === "staff" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          <StaffDirectory isAdmin={false} />
        </div>
      )}
      {(userRole === "Student" || userRole === "Parent") && activeView === "gallery" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          <Gallery isAdmin={false} />
        </div>
      )}
            {userRole === "Student" && userData && activeView === "assignments" && (
        <Assignments studentView={{ studentId: user.uid, classLevel: userData.classLevel }} />
      )}
            {userRole === "Student" && userData && activeView === "reportcard" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          <ReportCard isAdmin={false} fixedStudentId={user.uid} fixedStudentName={userData.fullName} />
        </div>
      )}
            {userRole === "Student" && userData && activeView === "mysubjects" && (
        <MySubjects userData={userData} />
      )}
            {userRole === "Parent" && userData && activeView === "reportcard" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          {(userData.children || []).length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>No ward linked yet.</p>
          ) : (
            userData.children.map((child) => (
              <div key={child.uid} style={{ marginBottom: '20px' }}>
                <ReportCard isAdmin={false} fixedStudentId={child.uid} fixedStudentName={child.name} />
              </div>
            ))
          )}
        </div>
      )}
            {userRole === "Parent" && userData && activeView === "assignments" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          {(userData.children || []).length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>No ward linked yet.</p>
          ) : (
            userData.children.map((child) => (
              <div key={child.uid} style={{ marginBottom: '20px' }}>
                <h3 style={{ textAlign: 'center', color: '#1f4d3a' }}>{child.name}</h3>
                <Assignments studentView={{ studentId: child.uid, classLevel: child.classLevel }} />
              </div>
            ))
          )}
        </div>
      )}
            {(userRole === "Student" || userRole === "Parent") && activeView === "noticeboard" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          <NoticeBoard isAdmin={false} />
        </div>
      )}
            {(userRole === "Student" || userRole === "Parent") && activeView === "contactus" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          <ContactUs isAdmin={false} />
        </div>
      )}
      {(userRole === "Student" || userRole === "Parent") && activeView === "activities" && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
          <Activities isAdmin={false} />
        </div>
      )}

      {(userRole === "Admin" || userRole === "Teacher") && activeView !== "home" && (
        <div style={{ maxWidth: '700px', margin: '20px auto', padding: '0 20px' }}>

          {activeView === "rollcall" && (
            <>
              <h2 style={{ textAlign: 'center' }}>Roll Call</h2>

              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <input
                  type="date"
                  value={rollCallDate}
                  max={today}
                  onChange={(e) => setRollCallDate(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px' }}
                />
                {!isViewingToday && (
                  <button
                    onClick={() => setRollCallDate(today)}
                    style={{ marginLeft: '8px', background: '#1f4d3a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    Back to Today
                  </button>
                )}
              </div>

              {isViewingToday ? (
                <p style={{ textAlign: 'center', color: '#666' }}>{presentCount}/{students.length} present today</p>
              ) : (
                <p style={{ textAlign: 'center', color: '#666' }}>
                  Viewing attendance for {rollCallDate} (read-only)
                </p>
              )}

              {[...new Set(students.map(s => s.classLevel).filter(Boolean))].sort().map(cls => {
                const classStudents = students.filter(s => s.classLevel === cls);
                const classPresent = isViewingToday
                  ? classStudents.filter(s => s.present).length
                  : classStudents.filter(s => pastAttendance[s.id] === 'Present').length;
                return (
                  <div key={cls} style={{ background: 'white', borderRadius: '10px', margin: '10px 0', overflow: 'hidden' }}>
                    <div
                      onClick={() => setOpenRollCallClass(openRollCallClass === cls ? null : cls)}
                      style={{ padding: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', color: '#1f4d3a' }}
                    >
                      <span>{cls}</span>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: 'normal' }}>{classPresent}/{classStudents.length} present</span>
                    </div>
                    {openRollCallClass === cls && (
                      <div style={{ borderTop: '1px solid #eee' }}>
                        {classStudents.map(s => (
                          <div key={s.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f4f0e6', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span style={{ flex: '1 1 100px' }}>{s.name}</span>
                            {isViewingToday ? (
                              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                <button onClick={() => togglePresent(s)} style={{ background: s.present ? '#1f4d3a' : 'white', color: s.present ? 'white' : 'black', padding: '4px 10px', borderRadius: '12px' }}>Present</button>
                                <button onClick={() => togglePresent(s)} style={{ background: !s.present ? '#c2704e' : 'white', color: !s.present ? 'white' : 'black', padding: '4px 10px', borderRadius: '12px' }}>Absent</button>
                              </div>
                            ) : (
                              <span style={{
                                background: pastAttendance[s.id] === 'Present' ? '#1f4d3a' : pastAttendance[s.id] === 'Absent' ? '#c2704e' : '#ccc',
                                color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '13px'
                              }}>
                                {pastAttendance[s.id] || 'No record'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {activeView === "grades" && <Grades />}

          {activeView === "fees" && userRole === "Admin" && <Fees students={students} />}

          {activeView === "subjects" && <Subjects />}

          {activeView === "classteachers" && userRole === "Admin" && <ClassTeachers />}

          {activeView === "adminstudents" && (userRole === "Admin" || userRole === "Teacher") && (
            <AdminStudents isAdmin={userRole === "Admin"} />
          )}

          {activeView === "staff" && <StaffDirectory isAdmin={userRole === "Admin"} />}

          {activeView === "gallery" && <Gallery isAdmin={userRole === "Admin"} />}

          {activeView === "activities" && <Activities isAdmin={userRole === "Admin"} />}
                    
                    {activeView === "noticeboard" && <NoticeBoard isAdmin={userRole === "Admin"} />}
          {activeView === "schoolinfo" && userRole === "Admin" && <SchoolInfo />}
                    {activeView === "testimonialsadmin" && userRole === "Admin" && <TestimonialsAdmin />}
          {activeView === "faqadmin" && userRole === "Admin" && <FAQAdmin />}
                    {activeView === "reportcard" && (userRole === "Admin" || userRole === "Teacher") && (
            <ReportCard isAdmin={true} />
          )}
                    {activeView === "periodictest" && (userRole === "Admin" || userRole === "Teacher") && (
            <PeriodicTest />
          )}

          {activeView === "assignments" && (userRole === "Admin" || userRole === "Teacher") && (
            <Assignments canManage={true} />
          )}
          {activeView === "contactus" && (
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 20px' }}>
              <ContactUs isAdmin={userRole === "Admin"} />
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '11px' }}>
        Developed by EPIC TRIBE RESOURCES INT.
      </div>
    </div>
  );
}
export default App;