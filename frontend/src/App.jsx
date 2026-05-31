import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SplashScreen from './components/SplashScreen';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewCase from './pages/NewCase';
import Documents from './pages/Documents';
import Payment from './pages/Payment';
import DayanLogin from './pages/DayanLogin';
import DayanPortal from './pages/DayanPortal';
import LawyerLogin from './pages/LawyerLogin';
import LawyerPortal from './pages/LawyerPortal';
import AdminScheduler from './pages/AdminScheduler';
import CaseDetail from './pages/CaseDetail';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import './styles/global.css';

export default function App() {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('splash_shown')
  );

  const handleSplashDone = () => {
    sessionStorage.setItem('splash_shown', '1');
    setShowSplash(false);
  };

  return (
    <AppProvider>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-case" element={<NewCase />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/dayan" element={<DayanLogin />} />
            <Route path="/dayan/portal" element={<DayanPortal />} />
            <Route path="/lawyer" element={<LawyerLogin />} />
            <Route path="/lawyer/portal" element={<LawyerPortal />} />
            <Route path="/case/:id" element={<CaseDetail />} />
            <Route path="/admin" element={<AdminScheduler />} />
            <Route path="/admin/scheduler" element={<AdminScheduler />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AppProvider>
  );
}