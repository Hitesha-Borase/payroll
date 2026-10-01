import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { 
  FaCalendarAlt, 
  FaCalendarWeek, 
  FaFileExport, 
  FaCog, 
  FaEdit, 
  FaFilePdf, 
  FaFileExcel, 
  FaFileCsv,
  FaDownload,
  FaTimes
} from 'react-icons/fa';
import { Spinner, Alert, Modal, Button, Form, Row, Col } from 'react-bootstrap';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { adminAPI } from '../../services/api';

// Color scheme
const colors = {
  primary: '#C62828',
  secondary: '#2c3e50',
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#9b59b6',
  light: '#f8f9fa',
  dark: '#343a40',
};

const AttendanceManagement = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [showRules, setShowRules] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [editingRecord, setEditingRecord] = useState(null);

  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch employees and attendance data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const empResponse = await adminAPI.getEmployees();
      if (empResponse?.data?.success) {
        setEmployees(empResponse.data.data.map(emp => ({
          id: emp.id,
          name: emp.user?.name || 'N/A',
        })));
      }

      const attResponse = await adminAPI.getAttendance();
      if (attResponse?.data?.success) {
        const data = attResponse.data.data || [];
        setDailyAttendance(data);

        const summary = {};
        data.forEach(att => {
          const empId = att.employee_id;
          if (!summary[empId]) {
            summary[empId] = { id: empId, employee: att.employee_name, present: 0, absent: 0, late: 0, leave: 0, otHours: 0 };
          }
          const status = (att.status || '').toLowerCase();
          if (status === 'present') summary[empId].present++;
          else if (status === 'absent') summary[empId].absent++;
          else if (status === 'late') summary[empId].late++;
          else if (status === 'leave') summary[empId].leave++;
          summary[empId].otHours += Math.max(0, parseFloat(att.working_hours || 0) - 8);
        });
        setMonthlyAttendance(Object.values(summary));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Form state for edit
  const [editForm, setEditForm] = useState({
    id: '',
    employee: '',
    date: '',
    inTime: '',
    outTime: '',
    status: 'Present'
  });

  // Form state for attendance rules
  const [rulesForm, setRulesForm] = useState({
    shiftTiming: '09:00 AM - 06:00 PM',
    graceTime: '10',
    overtimeRule: 'After 30 mins beyond shift',
    halfDayRule: 'Less than 4 hours',
    weeklyOff: 'Sunday'
  });

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRulesFormChange = (e) => {
    const { name, value } = e.target;
    setRulesForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedAttendance = dailyAttendance.map(record => {
      if (record.id === editForm.id) {
        return {
          ...record,
          employee: employees.find(emp => emp.id === parseInt(editForm.employee))?.name || record.employee,
          inTime: editForm.inTime || '-',
          outTime: editForm.outTime || '-',
          status: editForm.status
        };
      }
      return record;
    });

    setDailyAttendance(updatedAttendance);
    toast.success('Attendance updated successfully!');
    setShowEditModal(false);
    setEditForm({
      id: '',
      employee: '',
      date: '',
      inTime: '',
      outTime: '',
      status: 'Present'
    });
  };

  const handleRulesSubmit = (e) => {
    e.preventDefault();
    toast.success('Attendance rules updated successfully!');
    setShowRules(false);
  };

  const formatTimeDisplay = (val) => {
    if (!val || val === '-') return '-';
    try {
      if (/^\d{1,2}:\d{2}\s*(AM|PM)?$/i.test(val)) return val;
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return val;
    } catch {
      return val;
    }
  };

  const handleExport = (format) => {
    try {
      let exportHeaders = [];
      let exportRows = [];
      let reportTitle = '';
      let periodInfo = '';

      if (activeTab === 'daily') {
        reportTitle = 'Daily Attendance Report';
        periodInfo = `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
        exportHeaders = ['#', 'Employee Name', 'IN Time', 'OUT Time', 'Status'];
        
        const filteredList = dailyAttendance.filter(r => 
          (r.employee_name || r.employee || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        exportRows = filteredList.map((item, idx) => [
          (idx + 1).toString(),
          item.employee_name || item.employee || 'N/A',
          formatTimeDisplay(item.check_in_time || item.check_in || item.inTime),
          formatTimeDisplay(item.check_out_time || item.check_out || item.outTime),
          item.status || 'Absent'
        ]);
      } else {
        reportTitle = 'Monthly Attendance Summary Report';
        periodInfo = `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
        exportHeaders = ['#', 'Employee Name', 'Present', 'Absent', 'Late', 'Leaves', 'OT Hours'];
        
        const filteredList = monthlyAttendance.filter(r => 
          (r.employee || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        exportRows = filteredList.map((item, idx) => [
          (idx + 1).toString(),
          item.employee || 'N/A',
          (item.present || 0).toString(),
          (item.absent || 0).toString(),
          (item.late || 0).toString(),
          (item.leaves || item.leave || 0).toString(),
          parseFloat(item.otHours || 0).toFixed(2)
        ]);
      }

      if (exportRows.length === 0) {
        toast.error('No attendance records found to export.');
        return;
      }

      const fileDate = new Date().toISOString().split('T')[0];

      if (format === 'PDF') {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Top Accent Bar
        doc.setFillColor(198, 40, 40);
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
        doc.text(`Total Records: ${exportRows.length}`, pageWidth - 14, 30, { align: 'right' });

        // Divider
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(14, 34, pageWidth - 14, 34);

        // AutoTable
        const tableOptions = {
          startY: 40,
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

        // Page numbering footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setDrawColor(220, 220, 220);
          doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(130, 130, 130);
          doc.text('Kiaan Workforce & Payroll • Attendance Management Report', 14, pageHeight - 7);
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
        }

        doc.save(`Attendance_${activeTab}_Report_${fileDate}.pdf`);
        toast.success(`Attendance report exported as PDF successfully!`);
      } else if (format === 'Excel') {
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
              <tr><td colspan="${exportHeaders.length}" class="meta-row">${periodInfo} | Total: ${exportRows.length} records</td></tr>
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

        toast.success(`Attendance report exported as Excel (.xls) successfully!`);
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

        toast.success(`Attendance report exported as CSV (.csv) successfully!`);
      }
      setShowExportModal(false);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Failed to export attendance report: ${err.message || 'Unknown error'}`);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-success';
      case 'Absent':
        return 'bg-danger';
      case 'Late':
        return 'bg-warning';
      case 'Leave':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const handleEditAttendance = (id) => {
    const record = dailyAttendance.find(r => r.id === id);
    if (record) {
      setEditingRecord(record);
      setEditForm({
        id: record.id,
        employee: employees.find(emp => emp.name === record.employee)?.id || '',
        date: new Date().toISOString().split('T')[0],
        inTime: record.inTime === '-' ? '' : record.inTime,
        outTime: record.outTime === '-' ? '' : record.outTime,
        status: record.status
      });
      setShowEditModal(true);
    }
  };

  const handleMarkNow = (id) => {
    const record = dailyAttendance.find(r => r.id === id);
    if (record) {
      setEditingRecord(record);
      setEditForm({
        id: record.id,
        employee: employees.find(emp => emp.name === record.employee)?.id || '',
        date: new Date().toISOString().split('T')[0],
        inTime: '',
        outTime: '',
        status: 'Present'
      });
      setShowEditModal(true);
    }
  };

  return (
    <div className="container-fluid py-3 py-md-4 px-2 px-md-3" style={{ minHeight: '100vh', backgroundColor: colors.light }}>
      {/* Header */}
      <div className="row mb-3 mb-md-4">
        <div className="col-12">
          <h2 className="fw-bold fs-4 fs-md-2" style={{ color: colors.primary }}>Attendance Management</h2>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-3 mb-md-4">
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-body p-3 p-md-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3">
                <div className="flex-grow-1" style={{ maxWidth: '400px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    className={`btn ${activeTab === 'daily' ? 'btn-primary' : 'btn-outline-primary'} flex-fill flex-sm-grow-0`}
                    onClick={() => setActiveTab('daily')}
                    style={activeTab === 'daily' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { color: colors.primary, borderColor: colors.primary }}
                  >
                    <FaCalendarAlt className="me-2" />Daily Attendance
                  </button>
                  <button
                    className={`btn ${activeTab === 'monthly' ? 'btn-primary' : 'btn-outline-primary'} flex-fill flex-sm-grow-0`}
                    onClick={() => setActiveTab('monthly')}
                    style={activeTab === 'monthly' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { color: colors.primary, borderColor: colors.primary }}
                  >
                    <FaCalendarWeek className="me-2" />Monthly Attendance
                  </button>
                  
                  {/* Export Button -> Guaranteed to open Modal */}
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill flex-sm-grow-0 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setShowExportModal(true)}
                    style={{ fontWeight: '600', minWidth: '110px' }}
                  >
                    <FaFileExport color="#C62828" />
                    <span>Export</span>
                  </button>

                  <button
                    className="btn btn-outline-secondary flex-fill flex-sm-grow-0"
                    onClick={() => setShowRules(true)}
                  >
                    <FaCog className="me-2" />Attendance Rules
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Attendance Table */}
      {activeTab === 'daily' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0 rounded-3">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold fs-6 fs-md-5">Daily Attendance Snapshot</h5>
                <span className="badge bg-light text-dark border">
                  {dailyAttendance.filter(r => (r.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase())).length} Records
                </span>
              </div>
              <div className="card-body p-0 p-md-3">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ whiteSpace: 'nowrap' }}>Employee</th>
                        <th style={{ whiteSpace: 'nowrap' }}>IN Time</th>
                        <th style={{ whiteSpace: 'nowrap' }}>OUT Time</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyAttendance
                        .filter(r => (r.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((record) => (
                          <tr key={record.id}>
                            <td className="fw-semibold text-dark" style={{ whiteSpace: 'nowrap' }}>{record.employee_name}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatTimeDisplay(record.check_in_time || record.check_in)}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatTimeDisplay(record.check_out_time || record.check_out)}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                                {record.status}
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {record.status === 'Absent' ? (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleMarkNow(record.id)}
                                  style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                                >
                                  Mark Now
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => handleEditAttendance(record.id)}
                                >
                                  <FaEdit />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Attendance Table */}
      {activeTab === 'monthly' && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0 rounded-3">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold fs-6 fs-md-5">Monthly Attendance Summary</h5>
                <span className="badge bg-light text-dark border">
                  {monthlyAttendance.filter(r => (r.employee || '').toLowerCase().includes(searchTerm.toLowerCase())).length} Records
                </span>
              </div>
              <div className="card-body p-0 p-md-3">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ whiteSpace: 'nowrap' }}>Employee</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Present</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Absent</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Late</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Leaves</th>
                        <th style={{ whiteSpace: 'nowrap' }}>OT Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyAttendance
                        .filter(r => (r.employee || '').toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((record) => (
                          <tr key={record.id}>
                            <td className="fw-semibold text-dark" style={{ whiteSpace: 'nowrap' }}>{record.employee}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{record.present}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{record.absent}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{record.late}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{record.leaves || record.leave || 0}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{parseFloat(record.otHours || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. EXPORT ATTENDANCE MODAL (Uniform, Perfectly Sized Buttons) */}
      <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0' }}>
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
            <FaFileExport color="#C62828" />
            <span>Export Attendance Report</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted small mb-3">
            Select your preferred file format to download the <strong>{activeTab === 'daily' ? 'Daily Attendance' : 'Monthly Attendance Summary'}</strong> report.
          </p>

          <div className="d-flex flex-column gap-3">
            {/* PDF Option */}
            <div 
              onClick={() => handleExport('PDF')}
              className="p-3 rounded-3 d-flex align-items-center justify-content-between"
              style={{
                backgroundColor: '#FFF1F2',
                border: '1.5px solid #FECDD3',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FFE4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaFilePdf size={22} color="#E11D48" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '14px' }}>Export as PDF Document</h6>
                  <span className="text-muted small" style={{ fontSize: '12px' }}>Branded, printable PDF with header and tables</span>
                </div>
              </div>
              <button 
                type="button"
                className="btn btn-sm text-white fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                style={{ 
                  backgroundColor: '#E11D48', 
                  borderColor: '#E11D48',
                  minWidth: '85px',
                  height: '34px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              >
                <FaDownload size={12} />
                <span>PDF</span>
              </button>
            </div>

            {/* Excel Option */}
            <div 
              onClick={() => handleExport('Excel')}
              className="p-3 rounded-3 d-flex align-items-center justify-content-between"
              style={{
                backgroundColor: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaFileExcel size={22} color="#16A34A" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '14px' }}>Export as Excel (.xls)</h6>
                  <span className="text-muted small" style={{ fontSize: '12px' }}>Formatted spreadsheet with columns and rows</span>
                </div>
              </div>
              <button 
                type="button"
                className="btn btn-sm text-white fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                style={{ 
                  backgroundColor: '#16A34A', 
                  borderColor: '#16A34A',
                  minWidth: '85px',
                  height: '34px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              >
                <FaDownload size={12} />
                <span>Excel</span>
              </button>
            </div>

            {/* CSV Option */}
            <div 
              onClick={() => handleExport('CSV')}
              className="p-3 rounded-3 d-flex align-items-center justify-content-between"
              style={{
                backgroundColor: '#F0F9FF',
                border: '1.5px solid #BAE6FD',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaFileCsv size={22} color="#0284C7" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '14px' }}>Export as CSV (.csv)</h6>
                  <span className="text-muted small" style={{ fontSize: '12px' }}>Raw data table for Excel or Google Sheets</span>
                </div>
              </div>
              <button 
                type="button"
                className="btn btn-sm text-white fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                style={{ 
                  backgroundColor: '#0284C7', 
                  borderColor: '#0284C7',
                  minWidth: '85px',
                  height: '34px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              >
                <FaDownload size={12} />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #E2E8F0' }}>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 2. EDIT ATTENDANCE MODAL */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0' }}>
          <Modal.Title className="fw-bold fs-5 text-dark">Edit Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Employee</Form.Label>
              <Form.Select
                name="employee"
                value={editForm.employee}
                onChange={handleEditFormChange}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={editForm.date}
                onChange={handleEditFormChange}
                required
              />
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">IN Time</Form.Label>
                  <Form.Control
                    type="time"
                    name="inTime"
                    value={editForm.inTime}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">OUT Time</Form.Label>
                  <Form.Control
                    type="time"
                    name="outTime"
                    value={editForm.outTime}
                    onChange={handleEditFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small">Status</Form.Label>
              <Form.Select
                name="status"
                value={editForm.status}
                onChange={handleEditFormChange}
                required
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
                Update Attendance
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* 3. ATTENDANCE RULES MODAL */}
      <Modal 
        show={showRules} 
        onHide={() => setShowRules(false)} 
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0' }}>
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
            <FaCog color="#C62828" />
            <span>Attendance Rules</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleRulesSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-dark">Shift Timing</Form.Label>
              <Form.Control
                type="text"
                name="shiftTiming"
                value={rulesForm.shiftTiming}
                onChange={handleRulesFormChange}
                placeholder="09:00 AM - 06:00 PM"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-dark">Grace Time (minutes)</Form.Label>
              <Form.Control
                type="text"
                name="graceTime"
                value={rulesForm.graceTime}
                onChange={handleRulesFormChange}
                placeholder="10"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-dark">Overtime Rule</Form.Label>
              <Form.Control
                type="text"
                name="overtimeRule"
                value={rulesForm.overtimeRule}
                onChange={handleRulesFormChange}
                placeholder="After 30 mins beyond shift"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-dark">Half-Day Rule</Form.Label>
              <Form.Control
                type="text"
                name="halfDayRule"
                value={rulesForm.halfDayRule}
                onChange={handleRulesFormChange}
                placeholder="Less than 4 hours"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small text-dark">Weekly Off</Form.Label>
              <Form.Select
                name="weeklyOff"
                value={rulesForm.weeklyOff}
                onChange={handleRulesFormChange}
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowRules(false)}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
                Update Rules
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;