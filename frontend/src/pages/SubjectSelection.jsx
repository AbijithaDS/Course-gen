import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Book, FileText } from 'lucide-react';

const SubjectSelection = () => {
  const navigate = useNavigate();
  const { department, year, semester, setSubject } = useAppContext();

  if (!department || !semester) {
    navigate('/departments');
    return null;
  }

  // Mock subjects based on department/semester for demonstration
  const mockSubjects = [
    { id: 'CS101', name: 'Data Structures and Algorithms', code: 'CS301' },
    { id: 'CS102', name: 'Database Management Systems', code: 'CS302' },
    { id: 'CS103', name: 'Operating Systems', code: 'CS303' },
    { id: 'CS104', name: 'Computer Networks', code: 'CS304' },
    { id: 'CS105', name: 'Software Engineering', code: 'CS305' },
    { id: 'CS106', name: 'Artificial Intelligence', code: 'CS306' }
  ];

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
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>{department.id}</span>
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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {mockSubjects.map((subj) => (
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
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', lineHeight: 1.4 }}>{subj.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                <FileText size={14} /> Ready for generation
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectSelection;
