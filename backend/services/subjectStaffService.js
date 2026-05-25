const fs = require('fs');
const path = require('path');
const db = require('../data/db');

const STAFF_FILE_PATH = path.join(__dirname, '..', '..', 'DOC generation format', 'Subject Staff');

// Normalizes a string by lowercasing and stripping all whitespace and non-alphanumeric characters
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
}

/**
 * Parses the "Subject Staff" text file and extracts a list of { subjectKey: normalized, staffName: string }
 */
function parseStaffFile() {
  try {
    if (!fs.existsSync(STAFF_FILE_PATH)) {
      console.warn(`Subject Staff mapping file not found at: ${STAFF_FILE_PATH}`);
      return [];
    }

    const content = fs.readFileSync(STAFF_FILE_PATH, 'utf8');
    const lines = content.split(/\r?\n/);
    const mappings = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes('-')) return;

      const parts = trimmed.split('-');
      const subjectNameRaw = parts[0].trim();
      const staffName = parts[1].trim();

      mappings.push({
        normalizedName: normalizeString(subjectNameRaw),
        originalName: subjectNameRaw,
        staffName: staffName
      });
    });

    return mappings;
  } catch (error) {
    console.error('Error parsing Subject Staff mapping file:', error);
    return [];
  }
}

/**
 * Resolves a faculty member's name using the Subject Code
 * @param {string} subjectCode - e.g. "23AD534"
 * @returns {string} - The resolved staff name, or a graceful fallback
 */
function resolveStaff(subjectCode) {
  try {
    if (!subjectCode) return 'Course Coordinator';

    // 1. Fetch subject details from database
    const subjects = db.readData('subjects');
    const subject = subjects.find(s => s.code === subjectCode || s.id === subjectCode);
    
    if (!subject) {
      console.warn(`Subject with code ${subjectCode} not found in database.`);
      return 'Course Coordinator';
    }

    // 2. Parse the staff list
    const mappings = parseStaffFile();
    if (mappings.length === 0) {
      return 'Course Coordinator';
    }

    // 3. Normalize selected subject's name (e.g. "UI - UX Design" -> "uiuxdesign")
    const searchKey = normalizeString(subject.name);

    // 4. Find matching entry in the parsed staff file
    // Supports exact, partial, or keyword normalized matching
    const match = mappings.find(m => {
      // Check if one contains the other (fuzzy / substring matching on normalized keys)
      return m.normalizedName.includes(searchKey) || searchKey.includes(m.normalizedName);
    });

    if (match) {
      console.log(`Resolved staff for ${subjectCode} (${subject.name}) ➔ ${match.staffName}`);
      return match.staffName;
    }

    // Graceful secondary fallback: if no direct match, check common keywords (like "safety", "ui", "iot", "disaster")
    const fallbackMatch = mappings.find(m => {
      const keywords = ['safety', 'ui', 'iot', 'disaster', 'ux', 'embedded', 'environmental'];
      for (const kw of keywords) {
        if (m.normalizedName.includes(kw) && searchKey.includes(kw)) {
          return true;
        }
      }
      return false;
    });

    if (fallbackMatch) {
      console.log(`Resolved staff via keyword fallback for ${subjectCode} ➔ ${fallbackMatch.staffName}`);
      return fallbackMatch.staffName;
    }

    console.warn(`Could not resolve faculty mapping for ${subjectCode} (${subject.name}). Using fallback.`);
    return 'Course Coordinator';

  } catch (err) {
    console.error(`Error in resolveStaff for ${subjectCode}:`, err);
    return 'Course Coordinator';
  }
}

module.exports = {
  resolveStaff,
  parseStaffFile
};
