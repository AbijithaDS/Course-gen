import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Settings, Sparkles, Download, Edit3, Save, RefreshCw, FileText } from 'lucide-react';

const TABS = [
  { id: 'cia1', label: 'CIA 1' },
  { id: 'cia2', label: 'CIA 2' },
  { id: 'qbank', label: 'Question Bank' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'hots', label: 'HOTS' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'beyond', label: 'Beyond Syllabus' }
];

const CourseContent = () => {
  const navigate = useNavigate();
  const { department, semester, subject } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('cia1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!subject) {
    navigate('/subjects');
    return null;
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.id,
          semester: semester,
          subject: subject.name,
          type: activeTab
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setContent(data.generatedText);
      } else {
        setContent(`Error: ${data.error || 'Failed to generate content'}`);
        console.error('Generation error:', data);
      }
    } catch (error) {
      console.error("Error generating content", error);
      setContent('Error: Could not connect to the generation server. Is the backend running?');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (format) => {
    alert(`Exporting ${activeTab} as ${format.toUpperCase()}...`);
    // Will connect to export backend logic
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="top-nav" style={{ marginBottom: '1.5rem' }}>
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>{subject.code}</span>
            <span>-</span>
            <span>{subject.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary"><Settings size={18} /> Settings</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
        {/* Sidebar Tabs */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === tab.id ? 'none' : '' }}
              onClick={() => { setActiveTab(tab.id); setContent(''); setIsEditing(false); }}
            >
              <FileText size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.5rem' }}>{TABS.find(t => t.id === activeTab)?.label} Generator</h3>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {content && (
                <>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <><Save size={18} /> Save</> : <><Edit3 size={18} /> Edit</>}
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>
                    <Download size={18} /> PDF
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExport('doc')}>
                    <Download size={18} /> DOC
                  </button>
                </>
              )}
              <button className="btn btn-primary" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <><RefreshCw size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }}/> Generating...</> : <><Sparkles size={18} /> Generate AI Content</>}
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {!content && !isGenerating ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Click "Generate AI Content" to start creating materials.</p>
              </div>
            ) : isGenerating ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', marginBottom: '1rem' }}></div>
                <p>Gemini is analyzing the syllabus...</p>
              </div>
            ) : (
              isEditing ? (
                <textarea 
                  className="input-field"
                  style={{ flex: 1, resize: 'none', border: 'none', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              ) : (
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {content}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseContent;
