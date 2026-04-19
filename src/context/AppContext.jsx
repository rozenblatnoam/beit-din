import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const mockUser = {
  name: 'ישראל ישראלי',
  id: '10482',
  email: 'israel@example.com',
  phone: '050-1234567',
};

// דיינים עם קוד כניסה אישי
export const mockDayans = [
  { id: 'd1', name: 'הרב אברהם כהן',    code: '1111', short: 'הרב כהן',    specialty: 'ממונות ונזיקין',     avatar: '⚖️' },
  { id: 'd2', name: 'הרב משה לוי',      code: '2222', short: 'הרב לוי',    specialty: 'שותפויות ועסקים',   avatar: '📜' },
  { id: 'd3', name: 'הרב יעקב גולדברג', code: '3333', short: 'הרב גולדברג', specialty: 'ירושות ונדל"ן',    avatar: '🏛️' },
  { id: 'd4', name: 'הרב דוד ברקוביץ',  code: '4444', short: 'הרב ברקוביץ', specialty: 'חוזים ושכירות',    avatar: '📋' },
];

// Admin code
export const ADMIN_CODE = '9999';

export const mockCases = [
  {
    id: '2024-118',
    subject: 'סכסוך שכנים — נזקי בניה',
    opened: '12.01.2024',
    status: 'open',
    statusLabel: 'פעיל',
    dayanId: 'd1',
    dayan: 'הרב כהן',
    amount: '₪85,000',
    nextHearing: '15.04.2025',
    docs: 5,
  },
  {
    id: '2024-203',
    subject: 'חוב עסקי — שותפות',
    opened: '05.03.2024',
    status: 'pending',
    statusLabel: 'ממתין לתגובה',
    dayanId: 'd2',
    dayan: 'הרב לוי',
    amount: '₪42,000',
    nextHearing: null,
    docs: 3,
  },
  {
    id: '2023-077',
    subject: 'סכסוך ירושה — חלוקת נכסים',
    opened: '20.11.2023',
    status: 'docs',
    statusLabel: 'השלמת מסמכים',
    dayanId: 'd3',
    dayan: 'הרב גולדברג',
    amount: '₪210,000',
    nextHearing: null,
    docs: 7,
  },
  {
    id: '2022-041',
    subject: 'סכסוך שכירות',
    opened: '08.06.2022',
    status: 'closed',
    statusLabel: 'נסגר',
    dayanId: 'd1',
    dayan: 'הרב כהן',
    amount: '₪18,000',
    nextHearing: null,
    docs: 4,
  },
  {
    id: '2025-001',
    subject: 'סכסוך חוזה קבלן',
    opened: '02.01.2025',
    status: 'open',
    statusLabel: 'פעיל',
    dayanId: null,
    dayan: null,
    amount: '₪67,000',
    nextHearing: null,
    docs: 2,
  },
  {
    id: '2025-012',
    subject: 'תביעת חוב — הלוואה',
    opened: '14.02.2025',
    status: 'pending',
    statusLabel: 'ממתין לתגובה',
    dayanId: null,
    dayan: null,
    amount: '₪23,500',
    nextHearing: null,
    docs: 1,
  },
];

// זמינות דיינים — ימים בשבוע (0=ראשון, 1=שני, ...)
export const defaultAvailability = {
  d1: { days: [0, 1, 3], timeStart: '09:00', timeEnd: '17:00', notes: '' },
  d2: { days: [1, 2, 4], timeStart: '10:00', timeEnd: '16:00', notes: '' },
  d3: { days: [0, 2, 3, 4], timeStart: '08:00', timeEnd: '14:00', notes: '' },
  d4: { days: [1, 3], timeStart: '12:00', timeEnd: '19:00', notes: '' },
};

// שיבוצים: { caseId, dayanId, date, time, type }
export const defaultSchedule = [
  { id: 's1', caseId: '2024-118', dayanId: 'd1', date: '2025-04-15', time: '10:00', type: 'hearing', label: 'דיון שני' },
  { id: 's2', caseId: '2024-203', dayanId: 'd2', date: '2025-04-22', time: '11:00', type: 'review',  label: 'בדיקת מסמכים' },
  { id: 's3', caseId: '2023-077', dayanId: 'd3', date: '2025-05-01', time: '09:00', type: 'hearing', label: 'דיון ראשון' },
];

export const mockDocs = [
  { id: 1, name: 'כתב תביעה מקורי', caseId: '2024-118', type: 'pdf', size: '2.4MB', date: '12.01.2024', icon: '📄' },
  { id: 2, name: 'שטר בוררות חתום', caseId: '2024-118', type: 'pdf', size: '0.8MB', date: '20.01.2025', icon: '📑' },
  { id: 3, name: 'תצלומי נזקי בנייה', caseId: '2024-118', type: 'img', size: '8.1MB', date: '25.01.2024', icon: '🖼' },
  { id: 4, name: 'חוות דעת שמאי', caseId: '2024-118', type: 'pdf', size: '3.2MB', date: '01.03.2025', icon: '📊' },
  { id: 5, name: 'כתב תגובה נתבע', caseId: '2024-118', type: 'docx', size: '1.1MB', date: '02.04.2025', icon: '📝' },
  { id: 6, name: 'חוזה שותפות', caseId: '2024-203', type: 'pdf', size: '0.6MB', date: '06.03.2024', icon: '📄' },
  { id: 7, name: 'דפי חשבון בנק', caseId: '2024-203', type: 'pdf', size: '1.8MB', date: '10.03.2024', icon: '📋' },
  { id: 8, name: 'פסק דין', caseId: '2022-041', type: 'pdf', size: '0.9MB', date: '15.12.2022', icon: '🔒' },
];

export const mockPayments = [
  { id: 1, date: '01.04.2024', desc: 'אגרת פתיחת תיק', caseId: '2024-203', amount: 350, status: 'paid' },
  { id: 2, date: '15.01.2024', desc: 'אגרת בית דין', caseId: '2024-118', amount: 500, status: 'paid' },
  { id: 3, date: '—', desc: 'שכר דיין — ישיבה שניה', caseId: '2024-118', amount: 850, status: 'pending' },
  { id: 4, date: '10.12.2022', desc: 'תשלום מלא', caseId: '2022-041', amount: 1200, status: 'paid' },
];

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [cases, setCases] = useState(mockCases);
  const [docs, setDocs] = useState(mockDocs);
  const [payments] = useState(mockPayments);
  const [dayans] = useState(mockDayans);
  const [availability, setAvailability] = useState(defaultAvailability);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [loggedDayan, setLoggedDayan] = useState(null); // dayan object or null
  const [isAdmin, setIsAdmin] = useState(false);

  const addCase = (newCase) => {
    setCases(prev => [newCase, ...prev]);
  };

  const assignDayan = (caseId, dayanId) => {
    const dayan = dayans.find(d => d.id === dayanId);
    setCases(prev => prev.map(c =>
      c.id === caseId
        ? { ...c, dayanId, dayan: dayan?.short || null }
        : c
    ));
  };

  const addScheduleItem = (item) => {
    setSchedule(prev => [...prev, { ...item, id: `s${Date.now()}` }]);
  };

  const removeScheduleItem = (id) => {
    setSchedule(prev => prev.filter(s => s.id !== id));
  };

  const updateAvailability = (dayanId, data) => {
    setAvailability(prev => ({ ...prev, [dayanId]: data }));
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn, setIsLoggedIn,
      cases, docs, payments, addCase,
      user: mockUser,
      dayans,
      availability, updateAvailability,
      schedule, addScheduleItem, removeScheduleItem,
      assignDayan,
      loggedDayan, setLoggedDayan,
      isAdmin, setIsAdmin,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);