import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Onboarding, OnboardingData } from "@/component/d3/Onboarding";
import { D3Provider } from "@/component/d3/D3Content";
import { AppShell } from "@/component/d3/AppShell";
import { DashboardPage } from "@/component/d3/pages/DashboardPage";
import { ActivitiesPage } from "@/component/d3/pages/ActivitiesPage";
import { ProfilePage } from "@/component/d3/pages/ProfilePage";
import { AnalyticsPage } from "@/component/d3/pages/AnalyticsPage";
import { BlockingPage } from "@/component/d3/pages/BlockingPage";
import { ReflectionPage } from "@/component/d3/pages/ReflectionPage";
import { FocusSessionPage } from "@/component/d3/pages/FocusSessionPage";
import { QuickResetPage } from "@/component/d3/pages/QuickResetPage";
import { Intervention } from "@/component/d3/Intervention";
import { api } from "@/lib/api";

const defaultOnboardingData: OnboardingData = {
  name: "",
  email: "",
  password: "",
  ageGroup: "",
  screenTime: "",
  sleep: "",
  scrollTime: "",
  scrollReason: "",
  feeling: "",
  apps: [],
  customApp: "",
  mode: "",
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
};

const DISTRACTING_ROUTES = new Set(["/dashboard", "/activities", "/analytics", "/blocking", "/reflection"]);

const InnerApp = () => {
  const [intervene, setIntervene] = useState(false);
  const [todayScreenMinutes, setTodayScreenMinutes] = useState(0);
  const interactionCountRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;
  const token = localStorage.getItem("token");
  const isDistractingRoute = DISTRACTING_ROUTES.has(path);

  useEffect(() => {
    if (!token) return;

    const loadTodayScreenTime = async () => {
      try {
        const response = await api.get<{ entries: Array<{ date: string; totalMinutes: number }> }>("/screen-time");
        const todayKey = new Date().toISOString().slice(0, 10);
        const todayEntry = response.entries.find((entry) => new Date(entry.date).toISOString().slice(0, 10) === todayKey);
        setTodayScreenMinutes(todayEntry?.totalMinutes || 0);
      } catch (error) {
        console.error("Failed to load screen time history:", error);
      }
    };

    void loadTodayScreenTime();
  }, [token]);

  useEffect(() => {
    if (!token || !isDistractingRoute) return;

    const intervalId = setInterval(() => {
      setTodayScreenMinutes((prev) => {
        const next = prev + 1;
        void api
          .post("/screen-time", {
            date: new Date().toISOString(),
            totalMinutes: next,
            entertainmentMinutes: next,
            notes: "Auto-logged from frontend activity tracker",
          })
          .catch((error) => {
            console.error("Failed to auto-log screen time:", error);
          });
        return next;
      });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [token, isDistractingRoute]);

  useEffect(() => {
    if (!token) return;
    if (path === "/focus") {
      interactionCountRef.current = 0;
      return;
    }
    if (!isDistractingRoute) return;

    const handleInteraction = () => {
      interactionCountRef.current += 1;
      if (interactionCountRef.current >= 35 && !intervene) {
        setIntervene(true);
        interactionCountRef.current = 0;
      }
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("scroll", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction, { passive: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [token, path, intervene, isDistractingRoute]);

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/blocking" element={<BlockingPage />} />
        <Route path="/reflection" element={<ProtectedRoute><ReflectionPage /></ProtectedRoute>} />
        <Route path="/focus" element={<ProtectedRoute><FocusSessionPage /></ProtectedRoute>} />
        <Route path="/reset" element={<QuickResetPage />} />
      </Routes>

      {intervene && (
        <Intervention
          onClose={() => setIntervene(false)}
          onBreak={() => { setIntervene(false); navigate("/reset"); }}
          onExit={() => { setIntervene(false); navigate("/focus"); }}
        />
      )}
    </AppShell>
  );
};

const Index = () => {
  const [data, setData] = useState<OnboardingData | null>(() => {
    const cached = localStorage.getItem("d3.onboarding.v1");
    if (!cached) return null;
    try {
      return { ...defaultOnboardingData, ...JSON.parse(cached) };
    } catch {
      return null;
    }
  });

  const handleComplete = (d: OnboardingData) => {
    localStorage.setItem("d3.onboarding.v1", JSON.stringify(d));
    setData(d);
  };

  useEffect(() => {
    if (data) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const bootstrapFromProfile = async () => {
      try {
        const response = await api.get<{
          profile?: {
            ageRange?: string;
            distractionTriggers?: string[];
            preferredFocusSessionMinutes?: number;
          };
        }>("/onboarding");

        const hydrated: OnboardingData = {
          ...defaultOnboardingData,
          ageGroup: response.profile?.ageRange || "",
          apps: response.profile?.distractionTriggers || [],
        };
        setData(hydrated);
      } catch {
        // If token is invalid, api helper redirects to onboarding.
      }
    };

    void bootstrapFromProfile();
  }, [data]);

  if (!data) return <Onboarding onComplete={handleComplete} />;
  return (
    <D3Provider initial={data}>
      <InnerApp />
    </D3Provider>
  );
};

export default Index;
