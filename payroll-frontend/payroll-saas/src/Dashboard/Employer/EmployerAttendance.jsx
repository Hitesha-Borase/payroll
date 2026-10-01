import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  FaCalendarAlt,
  FaFileExport,
  FaClock,
  FaUserTie,
  FaChartLine,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaBuilding,
  FaUser
} from 'react-icons/fa';
import { employerAPI } from '../../services/api';
import { Spinner, Alert, Dropdown } from 'react-bootstrap';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Color scheme
const colors = {
  primary: '#C62828',
  primaryDark: '#B71C1C',
  secondary: '#1E293B',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#6366F1',
  light: '#F8FAFC',
  border: '#E2E8F0',
  darkText: '#0F172A',
  mutedText: '#64748B'
};

const formatTimeDisplay = (timeVal) => {
  if (!timeVal || timeVal === '-' || timeVal === 'null') return '-';
  try {
    if (typeof timeVal === 'string' && (timeVal.includes('T') || timeVal.includes('Z'))) {
      const d = new Date(timeVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }
    const parts = String(timeVal).split(':');
    if (parts.length >= 2) {
      const hStr = parts[0].includes('T') ? parts[0].split('T')[1] : parts[0];
      const h = parseInt(hStr, 10);
      const m = parts[1].slice(0, 2);
      if (isNaN(h)) return timeVal;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
    }
    return timeVal;
  } catch {
    return timeVal;
  }
};

const EmployerAttendance = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Data states
  const [employees, setEmployees] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [lateEarlyTracking, setLateEarlyTracking] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch attendance data when date or tab changes
  useEffect(() => {
    if (employees.length > 0) {
      if (activeTab === 'daily') {
        fetchDailyAttendance();
      } else if (activeTab === 'lateEarly') {
        fetchLateEarlyTracking();
      } else if (activeTab === 'monthly') {
        fetchMonthlySummary();
      }
    }
  }, [activeTab, selectedDate, selectedMonth, selectedYear, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employerAPI.getMyEmployees();
      if (response?.data?.success) {
        setEmployees(response.data.data || []);
      } else {
        setError(response?.data?.message || 'Failed to fetch employees.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const attendancePromises = employees.map(async (emp) => {
        try {
          const response = await employerAPI.getEmployeeAttendance(emp.id, { start_date: selectedDate, end_date: selectedDate });
          if (response?.data?.success && response.data.data && response.data.data.length > 0) {
            const att = response.data.data[0];
            return {
              id: emp.id,
              employee: emp.user?.name || emp.name || 'Unknown',
              department: emp.designation || 'N/A',
              inTime: formatTimeDisplay(att.check_in),
              outTime: formatTimeDisplay(att.check_out),
              rawInTime: att.check_in,
              rawOutTime: att.check_out,
              status: att.status === 'present' ? 'Present' : att.status === 'absent' ? 'Absent' : att.status === 'late' ? 'Late' : 'Present',
              lateBy: att.status === 'late' && att.check_in ? calculateLateTime(att.check_in) : '-',
              earlyBy: att.check_out ? calculateEarlyTime(att.check_out) : null,
            };
          } else {
            return {
              id: emp.id,
              employee: emp.user?.name || emp.name || 'Unknown',
              department: emp.designation || 'N/A',
              inTime: '-',
              outTime: '-',
              status: 'Absent',
              lateBy: '-',
              earlyBy: null,
            };
          }
        } catch (err) {
          return {
            id: emp.id,
            employee: emp.user?.name || emp.name || 'Unknown',
            department: emp.designation || 'N/A',
            inTime: '-',
            outTime: '-',
            status: 'Absent',
            lateBy: '-',
            earlyBy: null,
          };
        }
      });
      const attendanceData = await Promise.all(attendancePromises);
      setDailyAttendance(attendanceData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLateEarlyTracking = async () => {
    try {
      setLoading(true);
      setError(null);
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

      const trackingPromises = employees.map(async (emp) => {
        try {
          const response = await employerAPI.getEmployeeAttendance(emp.id, { start_date: startDate, end_date: endDate });
          if (response?.data?.success && response.data.data) {
            return response.data.data
              .filter(att => att.status === 'late' || (att.check_out && isEarlyCheckout(att.check_out)))
              .map(att => ({
                id: `${emp.id}-${att.date}`,
                employee: emp.user?.name || emp.name || 'Unknown',
                department: emp.designation || 'N/A',
                date: att.date,
                type: att.status === 'late' ? 'Late' : 'Early',
                duration: att.status === 'late' && att.check_in ? calculateLateTime(att.check_in) :
                  att.check_out ? calculateEarlyTime(att.check_out) : '-',
              }));
          }
          return [];
        } catch (err) {
          return [];
        }
      });
      const trackingArrays = await Promise.all(trackingPromises);
      setLateEarlyTracking(trackingArrays.flat());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch late/early tracking.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

      const summaryPromises = employees.reduce(async (accPromise, emp) => {
        const acc = await accPromise;
        try {
          const response = await employerAPI.getEmployeeAttendance(emp.id, { start_date: startDate, end_date: endDate });
          if (response?.data?.success && response.data.data) {
            const dept = emp.designation || 'General';
            if (!acc[dept]) {
              acc[dept] = { totalEmployees: 0, present: 0, late: 0, early: 0, totalDays: 0 };
            }
            acc[dept].totalEmployees += 1;
            acc[dept].totalDays += response.data.data.length;
            response.data.data.forEach(att => {
              if (att.status === 'present') acc[dept].present += 1;
              if (att.status === 'late') acc[dept].late += 1;
              if (att.check_out && isEarlyCheckout(att.check_out)) acc[dept].early += 1;
            });
          }
        } catch (err) {
          // Ignore errors for individual employees
        }
        return acc;
      }, Promise.resolve({}));

      const summary = await summaryPromises;
      const summaryArray = Object.entries(summary).map(([department, data]) => ({
        id: department,
        department,
        totalEmployees: data.totalEmployees,
        avgPresent: data.totalDays > 0 ? `${Math.round((data.present / data.totalDays) * 100)}%` : '0%',
        avgLate: data.totalDays > 0 ? `${Math.round((data.late / data.totalDays) * 100)}%` : '0%',
        avgEarly: data.totalDays > 0 ? `${Math.round((data.early / data.totalDays) * 100)}%` : '0%',
      }));
      setMonthlySummary(summaryArray);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch monthly summary.');
    } finally {
      setLoading(false);
    }
  };

  const calculateLateTime = (checkIn) => {
    if (!checkIn || checkIn === '-' || checkIn === 'null') return '-';
    try {
      let checkInHour = 0;
      let checkInMin = 0;
      if (typeof checkIn === 'string' && (checkIn.includes('T') || checkIn.includes('Z'))) {
        const d = new Date(checkIn);
        if (!isNaN(d.getTime())) {
          checkInHour = d.getHours();
          checkInMin = d.getMinutes();
        }
      } else {
        const parts = String(checkIn).split(':');
        if (parts.length >= 2) {
          const hStr = parts[0].includes('T') ? parts[0].split('T')[1] : parts[0];
          checkInHour = parseInt(hStr, 10);
          checkInMin = parseInt(parts[1], 10);
        }
      }
      if (isNaN(checkInHour) || isNaN(checkInMin)) return '-';

      const expectedMinutes = 9 * 60; // 09:00 AM
      const actualMinutes = checkInHour * 60 + checkInMin;
      const diff = actualMinutes - expectedMinutes;
      if (diff > 0) {
        if (diff >= 60) {
          const hrs = Math.floor(diff / 60);
          const mins = diff % 60;
          return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
        }
        return `${diff} min`;
      }
      return '-';
    } catch {
      return '-';
    }
  };

  const calculateEarlyTime = (checkOut) => {
    if (!checkOut || checkOut === '-' || checkOut === 'null') return null;
    try {
      let checkOutHour = 0;
      let checkOutMin = 0;
      if (typeof checkOut === 'string' && (checkOut.includes('T') || checkOut.includes('Z'))) {
        const d = new Date(checkOut);
        if (!isNaN(d.getTime())) {
          checkOutHour = d.getHours();
          checkOutMin = d.getMinutes();
        }
      } else {
        const parts = String(checkOut).split(':');
        if (parts.length >= 2) {
          const hStr = parts[0].includes('T') ? parts[0].split('T')[1] : parts[0];
          checkOutHour = parseInt(hStr, 10);
          checkOutMin = parseInt(parts[1], 10);
        }
      }
      if (isNaN(checkOutHour) || isNaN(checkOutMin)) return null;

      const expectedMinutes = 18 * 60; // 06:00 PM (18:00)
      const actualMinutes = checkOutHour * 60 + checkOutMin;
      const diff = expectedMinutes - actualMinutes;
      if (diff > 0) {
        if (diff >= 60) {
          const hrs = Math.floor(diff / 60);
          const mins = diff % 60;
          return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
        }
        return `${diff} min`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const isEarlyCheckout = (checkOut) => {
    if (!checkOut || checkOut === '-' || checkOut === 'null') return false;
    try {
      if (typeof checkOut === 'string' && (checkOut.includes('T') || checkOut.includes('Z'))) {
        const d = new Date(checkOut);
        if (!isNaN(d.getTime())) {
          return d.getHours() < 18;
        }
      }
      const parts = String(checkOut).split(':');
      if (parts.length === 0) return false;
      const hStr = parts[0].includes('T') ? parts[0].split('T')[1] : parts[0];
      const checkOutHour = parseInt(hStr, 10);
      return !isNaN(checkOutHour) && checkOutHour < 18;
    } catch {
      return false;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleExport = (format) => {
    try {
      let exportHeaders = [];
      let exportRows = [];
      let reportTitle = '';
      let periodInfo = '';

      if (activeTab === 'daily') {
        reportTitle = 'Daily Attendance Report';
        periodInfo = `Date: ${selectedDate}`;
        exportHeaders = ['#', 'Employee Name', 'Department', 'In Time', 'Out Time', 'Status', 'Late / Early'];
        exportRows = dailyAttendance.map((item, idx) => [
          (idx + 1).toString(),
          item.employee || 'N/A',
          item.department || 'N/A',
          item.inTime || '-',
          item.outTime || '-',
          item.status || 'Absent',
          item.status === 'Late' && item.lateBy ? `Late by ${item.lateBy}` :
            item.earlyBy ? `Early by ${item.earlyBy}` : '-'
        ]);
      } else if (activeTab === 'lateEarly') {
        reportTitle = 'Late & Early Tracking Report';
        periodInfo = `Month: ${monthNames[selectedMonth]} ${selectedYear}`;
        exportHeaders = ['#', 'Employee Name', 'Department', 'Date', 'Type', 'Duration'];
        exportRows = lateEarlyTracking.map((item, idx) => [
          (idx + 1).toString(),
          item.employee || 'N/A',
          item.department || 'N/A',
          item.date || 'N/A',
          item.type || 'N/A',
          item.duration || '-'
        ]);
      } else if (activeTab === 'monthly') {
        reportTitle = 'Monthly Attendance Summary Report';
        periodInfo = `Month: ${monthNames[selectedMonth]} ${selectedYear}`;
        exportHeaders = ['#', 'Department', 'Total Employees', 'Avg Present', 'Avg Late', 'Avg Early'];
        exportRows = monthlySummary.map((item, idx) => [
          (idx + 1).toString(),
          item.department || 'N/A',
          (item.totalEmployees || 0).toString(),
          item.avgPresent || '0%',
          item.avgLate || '0%',
          item.avgEarly || '0%'
        ]);
      }

      if (exportRows.length === 0) {
        toast.error('No attendance data available to export for this view.');
        return;
      }

      const fileDate = new Date().toISOString().split('T')[0];

      if (format === 'PDF') {
        // Generate Branded PDF Report
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Top Accent Bar
        doc.setFillColor(198, 40, 40); // #C62828
        doc.rect(0, 0, pageWidth, 8, 'F');

        // Header Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(198, 40, 40);
        doc.text('KIAAN TECHNOLOGY', 14, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 100, 100);
        doc.text('Workforce & Payroll Management System', 14, 25);

        // Document Details on Right
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.text(reportTitle.toUpperCase(), pageWidth - 14, 19, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 100, 100);
        doc.text(periodInfo, pageWidth - 14, 25, { align: 'right' });
        doc.text(`Exported On: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, pageWidth - 14, 30, { align: 'right' });

        // Divider
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(14, 34, pageWidth - 14, 34);

        // Summary Metric Box
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(14, 37, pageWidth - 28, 22, 2.5, 2.5, 'F');
        doc.setDrawColor(230, 230, 230);
        doc.roundedRect(14, 37, pageWidth - 28, 22, 2.5, 2.5, 'D');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text('TOTAL EMPLOYEES', 20, 44);
        doc.text("TODAY'S PRESENT", 65, 44);
        doc.text("TODAY'S LATE", 115, 44);
        doc.text("TODAY'S ABSENT", 160, 44);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(198, 40, 40);
        doc.text(totalEmployees.toString(), 20, 52);
        doc.setTextColor(16, 185, 129);
        doc.text(todayPresent.toString(), 65, 52);
        doc.setTextColor(245, 158, 11);
        doc.text(todayLate.toString(), 115, 52);
        doc.setTextColor(239, 68, 68);
        doc.text(todayAbsent.toString(), 160, 52);

        // Table
        const tableOptions = {
          startY: 64,
          head: [exportHeaders],
          body: exportRows,
          theme: 'grid',
          headStyles: {
            fillColor: [198, 40, 40],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: 3,
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2.8,
            textColor: [50, 50, 50],
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          margin: { left: 14, right: 14, bottom: 18 },
        };

        if (typeof doc.autoTable === 'function') {
          doc.autoTable(tableOptions);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, tableOptions);
        }

        // Page numbering
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setDrawColor(220, 220, 220);
          doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(130, 130, 130);
          doc.text('Kiaan Workforce & Payroll • Attendance Summary Report', 14, pageHeight - 7);
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
        }

        doc.save(`Attendance_${activeTab}_Report_${fileDate}.pdf`);
        toast.success(`Attendance report exported as PDF successfully!`);
      } else if (format === 'Excel') {
        // Excel formatted HTML table export (.xls)
        const excelHtml = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
            <style>
              table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
              th { background-color: #C62828; color: #FFFFFF; font-weight: bold; padding: 10px; border: 1px solid #CCCCCC; text-align: left; }
              td { padding: 8px; border: 1px solid #DDDDDD; font-size: 12px; }
              .title-row { font-size: 16px; font-weight: bold; color: #C62828; padding: 10px 0; }
              .meta-row { color: #666666; font-size: 11px; }
            </style>
          </head>
          <body>
            <table>
              <tr><td colspan="${exportHeaders.length}" class="title-row">KIAAN TECHNOLOGY - ${reportTitle}</td></tr>
              <tr><td colspan="${exportHeaders.length}" class="meta-row">${periodInfo} | Exported On: ${new Date().toLocaleDateString()}</td></tr>
              <tr><td colspan="${exportHeaders.length}"></td></tr>
              <tr>
                ${exportHeaders.map(h => `<th>${h}</th>`).join('')}
              </tr>
              ${exportRows.map(row => `<tr>${row.map(c => `<td>${c || '-'}</td>`).join('')}</tr>`).join('')}
            </table>
          </body>
          </html>
        `;

        const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `Attendance_${activeTab}_Report_${fileDate}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Attendance report exported as Excel successfully!`);
      } else {
        // CSV format
        const csvContent = '\uFEFF' + [
          exportHeaders.map(h => `"${h}"`).join(','),
          ...exportRows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `Attendance_${activeTab}_Report_${fileDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Attendance report exported as CSV successfully!`);
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Failed to export attendance report: ${err.message || 'Unknown error'}`);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'present':
        return { backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' };
      case 'absent':
        return { backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' };
      case 'late':
        return { backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' };
      case 'early':
        return { backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' };
    }
  };

  // Stats calculations
  const totalEmployees = employees.length;
  const todayPresent = dailyAttendance.filter(a => a.status === 'Present').length;
  const todayLate = dailyAttendance.filter(a => a.status === 'Late').length;
  const todayAbsent = dailyAttendance.filter(a => a.status === 'Absent').length;

  return (
    <div className="container-fluid px-3 px-sm-4 py-4" style={{ minHeight: '100vh', backgroundColor: colors.light, maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div className="card mb-4 shadow-sm" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'visible' }}>
        <div className="card-body p-3 p-sm-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#FEF2F2', width: isMobile ? '46px' : '54px', height: isMobile ? '46px' : '54px', border: '1px solid #FECACA' }}
              >
                <FaCalendarAlt style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', color: colors.primary }} />
              </div>
              <div>
                <h2 className="fw-bold mb-1" style={{ color: colors.darkText, fontSize: isMobile ? '1.35rem' : '1.75rem' }}>
                  Attendance Dashboard
                </h2>
                <p className="text-muted mb-0 small">Monitor and track employee attendance records</p>
              </div>
            </div>

            <Dropdown align="end" className={isMobile ? 'w-100' : 'w-auto'}>
              <Dropdown.Toggle
                variant="danger"
                id="export-attendance-dropdown"
                className="d-flex align-items-center justify-content-center gap-2 fw-semibold px-3 py-2 shadow-sm w-100"
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.85rem' : '0.92rem',
                }}
              >
                <FaFileExport /> Export Reports
              </Dropdown.Toggle>
              <Dropdown.Menu
                align="end"
                popperConfig={{
                  strategy: 'fixed',
                  modifiers: [{ name: 'preventOverflow', options: { boundary: 'viewport', padding: 10 } }],
                }}
                style={{
                  minWidth: '190px',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                  border: '1px solid #E2E8F0',
                  zIndex: 1060
                }}
              >
                <Dropdown.Header className="text-uppercase text-muted" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                  Select Format
                </Dropdown.Header>
                <Dropdown.Item onClick={() => handleExport('PDF')} className="d-flex align-items-center gap-2 py-2">
                  <span className="badge bg-danger-subtle text-danger fw-bold" style={{ fontSize: '11px' }}>PDF</span>
                  <span className="fw-medium">Export as PDF</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleExport('CSV')} className="d-flex align-items-center gap-2 py-2">
                  <span className="badge bg-success-subtle text-success fw-bold" style={{ fontSize: '11px' }}>CSV</span>
                  <span className="fw-medium">Export as CSV</span>
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleExport('Excel')} className="d-flex align-items-center gap-2 py-2">
                  <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: '11px' }}>XLS</span>
                  <span className="fw-medium">Export as Excel</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" style={{ width: '2.5rem', height: '2.5rem' }} />
          <p className="text-muted mt-2 small">Loading attendance data...</p>
        </div>
      )}

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4 shadow-sm" style={{ borderRadius: '10px' }}>{error}</Alert>}

      {!loading && (
        <>
          {/* Quick Stats Grid */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted small">Total Employees</p>
                      <h4 className="fw-bold mb-0" style={{ color: colors.primary, fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                        {totalEmployees}
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#FEF2F2', width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px' }}
                    >
                      <FaUsers style={{ color: colors.primary, fontSize: isMobile ? '1rem' : '1.2rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted small">Today's Present</p>
                      <h4 className="fw-bold mb-0" style={{ color: colors.success, fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                        {todayPresent}
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#ECFDF5', width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px' }}
                    >
                      <FaCheckCircle style={{ color: colors.success, fontSize: isMobile ? '1rem' : '1.2rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted small">Today's Late</p>
                      <h4 className="fw-bold mb-0" style={{ color: colors.warning, fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                        {todayLate}
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#FFFBEB', width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px' }}
                    >
                      <FaClock style={{ color: colors.warning, fontSize: isMobile ? '1rem' : '1.2rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted small">Today's Absent</p>
                      <h4 className="fw-bold mb-0" style={{ color: colors.danger, fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                        {todayAbsent}
                      </h4>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#FEF2F2', width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px' }}
                    >
                      <FaTimesCircle style={{ color: colors.danger, fontSize: isMobile ? '1rem' : '1.2rem' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Modern Segmented Control */}
          <div className="card mb-4 shadow-sm" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
            <div className="card-body p-2">
              <div className="d-flex flex-column flex-md-row gap-2">
                <button
                  className="btn flex-fill d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: activeTab === 'daily' ? colors.primary : 'transparent',
                    color: activeTab === 'daily' ? '#ffffff' : colors.mutedText,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    padding: '9px 12px',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setActiveTab('daily')}
                >
                  <FaCalendarAlt size={14} /> Daily Attendance
                </button>
                <button
                  className="btn flex-fill d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: activeTab === 'lateEarly' ? colors.primary : 'transparent',
                    color: activeTab === 'lateEarly' ? '#ffffff' : colors.mutedText,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    padding: '9px 12px',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setActiveTab('lateEarly')}
                >
                  <FaClock size={14} /> Track Late/Early
                </button>
                <button
                  className="btn flex-fill d-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: activeTab === 'monthly' ? colors.primary : 'transparent',
                    color: activeTab === 'monthly' ? '#ffffff' : colors.mutedText,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    padding: '9px 12px',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setActiveTab('monthly')}
                >
                  <FaChartLine size={14} /> Monthly Summary
                </button>
              </div>
            </div>
          </div>

          {/* 1. DAILY ATTENDANCE TAB */}
          {activeTab === 'daily' && (
            <div className="card shadow-sm" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div className="card-header py-3 px-3 px-sm-4 bg-white" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2.5">
                  <div>
                    <h5 className="mb-1 fw-bold" style={{ color: colors.darkText, fontSize: isMobile ? '1.05rem' : '1.15rem' }}>
                      Daily Attendance
                    </h5>
                    <p className="text-muted mb-0 small">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ width: isMobile ? '100%' : '170px' }}>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      style={{ borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '7px 12px' }}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="card-body p-0">
                {dailyAttendance.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaCalendarAlt style={{ fontSize: '24px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText }}>No Attendance Records</h6>
                    <p className="text-muted mb-0 small">No attendance records found for this date.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Card View */
                  <div className="p-3 d-flex flex-column gap-3">
                    {dailyAttendance.map((record) => (
                      <div
                        key={record.id}
                        className="card shadow-sm"
                        style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}
                      >
                        <div className="p-3 pb-2 d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.light, borderBottom: `1px solid ${colors.border}` }}>
                          <div>
                            <h6 className="fw-bold mb-0" style={{ color: colors.darkText, fontSize: '0.95rem' }}>
                              {record.employee}
                            </h6>
                            <span className="text-muted small">{record.department}</span>
                          </div>
                          <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(record.status), borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {record.status}
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="p-2.5 rounded-3 mb-0" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                            <div className="row g-2">
                              <div className="col-4">
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>IN Time</div>
                                <div className="fw-bold" style={{ color: record.inTime !== '-' ? colors.darkText : colors.mutedText, fontSize: '0.85rem' }}>
                                  {record.inTime}
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>OUT Time</div>
                                <div className="fw-bold" style={{ color: record.outTime !== '-' ? colors.darkText : colors.mutedText, fontSize: '0.85rem' }}>
                                  {record.outTime}
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Late/Early</div>
                                <div className="fw-medium text-truncate" style={{ color: colors.warning, fontSize: '0.82rem' }}>
                                  {record.lateBy || record.earlyBy || '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr style={{ backgroundColor: colors.light }}>
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>EMPLOYEE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DEPARTMENT</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>IN TIME</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>OUT TIME</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
                          <th className="border-0 py-3 pe-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>LATE / EARLY BY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyAttendance.map((record) => (
                          <tr key={record.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{record.employee}</td>
                            <td className="py-3 text-muted">{record.department}</td>
                            <td className="py-3 text-dark">{record.inTime}</td>
                            <td className="py-3 text-dark">{record.outTime}</td>
                            <td className="py-3">
                              <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(record.status), borderRadius: '6px' }}>
                                {record.status}
                              </span>
                            </td>
                            <td className="py-3 pe-4 text-muted">{record.lateBy || record.earlyBy || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. TRACK LATE / EARLY TAB */}
          {activeTab === 'lateEarly' && (
            <div className="card shadow-sm" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div className="card-header py-3 px-3 px-sm-4 bg-white" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2.5">
                  <h5 className="mb-0 fw-bold" style={{ color: colors.darkText, fontSize: isMobile ? '1.05rem' : '1.15rem' }}>
                    Late / Early Tracking
                  </h5>
                  <div style={{ width: isMobile ? '100%' : '180px' }}>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '7px 12px' }}
                      value={`${selectedMonth}-${selectedYear}`}
                      onChange={(e) => {
                        const [month, year] = e.target.value.split('-').map(Number);
                        setSelectedMonth(month);
                        setSelectedYear(year);
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={`${i}-${selectedYear}`}>
                          {monthNames[i]} {selectedYear}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="card-body p-0">
                {lateEarlyTracking.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaClock style={{ fontSize: '24px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText }}>No Late / Early Records</h6>
                    <p className="text-muted mb-0 small">No late check-in or early check-out records found for this month.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Card View */
                  <div className="p-3 d-flex flex-column gap-3">
                    {lateEarlyTracking.map((record) => (
                      <div
                        key={record.id}
                        className="card shadow-sm"
                        style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}
                      >
                        <div className="p-3 pb-2 d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.light, borderBottom: `1px solid ${colors.border}` }}>
                          <div>
                            <h6 className="fw-bold mb-0" style={{ color: colors.darkText, fontSize: '0.95rem' }}>
                              {record.employee}
                            </h6>
                            <span className="text-muted small">{record.department}</span>
                          </div>
                          <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(record.type), borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {record.type}
                          </span>
                        </div>
                        <div className="p-3 d-flex justify-content-between align-items-center">
                          <span className="text-muted small">Date: <strong className="text-dark">{record.date}</strong></span>
                          <span className="text-muted small">Duration: <strong className="text-danger">{record.duration}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr style={{ backgroundColor: colors.light }}>
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>EMPLOYEE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DEPARTMENT</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DATE</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>TYPE</th>
                          <th className="border-0 py-3 pe-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DURATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lateEarlyTracking.map((record) => (
                          <tr key={record.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{record.employee}</td>
                            <td className="py-3 text-muted">{record.department}</td>
                            <td className="py-3 text-dark">{record.date}</td>
                            <td className="py-3">
                              <span className="badge px-2.5 py-1" style={{ ...getStatusBadgeStyle(record.type), borderRadius: '6px' }}>
                                {record.type}
                              </span>
                            </td>
                            <td className="py-3 pe-4 text-dark fw-semibold">{record.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. MONTHLY SUMMARY TAB */}
          {activeTab === 'monthly' && (
            <div className="card shadow-sm" style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div className="card-header py-3 px-3 px-sm-4 bg-white" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2.5">
                  <h5 className="mb-0 fw-bold" style={{ color: colors.darkText, fontSize: isMobile ? '1.05rem' : '1.15rem' }}>
                    Monthly Summary - {monthNames[selectedMonth]} {selectedYear}
                  </h5>
                  <div style={{ width: isMobile ? '100%' : '180px' }}>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '7px 12px' }}
                      value={`${selectedMonth}-${selectedYear}`}
                      onChange={(e) => {
                        const [month, year] = e.target.value.split('-').map(Number);
                        setSelectedMonth(month);
                        setSelectedYear(year);
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={`${i}-${selectedYear}`}>
                          {monthNames[i]} {selectedYear}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="card-body p-0">
                {monthlySummary.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: colors.light }}>
                      <FaChartLine style={{ fontSize: '24px', color: colors.mutedText }} />
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: colors.darkText }}>No Monthly Summary</h6>
                    <p className="text-muted mb-0 small">No summary data available for this month.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Card View */
                  <div className="p-3 d-flex flex-column gap-3">
                    {monthlySummary.map((record) => (
                      <div
                        key={record.id}
                        className="card shadow-sm"
                        style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}
                      >
                        <div className="p-3 pb-2 d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.light, borderBottom: `1px solid ${colors.border}` }}>
                          <h6 className="fw-bold mb-0" style={{ color: colors.darkText, fontSize: '0.95rem' }}>
                            {record.department}
                          </h6>
                          <span className="badge bg-white text-dark px-2.5 py-1" style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '0.75rem' }}>
                            {record.totalEmployees} Employees
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="mb-2">
                            <div className="d-flex justify-content-between small mb-1">
                              <span className="text-muted">Avg. Present</span>
                              <span className="fw-bold text-success">{record.avgPresent}</span>
                            </div>
                            <div className="progress" style={{ height: '7px', borderRadius: '4px' }}>
                              <div className="progress-bar bg-success" style={{ width: record.avgPresent }}></div>
                            </div>
                          </div>
                          <div className="mb-2">
                            <div className="d-flex justify-content-between small mb-1">
                              <span className="text-muted">Avg. Late</span>
                              <span className="fw-bold text-warning">{record.avgLate}</span>
                            </div>
                            <div className="progress" style={{ height: '7px', borderRadius: '4px' }}>
                              <div className="progress-bar bg-warning" style={{ width: record.avgLate }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="d-flex justify-content-between small mb-1">
                              <span className="text-muted">Avg. Early</span>
                              <span className="fw-bold text-info">{record.avgEarly}</span>
                            </div>
                            <div className="progress" style={{ height: '7px', borderRadius: '4px' }}>
                              <div className="progress-bar bg-info" style={{ width: record.avgEarly }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr style={{ backgroundColor: colors.light }}>
                          <th className="border-0 py-3 ps-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>DEPARTMENT</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>EMPLOYEES</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>AVG. PRESENT</th>
                          <th className="border-0 py-3" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>AVG. LATE</th>
                          <th className="border-0 py-3 pe-4" style={{ color: colors.mutedText, fontSize: '0.85rem', fontWeight: 600 }}>AVG. EARLY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlySummary.map((record) => (
                          <tr key={record.id}>
                            <td className="py-3 ps-4 fw-medium text-dark">{record.department}</td>
                            <td className="py-3 text-dark">{record.totalEmployees}</td>
                            <td className="py-3">
                              <div className="d-flex align-items-center gap-2" style={{ minWidth: '120px' }}>
                                <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '4px' }}>
                                  <div className="progress-bar bg-success" style={{ width: record.avgPresent }}></div>
                                </div>
                                <span className="small fw-semibold">{record.avgPresent}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="d-flex align-items-center gap-2" style={{ minWidth: '120px' }}>
                                <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '4px' }}>
                                  <div className="progress-bar bg-warning" style={{ width: record.avgLate }}></div>
                                </div>
                                <span className="small fw-semibold">{record.avgLate}</span>
                              </div>
                            </td>
                            <td className="py-3 pe-4">
                              <div className="d-flex align-items-center gap-2" style={{ minWidth: '120px' }}>
                                <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '4px' }}>
                                  <div className="progress-bar bg-info" style={{ width: record.avgEarly }}></div>
                                </div>
                                <span className="small fw-semibold">{record.avgEarly}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployerAttendance;
