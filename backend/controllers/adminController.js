const db = require('../data/db');
const config = require('../config');

// --- DEPARTMENTS ---
exports.getDepartments = (req, res) => {
  const departments = db.readData('departments');
  res.status(200).json({ success: true, departments });
};

exports.addDepartment = (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'Department code (id) and name are required' });
  }

  const departments = db.readData('departments');
  if (departments.some(d => d.id.toUpperCase() === id.toUpperCase())) {
    return res.status(400).json({ error: 'Department code already exists' });
  }

  const newDept = { id: id.toUpperCase(), name };
  departments.push(newDept);
  db.writeData('departments', departments);

  res.status(201).json({ success: true, department: newDept });
};

exports.deleteDepartment = (req, res) => {
  const { id } = req.params;
  let departments = db.readData('departments');
  const initialLength = departments.length;
  
  departments = departments.filter(d => d.id !== id);
  if (departments.length === initialLength) {
    return res.status(404).json({ error: 'Department not found' });
  }

  db.writeData('departments', departments);
  res.status(200).json({ success: true, message: 'Department deleted successfully' });
};

// --- SUBJECTS ---
exports.getSubjects = (req, res) => {
  const { departmentId, semester } = req.query;
  let subjects = db.readData('subjects');

  if (departmentId) {
    subjects = subjects.filter(s => s.departmentId === departmentId);
  }
  if (semester) {
    subjects = subjects.filter(s => s.semester === parseInt(semester, 10));
  }

  res.status(200).json({ success: true, subjects });
};

exports.addSubject = (req, res) => {
  const { code, name, departmentId, semester } = req.body;
  if (!code || !name || !departmentId || !semester) {
    return res.status(400).json({ error: 'Code, name, departmentId, and semester are required' });
  }

  const subjects = db.readData('subjects');
  if (subjects.some(s => s.code.toUpperCase() === code.toUpperCase())) {
    return res.status(400).json({ error: 'Subject code already exists' });
  }

  const newSubject = {
    id: 'SUB' + Date.now(),
    code: code.toUpperCase(),
    name,
    departmentId,
    semester: parseInt(semester, 10)
  };

  subjects.push(newSubject);
  db.writeData('subjects', subjects);

  res.status(201).json({ success: true, subject: newSubject });
};

exports.deleteSubject = (req, res) => {
  const { id } = req.params;
  let subjects = db.readData('subjects');
  const initialLength = subjects.length;

  subjects = subjects.filter(s => s.id !== id && s.code !== id);
  if (subjects.length === initialLength) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  db.writeData('subjects', subjects);
  res.status(200).json({ success: true, message: 'Subject deleted successfully' });
};

// --- REGULATIONS ---
exports.getRegulations = (req, res) => {
  const regulations = db.readData('regulations');
  res.status(200).json({ success: true, regulations });
};

exports.addRegulation = (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'Regulation code (id) and name are required' });
  }

  const regulations = db.readData('regulations');
  if (regulations.some(r => r.id.toUpperCase() === id.toUpperCase())) {
    return res.status(400).json({ error: 'Regulation already exists' });
  }

  const newReg = { id: id.toUpperCase(), name };
  regulations.push(newReg);
  db.writeData('regulations', regulations);

  res.status(201).json({ success: true, regulation: newReg });
};

const isOwner = (name) => {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return lowerName === 'system owner' || 
         lowerName === 'system_owner' || 
         db.hashPassword(lowerName) === config.SYSTEM_OWNER_EMAIL_HASH;
};

// --- GENERATION LOGS & STATS ---
exports.getGenerations = (req, res) => {
  const generations = db.readData('generatedContent');
  const filtered = generations.filter(g => !isOwner(g.generatedBy));
  // Return reversed to show newest generations first
  res.status(200).json({ success: true, generations: [...filtered].reverse() });
};

exports.getStats = (req, res) => {
  try {
    const rawGenerations = db.readData('generatedContent');
    const generations = rawGenerations.filter(g => !isOwner(g.generatedBy));
    const departments = db.readData('departments');
    
    // Total generations count
    const totalGenerations = generations.length;
    
    // Breakdown by type
    const typeCounts = {
      cia1: 0,
      cia2: 0,
      qbank: 0,
      quiz: 0,
      hots: 0,
      assignment: 0,
      beyond: 0
    };
    
    // Breakdown by department
    const deptCounts = {};
    departments.forEach(d => {
      deptCounts[d.id] = 0;
    });

    let totalWords = 0;
    const activeUsers = new Set();

    generations.forEach(gen => {
      // Type breakdown
      if (typeCounts[gen.type] !== undefined) {
        typeCounts[gen.type]++;
      } else {
        typeCounts[gen.type] = 1;
      }

      // Department breakdown
      if (deptCounts[gen.departmentId] !== undefined) {
        deptCounts[gen.departmentId]++;
      } else {
        deptCounts[gen.departmentId] = 1;
      }

      // Word counts
      totalWords += gen.wordCount || 0;

      // Active user auditing
      if (gen.generatedBy) {
        activeUsers.add(gen.generatedBy);
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalGenerations,
        totalWords,
        activeFacultyCount: activeUsers.size,
        typeCounts,
        deptCounts,
        activeUsers: Array.from(activeUsers)
      }
    });

  } catch (error) {
    console.error('Error computing stats:', error);
    res.status(500).json({ error: 'Server error computing dashboard analytics' });
  }
};

exports.getUsers = (req, res) => {
  try {
    const users = db.readData('users');
    const sanitizedUsers = users
      .filter(u => 
        u.role !== 'SYSTEM_OWNER' && 
        !isOwner(u.username) &&
        !isOwner(u.email)
      )
      .map(u => {
        const { password, ...safeUser } = u;
        return safeUser;
      });
    res.status(200).json({ success: true, users: sanitizedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error retrieving users' });
  }
};

