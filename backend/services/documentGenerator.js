const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const templateService = require('./templateService');
const subjectStaffService = require('./subjectStaffService');

/**
 * Normalizes Markdown to clean plain text with spacing for DOCX rendering
 */
function formatMarkdownForDocx(md) {
  if (!md) return '';
  
  // Clean up any double bold tags or formatting symbols that can look messy in plain text
  return md
    .replace(/\*\*(.*?)\*\*/g, '$1') // Strip bold marks
    .replace(/\*(.*?)\*/g, '$1') // Strip italics marks
    .replace(/_([^_]+)_/g, '$1') // Strip underline marks
    .trim();
}

/**
 * Compiles a premium HTML-wrapped Word document as a high-fidelity fallback
 */
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

    // 1. Resolve staff dynamically using our SubjectStaff service
    const staffName = subjectStaffService.resolveStaff(subjectCode);

    // 2. Format names and parameters
    const displayDept = departmentName || (departmentId ? `${departmentId} Engineering` : 'Academic Department');
    const displayYear = year ? `Year ${year}` : 'N/A';
    const displaySem = semester ? `Sem ${semester}` : 'N/A';
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

    // 3. Prepare replacement placeholders
    const placeholders = {
      SUBJECT_CODE: subjectCode,
      SUBJECT_NAME: subjectName || 'Academic Subject',
      STAFF_NAME: staffName,
      DEPARTMENT: displayDept,
      REGULATION: regulation || 'N/A',
      YEAR: displayYear,
      SEMESTER: displaySem,
      GENERATION_DATE: displayDate,
      DOCUMENT_TYPE: docTypeLabel,
      CONTENT: formatMarkdownForDocx(content)
    };

    const docName = `${subjectCode}_${type.toUpperCase()}_Formatted`;

    // 4. Try template-based compiled DOCX rendering
    const hasDocxTemplate = templateService.hasTemplate(type);
    if (hasDocxTemplate) {
      console.log(`Loading official DOCX template for type ${type}...`);
      const templateBuffer = templateService.getTemplateBuffer(type);
      
      if (templateBuffer) {
        // Load zip archive
        const zip = new PizZip(templateBuffer);
        
        // Load docxtemplater engine with linebreak mapping enabled
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Perform tag replacement
        doc.render(placeholders);

        // Get compiled node zip buffer
        const outputBuffer = doc.getZip().generate({
          type: 'nodebuffer'
        });

        console.log(`Successfully generated dynamic DOCX file: ${docName}.docx`);
        return {
          buffer: outputBuffer,
          filename: `${docName}.docx`,
          isFallback: false
        };
      }
    }

    // 5. Safe Graceful Fallback: Build beautiful HTML-wrapped Word document if DOCX template is missing
    console.log(`DOCX Template missing/incompatible for type ${type}. Executing high-fidelity HTML-Word compilation...`);
    const htmlFallback = compileHtmlWordFallback(placeholders);
    const outputBuffer = Buffer.from(htmlFallback, 'utf8');

    return {
      buffer: outputBuffer,
      filename: `${docName}.doc`, // standard compatible extension
      isFallback: true
    };

  } catch (error) {
    console.error('Error generating template-driven document:', error);
    throw error;
  }
}

module.exports = {
  generateDocument
};
