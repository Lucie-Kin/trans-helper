/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   App.tsx                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: morgane <morgane@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/08 16:28:16 by mobonill          #+#    #+#             */
/*   Updated: 2026/01/11 20:18:22 by morgane          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/loginPage/loginPage';
import Register from './components/loginPage/register';
import HomePage from './components/homePage/homePage';
import TwoFAPage from './components/twoFAPage/twoFAPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/2fa" element={<TwoFAPage />} />
      <Route path="/home" element={<HomePage />} />
      {/* <Route path="/home" element={isAuthenticated ? <HomePage /> : <Navigate to="/" replace />} /> */}
      < Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
