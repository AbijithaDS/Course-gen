import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import RegulationSelection from './pages/RegulationSelection';
import DepartmentSelection from './pages/DepartmentSelection';
import SemesterSelection from './pages/SemesterSelection';
import SubjectSelection from './pages/SubjectSelection';
import CourseContent from './pages/CourseContent';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

// Guard for authenticated pages
const PrivateRoute = ({ children }) => {
  const { user } = useAppContext();
  return user ? children : <Navigate to="/login" replace />;
};

// Guard for administrator-only pages
const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAppContext();
  return user && isAdmin() ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Faculty Flow Routes */}
              <Route path="/departments" element={
                <PrivateRoute>
                  <DepartmentSelection />
                </PrivateRoute>
              } />
              <Route path="/regulation" element={
                <PrivateRoute>
                  <RegulationSelection />
                </PrivateRoute>
              } />
              <Route path="/semester" element={
                <PrivateRoute>
                  <SemesterSelection />
                </PrivateRoute>
              } />
              <Route path="/subjects" element={
                <PrivateRoute>
                  <SubjectSelection />
                </PrivateRoute>
              } />
              <Route path="/course-content" element={
                <PrivateRoute>
                  <CourseContent />
                </PrivateRoute>
              } />

              {/* Protected Administrator Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />

              {/* Catch-all fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
