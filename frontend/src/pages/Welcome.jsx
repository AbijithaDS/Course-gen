import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: 'var(--shadow-md)', display: 'inline-flex' }}>
          <BookOpen size={64} color="var(--primary)" strokeWidth={1.5} />
        </div>
      </div>
      
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
        Course File Generator
      </h1>
      
      <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '3rem', lineHeight: '1.8' }}>
        Automate the creation of academic course materials. Generate syllabi, question banks, and internal exams with a clean, professional workflow.
      </p>
      
      <button 
        className="btn btn-primary" 
        onClick={() => navigate('/departments')}
        style={{ fontSize: '1.125rem', padding: '1rem 2.5rem' }}
      >
        Start Generating <ArrowRight size={20} />
      </button>
    </div>
  );
};

export default Welcome;
