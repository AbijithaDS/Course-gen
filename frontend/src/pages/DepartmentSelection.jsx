import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Monitor, Cpu, Database, Shield, Hexagon, Zap, ShieldAlert, Cpu as Microchip } from 'lucide-react';

const DEPARTMENTS = [
  { id: 'CSE', name: 'Computer Science', icon: Monitor },
  { id: 'IT', name: 'Information Technology', icon: Database },
  { id: 'ECE', name: 'Electronics & Comm', icon: Zap },
  { id: 'MECH', name: 'Mechanical', icon: Hexagon },
  { id: 'CIVIL', name: 'Civil Engineering', icon: Hexagon },
  { id: 'AI_DS', name: 'AI & Data Science', icon: Cpu },
  { id: 'CYBER', name: 'Cyber Security', icon: ShieldAlert },
  { id: 'BME', name: 'Biomedical', icon: Microchip },
];

const DepartmentSelection = () => {
  const navigate = useNavigate();
  const { setDepartment } = useAppContext();

  const handleSelect = (dept) => {
    setDepartment(dept);
    navigate('/semester');
  };

  return (
    <div className="animate-fade-in">
      <div className="top-nav">
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            Select Department
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Choose Department</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Select the academic department to proceed with course file generation.</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
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
    </div>
  );
};

export default DepartmentSelection;
