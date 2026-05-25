const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname);

// File Paths
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  departments: path.join(DATA_DIR, 'departments.json'),
  subjects: path.join(DATA_DIR, 'subjects.json'),
  regulations: path.join(DATA_DIR, 'regulations.json'),
  generatedContent: path.join(DATA_DIR, 'generated_content.json')
};

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing utility using native Node.js crypto
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Read database file
function readData(key) {
  const filePath = FILES[key];
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (error) {
    console.error(`Error reading database file ${key}:`, error);
    return [];
  }
}

// Write database file
function writeData(key, data) {
  const filePath = FILES[key];
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing database file ${key}:`, error);
    return false;
  }
}

// Seed Initial Mock Data if files are empty/missing
function initializeDatabase() {
  // 1. Initialize Users (Pre-create default admin and faculty)
  const users = readData('users');
  if (users.length === 0) {
    const defaultUsers = [
      { username: 'admin', password: hashPassword('admin123'), role: 'Admin' },
      { username: 'faculty', password: hashPassword('faculty123'), role: 'Faculty' }
    ];
    writeData('users', defaultUsers);
    console.log('Seeded database with default accounts: admin/admin123 and faculty/faculty123');
  }

  // 2. Initialize Departments
  const departments = readData('departments');
  if (departments.length === 0) {
    const defaultDepts = [
      { id: 'CSE', name: 'Computer Science' },
      { id: 'IT', name: 'Information Technology' },
      { id: 'ECE', name: 'Electronics & Comm' },
      { id: 'MECH', name: 'Mechanical' },
      { id: 'CIVIL', name: 'Civil Engineering' },
      { id: 'AI_DS', name: 'AI & Data Science' },
      { id: 'CYBER', name: 'Cyber Security' },
      { id: 'BME', name: 'Biomedical' }
    ];
    writeData('departments', defaultDepts);
    console.log('Seeded database with default departments');
  }

  // 3. Initialize Regulations
  const regulations = readData('regulations');
  if (regulations.length === 0) {
    const defaultRegs = [
      { id: 'R2021', name: 'Regulation 2021 (Choice Based Credit System)' },
      { id: 'R2023', name: 'Regulation 2023 (Outcome Based Education)' },
      { id: 'R2025', name: 'Regulation 2025 (Next-Gen AI Curriculum)' }
    ];
    writeData('regulations', defaultRegs);
    console.log('Seeded database with default regulations');
  }

  // 4. Initialize Subjects
  const subjects = readData('subjects');
  if (subjects.length === 0) {
    const defaultSubjects = [
      // CSE - Semester 1
      { id: 'CS101', code: 'CS301', name: 'Data Structures and Algorithms', departmentId: 'CSE', semester: 1 },
      { id: 'CS102', code: 'CS302', name: 'Database Management Systems', departmentId: 'CSE', semester: 1 },
      // CSE - Semester 2
      { id: 'CS103', code: 'CS303', name: 'Operating Systems', departmentId: 'CSE', semester: 2 },
      { id: 'CS104', code: 'CS304', name: 'Computer Networks', departmentId: 'CSE', semester: 2 },
      // CSE - Semester 3
      { id: 'CS105', code: 'CS305', name: 'Software Engineering', departmentId: 'CSE', semester: 3 },
      { id: 'CS106', code: 'CS306', name: 'Artificial Intelligence', departmentId: 'CSE', semester: 3 },
      // IT - Semester 1
      { id: 'IT101', code: 'IT301', name: 'Web Programming', departmentId: 'IT', semester: 1 },
      { id: 'IT102', code: 'IT302', name: 'Cloud Computing Infrastructure', departmentId: 'IT', semester: 1 },
      // AI_DS - Semester 1
      { id: 'AI101', code: 'AD301', name: 'Probability and Data Analytics', departmentId: 'AI_DS', semester: 1 },
      { id: 'AI102', code: 'AD302', name: 'Machine Learning Fundamentals', departmentId: 'AI_DS', semester: 1 }
    ];
    writeData('subjects', defaultSubjects);
    console.log('Seeded database with default subjects');
  }

  // Ensure specific syllabus subjects from the PDF folder are present on system launch
  const requiredSyllabusSubjects = [
    { id: 'SUB_UIUX', code: '23AD534', name: 'UI - UX Design', departmentId: 'AI_DS', semester: 6 },
    { id: 'SUB_IOT', code: '23CS412', name: 'Embedded System and IoT', departmentId: 'CSE', semester: 4 },
    { id: 'SUB_SAFETY', code: '23ME601', name: 'Industrial Safety', departmentId: 'MECH', semester: 6 },
    { id: 'SUB_ESDM', code: '23EC602', name: 'Electronics System Design & Manufacturing (ESDM)', departmentId: 'ECE', semester: 6 }
  ];

  let subjectsUpdated = false;
  const currentSubjects = readData('subjects');
  requiredSyllabusSubjects.forEach(reqSubj => {
    if (!currentSubjects.some(s => s.code === reqSubj.code)) {
      currentSubjects.push(reqSubj);
      subjectsUpdated = true;
    }
  });

  if (subjectsUpdated) {
    writeData('subjects', currentSubjects);
    console.log('Injected perspective year/even semester subjects matching the syllabus PDFs');
  }

  // 5. Initialize Empty Generated Content log if missing
  const genContent = readData('generatedContent');
  if (!fs.existsSync(FILES.generatedContent)) {
    writeData('generatedContent', []);
  }
}

// Perform initial seeding
initializeDatabase();

module.exports = {
  readData,
  writeData,
  hashPassword
};
