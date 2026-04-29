import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Calendar, Layers } from 'lucide-react';

const SemesterSelection = () => {
  const navigate = useNavigate();
  const { department, setYear, setSemester } = useAppContext();
  
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemType, setSelectedSemType] = useState(null);

  if (!department) {
    // Redirect back if accessed directly
    navigate('/departments');
    return null;
  }

  const handleProceed = () => {
    if (!selectedYear || !selectedSemType) return;
    
    setYear(selectedYear);
    // Simple logic for determining semester number range based on year and type
    // e.g. Year 1 Odd = 1, Even = 2
    const baseSem = (selectedYear - 1) * 2;
    const semNumber = selectedSemType === 'Odd' ? baseSem + 1 : baseSem + 2;
    setSemester(semNumber);
    
    navigate('/subjects');
  };

  return (
    <div className="animate-fade-in">
      <div className="top-nav">
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--primary)' }}>{department.id}</span> &gt; Select Semester
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Academic Period</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Select the year and semester type for course file generation.</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }} className="glass-card">
        
        <div style={{ marginBottom: '2rem' }}>
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', marginBottom: '1rem' }}>
            <Calendar size={20} /> Select Academic Year
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[1, 2, 3, 4].map(y => (
              <button 
                key={y}
                className={`btn ${selectedYear === y ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedYear(y)}
                style={{ width: '100%' }}
              >
                Year {y}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', marginBottom: '1rem' }}>
            <Layers size={20} /> Semester Type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {['Odd', 'Even'].map(type => (
              <button 
                key={type}
                className={`btn ${selectedSemType === type ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedSemType(type)}
                style={{ width: '100%' }}
              >
                {type} Semester
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleProceed}
            disabled={!selectedYear || !selectedSemType}
            style={{ opacity: (!selectedYear || !selectedSemType) ? 0.5 : 1, width: '100%' }}
          >
            Continue to Subjects
          </button>
        </div>
      </div>
    </div>
  );
};

export default SemesterSelection;
