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
  const { user, logoutUser, department, regulation, year, semester, subject } = useAppContext();
  
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

  // Strips markdown formatting emphasis characters (*, _, **) from a string.
  const stripMarkdownFormatting = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/^[\*_\s]+|[\*_\s]+$/g, (match) => {
        return match.replace(/[\*_]/g, '');
      })
      .trim();
  };

  // Cleans CO and K references from the text to prevent duplication in dedicated columns.
  const cleanAllTextOfCOK = (text) => {
    if (!text) return '';
    
    // 1. Remove parenthesized CO and K references (e.g., "(CO4)", "(K2)", "(CO3, K1)", "(CO4, K4)", "(K4, CO4)")
    let cleaned = text.replace(/\(\s*(?:CO[1-5]|K[1-6])\s*(?:,\s*(?:CO[1-5]|K[1-6]))?\s*\)/gi, '');
    cleaned = cleaned.replace(/\(\s*(?:CO[1-5]|K[1-6])\s*\)/gi, '');
    cleaned = cleaned.replace(/\(\s*(?:CO[1-5]|K[1-6])\s*,\s*(?:CO[1-5]|K[1-6])\s*\)/gi, '');
    cleaned = cleaned.replace(/\(\s*K[1-6]\s*,\s*CO[1-5]\s*\)/gi, '');
    
    // 2. Remove non-parenthesized CO/K references at the end of lines
    // Exclude CO2 and K1 to prevent false matches with Carbon Dioxide (CO2) or Vitamin K1 in sentences.
    cleaned = cleaned.replace(/\s*\b(?:CO[1345]|K[2-6])\b\s*(?=[.?]?\s*(?:\r?\n|$))/gi, (match) => {
      const puncMatch = match.match(/[.?]/);
      return puncMatch ? puncMatch[0] : '';
    });
    
    return cleaned.replace(/\s+/g, ' ').trim();
  };

  // Convert Markdown to HTML for exports
  const renderMarkdownToHtml = (md) => {
    if (!md) return '';
    let cleaned = cleanAllTextOfCOK(md);
    // Quick simple markdown parser for bold, headers, list, etc.
    let html = cleaned
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br />');
    return html;
  };

  // ===================== QUESTION PARSER (mirrors backend) =====================
  const parseQuestionsForPDF = (text) => {
    const questions = {};
    if (!text) return questions;

    // Split into sections
    const partAIdx = text.search(/Part\s*A/i);
    const partBIdx = text.search(/Part\s*B/i);
    const partCIdx = text.search(/Part\s*C/i);

    let partAText = '';
    let partBText = '';

    if (partAIdx !== -1) {
      if (partBIdx !== -1) {
        partAText = text.substring(partAIdx, partBIdx);
        if (partCIdx !== -1) {
          partBText = text.substring(partBIdx, partCIdx) + '\n' + text.substring(partCIdx);
        } else {
          partBText = text.substring(partBIdx);
        }
      } else {
        partAText = text.substring(partAIdx);
      }
    } else {
      partAText = text;
      partBText = text;
    }

    const clean = (txt) => {
      if (!txt) return '';
      let cleaned = stripMarkdownFormatting(txt)
        .replace(/^\s*[\-\*\+]\s+/, '') // Strip list bullets
        .trim();
      return cleanAllTextOfCOK(cleaned);
    };

    const cleanOption = (txt) => {
      if (!txt) return '';
      let cleaned = clean(txt);
      // Remove any trailing/internal "Part C" headings, marks declarations, or instructions
      cleaned = cleaned.replace(/(?:^|\n)\s*#+\s*Part\s*[A-Z].*$/gim, '');
      cleaned = cleaned.replace(/(?:^|\n)\s*\*?\(?Answer\s+(?:all|either|any).*$/gim, '');
      cleaned = cleaned.replace(/(?:^|\n)\s*\*?\(?\d+\s*x\s*\d+\s*=\s*\d+\s*Marks.*$/gim, '');
      cleaned = cleaned.replace(/(?:^|\n)\s*-+\s*$/gm, '');
      return clean(cleaned);
    };

    // --- Parse Part A ---
    const partALines = partAText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (let i = 1; i <= 10; i++) {
      const patterns = [
        new RegExp(`^(?:\\*\\*|\\b)?Q?\\.?\\s*${i}\\s*[\\.\\)]\\s*\\*?\\*?\\s*(.+)`, 'i'),
        new RegExp(`^\\**\\s*Q?\\.?\\s*${i}\\s*[\\.\\):]\\**\\s*(.+)`, 'i')
      ];
      for (const line of partALines) {
        if (line.toLowerCase().includes('answer all') || line.toLowerCase().includes('marks)')) {
          continue;
        }
        let matched = false;
        for (const pat of patterns) {
          const m = line.match(pat);
          if (m) {
            questions[`Q${i}`] = clean(m[1]);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }

    // --- Parse Part B ---
    const findQuestionSegment = (srcText, num) => {
      const startRegex = new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${num}\\b`, 'i');
      const startMatch = srcText.match(startRegex);
      if (!startMatch) return '';

      const nextNum = num + 1;
      const endRegex = new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${nextNum}\\b`, 'i');
      const endMatch = srcText.match(endRegex);

      if (endMatch) {
        return srcText.substring(startMatch.index, endMatch.index);
      } else {
        return srcText.substring(startMatch.index);
      }
    };

    const parseOption = (segment, letter) => {
      const patterns = [
        new RegExp(`(?:\\b|\\()\\s*(?:\\d+)?${letter}\\s*[\\.\\):]\\s*\\*?\\*?\\s*([\\s\\S]+?)(?=(?:\\b|\\()\\s*(?:\\d+)?[a-b]\\s*[\\.\\):]|\\bOR\\b|$)`, 'i')
      ];

      for (const pat of patterns) {
        const m = segment.match(pat);
        if (m) {
          let txt = m[1].trim();
          txt = txt.replace(/\s+\**OR\**\s*$/i, '');
          return cleanOption(txt);
        }
      }
      return '';
    };

    const partBKeys = [
      { key: '11a', num: 11, letter: 'a' },
      { key: '11b', num: 11, letter: 'b' },
      { key: '12a', num: 12, letter: 'a' },
      { key: '12b', num: 12, letter: 'b' },
      { key: '13a', num: 13, letter: 'a' },
      { key: '13b', num: 13, letter: 'b' }
    ];

    for (const item of partBKeys) {
      const segment = findQuestionSegment(partBText, item.num);
      if (segment) {
        questions[`Q${item.key}`] = parseOption(segment, item.letter);
      }
    }

    return questions;
  };

  // Roman numeral converter
  const toRoman = (num) => {
    const n = parseInt(num, 10);
    if (isNaN(n) || n <= 0) return String(num || '');
    const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let result = '';
    let r = n;
    for (const [v, s] of map) { while (r >= v) { result += s; r -= v; } }
    return result;
  };

  const getAcademicYear = () => {
    const now = new Date();
    const y = now.getFullYear();
    return now.getMonth() >= 5 ? `${y}-${y+1}` : `${y-1}-${y}`;
  };

  const getBranchName = (deptId) => {
    const map = { 'AI_DS': 'AI&DS', 'AIDS': 'AI&DS', 'CSE': 'CSE', 'IT': 'IT', 'ECE': 'ECE', 'EEE': 'EEE', 'MECH': 'MECH' };
    return map[deptId] || deptId || 'N/A';
  };

  const formatRegulation = (reg) => {
    if (!reg) return 'N/A';
    if (reg.includes('-')) return reg;
    const m = reg.match(/^(R)(\d+)$/i);
    return m ? `${m[1]}-${m[2]}` : reg;
  };

  // PDF Export using native print optimization window
  const handleExportPDF = () => {
    const isCIA = (activeTab === 'cia1' || activeTab === 'cia2');
    const printWindow = window.open('', '_blank');
    const docTitle = `${subject.code}_${activeTab.toUpperCase()}_CourseFile`;

    if (isCIA) {
      // === HIGH-FIDELITY CIA QUESTION PAPER PDF ===
      const q = parseQuestionsForPDF(content);
      const yearSem = `${toRoman(year)}/${toRoman(semester)}`;
      const academicYear = getAcademicYear();
      const branch = getBranchName(department.id);
      const reg = formatRegulation(regulation);
      const ciaLabel = activeTab === 'cia1' ? 'I' : 'II';

      // Part A rows
      const coMapping = ['CO3','CO3','CO4','CO4','CO4','CO4','CO5','CO5','CO5','CO5'];
      const kxMapping = ['K1','K2','K1','K2','K1','K1','K1','K1','K1','K1'];
      let partARows = '';
      for (let i = 1; i <= 10; i++) {
        partARows += `<tr>
          <td style="width:60px;text-align:center;font-size:10pt;">${i}.</td>
          <td style="font-size:10pt;padding:4px 6px;">${q[`Q${i}`] || ''}</td>
          <td style="width:60px;text-align:center;font-size:9pt;">${coMapping[i-1]}</td>
          <td style="width:50px;text-align:center;font-size:9pt;">${kxMapping[i-1]}</td>
        </tr>`;
      }

      // Part B rows
      const partBData = [
        { qNo: '11a', marks: 16, co: 'CO4', kx: 'K4' },
        { type: 'or' },
        { qNo: '11b', marks: 16, co: 'CO4', kx: 'K4' },
        { qNo: '12a', marks: 16, co: 'CO5', kx: 'K3' },
        { type: 'or' },
        { qNo: '12b', marks: 16, co: 'CO5', kx: 'K3' },
        { qNo: '13a', marks: 8, co: 'CO3', kx: 'K3' },
        { type: 'or' },
        { qNo: '13b', marks: 8, co: 'CO3', kx: 'K3' },
      ];

      let partBRows = '';
      for (const row of partBData) {
        if (row.type === 'or') {
          partBRows += `<tr><td colspan="6" style="text-align:center;font-weight:bold;font-size:10pt;padding:2px;">OR</td></tr>`;
        } else {
          partBRows += `<tr>
            <td style="width:60px;text-align:center;font-size:10pt;">${row.qNo}.</td>
            <td style="font-size:10pt;padding:4px 6px;">${q[`Q${row.qNo}`] || ''}</td>
            <td style="width:60px;text-align:center;font-size:9pt;">${row.marks}</td>
            <td style="width:50px;text-align:center;font-size:9pt;">${row.co}</td>
            <td style="width:50px;text-align:center;font-size:9pt;">${row.kx}</td>
          </tr>`;
        }
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${docTitle}</title>
            <style>
              @page { size: A4; margin: 1.5cm 1cm; }
              body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 10px; font-size: 11pt; }
              table { border-collapse: collapse; width: 100%; }
              .header-cell { text-align: center; padding: 6px; }
              .college-name { font-size: 14pt; font-weight: bold; }
              .auto-inst { font-size: 10pt; }
              .address { font-size: 9pt; }
              .meta-table td { padding: 3px 6px; font-size: 10pt; font-weight: bold; }
              .meta-table .val { font-weight: normal; }
              .cia-header { background: #f2f2f2; text-align: center; font-weight: bold; font-size: 11pt; padding: 6px; }
              .co-table td { padding: 3px 6px; font-size: 10pt; }
              .co-label { font-weight: bold; width: 60px; }
              .section-header { text-align: center; font-weight: bold; font-size: 11pt; padding: 6px; }
              .q-table { margin-top: 8px; }
              .q-table th { font-weight: bold; font-size: 10pt; text-align: center; padding: 4px; background: #fafafa; }
              .q-table td { border: 1px solid #000; vertical-align: top; }
              .q-table th { border: 1px solid #000; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <!-- College Header -->
            <table style="border:none;margin-bottom:4px;">
              <tr>
                <td class="header-cell" style="border:none;">
                  <div class="college-name">SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY</div>
                  <div class="auto-inst">(An Autonomous Institution)</div>
                  <div class="address">Pullipalayam, Morur (Po.), Sankari (Tk.), Salem (Dt.) - 637 304.</div>
                </td>
              </tr>
            </table>

            <!-- CIA Title + Metadata Table -->
            <table style="border:1px solid #000;margin-top:6px;" class="meta-table">
              <tr><td colspan="4" class="cia-header">CONTINUOUS INTERNAL ASSESSMENT – ${ciaLabel}  (CIA- ${ciaLabel})</td></tr>
              <tr>
                <td style="border:1px solid #000;">Year / Sem :</td>
                <td style="border:1px solid #000;" class="val">${yearSem}</td>
                <td style="border:1px solid #000;">Academic Year :</td>
                <td style="border:1px solid #000;" class="val">${academicYear}</td>
              </tr>
              <tr>
                <td style="border:1px solid #000;">Branch / Section :</td>
                <td style="border:1px solid #000;" class="val">${branch}</td>
                <td style="border:1px solid #000;">Date of Exam :</td>
                <td style="border:1px solid #000;" class="val"></td>
              </tr>
              <tr>
                <td style="border:1px solid #000;">Duration :</td>
                <td style="border:1px solid #000;" class="val">100 minutes</td>
                <td style="border:1px solid #000;">Maximum Marks :</td>
                <td style="border:1px solid #000;text-align:center;" class="val">60</td>
              </tr>
              <tr>
                <td style="border:1px solid #000;">Regulations :</td>
                <td style="border:1px solid #000;" class="val">${reg}</td>
                <td style="border:1px solid #000;" colspan="2"></td>
              </tr>
              <tr>
                <td colspan="4" style="border:1px solid #000;font-size:10pt;">COURSE CODE / COURSE NAME: <span class="val">${subject.code} - ${subject.name}</span></td>
              </tr>
            </table>

            <!-- Course Outcomes Table -->
            <table style="border:1px solid #000;margin-top:6px;" class="co-table">
              <tr><td colspan="2" style="border:1px solid #000;text-align:center;font-weight:bold;background:#f2f2f2;">COURSE OUTCOMES</td></tr>
              <tr><td class="co-label" style="border:1px solid #000;">CO3:</td><td style="border:1px solid #000;">Understand and apply the fundamental concepts of the subject.</td></tr>
              <tr><td class="co-label" style="border:1px solid #000;">CO4:</td><td style="border:1px solid #000;">Analyze and evaluate complex problems using subject knowledge.</td></tr>
              <tr><td class="co-label" style="border:1px solid #000;">CO5:</td><td style="border:1px solid #000;">Design and create solutions applying higher-order thinking skills.</td></tr>
            </table>

            <!-- Part A Table -->
            <table class="q-table" style="margin-top:10px;">
              <tr><td colspan="4" class="section-header" style="border:1px solid #000;">ANSWER ALL THE QUESTIONS : PART A (10 x 2 = 20 Marks)</td></tr>
              <tr><th>Q.No</th><th></th><th>CO</th><th>Kx</th></tr>
              ${partARows}
            </table>

            <!-- Part B Table -->
            <table class="q-table" style="margin-top:10px;">
              <tr><td colspan="6" class="section-header" style="border:1px solid #000;">ANSWER ALL THE QUESTIONS : PART B (2x16=32 Marks & 1x8=8 Marks)</td></tr>
              <tr><th>Q.No</th><th></th><th>Marks</th><th>CO</th><th>Kx</th></tr>
              ${partBRows}
            </table>

            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      // === GENERIC PDF for non-CIA tabs ===
      const formattedHtml = renderMarkdownToHtml(content);
      printWindow.document.write(`
        <html>
          <head>
            <title>${docTitle}</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 2.5rem; line-height: 1.6; }
              .header-container { border-bottom: 2px solid #4f46e5; padding-bottom: 1rem; margin-bottom: 2rem; }
              .header-title { font-size: 24px; font-weight: bold; margin: 0; color: #1e293b; }
              .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem; font-size: 14px; color: #64748b; }
              h1, h2, h3 { color: #4f46e5; margin-top: 1.5rem; }
              h1 { font-size: 22px; } h2 { font-size: 18px; } h3 { font-size: 16px; }
              ul { margin-bottom: 1rem; padding-left: 1.5rem; } li { margin-bottom: 0.25rem; }
              @media print { body { padding: 1.5cm; } button { display: none; } }
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
            <div class="content-body">${formattedHtml}</div>
            <script>window.onload = function() { window.print(); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
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
