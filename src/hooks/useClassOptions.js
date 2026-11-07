import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const DEFAULT_CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS1", "JSS2", "JSS3",
  "SS1", "SS2", "SS3"
];

export function useClassOptions() {
  const [custom, setCustom] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "schoolClasses"),
      (snap) => {
        setCustom(
          snap.docs
            .map((d) => d.data())
            .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
            .map((c) => c.name)
            .filter(Boolean)
        );
      },
      () => {}
    );
    return () => unsub();
  }, []);

  return [...new Set([...DEFAULT_CLASSES, ...custom])];
}