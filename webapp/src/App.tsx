import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/loginPage/loginPage';
import Register from './components/loginPage/register';
import HomePage from './components/homePage/homePage';
import TwoFAPage from './components/twoFAPage/twoFAPage';
import PongPage from './components/pong/PongPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/2fa" element={<TwoFAPage />} />
      <Route path="/pong" element={<PongPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/play" element={<PongPage />} />
      {/* <Route path="/home" element={isAuthenticated ? <HomePage /> : <Navigate to="/" replace />} /> */}
      < Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
