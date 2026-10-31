import { useState } from "react";
import LandingPage from "./LandingPage";
import Onboarding from "./Onboarding";

const KEY = "onboardingSeen";

const shouldShowSlides = () => {
  try {
    if (localStorage.getItem(KEY) === "1") return false;
    const phone = window.matchMedia("(max-width: 768px)").matches;
    const installed = window.matchMedia("(display-mode: standalone)").matches;
    return phone || installed;
  } catch {
    return false;
  }
};

export default function PublicHome() {
  const [showSlides, setShowSlides] = useState(shouldShowSlides);

  const finish = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setShowSlides(false);
  };

  if (showSlides) return <Onboarding onDone={finish} />;
  return <LandingPage />;
}