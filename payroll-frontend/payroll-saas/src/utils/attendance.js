/**
 * Mark Employee Attendance Utility Function
 * Works in both React (browser) and Node.js environments
 * 
 * Note: The API uses the authenticated user's employee record from the session token.
 * The employeeId parameter is for reference/logging purposes only.
 * 
 * @param {string|number} employeeId - The employee ID (for reference/logging, not sent to API)
 * @param {Object} options - Optional parameters
 * @param {string} options.time - Check-in time in "HH:MM" format (optional, defaults to current time)
 * @param {string} options.date - Custom date in "YYYY-MM-DD" format (optional, defaults to current date)
 * @param {string} options.checkOutTime - Check-out time in "HH:MM" format (optional)
 * @param {string} options.status - Attendance status: 'present', 'absent', 'leave' (optional, defaults to 'present')
 * @param {string} options.notes - Additional notes (optional)
 * @param {Function} options.employeeAPI - The employeeAPI object (required in Node.js, optional in React)
 * @returns {Promise<Object>} Response object with success status and message
 */

export const markEmployeeAttendance = async (employeeId, options = {}) => {
  try {
    // Get current date and time
    const now = new Date();
    
    // Format date as "YYYY-MM-DD"
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Format time as "HH:MM" (24-hour format)
    const formatTime = (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    // Use provided date/time or current date/time
    const date = options.date || formatDate(now);
    const time = options.time || formatTime(now);
    const checkOutTime = options.checkOutTime || null;
    const status = options.status || 'present';
    const notes = options.notes || null;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Invalid date format. Expected format: YYYY-MM-DD');
    }

    // Validate time format
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      throw new Error('Invalid time format. Expected format: HH:MM');
    }

    // Validate check-out time format
    if (checkOutTime && !/^\d{2}:\d{2}$/.test(checkOutTime)) {
      throw new Error('Invalid check-out time format. Expected format: HH:MM');
    }

    // Get employeeAPI - works in both environments
    let employeeAPI;
    
    if (typeof window !== 'undefined') {
      // Browser/React environment - import dynamically
      const apiModule = await import('../services/api');
      employeeAPI = apiModule.employeeAPI;
    } else {
      // Node.js environment - must be provided
      if (!options.employeeAPI) {
        throw new Error('employeeAPI must be provided in Node.js environment');
      }
      employeeAPI = options.employeeAPI;
    }

    // Prepare attendance data (matches backend API format)
    const attendanceData = {
      date: date,
      check_in: time,
      ...(checkOutTime && { check_out: checkOutTime }),
      ...(status && { status }),
      ...(notes && { notes }),
    };

    // Call the API
    const response = await employeeAPI.markAttendance(attendanceData);

    // Handle response
    if (response?.data?.success) {
      const timeInfo = checkOutTime 
        ? `check-in: ${time}, check-out: ${checkOutTime}`
        : `check-in: ${time}`;
      const successMessage = `Attendance marked successfully for employee ${employeeId} on ${date} at ${timeInfo}`;
      
      // Log success (works in both environments)
      if (typeof console !== 'undefined' && console.log) {
        console.log('✅', successMessage);
      }
      
      return {
        success: true,
        message: successMessage,
        data: response.data.data,
        date,
        time,
        checkOutTime,
        status,
      };
    } else {
      throw new Error(response?.data?.message || 'Failed to mark attendance');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
    
    // Log error (works in both environments)
    if (typeof console !== 'undefined' && console.error) {
      console.error('❌ Failed to mark attendance:', errorMessage);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || error.message,
    };
  }
};

/**
 * Format current date as "YYYY-MM-DD"
 * @returns {string} Formatted date string
 */
export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format current time as "HH:MM" (24-hour format)
 * @returns {string} Formatted time string
 */
export const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Default export
export default markEmployeeAttendance;

