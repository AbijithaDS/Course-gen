import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Book, FileText, AlertCircle, RefreshCw } from 'lucide-react';

const SubjectSelection = () => {
  const navigate = useNavigate();
  const { department, regulation, semester, subjects, loadingSubjs, fetchSubjects, setSubject } = useAppContext();

  useEffect(() => {
    if (!department || !semester) {
      navigate('/departments');
      return;
    }
    fetchSubjects(department.id, semester);
  }, [department, semester]);

  if (!department || !semester || !regulation) {
    return null;
  }

  const handleSelectSubject = (subj) => {
    setSubject(subj);
    navigate('/course-content');
  };

  return (
    <div className="animate-fade-in">
      <div className="top-nav">
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: 'var(--primary)' }}>{department.id}</span>
            <span>&gt;</span>
            <span style={{ color: 'var(--primary)' }}>{regulation}</span>
            <span>&gt;</span>
            <span style={{ color: 'var(--primary)' }}>Sem {semester}</span>
            <span>&gt;</span>
            <span>Select Subject</span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Available Subjects</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Select a subject to generate course materials.</p>
      </div>

      {loadingSubjs ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', color: 'var(--primary)' }}>
          <RefreshCw size={40} className="spinner" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading subjects from database...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
          <p>No subjects found for {department.id} in Semester {semester}. Ask an Admin to add them.</p>
        </div>
      ) : (
        <div className="selection-grid-subjects">
          {subjects.map((subj) => (
            <div 
              key={subj.id} 
              className="glass-card"
              style={{ 
                cursor: 'pointer', 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                transition: 'all 0.2s'
              }}
              onClick={() => handleSelectSubject(subj)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: '0.75rem', color: 'var(--primary)' }}>
                <Book size={24} />
              </div>
              <div>
                <div className="badge" style={{ marginBottom: '0.5rem' }}>{subj.code}</div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', lineHeight: 1.4, fontWeight: '700' }}>{subj.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  <FileText size={14} /> Ready for generation
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectSelection;
