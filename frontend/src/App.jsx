import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Welcome from './pages/Welcome';
import DepartmentSelection from './pages/DepartmentSelection';
import SemesterSelection from './pages/SemesterSelection';
import SubjectSelection from './pages/SubjectSelection';
import CourseContent from './pages/CourseContent';
import './index.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/departments" element={<DepartmentSelection />} />
              <Route path="/semester" element={<SemesterSelection />} />
              <Route path="/subjects" element={<SubjectSelection />} />
              <Route path="/course-content" element={<CourseContent />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
