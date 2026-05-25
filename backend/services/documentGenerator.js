const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const templateService = require('./templateService');
const subjectStaffService = require('./subjectStaffService');

/**
 * Cleans CO and K references from the text to prevent duplication in dedicated columns.
 */
function cleanAllTextOfCOK(text) {
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
}

/**
 * Normalizes Markdown to clean plain text for DOCX rendering and strips CO/K mappings.
 */
function formatMarkdownForDocx(md) {
  if (!md) return '';
  let text = md
    .replace(/\*\*(.*?)\*\*/g, '$1') // Strip bold marks
    .replace(/\*(.*?)\*/g, '$1')     // Strip italics marks
    .replace(/_([^_]+)_/g, '$1')     // Strip underline marks
    .trim();
    
  return cleanAllTextOfCOK(text);
}

// =====================================================================
// QUESTION PARSER — Extracts individual questions from AI-generated text
// =====================================================================

/**
 * Parses AI-generated CIA question paper markdown into individual question placeholders.
 * Returns an object like { Q1: "...", Q2: "...", ..., Q10: "...", Q11a: "...", ..., Q13b: "..." }
 */
function parseQuestions(content) {
  const questions = {};
  if (!content) return questions;

  // Split into sections
  const partAIdx = content.search(/Part\s*A/i);
  const partBIdx = content.search(/Part\s*B/i);
  const partCIdx = content.search(/Part\s*C/i);

  let partAText = '';
  let partBText = '';

  if (partAIdx !== -1) {
    if (partBIdx !== -1) {
      partAText = content.substring(partAIdx, partBIdx);
      if (partCIdx !== -1) {
        partBText = content.substring(partBIdx, partCIdx) + '\n' + content.substring(partCIdx);
      } else {
        partBText = content.substring(partBIdx);
      }
    } else {
      partAText = content.substring(partAIdx);
    }
  } else {
    partAText = content;
    partBText = content;
  }

  const cleanOption = (txt) => {
    if (!txt) return '';
    let cleaned = formatMarkdownForDocx(txt);
    // Remove any trailing/internal "Part C" headings, marks declarations, or instructions
    cleaned = cleaned.replace(/(?:^|\n)\s*#+\s*Part\s*[A-Z].*$/gim, '');
    cleaned = cleaned.replace(/(?:^|\n)\s*\*?\(?Answer\s+(?:all|either|any).*$/gim, '');
    cleaned = cleaned.replace(/(?:^|\n)\s*\*?\(?\d+\s*x\s*\d+\s*=\s*\d+\s*Marks.*$/gim, '');
    cleaned = cleaned.replace(/(?:^|\n)\s*-+\s*$/gm, '');
    return formatMarkdownForDocx(cleaned);
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
          questions[`Q${i}`] = formatMarkdownForDocx(m[1]);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  // --- Parse Part B ---
  const findQuestionSegment = (text, num) => {
    const startRegex = new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${num}\\b`, 'i');
    const startMatch = text.match(startRegex);
    if (!startMatch) return '';

    const startIdx = startMatch.index + startMatch[0].length;
    const nextNum = num + 1;
    const endRegex = new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${nextNum}\\b`, 'i');
    const endMatch = text.match(endRegex);

    if (endMatch) {
      return text.substring(startMatch.index, endMatch.index);
    } else {
      return text.substring(startMatch.index);
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
}

// =====================================================================
// METADATA RESOLVERS — Dynamic placeholders for the official template
// =====================================================================

/**
 * Converts year/semester numbers to Roman numerals for the YEAR_SEM field
 * Example: year=3, semester=6 → "III/VI"
 */
function toRoman(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return String(num);
  const romanMap = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  let remaining = n;
  for (const [value, symbol] of romanMap) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

/**
 * Builds the YEAR_SEM string like "III/VI" from year and semester
 */
function resolveYearSem(year, semester) {
  const y = parseInt(year, 10);
  const s = parseInt(semester, 10);
  if (isNaN(y) && isNaN(s)) return 'N/A';
  const yearRoman = !isNaN(y) ? toRoman(y) : '';
  const semRoman = !isNaN(s) ? toRoman(s) : '';
  if (yearRoman && semRoman) return `${yearRoman}/${semRoman}`;
  if (semRoman) return semRoman;
  return yearRoman || 'N/A';
}

/**
 * Computes academic year string like "2025-2026"
 */
function resolveAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // Academic year starts in June/July
  if (month >= 5) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Maps department ID to display branch name
 */
function resolveBranch(departmentId, departmentName) {
  const branchMap = {
    'AI_DS': 'AI&DS',
    'AIDS': 'AI&DS',
    'CSE': 'CSE',
    'IT': 'IT',
    'ECE': 'ECE',
    'EEE': 'EEE',
    'MECH': 'MECH',
    'CIVIL': 'CIVIL',
    'BME': 'BME',
  };
  return branchMap[departmentId] || departmentName || departmentId || 'N/A';
}

/**
 * Formats regulation display string (e.g., "R2023" → "R-2023")
 */
function resolveRegulation(regulation) {
  if (!regulation) return 'N/A';
  // If already has hyphen, return as-is
  if (regulation.includes('-')) return regulation;
  // Insert hyphen after 'R' prefix
  const match = regulation.match(/^(R)(\d+)$/i);
  if (match) return `${match[1]}-${match[2]}`;
  return regulation;
}

// =====================================================================
// HTML WORD FALLBACK — For non-CIA document types
// =====================================================================

function compileHtmlWordFallback(data) {
  const formattedContent = data.content
    .replace(/^### (.*$)/gim, '<h3 style="color:#4f46e5; margin-top:20px; font-size:14pt;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#4f46e5; margin-top:25px; font-size:16pt;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#4f46e5; margin-top:30px; font-size:18pt;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 5px;">$1</li>')
    .replace(/\n/gim, '<br />');

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${data.SUBJECT_CODE} Assessment</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            font-size: 11pt; 
            color: #1e293b;
            line-height: 1.5; 
          }
          .header-table { 
            width: 100%; 
            border-bottom: 2px solid #4f46e5; 
            margin-bottom: 30px; 
            padding-bottom: 10px; 
          }
          .college-title {
            font-size: 16pt;
            font-weight: bold;
            color: #1e293b;
            text-align: center;
            text-transform: uppercase;
          }
          .dept-title {
            font-size: 12pt;
            font-weight: bold;
            color: #4f46e5;
            text-align: center;
            text-transform: uppercase;
            margin-top: 5px;
          }
          .meta-table {
            width: 100%;
            margin-top: 15px;
            font-size: 10pt;
            color: #4f5e71;
            border-collapse: collapse;
          }
          .meta-table td {
            padding: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="college-title">Sri Shanmugha College of Engineering and Technology</div>
        <div class="dept-title">Department of ${data.DEPARTMENT}</div>
        
        <table class="meta-table">
          <tr>
            <td><strong>Subject:</strong> ${data.SUBJECT_CODE} - ${data.SUBJECT_NAME}</td>
            <td align="right"><strong>Staff In-Charge:</strong> ${data.STAFF_NAME}</td>
          </tr>
          <tr>
            <td><strong>Regulation:</strong> ${data.REGULATION} | <strong>Semester:</strong> Sem ${data.SEMESTER}</td>
            <td align="right"><strong>Date:</strong> ${data.GENERATION_DATE}</td>
          </tr>
          <tr>
            <td><strong>Assessment Type:</strong> ${data.DOCUMENT_TYPE}</td>
            <td align="right"><strong>Academic Year:</strong> ${data.YEAR}</td>
          </tr>
        </table>
        
        <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
        
        <div class="content-area">
          ${formattedContent}
        </div>
      </body>
    </html>
  `;
}

// =====================================================================
// CORE DOCUMENT GENERATOR
// =====================================================================

/**
 * Core generation service merging content, database values, and templates
 * @param {object} payload - The generation details
 * @returns {object} - { buffer: Buffer, filename: string, isFallback: boolean }
 */
function generateDocument(payload) {
  try {
    const { 
      subjectCode, 
      subjectName, 
      departmentId, 
      departmentName, 
      semester, 
      regulation, 
      year, 
      type, 
      content 
    } = payload;

    if (!subjectCode || !content) {
      throw new Error('Subject code and content are required for document compilation.');
    }

    // 1. Resolve staff dynamically
    const staffName = subjectStaffService.resolveStaff(subjectCode);

    // 2. Format names and parameters
    const displayDept = departmentName || (departmentId ? `${departmentId} Engineering` : 'Academic Department');
    const displayDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const docTypeLabel = {
      cia1: 'Continuous Internal Assessment 1 (CIA 1)',
      cia2: 'Continuous Internal Assessment 2 (CIA 2)',
      qbank: 'Academic Question Bank',
      quiz: 'Classroom Quiz',
      hots: 'Higher Order Thinking Skills (HOTS)',
      assignment: 'Practical Assignment',
      beyond: 'Beyond Syllabus Content'
    }[type] || type.toUpperCase();

    const docName = `${subjectCode}_${type.toUpperCase()}_Formatted`;

    // 3. Check if this is a CIA type that uses the official template with question parsing
    const isCIA = (type === 'cia1' || type === 'cia2');

    if (isCIA) {
      // CIA-specific: parse questions and fill the official template
      console.log(`Generating CIA document with official template for type ${type}...`);

      // Parse individual questions from AI output
      const parsedQuestions = parseQuestions(content);
      console.log(`Parsed questions: ${Object.keys(parsedQuestions).join(', ')}`);

      // Build the full placeholder map for docxtemplater
      const placeholders = {
        // Metadata fields
        YEAR_SEM: resolveYearSem(year, semester),
        ACADEMIC_YEAR: resolveAcademicYear(),
        BRANCH: resolveBranch(departmentId, departmentName),
        DURATION: '100 minutes',
        MAX_MARKS: '60',
        REGULATION: resolveRegulation(regulation),
        SUBJECT_CODE: subjectCode,
        SUBJECT_NAME: subjectName || 'Academic Subject',

        // Course outcomes (placeholder descriptions — can be customized per subject)
        CO3_DESC: 'Understand and apply the fundamental concepts of the subject.',
        CO4_DESC: 'Analyze and evaluate complex problems using subject knowledge.',
        CO5_DESC: 'Design and create solutions applying higher-order thinking skills.',

        // Part A questions (Q1 to Q10)
        Q1: parsedQuestions.Q1 || '',
        Q2: parsedQuestions.Q2 || '',
        Q3: parsedQuestions.Q3 || '',
        Q4: parsedQuestions.Q4 || '',
        Q5: parsedQuestions.Q5 || '',
        Q6: parsedQuestions.Q6 || '',
        Q7: parsedQuestions.Q7 || '',
        Q8: parsedQuestions.Q8 || '',
        Q9: parsedQuestions.Q9 || '',
        Q10: parsedQuestions.Q10 || '',

        // Part B questions (Q11a to Q13b)
        Q11a: parsedQuestions.Q11a || '',
        Q11b: parsedQuestions.Q11b || '',
        Q12a: parsedQuestions.Q12a || '',
        Q12b: parsedQuestions.Q12b || '',
        Q13a: parsedQuestions.Q13a || '',
        Q13b: parsedQuestions.Q13b || '',
      };

      // Load the official template
      const templateBuffer = templateService.getTemplateBuffer(type);
      if (templateBuffer) {
        const zip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        doc.render(placeholders);

        const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });
        console.log(`Successfully generated CIA document: ${docName}.docx`);
        
        return {
          buffer: outputBuffer,
          filename: `${docName}.docx`,
          isFallback: false
        };
      }

      // If template file not found, fall through to HTML fallback
      console.warn('CIA template not found, falling back to HTML Word document...');
    }

    // 4. Non-CIA types or fallback: Try generic template-based rendering
    const hasDocxTemplate = templateService.hasTemplate(type);
    if (hasDocxTemplate && !isCIA) {
      console.log(`Loading generic DOCX template for type ${type}...`);
      const templateBuffer = templateService.getTemplateBuffer(type);
      
      if (templateBuffer) {
        const placeholders = {
          SUBJECT_CODE: subjectCode,
          SUBJECT_NAME: subjectName || 'Academic Subject',
          STAFF_NAME: staffName,
          DEPARTMENT: displayDept,
          REGULATION: regulation || 'N/A',
          YEAR: year ? `Year ${year}` : 'N/A',
          SEMESTER: semester ? `Sem ${semester}` : 'N/A',
          GENERATION_DATE: displayDate,
          DOCUMENT_TYPE: docTypeLabel,
          CONTENT: formatMarkdownForDocx(content)
        };

        const zip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        doc.render(placeholders);

        const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });
        console.log(`Successfully generated DOCX: ${docName}.docx`);
        return {
          buffer: outputBuffer,
          filename: `${docName}.docx`,
          isFallback: false
        };
      }
    }

    // 5. HTML Word fallback
    console.log(`Executing HTML-Word fallback for type ${type}...`);
    const fallbackPlaceholders = {
      SUBJECT_CODE: subjectCode,
      SUBJECT_NAME: subjectName || 'Academic Subject',
      STAFF_NAME: staffName,
      DEPARTMENT: displayDept,
      REGULATION: regulation || 'N/A',
      YEAR: year ? `Year ${year}` : 'N/A',
      SEMESTER: semester ? `Sem ${semester}` : 'N/A',
      GENERATION_DATE: displayDate,
      DOCUMENT_TYPE: docTypeLabel,
      content: cleanAllTextOfCOK(content)
    };
    const htmlFallback = compileHtmlWordFallback(fallbackPlaceholders);
    const outputBuffer = Buffer.from(htmlFallback, 'utf8');

    return {
      buffer: outputBuffer,
      filename: `${docName}.doc`,
      isFallback: true
    };

  } catch (error) {
    console.error('Error generating template-driven document:', error);
    throw error;
  }
}

module.exports = {
  generateDocument,
  parseQuestions  // exported for testing
};
