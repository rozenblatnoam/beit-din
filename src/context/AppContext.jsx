import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const mockUser = {
  name: 'ישראל ישראלי',
  id: '10482',
  email: 'israel@example.com',
  phone: '050-1234567',
};

export const mockCases = [
  {
    id: '2024-118',
    subject: 'סכסוך שכנים — נזקי בניה',
    opened: '12.01.2024',
    status: 'open',
    statusLabel: 'פעיל',
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
    dayan: 'הרב כהן',
    amount: '₪18,000',
    nextHearing: null,
    docs: 4,
  },
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

  const addCase = (newCase) => {
    setCases(prev => [newCase, ...prev]);
  };

  return (
    <AppContext.Provider value={{ isLoggedIn, setIsLoggedIn, cases, docs, payments, addCase, user: mockUser }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
