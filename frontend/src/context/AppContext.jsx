import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [department, setDepartment] = useState(null);
  const [year, setYear] = useState(null);
  const [semester, setSemester] = useState(null);
  const [subject, setSubject] = useState(null);

  const resetSelection = () => {
    setDepartment(null);
    setYear(null);
    setSemester(null);
    setSubject(null);
  };

  return (
    <AppContext.Provider value={{
      department, setDepartment,
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
