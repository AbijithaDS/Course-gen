import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Settings, Sparkles, Download, Edit3, Save, RefreshCw, FileText, ArrowLeft, LogOut } from 'lucide-react';

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
  const { user, logoutUser, department, regulation, semester, subject } = useAppContext();
  
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
    setContent('');
    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.id,
          semester: semester,
          subject: subject, // subject contains { code, name, ... }
          type: activeTab,
          regulation: regulation,
          generatedBy: user?.username || 'faculty'
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

  // Convert Markdown to HTML for exports
  const renderMarkdownToHtml = (md) => {
    if (!md) return '';
    // Quick simple markdown parser for bold, headers, list, etc.
    let html = md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br />');
    
    // Group list items into <ul>
    html = html.replace(/(<li>.*?<\/li>)/gim, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/gim, '');
    return html;
  };

  // PDF Export using native print optimization window
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    const formattedHtml = renderMarkdownToHtml(content);
    
    const docTitle = `${subject.code}_${activeTab.toUpperCase()}_CourseFile`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${docTitle}</title>
          <style>
            body { 
              font-family: 'Helvetica Neue', Arial, sans-serif; 
              color: #1e293b; 
              padding: 2.5rem; 
              line-height: 1.6; 
            }
            .header-container { 
              border-bottom: 2px solid #4f46e5; 
              padding-bottom: 1rem; 
              margin-bottom: 2rem; 
            }
            .header-title { 
              font-size: 24px; 
              font-weight: bold; 
              margin: 0; 
              color: #1e293b; 
            }
            .meta-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 0.5rem; 
              margin-top: 1rem; 
              font-size: 14px; 
              color: #64748b; 
            }
            h1, h2, h3 { color: #4f46e5; margin-top: 1.5rem; }
            h1 { font-size: 22px; }
            h2 { font-size: 18px; }
            h3 { font-size: 16px; }
            ul { margin-bottom: 1rem; padding-left: 1.5rem; }
            li { margin-bottom: 0.25rem; }
            @media print {
              body { padding: 1.5cm; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1 class="header-title">${TABS.find(t => t.id === activeTab)?.label} - Course Material</h1>
            <div class="meta-grid">
              <div><strong>Subject:</strong> ${subject.code} - ${subject.name}</div>
              <div><strong>Department:</strong> ${department.name} (${department.id})</div>
              <div><strong>Semester:</strong> Sem ${semester}</div>
              <div><strong>Regulation:</strong> ${regulation}</div>
            </div>
          </div>
          <div class="content-body">
            ${formattedHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              // Optional: close window after print dialog is closed
              // window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Word (DOC/DOCX) Export utilizing official institution templates from backend
  const handleExportWord = async () => {
    try {
      console.log('Requesting template-driven Word document from backend...');
      const response = await fetch('http://localhost:5000/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: subject.code,
          subjectName: subject.name,
          departmentId: department.id,
          departmentName: department.name,
          semester: semester,
          regulation: regulation,
          year: year,
          type: activeTab,
          content: content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate template-driven Word document.');
      }

      // Fetch as binary blob
      const blob = await response.blob();
      
      // Determine file extension from response headers or default to docx
      const disposition = response.headers.get('Content-Disposition');
      let filename = `${subject.code}_${activeTab.toUpperCase()}_Formatted.docx`;
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Trigger standard browser download of binary file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Template-driven Word document downloaded successfully:', filename);

    } catch (error) {
      console.error('Error exporting template-driven Word document:', error);
      alert('Failed to download official formatted document. Is the backend running?');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Top Navigation */}
      <div className="top-nav" style={{ marginBottom: '1.5rem' }}>
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>{subject.code}</span>
            <span>-</span>
            <span>{subject.name}</span>
            <span className="badge">{regulation}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={logoutUser}>
            <LogOut size={16} /> Sign Out
          </button>
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

        {/* Main Content Workspace */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{TABS.find(t => t.id === activeTab)?.label} Generator</h3>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {content && (
                <>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <><Save size={18} /> Save</> : <><Edit3 size={18} /> Edit</>}
                  </button>
                  <button className="btn btn-secondary" onClick={handleExportPDF}>
                    <Download size={18} /> PDF
                  </button>
                  <button className="btn btn-secondary" onClick={handleExportWord}>
                    <Download size={18} /> Word
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
                <p style={{ fontSize: '1.1rem' }}>Click "Generate AI Content" to start creating materials.</p>
              </div>
            ) : isGenerating ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <RefreshCw size={40} className="spinner" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '1rem' }} />
                <p style={{ fontWeight: 500 }}>Gemini AI is generating high-quality curriculum material...</p>
              </div>
            ) : (
              isEditing ? (
                <textarea 
                  className="input-field"
                  style={{ flex: 1, resize: 'none', border: 'none', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: '1.6' }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              ) : (
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1rem', color: '#1e293b' }}>
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
