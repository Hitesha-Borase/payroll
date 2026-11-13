import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { adminAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useRegional } from '../../context/RegionalContext';

// Color scheme as specified
const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  pureWhite: '#FFFFFF',
  blackText: '#000000',
  darkGrayText: '#4A4A4A',
  lightGrayBorder: '#E2E2E2',
  lightBackground: '#F9F9F9', // Added back this color as it's used in table
};

const Transactions = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useRegional();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all", "employer", "employee", "vendor"

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getTransactions();
        if (response?.data?.success) {
          const transactionsData = response.data.data || [];
          const mappedTransactions = transactionsData.map(txn => {
            // Determine category for filtering
            let category = 'employer';
            if (txn.type === 'salary' || txn.type === 'salary_credit') category = 'employee';
            else if (txn.type === 'vendor_payment') category = 'vendor';

            return {
              id: txn.id,
              date: (txn.date || txn.created_at) ? new Date(txn.date || txn.created_at).toLocaleDateString() : 'N/A',
              employer: txn.employer_name || 'N/A',
              amount: parseFloat(txn.amount || 0),
              type: txn.type || 'Transaction',
              reference: txn.reference || txn.description || '',
              mode: txn.payment_method || 'N/A',
              status: txn.status || 'success',
              processedBy: 'System',
              category: category,
            };
          });
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

  // Filter transactions based on search term and active tab
  useEffect(() => {
    let filtered = transactions;

    // Filter by active tab
    if (activeTab !== "all") {
      filtered = filtered.filter(transaction => transaction.category === activeTab);
    }

    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(transaction => {
      const idStr = String(transaction.id || '').toLowerCase();
      const employerStr = String(transaction.employer || '').toLowerCase();
      const typeStr = String(transaction.type || '').toLowerCase();
      const referenceStr = String(transaction.reference || '').toLowerCase();
      const modeStr = String(transaction.mode || '').toLowerCase();
      const statusStr = String(transaction.status || '').toLowerCase();
      const employeeStr = String(transaction.employee || '').toLowerCase();

      return idStr.includes(searchLower) ||
        employerStr.includes(searchLower) ||
        typeStr.includes(searchLower) ||
        referenceStr.includes(searchLower) ||
        modeStr.includes(searchLower) ||
        statusStr.includes(searchLower) ||
        employeeStr.includes(searchLower);
    });

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, transactions, activeTab]);

  // Get current transactions for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = pageNumber => setCurrentPage(pageNumber);

  // Delete transaction
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        const response = await adminAPI.deleteTransaction(id);
        if (response.data.success) {
          setTransactions(prev => prev.filter(t => t.id !== id));
          toast.success("Transaction deleted successfully");
        }
      } catch (err) {
        console.error('Delete error:', err);
        toast.error("Failed to delete transaction");
      }
    }
  };

  // Get type color based on transaction type
  const getTypeColor = (type) => {
    switch (type) {
      case "Credit Added": return colors.primaryRed;
      case "Credit Assigned": return colors.darkRed;
      case "Payment": return colors.darkGrayText;
      case "Salary Payment": return colors.darkRed;
      default: return colors.blackText;
    }
  };

  // Get status badge style
  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed": return { backgroundColor: "#E8F5E9", color: "#2E7D32" };
      case "Pending": return { backgroundColor: "#FFF8E1", color: "#F57C00" };
      case "Failed": return { backgroundColor: "#FFEBEE", color: "#C62828" };
      default: return { backgroundColor: "#F5F5F5", color: "#616161" };
    }
  };

  // Get tab title based on active tab
  const getTabTitle = () => {
    switch (activeTab) {
      case "all": return "All Transactions";
      case "employer": return "Employer Payment Logs";
      case "employee": return "Employee Salary Logs";
      case "vendor": return "Vendor Payment Logs";
      default: return "All Transactions";
    }
  };

  return (
    <div className="container-fluid py-2 py-md-4" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-column flex-md-row">
        <h2 className="fw-bold mb-3 mb-md-0" style={{ color: colors.blackText, fontSize: isMobile ? '1.5rem' : '2rem' }}>Transactions</h2>
        <button
          className="btn px-3 px-md-4 py-2 text-white"
          style={{ backgroundColor: colors.primaryRed, fontSize: isMobile ? '0.875rem' : '1rem' }}
          onClick={() => navigate('/admin/dashboard')}
        >
          <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="card mb-4 shadow-sm" style={{ border: `1px solid ${colors.lightGrayBorder}` }}>
        <div className="card-body p-0">
          <ul className="nav nav-tabs nav-fill" style={{ borderBottom: `1px solid ${colors.lightGrayBorder}` }}>
            {/* <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "all" ? "active" : ""}`}
                style={{ 
                  color: activeTab === "all" ? colors.primaryRed : colors.darkGrayText,
                  fontWeight: activeTab === "all" ? "bold" : "normal",
                  borderBottom: activeTab === "all" ? `3px solid ${colors.primaryRed}` : "none",
                  borderRadius: "0",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
                onClick={() => setActiveTab("all")}
              >
                All Transactions
              </button>
            </li> */}
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "employer" ? "active" : ""}`}
                style={{
                  color: activeTab === "employer" ? colors.primaryRed : colors.darkGrayText,
                  fontWeight: activeTab === "employer" ? "bold" : "normal",
                  borderBottom: activeTab === "employer" ? `3px solid ${colors.primaryRed}` : "none",
                  borderRadius: "0",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
                onClick={() => setActiveTab("employer")}
              >
                Employer Payment Logs
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "employee" ? "active" : ""}`}
                style={{
                  color: activeTab === "employee" ? colors.primaryRed : colors.darkGrayText,
                  fontWeight: activeTab === "employee" ? "bold" : "normal",
                  borderBottom: activeTab === "employee" ? `3px solid ${colors.primaryRed}` : "none",
                  borderRadius: "0",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
                onClick={() => setActiveTab("employee")}
              >
                Employee Salary Logs
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "vendor" ? "active" : ""}`}
                style={{
                  color: activeTab === "vendor" ? colors.primaryRed : colors.darkGrayText,
                  fontWeight: activeTab === "vendor" ? "bold" : "normal",
                  borderBottom: activeTab === "vendor" ? `3px solid ${colors.primaryRed}` : "none",
                  borderRadius: "0",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
                onClick={() => setActiveTab("vendor")}
              >
                Vendor Payment Logs
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card mb-4 shadow-sm" style={{ border: `1px solid ${colors.lightGrayBorder}` }}>
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text" style={{ backgroundColor: colors.pureWhite, border: `1px solid ${colors.lightGrayBorder}` }}>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by ID, Employer, Type, etc."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: `1px solid ${colors.lightGrayBorder}`, fontSize: isMobile ? '0.875rem' : '1rem' }}
                />
              </div>
            </div>
            <div className="col-12 col-md-6 d-flex justify-content-md-end align-items-center">
              <span className="text-muted" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>
                Showing {currentTransactions.length} of {filteredTransactions.length} transactions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table / Cards */}
      <div className="card shadow-sm" style={{ border: `1px solid ${colors.lightGrayBorder}` }}>
        <div className="card-header py-3" style={{ backgroundColor: colors.pureWhite, borderBottom: `1px solid ${colors.lightGrayBorder}` }}>
          <h5 className="mb-0 fw-bold" style={{ color: colors.blackText, fontSize: isMobile ? '1.125rem' : '1.25rem' }}>{getTabTitle()}</h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : isMobile ? (
            // Mobile Card View for Table
            <div className="p-3">
              {currentTransactions.map((transaction) => (
                <div key={transaction.id} className="card mb-3 border" style={{ borderRadius: "10px" }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-0" style={{ color: colors.blackText, fontSize: '0.9rem' }}>{transaction.id}</h6>
                      <span className="badge px-2 py-1" style={getStatusStyle(transaction.status)}>
                        {transaction.status}
                      </span>
                    </div>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Date</small>
                        <span style={{ fontSize: '0.8rem' }}>{transaction.date}</span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Employer</small>
                        <span style={{ fontSize: '0.8rem' }}>{transaction.employer}</span>
                      </div>
                      {transaction.employee && (
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Employee</small>
                          <span style={{ fontSize: '0.8rem' }}>{transaction.employee}</span>
                        </div>
                      )}
                      <div className="col-6">
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Amount</small>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{formatCurrency(transaction.amount)}</span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Type</small>
                        <span style={{ fontSize: '0.8rem', color: getTypeColor(transaction.type), fontWeight: '600' }}>
                          {transaction.type}
                        </span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Mode</small>
                        <span style={{ fontSize: '0.8rem' }}>{transaction.mode}</span>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Reference</small>
                        <span style={{ fontSize: '0.8rem' }}>{transaction.reference}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-end">
                      <button
                        className="btn btn-sm me-2"
                        style={{
                          color: colors.pureWhite,
                          backgroundColor: colors.primaryRed,
                          border: "none",
                          borderRadius: "4px",
                          padding: "0.25rem 0.5rem",
                          fontSize: '0.8rem'
                        }}
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        <i className="bi bi-eye-fill"></i>
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{
                          color: colors.pureWhite,
                          backgroundColor: "#f44336",
                          border: "none",
                          borderRadius: "4px",
                          padding: "0.25rem 0.5rem",
                          fontSize: '0.8rem'
                        }}
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr style={{ backgroundColor: colors.lightBackground, color: colors.darkGrayText }}>
                    <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Transaction ID</th>
                    <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Date</th>
                    <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Employer</th>
                    {activeTab === "employee" && <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Employee</th>}
                    <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Amount</th>
                    <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Type</th>
                    <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Mode</th>
                    <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Status</th>
                    <th className="border-0 py-3 text-center" style={{ color: colors.darkGrayText }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="py-3" style={{ color: colors.blackText }}>{transaction.id}</td>
                      <td className="py-3" style={{ color: colors.blackText }}>{transaction.date}</td>
                      <td className="py-3" style={{ color: colors.blackText }}>{transaction.employer}</td>
                      {activeTab === "employee" && (
                        <td className="py-3" style={{ color: colors.blackText }}>{transaction.employee}</td>
                      )}
                      <td className="py-3" style={{ color: colors.blackText }}>{formatCurrency(transaction.amount)}</td>
                      <td className="py-3">
                        <span style={{ color: getTypeColor(transaction.type), fontWeight: "600" }}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3" style={{ color: colors.blackText }}>{transaction.mode}</td>
                      <td className="py-3">
                        <span className="badge px-2 py-1" style={getStatusStyle(transaction.status)}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          className="btn btn-sm me-2"
                          style={{
                            color: colors.pureWhite,
                            backgroundColor: colors.primaryRed,
                            border: "none",
                            borderRadius: "4px",
                            padding: "0.25rem 0.5rem"
                          }}
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <i className="bi bi-eye-fill"></i>
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{
                            color: colors.pureWhite,
                            backgroundColor: "#f44336",
                            border: "none",
                            borderRadius: "4px",
                            padding: "0.25rem 0.5rem"
                          }}
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredTransactions.length > itemsPerPage && (
        <nav aria-label="Page navigation" className="mt-4">
          <ul className={`pagination justify-content-center ${isMobile ? 'pagination-sm' : ''}`}>
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => paginate(currentPage - 1)}
                style={{ color: colors.primaryRed }}
              >
                Previous
              </button>
            </li>
            {[...Array(Math.ceil(filteredTransactions.length / itemsPerPage)).keys()].map(number => (
              <li key={number} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => paginate(number + 1)}
                  style={{
                    color: currentPage === number + 1 ? colors.pureWhite : colors.primaryRed,
                    backgroundColor: currentPage === number + 1 ? colors.primaryRed : "transparent",
                    border: currentPage === number + 1 ? `1px solid ${colors.primaryRed}` : "1px solid #dee2e6"
                  }}
                >
                  {number + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === Math.ceil(filteredTransactions.length / itemsPerPage) ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => paginate(currentPage + 1)}
                style={{ color: colors.primaryRed }}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className={`modal-dialog modal-dialog-centered ${isMobile ? 'modal-sm' : ''}`}>
            <div className="modal-content">
              <div className="modal-header border-0" style={{ backgroundColor: colors.pureWhite }}>
                <h5 className="modal-title fw-bold" style={{ color: colors.blackText, fontSize: isMobile ? '1.125rem' : '1.25rem' }}>Transaction Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedTransaction(null)}
                ></button>
              </div>
              <div className="modal-body" style={{ backgroundColor: colors.pureWhite }}>
                <div className="mb-3">
                  <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Transaction ID</h6>
                  <p style={{ color: colors.blackText, fontSize: isMobile ? '0.875rem' : '1rem' }}>{selectedTransaction.id}</p>
                </div>
                <div className="mb-3">
                  <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Date</h6>
                  <p style={{ color: colors.blackText, fontSize: isMobile ? '0.875rem' : '1rem' }}>{selectedTransaction.date}</p>
                </div>
                <div className="mb-3">
                  <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Employer</h6>
                  <p style={{ color: colors.blackText, fontSize: isMobile ? '0.875rem' : '1rem' }}>{selectedTransaction.employer}</p>
                </div>
                {selectedTransaction.employee && (
                  <div className="mb-3">
                    <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Employee</h6>
                    <p style={{ color: colors.blackText, fontSize: isMobile ? '0.875rem' : '1rem' }}>{selectedTransaction.employee}</p>
                  </div>
                )}
                <div className="mb-3">
                  <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Amount</h6>
                  <p style={{ color: colors.blackText, fontSize: isMobile ? '0.875rem' : '1rem' }}>{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div className="mb-3">
                  <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Type</h6>
                  <p style={{ color: getTypeColor(selectedTransaction.type), fontWeight: "600", fontSize: isMobile ? '0.875rem' : '1rem' }}>
                    {selectedTransaction.type}
                  </p>
                </div>
                <div className="mb-3">
                  <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Reference</h6>
                  <p style={{ color: colors.blackText, fontSize: isMobile ? '0.875rem' : '1rem' }}>{selectedTransaction.reference}</p>
                </div>
                <div className="mb-3">
                  <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Payment Mode</h6>
                  <p style={{ color: colors.blackText, fontSize: isMobile ? '0.875rem' : '1rem' }}>{selectedTransaction.mode}</p>
                </div>
                <div className="mb-3">
                  <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Status</h6>
                  <span className="badge px-2 py-1" style={getStatusStyle(selectedTransaction.status)}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div className="mb-3">
                  <h6 style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Processed By</h6>
                  <p style={{ color: colors.blackText, fontSize: isMobile ? '0.875rem' : '1rem' }}>{selectedTransaction.processedBy}</p>
                </div>
              </div>
              <div className="modal-footer border-0" style={{ backgroundColor: colors.pureWhite }}>
                <button
                  type="button"
                  className="btn px-4 py-2 text-white"
                  style={{ backgroundColor: colors.primaryRed, fontSize: isMobile ? '0.875rem' : '1rem' }}
                  onClick={() => setSelectedTransaction(null)}
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

export default Transactions;