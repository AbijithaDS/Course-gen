const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'DOC generation format');

// Maps dynamic document types to their respective DOCX template files
const TEMPLATE_MAP = {
  cia1: 'Cia 1,2 - demo format.docx',
  cia2: 'Cia 1,2 - demo format.docx',
  qbank: 'demo for question bank.docx',
  // fallback placeholders for other formats
  quiz: 'demo for question bank.docx',
  hots: 'Cia 1,2 - demo format.docx',
  assignment: 'demo for question bank.docx',
  beyond: 'Cia 1,2 - demo format.docx' 
};

/**
 * Checks if a specific DOCX template file exists on disk
 * @param {string} type - e.g. "cia1", "qbank"
 * @returns {boolean}
 */
function hasTemplate(type) {
  const fileName = TEMPLATE_MAP[type];
  if (!fileName) return false;
  
  const fullPath = path.join(TEMPLATES_DIR, fileName);
  return fs.existsSync(fullPath);
}

/**
 * Returns the absolute path of the template file
 * @param {string} type
 * @returns {string}
 */
function getTemplatePath(type) {
  const fileName = TEMPLATE_MAP[type] || 'Cia 1,2 - demo format.docx';
  return path.join(TEMPLATES_DIR, fileName);
}

/**
 * Loads the template DOCX file as binary/buffer content
 * @param {string} type
 * @returns {Buffer|null}
 */
function getTemplateBuffer(type) {
  try {
    const filePath = getTemplatePath(type);
    if (!fs.existsSync(filePath)) {
      console.warn(`Template file for type ${type} not found at: ${filePath}`);
      return null;
    }
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error(`Error loading template buffer for ${type}:`, error);
    return null;
  }
}

module.exports = {
  hasTemplate,
  getTemplatePath,
  getTemplateBuffer,
  TEMPLATES_DIR
};
