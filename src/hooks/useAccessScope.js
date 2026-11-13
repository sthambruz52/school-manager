import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

// A parent's children are found by email: the student's registration lists a parent email,
// and a parent who signs up and verifies that same email sees those children.
export function useMyChildren(enabled = true) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [unverified, setUnverified] = useState(false);
  const synced = useRef("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!enabled || !user) {
      setLoading(false);
      return;
    }
    if (!user.emailVerified) {
      setUnverified(true);
      setLoading(false);
      return;
    }
    setUnverified(false);

    const q = query(
      collection(db, "users"),
      where("role", "==", "Student"),
      where("parentEmail", "==", String(user.email || "").toLowerCase())
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ uid: d.id, name: d.data().fullName || "", classLevel: d.data().classLevel || "" }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setChildren(list);
        setLoading(false);

        // Keep a copy on the parent's own profile, because some older screens read it.
        const key = JSON.stringify(list);
        if (synced.current !== key) {
          synced.current = key;
          updateDoc(doc(db, "users", user.uid), { children: list }).catch(() => {});
        }
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [enabled]);

  return { children, loading, unverified };
}

// Which classes may this person see? classes === null means all classes (Admin and Management).
export function useAccessScope() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [taught, setTaught] = useState({ byList: [], byId: [] });

  const uid = auth.currentUser?.uid;
  const role = me?.role || "";
  const { children } = useMyChildren(role === "Parent");

  useEffect(() => {
    if (!uid) {
      setReady(true);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        setMe(snap.exists() ? snap.data() : null);
        setReady(true);
      },
      () => setReady(true)
    );
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (role !== "Teacher" || !uid) return;
    const ids = (snap) => snap.docs.map((d) => d.id);
    const u1 = onSnapshot(
      query(collection(db, "classTeachers"), where("teacherIds", "array-contains", uid)),
      (s) => setTaught((p) => ({ ...p, byList: ids(s) })),
      () => {}
    );
    const u2 = onSnapshot(
      query(collection(db, "classTeachers"), where("teacherId", "==", uid)),
      (s) => setTaught((p) => ({ ...p, byId: ids(s) })),
      () => {}
    );
    return () => {
      u1();
      u2();
    };
  }, [role, uid]);

  let classes = [];
  if (role === "Admin" || role === "Management") classes = null;
  else if (role === "Teacher") classes = [...new Set([...taught.byList, ...taught.byId])];
  else if (role === "Student") classes = me?.classLevel ? [me.classLevel] : [];
  else if (role === "Parent") classes = [...new Set(children.map((c) => c.classLevel).filter(Boolean))];

  return { me, role, classes, children, loading: !ready };
}