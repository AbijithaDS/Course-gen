import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  BarChart2, 
  Layers, 
  Book, 
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  LogOut, 
  RefreshCw, 
  Search, 
  User, 
  Calendar,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logoutUser } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('monitor');
  const [stats, setStats] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [regulations, setRegulations] = useState([]);

  // Load flags
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingGens, setLoadingGens] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingSubjs, setLoadingSubjs] = useState(false);

  // Form states
  const [newDeptId, setNewDeptId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjDept, setNewSubjDept] = useState('');
  const [newSubjSem, setNewSubjSem] = useState(1);
  
  // Search & view modal states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGen, setSelectedGen] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Advanced Filtering System state variables
  const [filterType, setFilterType] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterReg, setFilterReg] = useState('all');

  // Dynamically apply fixed viewport dashboard layout class
  useEffect(() => {
    document.body.classList.add('dashboard-layout');
    return () => {
      document.body.classList.remove('dashboard-layout');
    };
  }, []);

  // Manage body scroll locking when modals are active
  useEffect(() => {
    const isModalOpen = !!selectedGen || confirmModal.isOpen;
    if (isModalOpen) {
      document.body.classList.add('body-scroll-lock');
    } else {
      document.body.classList.remove('body-scroll-lock');
    }
    return () => {
      document.body.classList.remove('body-scroll-lock');
    };
  }, [selectedGen, confirmModal.isOpen]);

  // Fetch all basic datasets
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/stats');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchGenerations = async () => {
    setLoadingGens(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/generations');
      const data = await res.json();
      if (res.ok && data.success) {
        setGenerations(data.generations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGens(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/departments');
      const data = await res.json();
      if (res.ok && data.success) {
        setDepartments(data.departments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDepts(false);
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjs(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/subjects');
      const data = await res.json();
      if (res.ok && data.success) {
        setSubjects(data.subjects);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubjs(false);
    }
  };

  const fetchRegulations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/regulations');
      const data = await res.json();
      if (res.ok && data.success) {
        setRegulations(data.regulations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchGenerations();
    fetchDepartments();
    fetchSubjects();
    fetchRegulations();
  }, []);

  // CRUD Actions
  const handleAddDept = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newDeptId || !newDeptName) return;

    try {
      const res = await fetch('http://localhost:5000/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newDeptId, name: newDeptName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Department added successfully!');
        setNewDeptId('');
        setNewDeptName('');
        fetchDepartments();
        fetchStats();
      } else {
        setErrorMsg(data.error || 'Failed to add department');
      }
    } catch (err) {
      setErrorMsg('Connection error');
    }
  };

  const executeDeleteDept = async (id) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await fetch(`http://localhost:5000/api/admin/departments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchDepartments();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDept = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Department',
      message: `Are you sure you want to delete department ${id}?`,
      onConfirm: () => executeDeleteDept(id)
    });
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newSubjCode || !newSubjName || !newSubjDept || !newSubjSem) {
      setErrorMsg('All subject fields are required');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newSubjCode,
          name: newSubjName,
          departmentId: newSubjDept,
          semester: newSubjSem
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Subject added successfully!');
        setNewSubjCode('');
        setNewSubjName('');
        fetchSubjects();
      } else {
        setErrorMsg(data.error || 'Failed to add subject');
      }
    } catch (err) {
      setErrorMsg('Connection error');
    }
  };

  const executeDeleteSubject = async (id) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await fetch(`http://localhost:5000/api/admin/subjects/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchSubjects();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubject = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Subject',
      message: 'Are you sure you want to delete this subject?',
      onConfirm: () => executeDeleteSubject(id)
    });
  };

  // CSV Report Generator
  const downloadCSVReport = () => {
    if (generations.length === 0) return;
    
    // Create CSV rows
    const headers = ['Generation ID', 'Subject Code', 'Subject Name', 'Department', 'Semester', 'Regulation', 'Type', 'Generated By', 'Timestamp', 'Word Count'];
    const rows = generations.map(gen => [
      gen.id,
      gen.subjectCode,
      typeof gen.subjectName === 'object' ? gen.subjectName.name : gen.subjectName,
      gen.departmentId,
      gen.semester,
      gen.regulation,
      gen.type.toUpperCase(),
      gen.generatedBy,
      gen.timestamp,
      gen.wordCount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CourseFile_SystemReport_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDocTypeLabel = (id) => {
    switch (id) {
      case 'cia1': return 'CIA 1';
      case 'cia2': return 'CIA 2';
      case 'qbank': return 'Question Bank';
      case 'quiz': return 'Quiz';
      case 'hots': return 'HOTS';
      case 'assignment': return 'Assignment';
      case 'beyond': return 'Beyond Syllabus';
      default: return id.toUpperCase();
    }
  };

  // Filter history logs (Unified Multi-criteria search and filter match logic)
  const filteredGenerations = generations.filter(gen => {
    const subjNameStr = typeof gen.subjectName === 'object' ? gen.subjectName.name : gen.subjectName;
    const matchesSearch = (
      gen.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjNameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gen.generatedBy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesType = filterType === 'all' || gen.type === filterType;
    const matchesDept = filterDept === 'all' || gen.departmentId === filterDept;

    const cleanGenReg = gen.regulation ? gen.regulation.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
    const cleanFilterReg = filterReg.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const matchesReg = filterReg === 'all' || cleanGenReg === cleanFilterReg;

    return matchesSearch && matchesType && matchesDept && matchesReg;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Top Navigation */}
      <div className="top-nav" style={{ marginBottom: '1.5rem' }}>
        <div className="nav-left">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Admin Console</h2>
          <span className="badge">System Owner</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={logoutUser}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
        
        {/* Sidebar Nav */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
          <button 
            className={`btn ${activeTab === 'monitor' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', border: activeTab === 'monitor' ? 'none' : '' }}
            onClick={() => setActiveTab('monitor')}
          >
            <BarChart2 size={18} /> Monitor Usage
          </button>
          <button 
            className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', border: activeTab === 'departments' ? 'none' : '' }}
            onClick={() => setActiveTab('departments')}
          >
            <Layers size={18} /> Manage Departments
          </button>
          <button 
            className={`btn ${activeTab === 'subjects' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', border: activeTab === 'subjects' ? 'none' : '' }}
            onClick={() => setActiveTab('subjects')}
          >
            <Book size={18} /> Manage Subjects
          </button>
          <button 
            className={`btn ${activeTab === 'generations' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', border: activeTab === 'generations' ? 'none' : '' }}
            onClick={() => setActiveTab('generations')}
          >
            <FileText size={18} /> View Generated Files
          </button>
          <button 
            className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', border: activeTab === 'reports' ? 'none' : '' }}
            onClick={() => setActiveTab('reports')}
          >
            <Download size={18} /> Export System Reports
          </button>
        </div>

        {/* Dynamic Content Panel */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* TAB 1: MONITOR & STATS */}
          {activeTab === 'monitor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }} className="dashboard-scroll-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>System Usage & Analytics</h3>
                <button className="btn btn-secondary" onClick={fetchStats} disabled={loadingStats} style={{ padding: '0.5rem 1rem' }}>
                  <RefreshCw size={16} className={loadingStats ? 'spinner' : ''} /> Refresh
                </button>
              </div>

              {loadingStats ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '30vh', color: 'var(--primary)' }}>
                  <RefreshCw size={40} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : stats ? (
                <>
                  {/* Grid Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#e0e7ff', borderRadius: '50%', color: 'var(--primary)' }}>
                        <FileText size={32} />
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Generations</p>
                        <h4 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalGenerations}</h4>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '50%', color: '#059669' }}>
                        <BarChart2 size={32} />
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Words Generated</p>
                        <h4 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalWords.toLocaleString()}</h4>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
                        <User size={32} />
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Faculty</p>
                        <h4 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.activeFacultyCount}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Stunning Custom Glassmorphic Charts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                    
                    {/* Document Type Bar Chart */}
                    <div className="glass-card" style={{ padding: '1.75rem', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                      <h4 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', fontWeight: 700 }}>Breakdown by Material Type</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {Object.entries(stats.typeCounts).map(([type, count]) => {
                          const percent = stats.totalGenerations > 0 ? (count / stats.totalGenerations) * 100 : 0;
                          return (
                            <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ fontWeight: 600 }}>{getDocTypeLabel(type)}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{count} ({Math.round(percent)}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '999px', transition: 'width 1s ease' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Department Distribution Chart */}
                    <div className="glass-card" style={{ padding: '1.75rem', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                      <h4 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', fontWeight: 700 }}>Distribution by Department</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {Object.entries(stats.deptCounts).map(([dept, count]) => {
                          const percent = stats.totalGenerations > 0 ? (count / stats.totalGenerations) * 100 : 0;
                          return (
                            <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ fontWeight: 600 }}>{dept} Engineering</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{count} ({Math.round(percent)}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{ width: `${percent}%`, height: '100%', backgroundColor: '#0ea5e9', borderRadius: '999px', transition: 'width 1s ease' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </>
              ) : (
                <p>No statistics available.</p>
              )}
            </div>
          )}

          {/* TAB 2: DEPARTMENTS MANAGEMENT */}
          {activeTab === 'departments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Manage Academic Departments</h3>

              {successMsg && <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>{successMsg}</div>}
              {errorMsg && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>{errorMsg}</div>}

              {/* Form and List Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', flex: 1, overflow: 'hidden' }}>
                
                {/* Add Form */}
                <form onSubmit={handleAddDept} className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Add New Department</h4>
                  <div>
                    <label className="label">Department Code (e.g. MECH)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. MECH" 
                      value={newDeptId}
                      onChange={(e) => setNewDeptId(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Department Full Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Mechanical Engineering" 
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={18} /> Add Branch
                  </button>
                </form>

                {/* List Table */}
                <div className="dashboard-scroll-content">
                  {loadingDepts ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><RefreshCw size={32} className="spinner" /></div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Code</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Department Name</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map(dept => (
                          <tr key={dept.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{dept.id}</td>
                            <td style={{ padding: '1rem' }}>{dept.name}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <button 
                                className="btn-icon" 
                                onClick={() => handleDeleteDept(dept.id)}
                                style={{ color: '#b91c1c', borderColor: '#fee2e2' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: SUBJECTS MANAGEMENT */}
          {activeTab === 'subjects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Manage Academic Subjects</h3>

              {successMsg && <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>{successMsg}</div>}
              {errorMsg && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>{errorMsg}</div>}

              {/* Form and List Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.75fr', gap: '2rem', flex: 1, overflow: 'hidden' }}>
                
                {/* Add Form */}
                <form onSubmit={handleAddSubject} className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Add New Subject</h4>
                  
                  <div>
                    <label className="label">Subject Code (e.g. CS301)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. CS301" 
                      value={newSubjCode}
                      onChange={(e) => setNewSubjCode(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Subject Title</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Data Structures" 
                      value={newSubjName}
                      onChange={(e) => setNewSubjName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Department mapping</label>
                    <select 
                      className="input-field"
                      value={newSubjDept}
                      onChange={(e) => setNewSubjDept(e.target.value)}
                      required
                    >
                      <option value="">Select branch</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.id} - {d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Target Semester</label>
                    <select 
                      className="input-field"
                      value={newSubjSem}
                      onChange={(e) => setNewSubjSem(parseInt(e.target.value, 10))}
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={18} /> Add Subject
                  </button>
                </form>

                {/* List Table */}
                <div className="dashboard-scroll-content">
                  {loadingSubjs ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><RefreshCw size={32} className="spinner" /></div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Code</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Subject Name</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Dept</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Sem</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map(subj => (
                          <tr key={subj.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{subj.code}</td>
                            <td style={{ padding: '1rem' }}>{subj.name}</td>
                            <td style={{ padding: '1rem' }}><span className="badge">{subj.departmentId}</span></td>
                            <td style={{ padding: '1rem' }}>Sem {subj.semester}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <button 
                                className="btn-icon" 
                                onClick={() => handleDeleteSubject(subj.id)}
                                style={{ color: '#b91c1c', borderColor: '#fee2e2' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: VIEW GENERATED FILES & AUDITS */}
          {activeTab === 'generations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Institution-Wide Generation Logs</h3>
                <button className="btn btn-secondary" onClick={fetchGenerations} disabled={loadingGens} style={{ padding: '0.5rem 1rem' }}>
                  <RefreshCw size={16} className={loadingGens ? 'spinner' : ''} /> Refresh
                </button>
              </div>

              {/* Search & Advanced Filtering Controls */}
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-glass)'
              }}>
                {/* Search input field */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'white', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '0.4rem 0.75rem', 
                  flex: '2 1 240px'
                }}>
                  <Search size={16} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                  <input 
                    type="text" 
                    placeholder="Search by code, subject title, or user..." 
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.85rem',
                    flex: '1 1 120px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'white',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="cia1">CIA 1</option>
                  <option value="cia2">CIA 2</option>
                  <option value="quiz">Quiz</option>
                  <option value="qbank">Question Bank</option>
                  <option value="assignment">Assignment</option>
                  <option value="hots">HOTS</option>
                  <option value="beyond">Beyond Syllabus</option>
                </select>

                {/* Department Filter */}
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.85rem',
                    flex: '1 1 140px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'white',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Departments</option>
                  <option value="AI_DS">AI_DS</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="BME">BME</option>
                  <option value="CYBER">CYBER</option>
                </select>

                {/* Regulation Filter */}
                <select
                  value={filterReg}
                  onChange={(e) => setFilterReg(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.85rem',
                    flex: '1 1 130px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'white',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Regulations</option>
                  <option value="R2021">R2021</option>
                  <option value="R2023">R2023</option>
                  <option value="R2025">R2025</option>
                </select>
              </div>

              {loadingGens ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><RefreshCw size={32} className="spinner" /></div>
              ) : filteredGenerations.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
                  <p>No generations found matching query.</p>
                </div>
              ) : (
                <div className="dashboard-scroll-content">
                  
                  {/* Highly Compact & Responsive Generation Table */}
                  <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, width: '26%' }}>Subject</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, width: '24%' }}>Scope</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, width: '20%' }}>Type</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, width: '14%' }}>Generated By</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, width: '10%' }}>Word Count</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, width: '6%', textAlign: 'center' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGenerations.map(gen => {
                        const sName = typeof gen.subjectName === 'object' ? gen.subjectName.name : gen.subjectName;
                        return (
                          <tr key={gen.id} className="premium-table-row" style={{ borderBottom: '1px solid var(--border-light)' }}>
                            {/* Subject Column */}
                            <td data-label="Subject" style={{ padding: '0.4rem 0.75rem', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: '1.2' }}>{gen.subjectCode}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.2', marginTop: '1px' }}>{sName}</div>
                            </td>
                            {/* Scope Column */}
                            <td data-label="Scope" style={{ padding: '0.4rem 0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                {gen.departmentId} <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>•</span> Sem {gen.semester} <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>•</span> {gen.regulation}
                              </div>
                            </td>
                            {/* Type Column */}
                            <td data-label="Type" style={{ padding: '0.4rem 0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <span className="badge" style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                height: '22px', 
                                minWidth: '100px', 
                                fontSize: '0.7rem', 
                                textAlign: 'center', 
                                whiteSpace: 'nowrap',
                                lineHeight: '1',
                                padding: '0 0.5rem',
                                backgroundColor: '#e0e7ff',
                                color: '#3730a3'
                              }}>
                                {getDocTypeLabel(gen.type)}
                              </span>
                            </td>
                            {/* Generated By Column */}
                            <td data-label="Generated By" style={{ padding: '0.4rem 0.75rem', verticalAlign: 'middle' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                <User size={13} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                                <span style={{ fontWeight: 500 }}>{gen.generatedBy}</span>
                              </div>
                            </td>
                            {/* Word Count Column */}
                            <td data-label="Word Count" style={{ padding: '0.4rem 0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {gen.wordCount} words
                            </td>
                            {/* Details Column */}
                            <td data-label="Details" style={{ padding: '0.4rem 0.75rem', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ 
                                  padding: '0.2rem 0.6rem', 
                                  fontSize: '0.75rem', 
                                  height: '24px',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid var(--border-light)',
                                  borderRadius: 'var(--radius-full)',
                                  boxShadow: 'var(--shadow-sm)'
                                }}
                                onClick={() => setSelectedGen(gen)}
                              >
                                View File
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOWNLOAD CSV SYSTEM REPORTS */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', flex: 1, padding: '3rem', textAlign: 'center' }}>
              <div style={{ padding: '2rem', backgroundColor: '#e0f2fe', borderRadius: '50%', color: '#0284c7' }}>
                <FileSpreadsheet size={64} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Institution-Wide Excel/CSV Summary</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
                  Download a comprehensive audit summary spreadsheet listing all generation transactions, word counts, users, and details to measure token usage and resource logging.
                </p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={downloadCSVReport} 
                disabled={generations.length === 0}
                style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
              >
                <Download size={20} /> Export CSV Spreadsheet
              </button>
              {generations.length === 0 && (
                <p style={{ color: '#b91c1c', fontSize: '0.85rem' }}>No generated materials have been logged on this system yet.</p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* DETAILED VIEW MODAL */}
      {selectedGen && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(30, 41, 59, 0.45)', 
          backdropFilter: 'blur(4px)', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '2rem' 
        }}>
          <div className="glass-card" style={{ 
            width: '100%', 
            maxWidth: '850px', 
            maxHeight: '90vh', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '2rem',
            backgroundColor: 'white'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{getDocTypeLabel(selectedGen.type)} Details</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Subject:</strong> {selectedGen.subjectCode} | <strong>Author:</strong> {selectedGen.generatedBy} | <strong>Regulation:</strong> {selectedGen.regulation}
                </p>
              </div>
              <button 
                onClick={() => setSelectedGen(null)}
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              >
                Close Window
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              backgroundColor: '#f8fafc', 
              padding: '1.5rem', 
              borderRadius: 'var(--radius-sm)', 
              lineHeight: '1.7', 
              whiteSpace: 'pre-wrap',
              fontSize: '0.95rem',
              color: '#334155'
            }}>
              {selectedGen.content}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Premium Confirm Modal */}
      {confirmModal.isOpen && createPortal(
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
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ 
                  flex: 1, 
                  backgroundColor: '#ef4444', 
                  boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(239, 68, 68, 0.39)';
                }}
                onClick={confirmModal.onConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
