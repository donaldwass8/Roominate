import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { RoleProvider } from './context/RoleContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ReservationsPage from './pages/ReservationsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import RoomCalendarPage from './pages/RoomCalendarPage';
import RoomReservationPage from './pages/RoomReservationPage';
import AccessibilityPage from './pages/AccessibilityPage';
import AccessibilityReportPage from './pages/AccessibilityReportPage';
import UtilizationPage from './pages/UtilizationPage';
import RestorePage from './pages/RestorePage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <Router>
          <div className="min-h-screen bg-page-bg flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/reservations" element={<ReservationsPage />} />
                  <Route path="/rooms/:id" element={<RoomDetailPage />} />
                  <Route path="/rooms/:id/accessibility" element={<AccessibilityPage />} />
                  <Route path="/rooms/:id/accessibility-report" element={<AccessibilityReportPage />} />
                  <Route path="/rooms/:id/calendar" element={<RoomCalendarPage />} />
                  <Route path="/rooms/:id/reserve" element={<RoomReservationPage />} />
                  <Route path="/history" element={<BookingHistoryPage />} />
                  <Route path="/utilization" element={<UtilizationPage />} />
                  <Route path="/restore" element={<RestorePage />} />
                </Route>
              </Routes>
          </main>
          <Toaster position="bottom-right" />
        </div>
      </Router>
    </RoleProvider>
    </AuthProvider>
  );
}

export default App;
