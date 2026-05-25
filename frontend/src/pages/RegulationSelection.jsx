import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ClipboardList, AlertCircle, RefreshCw } from 'lucide-react';

const RegulationSelection = () => {
  const navigate = useNavigate();
  const { department, regulations, loadingRegs, fetchRegulations, setRegulation } = useAppContext();

  useEffect(() => {
    if (!department) {
      navigate('/departments');
      return;
    }
    fetchRegulations();
  }, [department]);

  const handleSelect = (reg) => {
    setRegulation(reg.id);
    navigate('/semester');
  };

  if (!department) return null;

  return (
    <div className="animate-fade-in">
      <div className="top-nav">
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--primary)' }}>{department.id}</span> &gt; Select Regulation
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Academic Regulation</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Select the course curriculum regulation framework to proceed.</p>
      </div>

      {loadingRegs ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', color: 'var(--primary)' }}>
          <RefreshCw size={40} className="spinner" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading regulations...</p>
        </div>
      ) : regulations.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
          <p>No regulations found. Is the server running?</p>
        </div>
      ) : (
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {regulations.map((reg) => (
            <div 
              key={reg.id} 
              className="glass-card"
              style={{ 
                cursor: 'pointer', 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.25rem',
                transition: 'all 0.2s',
                padding: '2rem'
              }}
              onClick={() => handleSelect(reg)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: '0.75rem', color: 'var(--primary)' }}>
                <ClipboardList size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontWeight: '700' }}>{reg.id}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>{reg.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegulationSelection;
