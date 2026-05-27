import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('course_gen_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [regulations, setRegulations] = useState([]);

  const [department, setDepartment] = useState(null);
  const [regulation, setRegulation] = useState(null);
  const [year, setYear] = useState(null);
  const [semester, setSemester] = useState(null);
  const [subject, setSubject] = useState(null);

  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingSubjs, setLoadingSubjs] = useState(false);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Fetch Departments from dynamic API
  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/departments`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepts(false);
    }
  };

  // Fetch Regulations from dynamic API
  const fetchRegulations = async () => {
    setLoadingRegs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/regulations`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRegulations(data.regulations);
      }
    } catch (error) {
      console.error('Error fetching regulations:', error);
    } finally {
      setLoadingRegs(false);
    }
  };

  // Fetch Subjects from dynamic API matching chosen department and semester
  const fetchSubjects = async (deptId, semNum) => {
    if (!deptId || !semNum) return;
    setLoadingSubjs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/subjects?departmentId=${deptId}&semester=${semNum}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoadingSubjs(false);
    }
  };

  // Trigger loading of basic catalogs when context mounts
  useEffect(() => {
    if (user) {
      fetchDepartments();
      fetchRegulations();
    }
  }, [user]);

  // Handle Auth Operations
  const loginUser = (userData) => {
    localStorage.setItem('course_gen_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('course_gen_user');
    setUser(null);
    resetSelection();
  };

  const resetSelection = () => {
    setDepartment(null);
    setRegulation(null);
    setYear(null);
    setSemester(null);
    setSubject(null);
    setSubjects([]);
  };

  const isSystemOwner = () => user?.role === 'SYSTEM_OWNER';
  const isAdmin = () => user?.role === 'Admin' || user?.role === 'SYSTEM_OWNER';
  const isFaculty = () => user?.role === 'Faculty';

  return (
    <AppContext.Provider value={{
      user, loginUser, logoutUser,
      isSystemOwner, isAdmin, isFaculty,
      departments, loadingDepts, fetchDepartments,
      regulations, loadingRegs, fetchRegulations,
      subjects, loadingSubjs, fetchSubjects,
      department, setDepartment,
      regulation, setRegulation,
      year, setYear,
      semester, setSemester,
      subject, setSubject,
      resetSelection
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
