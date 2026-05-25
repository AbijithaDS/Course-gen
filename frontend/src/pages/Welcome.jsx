import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BookOpen, Shield, GraduationCap, ArrowRight, UserCheck, ArrowLeft } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, logoutUser } = useAppContext();
  
  // Controls transition between original landing and the Role Selection gateway
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  const handleRoleSelection = (role) => {
    navigate('/login', { state: { chosenRole: role } });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', textAlign: 'center' }}>
      
      {/* Brand Header Icon */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: 'var(--shadow-md)', display: 'inline-flex' }}>
          <BookOpen size={64} color="var(--primary)" strokeWidth={1.5} />
        </div>
      </div>
      
      <h1 style={{ fontSize: '3.25rem', marginBottom: '1rem', letterSpacing: '-0.025em', fontWeight: 800 }}>
        Course File Generator
      </h1>

      {user ? (
        /* --- 1. LOGGED IN SESSION SHORTCUT --- */
        <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
            <UserCheck size={40} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: 700 }}>Active Session: {user.username}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            Logged in as <span className="badge">{user.role}</span>
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={() => user.role === 'Admin' ? navigate('/admin') : navigate('/departments')}
            >
              Go to Workspace <ArrowRight size={18} />
            </button>
            <button 
              className="btn btn-secondary"
              onClick={logoutUser}
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : !showRoleSelect ? (
        /* --- 2. PREVIOUS LANDING PAGE (With Start Generating / Get Started) --- */
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '3rem', lineHeight: '1.8' }}>
            Automate the creation of academic course materials. Generate syllabi, question banks, and internal exams with a clean, professional workflow.
          </p>
          
          <button 
            className="btn btn-primary" 
            onClick={() => setShowRoleSelect(true)}
            style={{ fontSize: '1.125rem', padding: '1rem 2.75rem' }}
          >
            Start Generating <ArrowRight size={20} />
          </button>
        </div>
      ) : (
        /* --- 3. DYNAMIC ROLE SELECTION SLIDE --- */
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '750px', marginTop: '1rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            Are you a Faculty member or System Administrator?
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '2rem',
            marginBottom: '2.5rem'
          }}>
            {/* Faculty Portal Option */}
            <div 
              className="glass-card"
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '2.5rem', textAlign: 'center' }}
              onClick={() => handleRoleSelection('Faculty')}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#e0e7ff', borderRadius: '50%', color: 'var(--primary)' }}>
                  <GraduationCap size={44} />
                </div>
              </div>
              <h4 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Faculty Portal</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Generate internal assessment papers, unit-wise question banks, quiz sets, and assignment scenarios.
              </p>
            </div>

            {/* Admin Portal Option */}
            <div 
              className="glass-card"
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '2.5rem', textAlign: 'center' }}
              onClick={() => handleRoleSelection('Admin')}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '50%', color: '#0284c7' }}>
                  <Shield size={44} />
                </div>
              </div>
              <h4 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Admin Console</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Create departments, configure academic subjects, audit logged files, and analyze token usage logs.
              </p>
            </div>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={() => setShowRoleSelect(false)}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}
          >
            <ArrowLeft size={16} /> Back to Main Page
          </button>
        </div>
      )}
    </div>
  );
};

export default Welcome;
