import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth';
import Login from './pages/Login';
import OrganizerHome from './pages/OrganizerHome';
import ParticipantHome from './pages/ParticipantHome';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/organizer"
            element={
              <ProtectedRoute requiredRole="ORGANIZER">
                <OrganizerHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant"
            element={
              <ProtectedRoute requiredRole="PARTICIPANT">
                <ParticipantHome />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
