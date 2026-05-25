import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Monitor, Cpu, Database, Zap, BookOpen, RefreshCw, LogOut, Wrench, Building, Brain, Shield, HeartPulse } from 'lucide-react';

const ICON_MAP = {
  CSE: Monitor,
  IT: Database,
  ECE: Zap,
  MECH: Wrench,
  CIVIL: Building,
  AI_DS: Brain,
  CYBER: Shield,
  BME: HeartPulse
};

const DepartmentSelection = () => {
  const navigate = useNavigate();
  const { user, logoutUser, departments, loadingDepts, fetchDepartments, setDepartment } = useAppContext();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSelect = (dept) => {
    setDepartment(dept);
    navigate('/regulation');
  };

  return (
    <div className="animate-fade-in">
      <div className="top-nav">
        <div className="nav-left">
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            Welcome, <span style={{ color: 'var(--primary)' }}>{user?.username}</span> (Faculty)
          </div>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={logoutUser} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Choose Department</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Select the academic department to proceed with course file generation.</p>
      </div>

      {loadingDepts ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', color: 'var(--primary)' }}>
          <RefreshCw size={40} className="spinner" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading departments from database...</p>
        </div>
      ) : departments.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>No departments configured. Please ask an Admin to add departments.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {departments.map((dept) => {
            const Icon = ICON_MAP[dept.id] || BookOpen;
            return (
              <div 
                key={dept.id} 
                className="glass-card"
                style={{ cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                onClick={() => handleSelect(dept)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#e0e7ff', borderRadius: '50%', color: 'var(--primary)' }}>
                    <Icon size={32} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{dept.id}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{dept.name}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DepartmentSelection;
