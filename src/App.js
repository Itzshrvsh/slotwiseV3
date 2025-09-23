import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from './AuthPage.js';
import Home from './Home.js';
import Admin from './Admin.js';
import Faculty from './Faculty.js';
import AdminFaculty from './AdminFaculty.js';
import ProtectedRoute from './ProtectedRoute.js';
import TimetablePage from './bin/TimetablePage.js';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public login/signup page */}
        <Route path="/login" element={<AuthPage />} />

        {/* Home page - accessible to all logged-in users */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Faculty input page - logged-in users */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute>
              <Faculty />
            </ProtectedRoute>
          }
        />

        {/* Admin faculty monitoring page - admin only */}
        <Route
          path="/admin-faculty"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminFaculty />
            </ProtectedRoute>
          }
        />
        {/* Timetable display page */}
        <Route path="/timetable" element={<TimetablePage />} />
        {/* Catch-all route redirects to login */}
        <Route path="*" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
