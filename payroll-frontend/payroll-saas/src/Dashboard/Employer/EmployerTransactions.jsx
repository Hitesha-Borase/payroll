import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaArrowLeft,
  FaSearch,
  FaTimes,
  FaUniversity,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaChevronRight,
  FaReceipt,
  FaCreditCard,
  FaExchangeAlt
} from "react-icons/fa";
import { employerAPI } from '../../services/api';

// Color scheme
const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  pureWhite: '#FFFFFF',
  blackText: '#1E293B',
  darkGrayText: '#64748B',
  lightGrayBorder: '#E2E8F0',
  lightBackground: '#F8FAFC',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6'
};

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window width for responsive adjustments
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString).split('T')[0];
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatText = (text) => {
    if (!text) return 'N/A';
    return String(text)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await employerAPI.getTransactions();
        if (response?.data?.success) {
          const txns = response.data.data || [];
          const mappedTransactions = txns.map(txn => ({
            id: txn.id,
            date: formatDate(txn.date || txn.created_at),
            employer: txn.employer_name || txn.employee_name || 'Employer',
            amount: parseFloat(txn.amount || 0),
            type: txn.type || 'Salary Credit',
            reference: txn.reference || txn.description || '',
            mode: txn.payment_method || 'Bank Transfer',
            status: txn.status || 'Success',
            processedBy: txn.processed_by || 'System Admin',
          }));
          setTransactions(mappedTransactions);
          setFilteredTransactions(mappedTransactions);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Filter transactions based on search term & status
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    let result = transactions;

    if (statusFilter !== 'all') {
      result = result.filter(t => String(t.status).toLowerCase() === statusFilter.toLowerCase());
    }

    if (term) {
      result = result.filter(t =>
        String(t.id).toLowerCase().includes(term) ||
        t.employer.toLowerCase().includes(term) ||
        t.type.toLowerCase().includes(term) ||
        t.reference.toLowerCase().includes(term) ||
        t.mode.toLowerCase().includes(term) ||
        t.status.toLowerCase().includes(term)
      );
    }

    setFilteredTransactions(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, transactions]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const paginate = pageNumber => setCurrentPage(pageNumber);

  // Stats calculation
  const totalVolume = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const successCount = transactions.filter(t => ['completed', 'success', 'paid'].includes(String(t.status).toLowerCase())).length;
  const pendingCount = transactions.filter(t => String(t.status).toLowerCase() === 'pending').length;

  // Get status badge styling
  const getStatusStyle = (status) => {
    const s = String(status).toLowerCase();
    if (s === "completed" || s === "success" || s === "paid") {
      return { backgroundColor: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0", icon: <FaCheckCircle className="text-success" /> };
    }
    if (s === "pending") {
      return { backgroundColor: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A", icon: <FaClock className="text-warning" /> };
    }
    if (s === "failed") {
      return { backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA", icon: <FaTimesCircle className="text-danger" /> };
    }
    return { backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", icon: <FaClock /> };
  };

  const getTypeIcon = (type, mode) => {
    const t = String(type).toLowerCase();
    const m = String(mode).toLowerCase();
    if (m.includes('bank') || m.includes('transfer')) return <FaUniversity />;
    if (m.includes('card')) return <FaCreditCard />;
    if (t.includes('salary') || t.includes('payroll')) return <FaMoneyBillWave />;
    return <FaExchangeAlt />;
  };

  return (
    <div className="container-fluid px-2 px-sm-3 px-md-4 py-3 py-md-4" style={{ minHeight: "100vh", backgroundColor: colors.lightBackground, maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div className="card mb-3 mb-md-4 shadow-sm border-0" style={{ borderRadius: '14px', backgroundColor: '#FFFFFF' }}>
        <div className="card-body p-3 p-sm-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: '#FEF2F2', width: isMobile ? '42px' : '52px', height: isMobile ? '42px' : '52px', border: '1px solid #FECACA' }}
              >
                <FaReceipt style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', color: colors.primaryRed }} />
              </div>
              <div>
                <h2 className="fw-bold mb-0" style={{ color: colors.blackText, fontSize: isMobile ? '1.25rem' : '1.6rem', lineHeight: '1.2' }}>
                  Transactions
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                  Manage and monitor your payment records &amp; logs
                </p>
              </div>
            </div>

            <button
              className="btn text-white d-inline-flex align-items-center justify-content-center gap-2 shadow-sm"
              style={{
                backgroundColor: colors.primaryRed,
                fontSize: isMobile ? '0.82rem' : '0.88rem',
                fontWeight: 600,
                borderRadius: '8px',
                padding: isMobile ? '8px 16px' : '8px 18px',
                width: isMobile ? '100%' : 'auto',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
              onClick={() => navigate('/employer/dashboard')}
            >
              <FaArrowLeft size={12} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="row g-2 g-sm-3 mb-3 mb-md-4">
        <div className="col-6 col-md-3">
          <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
            <div className="card-body p-2.5 p-sm-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="min-w-0">
                  <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.68rem' : '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Total Volume
                  </p>
                  <h4 className="fw-bold mb-0 mt-1 text-truncate" style={{ color: colors.primaryRed, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                    ${totalVolume.toLocaleString()}
                  </h4>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
                  style={{ backgroundColor: '#FEF2F2', width: isMobile ? '36px' : '42px', height: isMobile ? '36px' : '42px', border: '1px solid #FECACA' }}
                >
                  <FaMoneyBillWave style={{ color: colors.primaryRed, fontSize: isMobile ? '0.95rem' : '1.15rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
            <div className="card-body p-2.5 p-sm-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="min-w-0">
                  <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.68rem' : '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Total Txns
                  </p>
                  <h4 className="fw-bold mb-0 mt-1" style={{ color: colors.blackText, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                    {transactions.length}
                  </h4>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
                  style={{ backgroundColor: '#F1F5F9', width: isMobile ? '36px' : '42px', height: isMobile ? '36px' : '42px', border: '1px solid #E2E8F0' }}
                >
                  <FaReceipt style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.95rem' : '1.15rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
            <div className="card-body p-2.5 p-sm-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="min-w-0">
                  <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.68rem' : '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Successful
                  </p>
                  <h4 className="fw-bold mb-0 mt-1" style={{ color: colors.success, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                    {successCount}
                  </h4>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
                  style={{ backgroundColor: '#ECFDF5', width: isMobile ? '36px' : '42px', height: isMobile ? '36px' : '42px', border: '1px solid #A7F3D0' }}
                >
                  <FaCheckCircle style={{ color: colors.success, fontSize: isMobile ? '0.95rem' : '1.15rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
            <div className="card-body p-2.5 p-sm-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="min-w-0">
                  <p className="mb-0 text-muted" style={{ fontSize: isMobile ? '0.68rem' : '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Pending
                  </p>
                  <h4 className="fw-bold mb-0 mt-1" style={{ color: colors.warning, fontSize: isMobile ? '1.15rem' : '1.45rem' }}>
                    {pendingCount}
                  </h4>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
                  style={{ backgroundColor: '#FFFBEB', width: isMobile ? '36px' : '42px', height: isMobile ? '36px' : '42px', border: '1px solid #FDE68A' }}
                >
                  <FaClock style={{ color: colors.warning, fontSize: isMobile ? '0.95rem' : '1.15rem' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card mb-3 mb-md-4 shadow-sm border-0" style={{ borderRadius: '14px', backgroundColor: '#FFFFFF' }}>
        <div className="card-body p-2.5 p-sm-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-2.5">
            {/* Status Filter Pills */}
            <div
              className="d-flex gap-1.5 p-1 bg-light rounded-3 flex-nowrap"
              style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
            >
              {[
                { key: 'all', label: 'All' },
                { key: 'success', label: 'Success' },
                { key: 'pending', label: 'Pending' },
                { key: 'failed', label: 'Failed' }
              ].map(f => (
                <button
                  key={f.key}
                  className="btn btn-sm text-nowrap flex-grow-1 flex-md-grow-0"
                  style={{
                    backgroundColor: statusFilter === f.key ? colors.primaryRed : 'transparent',
                    color: statusFilter === f.key ? '#FFFFFF' : colors.darkGrayText,
                    fontWeight: 600,
                    borderRadius: '7px',
                    fontSize: isMobile ? '0.78rem' : '0.85rem',
                    padding: isMobile ? '6px 12px' : '6px 16px',
                    border: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ width: isMobile ? '100%' : '300px' }}>
              <div className="input-group">
                <span className="input-group-text py-1.5 px-2.5" style={{ backgroundColor: '#FFFFFF', borderColor: colors.lightGrayBorder, borderRight: 'none', borderRadius: '8px 0 0 8px' }}>
                  <FaSearch style={{ color: colors.darkGrayText, fontSize: '0.8rem' }} />
                </span>
                <input
                  type="text"
                  className="form-control shadow-none"
                  placeholder="Search ID, type, employer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    borderColor: colors.lightGrayBorder,
                    borderLeft: 'none',
                    borderRadius: searchTerm ? '0' : '0 8px 8px 0',
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    padding: '7px 10px'
                  }}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary py-1 px-2.5"
                    type="button"
                    onClick={() => setSearchTerm("")}
                    style={{ borderColor: colors.lightGrayBorder, borderLeft: 'none', borderRadius: '0 8px 8px 0' }}
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Container */}
      {isMobile ? (
        /* Mobile View - Modern Fintech Cards */
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2.5 px-1">
            <h5 className="mb-0 fw-bold" style={{ color: colors.blackText, fontSize: '0.95rem' }}>
              Transaction History ({filteredTransactions.length})
            </h5>
            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
              Tap to view details
            </span>
          </div>

          {loading ? (
            <div className="text-center py-5 bg-white rounded-3 border shadow-sm">
              <div className="spinner-border text-danger" role="status" style={{ width: '2rem', height: '2rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2 mb-0 small">Loading transactions...</p>
            </div>
          ) : currentTransactions.length === 0 ? (
            <div className="text-center py-5 px-3 bg-white rounded-3 border shadow-sm">
              <div className="mx-auto mb-2.5 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: colors.lightBackground }}>
                <FaReceipt style={{ fontSize: '20px', color: colors.darkGrayText }} />
              </div>
              <h6 className="fw-bold mb-1" style={{ color: colors.blackText, fontSize: '0.95rem' }}>No Transactions Found</h6>
              <p className="text-muted mb-0 small">
                {searchTerm || statusFilter !== 'all' ? "No transactions match your filters." : "You do not have any recorded transactions yet."}
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2.5">
              {currentTransactions.map((transaction) => {
                const statusStyle = getStatusStyle(transaction.status);
                return (
                  <div
                    key={transaction.id}
                    className="card shadow-sm border"
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <div className="p-3">
                      {/* Top Row: Icon + Type & Employer + Amount */}
                      <div className="d-flex align-items-start justify-content-between" style={{ gap: '10px' }}>
                        <div className="d-flex align-items-center min-w-0" style={{ gap: '10px' }}>
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: '38px',
                              height: '38px',
                              backgroundColor: '#FEF2F2',
                              color: colors.primaryRed,
                              fontSize: '0.95rem',
                              border: '1px solid #FECACA',
                            }}
                          >
                            {getTypeIcon(transaction.type, transaction.mode)}
                          </div>
                          <div className="min-w-0">
                            <div className="fw-bold text-truncate" style={{ color: colors.blackText, fontSize: '0.92rem' }}>
                              {formatText(transaction.type)}
                            </div>
                            <div className="text-muted small text-truncate" style={{ fontSize: '0.76rem' }}>
                              {transaction.employer}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Status Badge */}
                        <div className="text-end flex-shrink-0">
                          <div className="fw-bold" style={{ color: colors.blackText, fontSize: '1rem' }}>
                            ${transaction.amount.toLocaleString()}
                          </div>
                          <span
                            className="badge px-2 py-0.5 mt-0.5 d-inline-flex align-items-center text-capitalize"
                            style={{
                              ...statusStyle,
                              borderRadius: '6px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              gap: '4px'
                            }}
                          >
                            {transaction.status}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Info Strip */}
                      <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                        <div className="text-muted text-truncate" style={{ fontSize: '0.74rem' }}>
                          <span className="fw-medium text-dark">#{transaction.id}</span> • {transaction.date}
                        </div>
                        <div className="d-flex align-items-center text-danger fw-semibold flex-shrink-0 ms-2" style={{ fontSize: '0.76rem', gap: '4px' }}>
                          <span>Details</span>
                          <FaChevronRight size={10} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Desktop/Tablet View - Full Table Card */
        <div className="card shadow-sm border-0" style={{ borderRadius: '14px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
          <div className="card-header py-3 px-3 px-sm-4 d-flex justify-content-between align-items-center bg-white border-bottom">
            <h5 className="mb-0 fw-bold" style={{ color: colors.blackText, fontSize: '1.08rem' }}>
              Payment Logs ({filteredTransactions.length})
            </h5>
            <span className="badge rounded-pill bg-light text-dark px-3 py-1.5 border" style={{ fontSize: '0.8rem' }}>
              Showing {currentTransactions.length} of {filteredTransactions.length}
            </span>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-2 mb-0 small">Loading transactions...</p>
              </div>
            ) : currentTransactions.length === 0 ? (
              <div className="text-center py-5 px-3">
                <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: colors.lightBackground }}>
                  <FaReceipt style={{ fontSize: '24px', color: colors.darkGrayText }} />
                </div>
                <h6 className="fw-bold mb-1" style={{ color: colors.blackText }}>No Transactions Found</h6>
                <p className="text-muted mb-0 small">
                  {searchTerm || statusFilter !== 'all' ? "No transactions match your search filter." : "You do not have any recorded transactions yet."}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-uppercase text-muted" style={{ fontSize: '0.78rem' }}>
                    <tr>
                      <th className="ps-4 py-3">TRANSACTION ID</th>
                      <th className="py-3">DATE</th>
                      <th className="py-3">EMPLOYEE / PARTY</th>
                      <th className="py-3">AMOUNT</th>
                      <th className="py-3">TYPE</th>
                      <th className="py-3">MODE</th>
                      <th className="py-3">STATUS</th>
                      <th className="py-3 text-center pe-4">ACTION</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '0.88rem' }}>
                    {currentTransactions.map((transaction) => {
                      const statusStyle = getStatusStyle(transaction.status);
                      return (
                        <tr key={transaction.id}>
                          <td className="py-3 ps-4 fw-semibold text-dark">
                            #{transaction.id}
                          </td>
                          <td className="py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                            {transaction.date}
                          </td>
                          <td className="py-3 fw-medium text-dark">
                            {transaction.employer}
                          </td>
                          <td className="py-3 fw-bold text-dark">
                            ${transaction.amount.toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span className="fw-semibold text-danger">
                              {formatText(transaction.type)}
                            </span>
                          </td>
                          <td className="py-3 text-muted">
                            {formatText(transaction.mode)}
                          </td>
                          <td className="py-3">
                            <span className="badge px-2.5 py-1 d-inline-flex align-items-center gap-1" style={{ ...statusStyle, borderRadius: '6px' }}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-3 text-center pe-4">
                            <button
                              className="btn btn-sm d-inline-flex align-items-center gap-1"
                              style={{ color: colors.primaryRed, backgroundColor: '#FEF2F2', border: `1px solid #FECACA`, borderRadius: '6px', fontWeight: 600, padding: '5px 12px' }}
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              <FaReceipt size={11} />
                              View
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
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Page navigation" className="mt-3 mt-md-4">
          <ul className={`pagination ${isMobile ? 'pagination-sm' : ''} justify-content-center mb-0`}>
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link shadow-none"
                onClick={() => paginate(currentPage - 1)}
                style={{ color: colors.primaryRed, borderRadius: '8px 0 0 8px' }}
              >
                Previous
              </button>
            </li>
            {[...Array(totalPages).keys()].map(number => (
              <li key={number} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                <button
                  className="page-link shadow-none"
                  onClick={() => paginate(number + 1)}
                  style={{
                    color: currentPage === number + 1 ? colors.pureWhite : colors.primaryRed,
                    backgroundColor: currentPage === number + 1 ? colors.primaryRed : "transparent",
                    borderColor: currentPage === number + 1 ? colors.primaryRed : "#dee2e6"
                  }}
                >
                  {number + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link shadow-none"
                onClick={() => paginate(currentPage + 1)}
                style={{ color: colors.primaryRed, borderRadius: '0 8px 8px 0' }}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1050 }}
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: isMobile ? "94%" : "500px", margin: "1.75rem auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div className="modal-header py-3 px-4" style={{ backgroundColor: colors.lightBackground, borderBottom: `1px solid ${colors.lightGrayBorder}` }}>
                <div>
                  <h5 className="modal-title fw-bold mb-0" style={{ color: colors.blackText, fontSize: '1.05rem' }}>
                    Transaction Receipt
                  </h5>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                    Transaction ID: #{selectedTransaction.id}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setSelectedTransaction(null)}
                ></button>
              </div>

              <div className="modal-body p-3 p-sm-4" style={{ backgroundColor: colors.pureWhite, maxHeight: "75vh", overflowY: "auto" }}>
                {/* Highlight Card */}
                <div className="p-3 rounded-3 mb-3 text-center" style={{ backgroundColor: '#FEF2F2', border: `1px solid #FECACA` }}>
                  <div className="text-muted mb-1" style={{ fontSize: '0.78rem' }}>Transaction Amount</div>
                  <div className="fw-bold" style={{ fontSize: '1.65rem', color: colors.primaryRed }}>
                    ${selectedTransaction.amount.toLocaleString()}
                  </div>
                  <span className="badge px-3 py-1 mt-1" style={{ ...getStatusStyle(selectedTransaction.status), borderRadius: '20px', fontSize: '0.78rem' }}>
                    {selectedTransaction.status.toUpperCase()}
                  </span>
                </div>

                {/* Details List */}
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Employee / Recipient</span>
                    <span className="fw-semibold text-end text-dark" style={{ fontSize: '0.88rem' }}>{selectedTransaction.employer}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Date & Time</span>
                    <span className="fw-medium text-end text-dark" style={{ fontSize: '0.88rem' }}>{selectedTransaction.date}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Transaction Type</span>
                    <span className="fw-semibold text-end text-danger" style={{ fontSize: '0.88rem' }}>
                      {formatText(selectedTransaction.type)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Payment Mode</span>
                    <span className="fw-semibold text-end text-dark" style={{ fontSize: '0.88rem' }}>
                      {formatText(selectedTransaction.mode)}
                    </span>
                  </div>
                  {selectedTransaction.reference && (
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="text-muted small">Reference / Notes</span>
                      <span className="fw-medium text-end text-break text-dark" style={{ maxWidth: '60%', fontSize: '0.88rem' }}>
                        {selectedTransaction.reference}
                      </span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="text-muted small">Processed By</span>
                    <span className="fw-medium text-end text-dark" style={{ fontSize: '0.88rem' }}>
                      {selectedTransaction.processedBy}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer py-2.5 px-4" style={{ backgroundColor: colors.lightBackground, borderTop: `1px solid ${colors.lightGrayBorder}` }}>
                <button
                  type="button"
                  className="btn w-100 text-white fw-semibold shadow-sm"
                  style={{ backgroundColor: colors.primaryRed, borderRadius: '8px', padding: '8px 16px', fontSize: '0.88rem' }}
                  onClick={() => setSelectedTransaction(null)}
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;