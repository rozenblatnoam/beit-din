import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewCase from './pages/NewCase';
import Documents from './pages/Documents';
import Payment from './pages/Payment';
import DayanLogin from './pages/DayanLogin';
import DayanPortal from './pages/DayanPortal';
import AdminScheduler from './pages/AdminScheduler';
import './styles/global.css';

export default function App() {
  return (
    <AppProvider>
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
            <Route path="/admin/scheduler" element={<AdminScheduler />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AppProvider>
  );
}