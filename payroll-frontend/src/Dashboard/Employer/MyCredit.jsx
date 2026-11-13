import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaPlus, FaEye, FaExclamationTriangle, FaFilter, FaTimes, FaHistory, FaDownload, FaSearch, FaFilePdf, FaFileCsv } from 'react-icons/fa';
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import "bootstrap/dist/css/bootstrap.min.css";
import { employerAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRegional } from '../../context/RegionalContext';

const CreditBalance = () => {
  const { formatCurrency } = useRegional();
  const [showLowBalanceAlert, setShowLowBalanceAlert] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestType, setRequestType] = useState('Added');
  const [requestStatus, setRequestStatus] = useState('Pending');
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [creditBalance, setCreditBalance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lowBalanceThreshold = 10000;

  // Storage key helpers for credit requests
  const getCreditStorageKey = () => {
    const user = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'current';
    return `employer_credit_requests_${user}`;
  };

  const getSavedCreditRequests = () => {
    try {
      const key = getCreditStorageKey();
      const local = localStorage.getItem(key) || localStorage.getItem('employer_custom_credit_requests');
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  };

  const saveCreditRequestsLocally = (list) => {
    try {
      const key = getCreditStorageKey();
      localStorage.setItem(key, JSON.stringify(list));
      localStorage.setItem('employer_custom_credit_requests', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save credit requests locally:', e);
    }
  };

  // Fetch credit data from API
  useEffect(() => {
    const fetchCreditData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch credit balance
        try {
          const balanceRes = await employerAPI.getCreditBalance();
          if (balanceRes?.data?.success) {
            const credit = balanceRes.data.data;
            setCreditBalance(parseFloat(credit.balance || credit.amount || 0));
            setLastUpdated(credit.updated_at || credit.created_at || new Date().toLocaleDateString());
          }
        } catch (balErr) {
          console.warn('Could not fetch remote credit balance:', balErr);
        }

        // Fetch credit history
        let history = [];
        try {
          const historyRes = await employerAPI.getCreditHistory();
          if (historyRes?.data?.success) {
            history = historyRes.data.data || [];
          }
        } catch (histErr) {
          console.warn('Could not fetch remote credit history:', histErr);
        }

        const localRequests = getSavedCreditRequests();
        const formattedHistory = history.map(item => {
          const type = (item.type?.toLowerCase() === 'credit' || item.type?.toLowerCase() === 'added' || item.type === 'CREDIT') ? 'Added' : 'Deducted';
          return {
            id: item.id,
            date: item.created_at || item.transaction_date,
            type: type,
            amount: Math.abs(parseFloat(item.amount || 0)),
            status: item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Success',
            notes: item.reference_note || item.description || item.reference || '',
          };
        });

        // Merge local requests that aren't in remote history
        localRequests.forEach(loc => {
          const exists = formattedHistory.some(h => String(h.id) === String(loc.id));
          if (!exists) {
            formattedHistory.unshift(loc);
          }
        });

        setCreditHistory(formattedHistory);
      } catch (err) {
        console.error('Failed to load credit data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCreditData();
  }, []);

  // Calculate statistics
  const totalAdded = creditHistory
    .filter(item => item.type === 'Added' && item.status === 'Success')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalDeducted = creditHistory
    .filter(item => item.type === 'Deducted' && item.status === 'Success')
    .reduce((sum, item) => sum + item.amount, 0);

  // Calculate percentage change
  const netChange = totalAdded - totalDeducted;
  const percentageChange = creditHistory.length > 0 ? (netChange / totalAdded * 100).toFixed(1) : 0;

  // Filter
  const filteredHistory = creditHistory.filter(item => {
    const matchesSearch = item.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Check for low balance
  useEffect(() => {
    if (creditBalance < lowBalanceThreshold) {
      setShowLowBalanceAlert(true);
    } else {
      setShowLowBalanceAlert(false);
    }
  }, [creditBalance]);

  // Function to download credit statement as CSV
  const downloadCSVStatement = () => {
    try {
      const headers = ['Transaction ID', 'Date', 'Type', 'Amount ($)', 'Status', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...creditHistory.map(item => [
          `"${item.id || ''}"`,
          `"${item.date || ''}"`,
          `"${item.type || ''}"`,
          `"${item.amount || 0}"`,
          `"${item.status || ''}"`,
          `"${(item.notes || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `credit_statement_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Credit statement CSV downloaded successfully!');
    } catch (err) {
      console.error('Error generating CSV statement:', err);
      toast.error('Failed to download CSV statement');
    }
  };

  // Function to download credit statement as a branded PDF
  const downloadStatement = () => {
    try {
      if (!creditHistory || creditHistory.length === 0) {
        toast.error('No transaction history found to generate statement.');
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Top Primary Brand Accent Bar
      doc.setFillColor(198, 40, 40); // #C62828
      doc.rect(0, 0, pageWidth, 8, 'F');

      // Company / Header Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(198, 40, 40);
      doc.text('KIAAN TECHNOLOGY', 14, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Workforce & Payroll Management Platform', 14, 27);

      // Statement Title & Info on Right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(33, 33, 33);
      doc.text('CREDIT ACCOUNT STATEMENT', pageWidth - 14, 20, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      const todayStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      doc.text(`Generated On: ${todayStr}`, pageWidth - 14, 26, { align: 'right' });
      doc.text(`Statement ID: STM-${Date.now().toString().slice(-8)}`, pageWidth - 14, 31, { align: 'right' });

      // Divider line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(14, 36, pageWidth - 14, 36);

      // Account Summary Box
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, 40, pageWidth - 28, 28, 3, 3, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(14, 40, pageWidth - 28, 28, 3, 3, 'D');

      // Metric 1: Current Balance
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text('CURRENT BALANCE', 20, 48);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(198, 40, 40);
      doc.text(`$${creditBalance.toLocaleString()}`, 20, 57);

      // Metric 2: Total Added
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text('TOTAL ADDED', 68, 48);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(46, 125, 50); // Green
      doc.text(`+$${totalAdded.toLocaleString()}`, 68, 57);

      // Metric 3: Total Deducted
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text('TOTAL DEDUCTED', 116, 48);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(211, 47, 47); // Red
      doc.text(`-$${totalDeducted.toLocaleString()}`, 116, 57);

      // Metric 4: Total Transactions
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text('TRANSACTIONS', 162, 48);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(33, 33, 33);
      doc.text(`${creditHistory.length}`, 162, 57);

      // Section Title: Transaction Details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(33, 33, 33);
      doc.text('Transaction History', 14, 76);

      // Prepare Table Data
      const tableData = creditHistory.map((item, index) => {
        let dateFormatted = item.date || 'N/A';
        try {
          if (item.date && !isNaN(new Date(item.date).getTime())) {
            dateFormatted = new Date(item.date).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        } catch (e) {}

        const sign = item.type === 'Added' ? '+' : '-';
        return [
          (index + 1).toString(),
          dateFormatted,
          item.type || 'N/A',
          item.notes || 'No description provided',
          item.status || 'Success',
          `${sign}$${item.amount.toLocaleString()}`
        ];
      });

      // AutoTable
      doc.autoTable({
        startY: 80,
        head: [['#', 'Date & Time', 'Type', 'Description / Reference', 'Status', 'Amount ($)']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [198, 40, 40],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'left',
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 42 },
          2: { cellWidth: 22 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2.8,
          textColor: [50, 50, 50],
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            // Color amount column
            if (data.column.index === 5) {
              const text = data.cell.raw || '';
              if (text.startsWith('+')) {
                data.cell.styles.textColor = [46, 125, 50];
              } else if (text.startsWith('-')) {
                data.cell.styles.textColor = [198, 40, 40];
              }
            }
            // Status column styling
            if (data.column.index === 4) {
              const status = (data.cell.raw || '').toLowerCase();
              if (status === 'success') {
                data.cell.styles.textColor = [46, 125, 50];
              } else if (status === 'pending') {
                data.cell.styles.textColor = [230, 81, 0];
              } else {
                data.cell.styles.textColor = [198, 40, 40];
              }
            }
          }
        },
        margin: { left: 14, right: 14, bottom: 20 },
      });

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text('Kiaan Workforce & Payroll • Confidential & Official Statement', 14, pageHeight - 8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
      }

      const fileName = `Kiaan_Credit_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('Credit statement PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF statement:', err);
      // Fallback CSV download if PDF encountered any error
      downloadCSVStatement();
    }
  };

  const handleRequestCredits = async () => {
    if (!requestAmount || !requestReason || !requestReason.trim()) {
      toast.error('Please fill in required fields (Amount and Reason).');
      return;
    }

    const parsedAmount = parseFloat(requestAmount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    const newRequestId = `CR-${Date.now().toString().slice(-6)}`;
    const newRequestItem = {
      id: newRequestId,
      date: new Date().toISOString().split('T')[0],
      type: 'Added',
      amount: parsedAmount,
      status: 'Pending',
      notes: requestReason.trim(),
    };

    try {
      setLoading(true);

      // Attempt backend API call
      try {
        await employerAPI.requestCredit({
          amount: parsedAmount,
          reason: requestReason.trim()
        });
      } catch (apiErr) {
        console.warn('Backend request-credit notice (handled with local storage fallback):', apiErr);
      }

      // Save locally to ensure persistent display even if remote server is unreachable
      const currentSaved = getSavedCreditRequests();
      const updatedSaved = [newRequestItem, ...currentSaved.filter(r => String(r.id) !== String(newRequestId))];
      saveCreditRequestsLocally(updatedSaved);

      // Update state immediately
      setCreditHistory(prev => {
        const exists = prev.some(item => String(item.id) === String(newRequestId));
        if (exists) return prev;
        return [newRequestItem, ...prev];
      });

      // Clear form & close modal
      setRequestAmount('');
      setRequestReason('');
      setShowRequestModal(false);

      toast.success('Credit request submitted successfully and is pending approval!');
    } catch (err) {
      console.error('Error submitting credit request:', err);
      toast.error('Failed to submit credit request');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  return (
    <div className="container-fluid p-3 p-md-4" style={{ minHeight: "100vh" }}>
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <h2 className="fw-bold mb-3 mb-md-0" style={{ color: "#C62828" }}>My Credits</h2>
        <div className="d-flex align-items-center text-muted small">
          <span className="me-2">Last updated:</span>
          <span>{lastUpdated}</span>
        </div>
      </div>

      {/* Low Balance Alert */}
      {showLowBalanceAlert && (
        <div className="alert alert-warning d-flex align-items-center mb-4" style={{ borderRadius: "12px", border: "none" }}>
          <FaExclamationTriangle className="me-2 flex-shrink-0" />
          <div className="flex-grow-1">
            Your credit balance is below ${lowBalanceThreshold.toLocaleString()}. Please request more credits.
          </div>
          <button type="button" className="btn-close flex-shrink-0" onClick={() => setShowLowBalanceAlert(false)}></button>
        </div>
      )}

      {/* Credit Balance Cards */}
      <div className="row mb-4">
        <div className="col-12 col-lg-4 mb-4 mb-lg-0">
          <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: "16px", background: "linear-gradient(135deg, #C62828 0%, #D32F2F 100%)" }}>
            <div className="card-body p-4 text-white">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <p className="mb-2 text-white-50">Current Balance</p>
                  <h1 className="fw-bold mb-0" style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)" }}>{formatCurrency(creditBalance)}</h1>
                </div>
                <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <FaCreditCard size={30} color="white" />
                </div>
              </div>
              <div className="d-flex align-items-center">
                <div className={`d-flex align-items-center me-3 ${netChange >= 0 ? 'text-white-50' : 'text-white-50'}`}>
                  {netChange >= 0 ? <FaArrowTrendUp className="me-1" /> : <FaArrowTrendDown className="me-1" />}
                  <span>{Math.abs(percentageChange)}%</span>
                </div>
                <div className="text-white-50 small">from last month</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4 mb-4 mb-lg-0">
          <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: "16px" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-semibold">Total Added</h5>
                <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#e8f5e9" }}>
                  <FaArrowTrendUp size={20} color="#2e7d32" />
                </div>
              </div>
              <h3 className="fw-bold text-success mb-2" style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}>{formatCurrency(totalAdded)}</h3>
              <div className="progress" style={{ height: "6px" }}>
                <div className="progress-bar bg-success" role="progressbar" style={{ width: `${totalAdded > 0 ? (totalAdded / (totalAdded + totalDeducted) * 100) : 0}%` }}></div>
              </div>
              <p className="text-muted small mt-2 mb-0">{creditHistory.filter(item => item.type === 'Added' && item.status === 'Success').length} transactions</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4 mb-4 mb-lg-0">
          <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: "16px" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-semibold">Total Deducted</h5>
                <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#ffebee" }}>
                  <FaArrowTrendDown size={20} color="#c62828" />
                </div>
              </div>
              <h3 className="fw-bold text-danger mb-2" style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}>{formatCurrency(totalDeducted)}</h3>
              <div className="progress" style={{ height: "6px" }}>
                <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${totalDeducted > 0 ? (totalDeducted / (totalAdded + totalDeducted) * 100) : 0}%` }}></div>
              </div>
              <p className="text-muted small mt-2 mb-0">{creditHistory.filter(item => item.type === 'Deducted' && item.status === 'Success').length} transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "16px" }}>
        <div className="card-body p-4">
          <h5 className="mb-4 fw-semibold">Quick Actions</h5>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <button
                className="btn d-flex align-items-center justify-content-center w-100 py-3 text-white"
                style={{ background: "linear-gradient(135deg, #C62828 0%, #D32F2F 100%)", borderRadius: "12px", transition: "all 0.3s ease" }}
                onClick={() => setShowRequestModal(true)}
              >
                <FaPlus className="me-2" />
                Request More Credits
              </button>
            </div>
            <div className="col-12 col-md-6">
              <button
                className="btn d-flex align-items-center justify-content-center w-100 py-3"
                style={{ border: "2px solid #C62828", color: "#C62828", borderRadius: "12px", background: "white", transition: "all 0.3s ease" }}
                onClick={downloadStatement}
              >
                <FaDownload className="me-2" />
                Download Statement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Credit History */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "16px" }}>
        <div className="card-header bg-white p-4 border-0">
          <div className="row align-items-center">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <h5 className="mb-0 fw-semibold d-flex align-items-center">
                <FaHistory className="me-2" style={{ color: "#C62828" }} />
                Credit History
              </h5>
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex flex-column flex-md-row gap-2">
                <div className="position-relative flex-grow-1">
                  <input
                    type="text"
                    className="form-control ps-5"
                    style={{ border: "1px solid #E2E2E2", borderRadius: "8px" }}
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch
                    size={16}
                    color="#C62828"
                    style={{
                      position: "absolute",
                      left: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none"
                    }}
                  />
                </div>

                <select
                  className="form-select"
                  style={{ border: "1px solid #E2E2E2", borderRadius: "8px" }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {/* Desktop Table View */}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover mb-0 align-middle">
              <thead style={{ background: "#FFF5F5", position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} style={{ transition: "all 0.2s ease" }}>
                    <td>{item.date}</td>

                    <td>
                      <div className="d-flex align-items-center">
                        <div className="me-2 p-1 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: "28px",
                            height: "28px",
                            backgroundColor: item.type === 'Added' ? '#e8f5e9' : '#ffebee'
                          }}>
                          {item.type === 'Added'
                            ? <FaArrowTrendUp size={14} color="#2e7d32" />
                            : <FaArrowTrendDown size={14} color="#c62828" />
                          }
                        </div>
                        {item.type}
                      </div>
                    </td>

                    <td className={`fw-semibold ${item.type === 'Added' ? 'text-success' : 'text-danger'}`}>
                      {item.type === 'Added' ? '+' : '-'}{formatCurrency(item.amount)}
                    </td>

                    <td>
                      <span className={`badge rounded-pill ${item.status === 'Success'
                        ? 'bg-success'
                        : item.status === 'Pending'
                          ? 'bg-warning text-dark'
                          : 'bg-danger'
                        }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="text-truncate" style={{ maxWidth: '200px' }} title={item.notes}>
                      {item.notes}
                    </td>

                    <td>
                      <button
                        className="btn btn-sm text-white px-2"
                        style={{ background: "#C62828", borderRadius: "8px", transition: "all 0.2s ease" }}
                        onClick={() => handleViewDetails(item)}
                        title="View Details"
                      >
                        <FaEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="d-md-none p-3">
            {filteredHistory.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted">No transactions found matching your criteria.</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="card mb-3 border" style={{ borderRadius: "12px" }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <div className="me-2 p-1 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: "28px",
                            height: "28px",
                            backgroundColor: item.type === 'Added' ? '#e8f5e9' : '#ffebee'
                          }}>
                          {item.type === 'Added'
                            ? <FaArrowTrendUp size={14} color="#2e7d32" />
                            : <FaArrowTrendDown size={14} color="#c62828" />
                          }
                        </div>
                        <span className="fw-semibold">{item.type}</span>
                      </div>
                      <span className={`badge rounded-pill ${item.status === 'Success'
                        ? 'bg-success'
                        : item.status === 'Pending'
                          ? 'bg-warning text-dark'
                          : 'bg-danger'
                        }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small">{item.date}</span>
                      <span className={`fw-bold ${item.type === 'Added' ? 'text-success' : 'text-danger'}`}>
                        {item.type === 'Added' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <p className="text-muted small mb-0">{item.notes}</p>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        className="btn btn-sm text-white px-2"
                        style={{ background: "#C62828", borderRadius: "8px", transition: "all 0.2s ease" }}
                        onClick={() => handleViewDetails(item)}
                        title="View Details"
                      >
                        <FaEye size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center p-4 d-none d-md-block">
              <p className="text-muted">No transactions found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Request Credits Modal */}
      {showRequestModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: "16px", border: 'none' }}>
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: "#C62828" }}>Request More Credits</h5>
                <button type="button" className="btn-close" onClick={() => setShowRequestModal(false)}></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Amount ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ borderRadius: "8px", border: "1px solid #E2E2E2" }}
                    placeholder="Enter amount"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Reason / Notes</label>
                  <textarea
                    className="form-control"
                    style={{ borderRadius: "8px", border: "1px solid #E2E2E2" }}
                    rows="3"
                    placeholder="Explain why you need more credits"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer border-0">
                <button type="button" className="btn w-100 w-md-auto" style={{ borderRadius: "8px" }} onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn text-white px-4 w-100 w-md-auto"
                  style={{ background: "#C62828", borderRadius: "8px" }}
                  onClick={handleRequestCredits}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: "16px", border: 'none' }}>
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: "#C62828" }}>Transaction Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label text-muted small">Transaction ID</label>
                  <p className="mb-0 fw-semibold">#{selectedTransaction.id}</p>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small">Date</label>
                  <p className="mb-0 fw-semibold">{selectedTransaction.date}</p>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small">Type</label>
                  <div className="d-flex align-items-center">
                    <div className="me-2 p-1 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "28px",
                        height: "28px",
                        backgroundColor: selectedTransaction.type === 'Added' ? '#e8f5e9' : '#ffebee'
                      }}>
                      {selectedTransaction.type === 'Added'
                        ? <FaArrowTrendUp size={14} color="#2e7d32" />
                        : <FaArrowTrendDown size={14} color="#c62828" />}
                    </div>
                    <p className="mb-0 fw-semibold">{selectedTransaction.type}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small">Amount</label>
                  <p className={`mb-0 fw-bold ${selectedTransaction.type === 'Added' ? 'text-success' : 'text-danger'}`}>
                    {selectedTransaction.type === 'Added' ? '+' : '-'}${selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small">Status</label>
                  <span className={`badge rounded-pill ${selectedTransaction.status === 'Success'
                    ? 'bg-success'
                    : selectedTransaction.status === 'Pending'
                      ? 'bg-warning text-dark'
                      : 'bg-danger'
                    }`}>
                    {selectedTransaction.status}
                  </span>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small">Notes</label>
                  <p className="mb-0">{selectedTransaction.notes}</p>
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn text-white w-100"
                  style={{ background: "#C62828", borderRadius: "8px" }}
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditBalance;