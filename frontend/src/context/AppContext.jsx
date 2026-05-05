import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loggedDayan, setLoggedDayan] = useState(null);
  const [loggedLawyer, setLoggedLawyer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cases, setCases] = useState([]);
  const [docs, setDocs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!user;

  // ─── Bootstrap: restore session from localStorage, silent-refresh if needed ───
  useEffect(() => {
    const token     = localStorage.getItem("access_token");
    const savedUser   = localStorage.getItem("user");
    const savedDayan  = localStorage.getItem("dayan");
    const savedLawyer = localStorage.getItem("lawyer");

    const restore = async () => {
      if (token && savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        setIsAdmin(u.is_admin || false);
      } else if (token && savedDayan) {
        setLoggedDayan(JSON.parse(savedDayan));
      } else if (token && savedLawyer) {
        setLoggedLawyer(JSON.parse(savedLawyer));
      } else if (savedUser || savedDayan || savedLawyer) {
        // No access_token but have role data → try silent refresh via httpOnly cookie
        const ok = await api.silentRefresh();
        if (ok) {
          if (savedUser)   { const u = JSON.parse(savedUser);  setUser(u); setIsAdmin(u.is_admin || false); }
          else if (savedDayan)  setLoggedDayan(JSON.parse(savedDayan));
          else if (savedLawyer) setLoggedLawyer(JSON.parse(savedLawyer));
        } else {
          localStorage.clear();
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  // ─── Load user data when logged in ──────────────────
  useEffect(() => {
    if (!user) return;
    api.get("/cases/").then(setCases).catch(() => {});
    api.get("/payments/my").then(setPayments).catch(() => {});
  }, [user]);

  // ─── Auth ────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    _persistAuth(data);
  }, []);

  const register = useCallback(async (email, name, phone, password) => {
    const data = await api.post("/auth/register", { email, name, phone, password });
    _persistAuth(data);
  }, []);

  const loginDayan = useCallback(async (email, password) => {
    const data = await api.post("/auth/dayan/login", { email, password });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("dayan", JSON.stringify(data.dayan));
    setLoggedDayan(data.dayan);
  }, []);

  const loginLawyer = useCallback(async (email, password) => {
    const data = await api.post("/auth/lawyer/login", { email, password });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("lawyer", JSON.stringify(data.lawyer));
    setLoggedLawyer(data.lawyer);
  }, []);

  const logout = useCallback(() => {
    // Clear httpOnly refresh cookies from backend
    const role = localStorage.getItem("dayan") ? "dayan"
               : localStorage.getItem("lawyer") ? "lawyer" : "user";
    const logoutUrl = role === "dayan" ? "/auth/dayan/logout"
                    : role === "lawyer" ? "/auth/lawyer/logout"
                    : "/auth/logout";
    fetch(logoutUrl, { method: "POST", credentials: "include" }).catch(() => {});

    localStorage.clear();
    setUser(null);
    setLoggedDayan(null);
    setLoggedLawyer(null);
    setIsAdmin(false);
    setCases([]);
    setPayments([]);
    setDocs([]);
    setSchedule([]);
  }, []);

  function _persistAuth(data) {
    localStorage.setItem("access_token", data.access_token);
    // refresh_token is stored as httpOnly cookie by the backend — not in localStorage
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    setIsAdmin(data.user.is_admin || false);
  }

  // ─── Cases ───────────────────────────────────────────
  const addCase = useCallback(async (subject, description, amount) => {
    const newCase = await api.post("/cases/", { subject, description, amount });
    setCases((prev) => [newCase, ...prev]);
    return newCase;
  }, []);

  const refreshCases = useCallback(async () => {
    const data = await api.get("/cases/");
    setCases(data);
  }, []);

  // ─── Documents ───────────────────────────────────────
  const uploadDoc = useCallback(async (caseId, file) => {
    const form = new FormData();
    form.append("case_id", caseId);
    form.append("file", file);
    const doc = await api.uploadFile("/documents/", form);
    setDocs((prev) => [doc, ...prev]);
    return doc;
  }, []);

  const loadDocs = useCallback(async (caseId) => {
    const data = await api.get(`/documents/case/${caseId}`);
    setDocs(data);
  }, []);

  const removeDoc = useCallback(async (docId) => {
    await api.delete(`/documents/${docId}`);
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  // ─── Payments ────────────────────────────────────────
  const createPayment = useCallback(async (caseId, amount, description) => {
    const payment = await api.post("/payments/", { case_id: caseId, amount, description });
    setPayments((prev) => [payment, ...prev]);
    if (payment.hyp_redirect_url) {
      window.location.href = payment.hyp_redirect_url;
    }
    return payment;
  }, []);

  // ─── Schedule ────────────────────────────────────────
  const loadDayanSchedule = useCallback(async () => {
    const data = await api.get("/schedule/dayan/my");
    setSchedule(data);
  }, []);

  const updateAvailability = useCallback(async (availData) => {
    await api.put("/schedule/availability", availData);
  }, []);

  const addScheduleItem = useCallback(async (item) => {
    const hearing = await api.post("/schedule/", item);
    setSchedule((prev) => [...prev, hearing]);
    return hearing;
  }, []);

  const removeScheduleItem = useCallback(async (hearingId) => {
    await api.delete(`/schedule/${hearingId}`);
    setSchedule((prev) => prev.filter((s) => s.id !== hearingId));
  }, []);

  // ─── Admin ───────────────────────────────────────────
  const assignDayan = useCallback(async (caseId, dayanId) => {
    const updated = await api.patch(`/admin/cases/${caseId}`, { dayan_id: dayanId });
    setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        loggedDayan,
        setLoggedDayan,
        loggedLawyer,
        setLoggedLawyer,
        isAdmin,
        setIsAdmin,
        login,
        register,
        loginDayan,
        loginLawyer,
        logout,
        cases,
        setCases,
        addCase,
        refreshCases,
        docs,
        setDocs,
        uploadDoc,
        loadDocs,
        removeDoc,
        payments,
        createPayment,
        schedule,
        loadDayanSchedule,
        updateAvailability,
        addScheduleItem,
        removeScheduleItem,
        assignDayan,
        loading,
        // Google OAuth URLs
        googleLoginUrl: api.googleLoginUrl,
        googleDayanLoginUrl: api.googleDayanLoginUrl,
        googleLawyerLoginUrl: api.googleLawyerLoginUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
