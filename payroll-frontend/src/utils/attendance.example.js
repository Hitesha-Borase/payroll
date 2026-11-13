/**
 * Usage Examples for markEmployeeAttendance Function
 * 
 * This file demonstrates how to use the markEmployeeAttendance function
 * in both React (browser) and Node.js environments.
 */

// ==================== REACT/BROWSER USAGE ====================

// Example 1: Basic usage with current date/time
import { markEmployeeAttendance } from './attendance';

const markAttendanceBasic = async () => {
  const employeeId = '123'; // For reference/logging only
  const result = await markEmployeeAttendance(employeeId);
  
  if (result.success) {
    console.log(result.message);
    // Output: ✅ Attendance marked successfully for employee 123 on 2025-12-31 at check-in: 14:30
  } else {
    console.error(result.message);
  }
};

// Example 2: With custom time and date
const markAttendanceCustom = async () => {
  const employeeId = '123';
  const result = await markEmployeeAttendance(employeeId, {
    time: '09:00',
    date: '2025-12-31',
    notes: 'Working from office'
  });
  
  if (result.success) {
    console.log(result.message);
  }
};

// Example 3: With check-out time
const markAttendanceWithCheckout = async () => {
  const employeeId = '123';
  const result = await markEmployeeAttendance(employeeId, {
    time: '09:00',
    checkOutTime: '18:00',
    date: '2025-12-31',
    status: 'present',
    notes: 'Full day work'
  });
  
  if (result.success) {
    console.log(result.message);
  }
};

// Example 4: In a React component
import React, { useState } from 'react';
import { markEmployeeAttendance } from '../utils/attendance';

const AttendanceButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMarkAttendance = async () => {
    setLoading(true);
    setMessage('');
    
    const employeeId = localStorage.getItem('userId'); // Get from auth context
    const result = await markEmployeeAttendance(employeeId);
    
    if (result.success) {
      setMessage(result.message);
    } else {
      setMessage(`Error: ${result.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleMarkAttendance} disabled={loading}>
        {loading ? 'Marking...' : 'Mark Attendance'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

// ==================== NODE.JS USAGE ====================

// Example 5: Node.js usage (requires employeeAPI to be provided)
const markAttendanceNodeJS = async () => {
  // In Node.js, you need to provide the employeeAPI object
  const axios = require('axios');
  
  // Create your API instance
  const employeeAPI = {
    markAttendance: (data) => axios.post('http://localhost:5000/api/employee/attendance', data, {
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`,
        'Content-Type': 'application/json'
      }
    })
  };
  
  const employeeId = '123';
  const result = await markEmployeeAttendance(employeeId, {
    time: '09:00',
    date: '2025-12-31',
    employeeAPI: employeeAPI // Required in Node.js
  });
  
  if (result.success) {
    console.log(result.message);
  } else {
    console.error(result.message);
  }
};

// ==================== HELPER FUNCTIONS USAGE ====================

import { getCurrentDate, getCurrentTime } from './attendance';

// Get formatted current date
const currentDate = getCurrentDate(); // Returns: "2025-12-31"

// Get formatted current time
const currentTime = getCurrentTime(); // Returns: "14:30"

// Use in your function
const markAttendanceWithHelpers = async () => {
  const employeeId = '123';
  const date = getCurrentDate();
  const time = getCurrentTime();
  
  const result = await markEmployeeAttendance(employeeId, {
    date,
    time
  });
  
  console.log(result);
};

export {
  markAttendanceBasic,
  markAttendanceCustom,
  markAttendanceWithCheckout,
  markAttendanceNodeJS,
  markAttendanceWithHelpers,
  AttendanceButton
};

