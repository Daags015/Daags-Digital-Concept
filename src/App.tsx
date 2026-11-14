import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '@/src/context/ToastContext';
import { CmsProvider } from '@/src/context/CmsContext';
import { PublicLayout } from '@/src/components/PublicLayout';
import { HomePage } from '@/src/pages/HomePage';
import { ServicesPage } from '@/src/pages/ServicesPage';
import { PortfolioPage } from '@/src/pages/PortfolioPage';
import { AboutPage } from '@/src/pages/AboutPage';
import { FaqsPage } from '@/src/pages/FaqsPage';
import { ContactPage } from '@/src/pages/ContactPage';
import { AdminLoginPage } from '@/src/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/src/pages/admin/AdminDashboardPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <ToastProvider>
      <CmsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Website Routes */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <HomePage />
                </PublicLayout>
              }
            />
            <Route
              path="/services"
              element={
                <PublicLayout>
                  <ServicesPage />
                </PublicLayout>
              }
            />
            <Route
              path="/services/:slug"
              element={
                <PublicLayout>
                  <ServicesPage />
                </PublicLayout>
              }
            />
            <Route
              path="/portfolio"
              element={
                <PublicLayout>
                  <PortfolioPage />
                </PublicLayout>
              }
            />
            <Route
              path="/about"
              element={
                <PublicLayout>
                  <AboutPage />
                </PublicLayout>
              }
            />
            <Route
              path="/faqs"
              element={
                <PublicLayout>
                  <FaqsPage />
                </PublicLayout>
              }
            />
            <Route
              path="/contact"
              element={
                <PublicLayout>
                  <ContactPage />
                </PublicLayout>
              }
            />

            {/* Admin CMS Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Mandatory Zero-404 Catch-All Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CmsProvider>
    </ToastProvider>
  );
}
