import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Settings, Sparkles, Download, Edit3, Save, RefreshCw, FileText, ArrowLeft, LogOut, Copy, Check, ExternalLink, FileCode } from 'lucide-react';
import { API_BASE_URL } from '../config';

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
  const [assignmentCount, setAssignmentCount] = useState(5);
  const [content, setContent] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [appsScriptCode, setAppsScriptCode] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [directFormState, setDirectFormState] = useState({
    status: 'idle', // idle, auth, creating, success, error
    message: '',
    error: '',
    editUrl: '',
    responderUri: ''
  });
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Dynamically apply fixed viewport dashboard layout class
  useEffect(() => {
    document.body.classList.add('dashboard-layout');
    return () => {
      document.body.classList.remove('dashboard-layout');
    };
  }, []);

  // Manage body scroll locking when modals are active
  useEffect(() => {
    const isModalOpen = showFormModal || directFormState.status !== 'idle' || alertModal.isOpen;
    if (isModalOpen) {
      document.body.classList.add('body-scroll-lock');
    } else {
      document.body.classList.remove('body-scroll-lock');
    }
    return () => {
      document.body.classList.remove('body-scroll-lock');
    };
  }, [showFormModal, directFormState.status, alertModal.isOpen]);

  if (!subject) {
    navigate('/subjects');
    return null;
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    setContent('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.id,
          semester: semester,
          subject: subject, // subject contains { code, name, ... }
          type: activeTab,
          regulation: regulation,
          generatedBy: user?.username || 'faculty',
          assignmentCount: activeTab === 'assignment' ? assignmentCount : undefined
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
    
    return cleaned
      .replace(/[ \t]+/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  };

  // Convert Markdown to HTML for exports
  const renderMarkdownToHtml = (md) => {
    if (!md) return '';
    let cleaned = cleanAllTextOfCOK(md);
    // Quick simple markdown parser for bold, headers, list, etc.
    let html = cleaned
      .replace(/^### (.*$)/gim, '<h3 style="color:#4f46e5; margin-top:20px; font-size:14pt; font-family:\'Times New Roman\', Times, serif;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#4f46e5; margin-top:25px; font-size:16pt; font-family:\'Times New Roman\', Times, serif;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#4f46e5; margin-top:30px; font-size:18pt; font-family:\'Times New Roman\', Times, serif;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 5px; font-family:\'Times New Roman\', Times, serif;">$1</li>')
      // Format MCQ Options (lines starting with option indicators)
      .replace(/^\s*([a-d][\)\.])\s*(.*)$/gim, '<div style="margin-left: 20px; color: #334155; margin-bottom: 3px; font-family:\'Times New Roman\', Times, serif;">$1 $2</div>')
      // Format Correct answer lines
      .replace(/^\s*(Correct\s*:\s*.*)$/gim, '<div style="margin-left: 20px; margin-bottom: 12px; color: #15803d; font-weight: bold; font-family:\'Times New Roman\', Times, serif;">$1</div>')
      // Format Questions lines (lines starting with Q1., Q2., or 1., 2.)
      .replace(/^\s*(Q?\d+[\.\)]\s*.*)$/gim, '<div style="font-weight: bold; margin-top: 15px; margin-bottom: 6px; font-family:\'Times New Roman\', Times, serif;">$1</div>')
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
    } else if (activeTab === 'beyond') {
      // === HIGH-FIDELITY BEYOND SYLLABUS PRINT ===
      const yearSem = `${toRoman(year)}/${toRoman(semester)}`;
      const academicYear = getAcademicYear();
      const branch = getBranchName(department.id);
      
      const ayStart = parseInt(academicYear.split('-')[0], 10);
      const batchStart = ayStart - parseInt(year, 10) + 1;
      const batchEnd = batchStart + 4;
      const batchStr = `${batchStart} – ${batchEnd}`;
      
      // Helper to parse beyond markdown
      const parseBeyondMarkdown = (txt) => {
        const units = [];
        // Match headers like "### Unit I: Title" or "### Unit 1: Title"
        const matches = [...txt.matchAll(/(?:^|\n)\s*###+\s*(Unit\s+[IVX\d]+[:\-\s].*?)(?=\n|$)/gi)];
        
        for (let idx = 0; idx < matches.length; idx++) {
          const header = matches[idx][1].trim();
          const startIdx = matches[idx].index + matches[idx][0].length;
          const endIdx = matches[idx+1] ? matches[idx+1].index : txt.length;
          const unitBody = txt.substring(startIdx, endIdx).trim();
          
          const lines = unitBody.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const topics = [];
          
          for (const line of lines) {
            const m = line.match(/^\s*(\d+)[\.\)]\s*(.*?)\s*[\–\-\—\:]\s*(.*)/);
            if (m) {
              topics.push({
                num: m[1].trim(),
                name: m[2].replace(/\*+|_+/g, '').trim(),
                desc: m[3].replace(/\*+|_+/g, '').trim()
              });
            } else {
              const m_fallback = line.match(/^\s*(\d+)[\.\)]\s*(.*)/);
              if (m_fallback) {
                const fullText = m_fallback[2].replace(/\*+|_+/g, '').trim();
                const parts = fullText.split("  ", 2);
                topics.push({
                  num: m_fallback[1].trim(),
                  name: parts[0].trim(),
                  desc: parts[1] ? parts[1].trim() : ""
                });
              }
            }
          }
          
          const titleParts = header.split(':');
          const unitTitle = titleParts[1] ? titleParts[1].replace(/\*+|_+/g, '').trim() : header.replace(/\*+|_+/g, '').trim();
          
          units.push({
            title: unitTitle,
            topics: topics
          });
        }
        return units;
      };

      const parsedUnits = parseBeyondMarkdown(content);
      const romanNums = ["I", "II", "III", "IV", "V"];
      
      let unitsHtml = '';
      parsedUnits.forEach((unit, uIdx) => {
        const roman = romanNums[uIdx] || String(uIdx + 1);
        unitsHtml += `
          <div class="unit-container" style="page-break-inside: avoid; margin-bottom: 12px;">
            <div class="unit-title" style="text-align: center; font-weight: bold; font-size: 11pt; margin-top: 15px; margin-bottom: 4px; text-transform: uppercase;">UNIT ${roman} – ${unit.title.toUpperCase()}</div>
            <div class="beyond-label" style="font-weight: bold; font-size: 11pt; margin-bottom: 4px;">Beyond-the-Syllabus Topics:</div>
            <div class="topics-list">
              ${unit.topics.map(t => `
                <div class="topic-item" style="margin-bottom: 4px; text-align: justify; font-size: 11pt;">
                  <span class="topic-num-name" style="font-weight: bold;">${t.num}. ${t.name}</span>
                  <span class="topic-divider">–</span>
                  <span class="topic-desc">${t.desc}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      });

      const staffName = subject.staffName || 'R.ASHA';

      printWindow.document.write(`
        <html>
          <head>
            <title>${docTitle}</title>
            <style>
              @page { size: A4; margin: 2cm 1.5cm; }
              body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 0; font-size: 11pt; line-height: 1.4; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <!-- College Header -->
            <div class="header-container" style="text-align: center; margin-bottom: 15px;">
              <div class="college-name" style="font-size: 14pt; font-weight: bold; margin-bottom: 2px;">SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY</div>
              <div class="dept-name" style="font-size: 12pt; font-weight: bold; margin-bottom: 2px;">DEPARTMENT OF ${branch.toUpperCase()}</div>
              <div class="doc-title" style="font-size: 12pt; font-weight: bold; margin-bottom: 2px;">Content Beyond Syllabus</div>
              <div class="academic-year" style="font-size: 11pt; font-weight: bold; margin-bottom: 10px;">Academic Year (${academicYear})</div>
            </div>

            <!-- Metadata Details -->
            <table class="meta-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
              <tr>
                <td style="font-weight: bold; width: 220px; padding: 3px 0; vertical-align: top;">Name of the Faculty :</td>
                <td style="padding: 3px 0; vertical-align: top;">${staffName}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 3px 0; vertical-align: top;">Subject Code / Subject Name :</td>
                <td style="padding: 3px 0; vertical-align: top;">${subject.code} / ${subject.name}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 3px 0; vertical-align: top;">Year / Semester :</td>
                <td style="padding: 3px 0; vertical-align: top;">${yearSem}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 3px 0; vertical-align: top;">Batch :</td>
                <td style="padding: 3px 0; vertical-align: top;">${batchStr}</td>
              </tr>
            </table>

            <!-- Content Area -->
            <div class="content-area">
              ${unitsHtml}
            </div>

            <!-- Footer Sign-off -->
            <div class="footer-signoff" style="margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold; font-size: 11pt; page-break-inside: avoid;">
              <div>COURSE INSTRUCTOR</div>
              <div>HOD</div>
            </div>
            
            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else if (activeTab === 'hots' || activeTab === 'assignment') {
      // === HIGH-FIDELITY HOTS & ASSIGNMENT PRINT ===
      const yearSem = `${toRoman(year)}/${toRoman(semester)}`;
      const academicYear = getAcademicYear();
      
      const getFullBranchName = (dept) => {
        if (!dept) return '';
        const name = dept.name || '';
        return name.replace(/^Department of\s+/i, '').toUpperCase();
      };
      
      const ayStart = parseInt(academicYear.split('-')[0], 10);
      const batchStart = ayStart - parseInt(year, 10) + 1;
      const batchEnd = batchStart + 4;
      const batchStr = `${batchStart} – ${batchEnd}`;
      
      const parseHotsMarkdown = (txt) => {
        const units = [];
        const matches = [...txt.matchAll(/(?:^|\n)\s*###+\s*(Unit\s+[IVX\d]+[:\-\s].*?)(?=\n|$)/gi)];
        
        for (let idx = 0; idx < matches.length; idx++) {
          const header = matches[idx][1].trim();
          const startIdx = matches[idx].index + matches[idx][0].length;
          const endIdx = matches[idx+1] ? matches[idx+1].index : txt.length;
          const unitBody = txt.substring(startIdx, endIdx).trim();
          
          const lines = unitBody.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const questions = [];
          
          for (const line of lines) {
            const m = line.match(/^\s*(\d+)[\.\)]\s*(.*)/);
            if (m) {
              questions.push({
                num: m[1].trim(),
                text: m[2].replace(/\*+|_+/g, '').trim()
              });
            }
          }
          
          const titleParts = header.split(':');
          const unitTitle = titleParts[1] ? titleParts[1].replace(/\*+|_+/g, '').trim() : header.replace(/\*+|_+/g, '').trim();
          
          units.push({
            title: unitTitle,
            questions: questions
          });
        }
        return units;
      };
      
      const parseAssignmentMarkdown = (txt) => {
        const lines = txt.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const questions = [];
        for (const line of lines) {
          const m = line.match(/^\s*(\d+)[\.\)]\s*(.*)/);
          if (m) {
            questions.push({
              num: m[1].trim(),
              text: m[2].replace(/\*+|_+/g, '').trim()
            });
          }
        }
        return questions;
      };
      
      let contentHtml = '';
      if (activeTab === 'hots') {
        const units = parseHotsMarkdown(content);
        const romanNums = ["I", "II", "III", "IV", "V"];
        
        units.forEach((unit, uIdx) => {
          const roman = romanNums[uIdx] || String(uIdx + 1);
          contentHtml += `
            <div class="unit-title">UNIT ${roman} – ${unit.title.toUpperCase()}</div>
            <div class="questions-list">
              ${unit.questions.map(q => `
                <div class="question-p">
                  ${q.num}. ${q.text}
                </div>
              `).join('')}
            </div>
          `;
        });
      } else {
        const questions = parseAssignmentMarkdown(content);
        contentHtml += '<div class="questions-list" style="margin-top: 20px;">';
        questions.forEach(q => {
          contentHtml += `
            <div class="question-p">
              ${q.num}. ${q.text}
            </div>
          `;
        });
        contentHtml += '</div>';
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>${docTitle}</title>
            <style>
              @page { size: A4; margin: 1.5cm 1cm; }
              body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 10px; font-size: 11pt; line-height: 1.2; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
              td { padding: 4px 6px; font-size: 11pt; font-family: 'Times New Roman', Times, serif; }
              .logo-table td { border: none; padding: 0; vertical-align: middle; }
              .meta-table { border: 1px solid #000; width: 100%; }
              .meta-table td { border: 1px solid #000; font-weight: bold; }
              .meta-table td.val { font-weight: normal; }
              .title-p { text-align: center; font-weight: bold; font-size: 12pt; margin: 15px 0 5px 0; }
              .dept-p { text-align: center; font-weight: bold; font-size: 11pt; margin: 5px 0; text-transform: uppercase; }
              .ay-p { text-align: center; font-weight: bold; font-size: 11pt; margin: 5px 0 15px 0; }
              .unit-title { text-align: center; font-weight: bold; font-size: 11pt; margin: 25px 0 10px 0; text-transform: uppercase; }
              .question-p { text-align: justify; font-size: 11pt; margin-bottom: 12pt; margin-top: 0; line-height: 1.15; }
              .footer-signoff { margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold; font-size: 11pt; page-break-inside: avoid; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <!-- College Header -->
            <table class="logo-table">
              <tr>
                <td style="width: 80px; text-align: center;">
                  <img src="/logo.png" style="width: 70px; height: auto;" alt="Logo" />
                </td>
                <td style="text-align: center; padding-left: 10px;">
                  <div style="font-size: 14pt; font-weight: bold; font-family: 'Times New Roman', Times, serif; line-height: 1.3;">SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY</div>
                  <div style="font-size: 10pt; font-family: 'Times New Roman', Times, serif; font-weight: normal; margin-top: 2px;">(An Autonomous Institution)</div>
                  <div style="font-size: 9pt; font-family: 'Times New Roman', Times, serif; font-weight: normal; margin-top: 2px;">Pullipalayam, Morur (Po.), Sankari (Tk.), Salem (Dt.) - 637 304.</div>
                </td>
              </tr>
            </table>

            <!-- Department and Title -->
            <div class="dept-p">DEPARTMENT OF ${getFullBranchName(department)}</div>
            <div class="title-p">${activeTab === 'hots' ? 'HOTS (Higher Order Thinking Skills) Questions' : 'Assignment Questions'}</div>
            <div class="ay-p">Academic Year (${academicYear})</div>

            <!-- Metadata Details Table -->
            <table class="meta-table">
              <tr>
                <td style="width: 35%; border: 1px solid #000;">Name of the Faculty :</td>
                <td class="val" style="width: 65%; border: 1px solid #000;">${subject.staffName || 'Faculty member'}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000;">Subject Code / Subject Name :</td>
                <td class="val" style="border: 1px solid #000;">${subject.code} / ${subject.name}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000;">Year / Semester :</td>
                <td class="val" style="border: 1px solid #000;">${yearSem}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000;">Batch :</td>
                <td class="val" style="border: 1px solid #000;">${batchStr}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000;">Regulations :</td>
                <td class="val" style="border: 1px solid #000;">${formatRegulation(regulation)}</td>
              </tr>
            </table>

            <!-- Questions Area -->
            <div class="content-area">
              ${contentHtml}
            </div>

            <!-- Footer Sign-off -->
            <div class="footer-signoff">
              <div>COURSE INSTRUCTOR</div>
              <div>HOD</div>
            </div>
            
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
              body { font-family: 'Times New Roman', Times, serif; color: #1e293b; padding: 2.5rem; line-height: 1.6; }
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
      const response = await fetch(`${API_BASE_URL}/api/export`, {
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
      setAlertModal({
        isOpen: true,
        title: 'Download Failed',
        message: 'Failed to download official formatted document. Is the backend running?'
      });
    }
  };

  const handleExportGoogleForm = async () => {
    setIsGeneratingScript(true);
    setShowFormModal(true);
    setIsCopied(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/export-google-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: subject.code,
          subjectName: subject.name,
          content: content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate Google Form script');
      }
      
      const data = await response.json();
      if (data.success) {
        setAppsScriptCode(data.script);
      } else {
        throw new Error(data.error || 'Failed to generate script');
      }
    } catch (error) {
      console.error("Error generating Google Form script:", error);
      setAppsScriptCode(`// Error: Failed to generate script.\n// Details: ${error.message}\n// Please make sure the backend is running.`);
    } finally {
      setIsGeneratingScript(false);
    }
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleDownloadScript = () => {
    const blob = new Blob([appsScriptCode], { type: 'text/javascript' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${subject.code}_GoogleFormQuiz.gs`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeDirectCreation = async (token) => {
    setDirectFormState({
      status: 'creating',
      message: 'Analyzing AI-generated quiz questions & structures...',
      error: '',
      editUrl: '',
      responderUri: ''
    });
    
    try {
      const progressMessages = [
        'Creating a new, empty Form on your Google Account...',
        'Converting MCQs to Google Forms compatible schemas...',
        'Injecting Name & Register Number required metadata fields...',
        'Adding 15 structured MCQs with choices and correct answers...',
        'Enabling Quiz Mode, setting 2 points per MCQ, and finalizing...'
      ];
      
      let messageIndex = 0;
      const intervalId = setInterval(() => {
        if (messageIndex < progressMessages.length) {
          setDirectFormState(prev => {
            if (prev.status === 'creating') {
              return { ...prev, message: progressMessages[messageIndex++] };
            }
            return prev;
          });
        }
      }, 1500);
      
      const response = await fetch(`${API_BASE_URL}/api/create-google-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: token,
          subjectCode: subject.code,
          subjectName: subject.name,
          content: content
        })
      });
      
      clearInterval(intervalId);
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to create Google Form directly.');
      }
      
      setDirectFormState({
        status: 'success',
        message: 'Successfully generated and published your Google Form Quiz!',
        error: '',
        editUrl: data.editUrl,
        responderUri: data.responderUri
      });
      
      window.open(data.editUrl, '_blank');
      
    } catch (err) {
      console.error('Execution creation failed:', err);
      setDirectFormState({
        status: 'error',
        message: '',
        error: err.message || 'Failed to complete direct Google Form creation.',
        editUrl: '',
        responderUri: ''
      });
    }
  };

  const handleDirectCreateForm = async () => {
    setDirectFormState({
      status: 'auth',
      message: 'Initializing Google Sign-in connection...',
      error: '',
      editUrl: '',
      responderUri: ''
    });
    
    try {
      const configRes = await fetch(`${API_BASE_URL}/api/auth/config`);
      const configData = await configRes.json();
      
      if (!configRes.ok || !configData.success || !configData.googleClientId) {
        throw new Error('Could not retrieve Google Client ID from backend server.');
      }
      
      const clientId = configData.googleClientId;
      
      setDirectFormState(prev => ({
        ...prev,
        message: 'Opening Google authorization prompt for Forms & Drive access...'
      }));
      
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        throw new Error('Google Identity Services SDK is not loaded. Please refresh the page.');
      }
      
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/drive.file',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Google authorization error:', tokenResponse);
            setDirectFormState({
              status: 'error',
              message: '',
              error: `Authorization failed: ${tokenResponse.error_description || tokenResponse.error}`,
              editUrl: '',
              responderUri: ''
            });
            return;
          }
          
          if (tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            await executeDirectCreation(token);
          } else {
            throw new Error('No access token returned from Google authentication.');
          }
        },
        error_callback: (err) => {
          console.error('GIS Error:', err);
          setDirectFormState({
            status: 'error',
            message: '',
            error: `Google Identity Services error: ${err.message || JSON.stringify(err)}`,
            editUrl: '',
            responderUri: ''
          });
        }
      });
      
      tokenClient.requestAccessToken();
      
    } catch (err) {
      console.error('Direct Form Creation error:', err);
      setDirectFormState({
        status: 'error',
        message: '',
        error: err.message || 'An unexpected error occurred during direct Form creation.',
        editUrl: '',
        responderUri: ''
      });
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
              onClick={() => { setActiveTab(tab.id); setContent(''); }}
            >
              <FileText size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Workspace */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{TABS.find(t => t.id === activeTab)?.label} Generator</h3>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {content && (
                <>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleExportPDF}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '36px' }}
                  >
                    <Download size={16} /> PDF
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleExportWord}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '36px' }}
                  >
                    <Download size={16} /> Word
                  </button>
                  {activeTab === 'quiz' && (
                    <button 
                      className="btn" 
                      onClick={handleDirectCreateForm} 
                      style={{ 
                        backgroundColor: '#673ab7', 
                        color: '#ffffff', 
                        border: 'none',
                        boxShadow: '0 4px 14px 0 rgba(103, 58, 183, 0.39)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: '0.5rem 1rem', 
                        fontSize: '0.85rem', 
                        height: '36px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(103, 58, 183, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(103, 58, 183, 0.39)';
                      }}
                    >
                      <Sparkles size={16} /> Create Google Form
                    </button>
                  )}
                </>
              )}
              {activeTab === 'assignment' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Questions (Max 200):</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={200} 
                    className="input-field" 
                    style={{ width: '80px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', textAlign: 'center', backgroundColor: 'white', height: '36px' }}
                    value={assignmentCount}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1));
                      setAssignmentCount(val);
                    }}
                  />
                </div>
              )}
              <button 
                className="btn btn-primary" 
                onClick={handleGenerate} 
                disabled={isGenerating}
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', height: '44px' }}
              >
                {isGenerating ? <><RefreshCw size={18} className="spinner" style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }}/> Generating...</> : <><Sparkles size={18} /> Generate AI Content</>}
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
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1rem', color: '#1e293b' }}>
                {content}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Forms Apps Script Modal */}
      {showFormModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          animation: 'fade-in 0.2s ease-out'
        }}>
          <div className="glass-card" style={{
            width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            padding: '2rem', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5' }}>
                <Sparkles size={24} /> Create Google Form Quiz
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }} onClick={() => setShowFormModal(false)}>
                ✕ Close
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.5rem' }}>
              
              {/* Step-by-Step Instructions */}
              <div style={{ padding: '1rem', backgroundColor: 'rgba(79, 70, 229, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                <h4 style={{ fontWeight: 600, color: '#4f46e5', marginBottom: '0.75rem' }}>How to create your Google Form instantly:</h4>
                <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>
                  <li>Click <strong>Copy Code</strong> below to copy the automation script to your clipboard.</li>
                  <li>Open <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>Google Apps Script <ExternalLink size={12} /></a> (or go to Google Drive &gt; New &gt; More &gt; Google Apps Script).</li>
                  <li>Delete any existing template code in the editor, and <strong>paste</strong> the copied code.</li>
                  <li>Click the <strong>Save</strong> (disk) icon, then click the <strong>Run</strong> (triangle) button at the top.</li>
                  <li>Click "Review Permissions" to authorize the script (it's completely secure and runs solely on your own Google Account).</li>
                  <li>The quiz will be created in your Google Drive! The direct links will be printed in the <strong>Execution Log</strong> at the bottom of the editor.</li>
                </ol>
              </div>

              {/* Code Editor Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', borderTopLeftRadius: 'var(--radius-sm)', borderTopRightRadius: 'var(--radius-sm)', padding: '0.5rem 1rem', borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    <FileCode size={14} /> {subject.code}_google_form.gs
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" disabled={isGeneratingScript} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#334155', color: '#f8fafc', border: 'none' }} onClick={handleCopyCode}>
                      {isCopied ? <><Check size={12} style={{ color: '#10b981' }} /> Copied</> : <><Copy size={12} /> Copy Code</>}
                    </button>
                    <button className="btn" disabled={isGeneratingScript} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#334155', color: '#f8fafc', border: 'none' }} onClick={handleDownloadScript}>
                      <Download size={12} /> Download .gs
                    </button>
                  </div>
                </div>
                
                <div style={{ flex: 1, backgroundColor: '#0f172a', borderBottomLeftRadius: 'var(--radius-sm)', borderBottomRightRadius: 'var(--radius-sm)', padding: '1rem', overflow: 'hidden', display: 'flex' }}>
                  {isGeneratingScript ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <RefreshCw size={32} className="spinner" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '0.5rem' }} />
                      <span>Parsing questions and composing automation script...</span>
                    </div>
                  ) : (
                    <pre style={{ flex: 1, overflow: 'auto', margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#38bdf8', whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.4' }}>
                      {appsScriptCode}
                    </pre>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Premium Direct Google Forms Status/Success Modal */}
      {directFormState.status !== 'idle' && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050,
          animation: 'fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* CSS Animation Keyframes for the Premium Modal */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes progress-bar {
              0% { left: -30%; width: 30%; }
              50% { left: 30%; width: 40%; }
              100% { left: 100%; width: 30%; }
            }
            @keyframes scale-up {
              0% { transform: scale(0.7); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes pulse {
              0% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 0.8; }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-6px); }
              40%, 80% { transform: translateX(6px); }
            }
          `}} />
          <div className="glass-card" style={{
            width: '550px',
            padding: '2.5rem',
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: '0 25px 50px -12px rgba(103, 58, 183, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)'
          }}>
            
            {/* 1. AUTHENTICATING / CREATING (Loading State) */}
            {(directFormState.status === 'auth' || directFormState.status === 'creating') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: '50%', border: '4px solid rgba(103, 58, 183, 0.1)',
                    borderTopColor: '#673ab7',
                    animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
                  }} />
                  <div style={{
                    position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px',
                    borderRadius: '50%', border: '4px solid rgba(103, 58, 183, 0.05)',
                    borderBottomColor: '#ab47bc',
                    animation: 'spin 0.8s linear infinite reverse'
                  }} />
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#673ab7'
                  }}>
                    <Sparkles size={28} className="pulse" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
                
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginTop: '0.5rem' }}>
                  Creating Google Form Quiz
                </h3>
                
                <p style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  minHeight: '48px',
                  lineHeight: '1.5',
                  padding: '0 1rem',
                  transition: 'opacity 0.3s ease'
                }}>
                  {directFormState.message}
                </p>
                
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(103, 58, 183, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    height: '100%',
                    backgroundColor: '#673ab7',
                    borderRadius: '3px',
                    width: '60%',
                    left: 0,
                    animation: 'progress-bar 2.5s ease-in-out infinite'
                  }} />
                </div>
                
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This will launch your browser auth popup if not already verified.
                </span>
              </div>
            )}

            {/* 2. SUCCESS STATE */}
            {directFormState.status === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                <div style={{
                  width: '72px', height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#10b981',
                  animation: 'scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                  <Check size={38} strokeWidth={3} />
                </div>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                  Quiz Ready & Published!
                </h3>
                
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', padding: '0 0.5rem', lineHeight: '1.5' }}>
                  The Google Form has been directly built inside your Google Drive. 
                  It includes the complete MCQ questions and answer key automatically graded!
                </p>
                
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginTop: '1rem',
                  marginBottom: '1rem'
                }}>
                  <a 
                    href={directFormState.editUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ 
                      backgroundColor: '#673ab7', 
                      boxShadow: '0 4px 14px 0 rgba(103, 58, 183, 0.39)',
                      width: '100%',
                      textDecoration: 'none'
                    }}
                  >
                    Open in Google Forms <ExternalLink size={16} style={{ marginLeft: '4px' }} />
                  </a>
                  
                  <a 
                    href={directFormState.responderUri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ width: '100%', textDecoration: 'none' }}
                  >
                    View Student Live Link <ExternalLink size={16} style={{ marginLeft: '4px' }} />
                  </a>
                </div>
                
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    padding: '0.5rem 1.5rem', 
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.9rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    color: 'var(--text-secondary)'
                  }} 
                  onClick={() => setDirectFormState({ status: 'idle', message: '', error: '', editUrl: '', responderUri: '' })}
                >
                  ✕ Close & Return
                </button>
              </div>
            )}

            {/* 3. ERROR STATE */}
            {directFormState.status === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                <div style={{
                  width: '72px', height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ef4444',
                  animation: 'shake 0.5s ease'
                }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 'bold', fontFamily: 'inherit' }}>!</span>
                </div>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                  Creation Failed
                </h3>
                
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  color: '#dc2626',
                  fontFamily: 'monospace',
                  width: '100%',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap'
                }}>
                  {directFormState.error}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, backgroundColor: '#673ab7', border: 'none' }}
                    onClick={handleDirectCreateForm}
                  >
                    <RefreshCw size={16} /> Try Again
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => setDirectFormState({ status: 'idle', message: '', error: '', editUrl: '', responderUri: '' })}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* Premium Alert Modal */}
      {alertModal.isOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          animation: 'fade-in 0.2s ease-out'
        }}>
          <div className="glass-card" style={{
            width: '450px',
            padding: '2.5rem',
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              {alertModal.title}
            </h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              {alertModal.message}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })}
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CourseContent;
