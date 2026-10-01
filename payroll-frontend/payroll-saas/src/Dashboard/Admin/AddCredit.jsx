import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { adminAPI } from '../../services/api';
import { Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';

// Color scheme as specified
const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  pureWhite: '#FFFFFF',
  blackText: '#000000',
  darkGrayText: '#4A4A4A',
  lightGrayBorder: '#E2E2E2',
  lightBackground: '#F9F9F9',
  successGreen: '#4CAF50',
  warningOrange: '#FF9800',
};

const AddCredit = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalEmployers, setTotalEmployers] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [employers, setEmployers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    employerId: "",
    amount: "",
    reference: "",
    mode: "Bank",
    txnId: ""
  });

  const [editFormData, setEditFormData] = useState({
    employer: "",
    amount: "",
    reference: "",
    mode: "Bank",
    txnId: ""
  });

  const [bulkFormData, setBulkFormData] = useState({
    employers: [],
    amount: "",
    reference: "Bulk Credit Grant",
    mode: "Bank",
    txnId: ""
  });

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch employers
      const empResponse = await adminAPI.getEmployers();
      if (empResponse?.data?.success) {
        const employersData = empResponse.data.data || [];
        setEmployers(employersData.map(emp => ({
          id: emp.id,
          name: emp.company_name || emp.user?.name || `Employer #${emp.id}`
        })));
      }

      // 2. Fetch pending requests
      const pendingRes = await adminAPI.getPendingCreditRequests();
      if (pendingRes?.data?.success) {
        setPendingRequests(pendingRes.data.data || []);
      }

      // 3. Fetch credit history / transactions
      const txnResponse = await adminAPI.getTransactions();
      if (txnResponse?.data?.success) {
        const transactions = txnResponse.data.data || [];
        const creditHistory = transactions
          .filter(txn => txn.type === 'credit' || txn.transaction_type === 'credit')
          .map(txn => ({
            id: txn.id,
            date: txn.created_at || txn.transaction_date,
            employer: txn.employer?.company_name || txn.employer_name || 'N/A',
            amount: parseFloat(txn.amount || 0),
            ref: txn.reference || txn.description || '',
            mode: txn.payment_method || 'Bank',
            txnId: txn.transaction_id || txn.id || `TXN-${txn.id}`,
            rawId: txn.id,
            addedBy: txn.processed_by || 'Admin',
            isOnline: txn.payment_method !== 'Cash',
            paymentGateway: txn.payment_gateway || '',
            paymentStatus: txn.status || 'Success',
            paymentTime: txn.created_at || '',
          }));
        setHistory(creditHistory);

        // Calculate totals
        const total = creditHistory.reduce((sum, h) => sum + h.amount, 0);
        setTotalCredits(total);
        setTotalTransactions(creditHistory.length);
        setTotalEmployers(new Set(creditHistory.map(h => h.employer)).size);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle Bulk Employer Selection
  const toggleBulkEmployer = (id) => {
    setBulkFormData(prev => {
      const exists = prev.employers.includes(id);
      return {
        ...prev,
        employers: exists
          ? prev.employers.filter(e => e !== id)
          : [...prev.employers, id]
      };
    });
  };

  const toggleSelectAllBulk = () => {
    if (bulkFormData.employers.length === employers.length) {
      setBulkFormData(prev => ({ ...prev, employers: [] }));
    } else {
      setBulkFormData(prev => ({ ...prev, employers: employers.map(e => e.id) }));
    }
  };

  // 1. Single Add Credit Submit Handler
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employerId) {
      toast.error("Please select an employer");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setSubmitting(true);
      const response = await adminAPI.addCredit(formData.employerId, {
        amount: parseFloat(formData.amount),
        reference: formData.reference || 'Manual Credit Add',
        payment_method: formData.mode || 'Bank',
        transaction_id: formData.txnId || '',
      });

      if (response?.data?.success) {
        toast.success("Credit Added Successfully!");
        setShowModal(false);
        setFormData({
          employerId: "",
          amount: "",
          reference: "",
          mode: "Bank",
          txnId: ""
        });
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add credit');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Bulk Add Submit Handler
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (bulkFormData.employers.length === 0) {
      toast.error("Please select at least one employer.");
      return;
    }
    if (!bulkFormData.amount || parseFloat(bulkFormData.amount) <= 0) {
      toast.error("Please enter a valid amount per employer.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await adminAPI.addCreditBulk({
        employer_ids: bulkFormData.employers,
        amount: parseFloat(bulkFormData.amount),
        reference: bulkFormData.reference || "Bulk Credit Grant",
        payment_mode: bulkFormData.mode || 'Bank',
        transaction_id: bulkFormData.txnId || '',
      });

      if (response?.data?.success) {
        toast.success(`${bulkFormData.employers.length} employers credited successfully!`);
        setShowBulkModal(false);
        setBulkFormData({
          employers: [],
          amount: "",
          reference: "Bulk Credit Grant",
          mode: "Bank",
          txnId: ""
        });
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add bulk credits');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Edit Submit Handler
  const handleEditSubmit = (e) => {
    e.preventDefault();
    const index = history.findIndex(item => item === selectedCredit);
    if (index !== -1) {
      const updatedHistory = [...history];
      updatedHistory[index] = {
        ...selectedCredit,
        amount: parseFloat(editFormData.amount || selectedCredit.amount),
        ref: editFormData.reference,
        mode: editFormData.mode,
        txnId: editFormData.txnId
      };
      setHistory(updatedHistory);
      toast.success("Credit Record Updated");
      setShowEditModal(false);
    }
  };

  // 4. Trash / Delete Submit Handler
  const handleTrashSubmit = async () => {
    if (!selectedCredit) return;
    try {
      setSubmitting(true);
      const idToDelete = selectedCredit.rawId || selectedCredit.id;
      await adminAPI.deleteTransaction(idToDelete);
      toast.success("Transaction Deleted Successfully");
      setShowTrashModal(false);
      setSelectedCredit(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Action Button Triggers
  const handleViewDetails = (credit) => {
    setSelectedCredit(credit);
    setShowDetailsModal(true);
  };

  const handleEditCredit = (credit) => {
    setSelectedCredit(credit);
    setEditFormData({
      employer: credit.employer,
      amount: credit.amount,
      reference: credit.ref,
      mode: credit.mode,
      txnId: credit.txnId,
    });
    setShowEditModal(true);
  };

  const handleTrashCredit = (credit) => {
    setSelectedCredit(credit);
    setShowTrashModal(true);
  };

  const handleApproveRequest = async (id) => {
    if (!window.confirm('Are you sure you want to approve this credit request?')) return;
    try {
      setLoading(true);
      const res = await adminAPI.approveCreditRequest(id);
      if (res.data.success) {
        toast.success('Request approved successfully!');
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (id) => {
    const reason = window.prompt('Enter reason for rejection:');
    if (reason === null) return;
    try {
      setLoading(true);
      const res = await adminAPI.rejectCreditRequest(id, { reason });
      if (res.data.success) {
        toast.success('Request rejected.');
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-2 py-md-4" style={{ minHeight: "100vh" }}>
      {/* Page Header & Action Buttons */}
      <div className="card mb-3 mb-md-4 shadow-sm" style={{ border: `1px solid ${colors.lightGrayBorder}`, borderRadius: '14px' }}>
        <div className="card-body p-3 p-sm-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
            <div>
              <h2 className="fw-bold mb-0" style={{ color: colors.blackText, fontSize: isMobile ? '1.35rem' : '1.85rem' }}>
                Credits Management
              </h2>
              <p className="text-muted mb-0 small" style={{ fontSize: isMobile ? '0.78rem' : '0.88rem' }}>
                Manage employer credit allocations, bulk grants & pending requests
              </p>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 w-100 w-sm-auto">
              <button
                className="btn text-white fw-semibold d-flex align-items-center justify-content-center gap-1.5 flex-fill flex-sm-grow-0"
                style={{
                  background: colors.primaryRed,
                  borderRadius: 10,
                  fontSize: isMobile ? '0.82rem' : '0.9rem',
                  padding: isMobile ? '8px 14px' : '9px 18px',
                  boxShadow: '0 2px 4px rgba(198, 40, 40, 0.2)'
                }}
                onClick={() => setShowModal(true)}
              >
                <i className="bi bi-plus-circle"></i>
                <span>Add Credit</span>
              </button>
              <button
                className="btn text-white fw-semibold d-flex align-items-center justify-content-center gap-1.5 flex-fill flex-sm-grow-0"
                style={{
                  background: colors.darkRed,
                  borderRadius: 10,
                  fontSize: isMobile ? '0.82rem' : '0.9rem',
                  padding: isMobile ? '8px 14px' : '9px 18px'
                }}
                onClick={() => setShowBulkModal(true)}
              >
                <i className="bi bi-plus-circle-fill"></i>
                <span>Bulk Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards - 3 Col Grid on Mobile & Desktop */}
      <div className="row g-2 g-md-3 mb-3 mb-md-4">
        <div className="col-4">
          <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.lightGrayBorder}`, borderRadius: '12px' }}>
            <div className="card-body p-2 p-sm-3">
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-1">
                <div>
                  <p className="mb-0 text-muted" style={{ fontSize: isMobile ? "0.68rem" : "0.82rem", fontWeight: 500 }}>
                    TOTAL CREDITS
                  </p>
                  <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.primaryRed, fontSize: isMobile ? '0.95rem' : '1.45rem' }}>
                    ${totalCredits.toLocaleString()}
                  </h4>
                </div>
                <div
                  className="rounded-circle d-none d-sm-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ backgroundColor: '#FEF2F2', width: isMobile ? "32px" : "44px", height: isMobile ? "32px" : "44px" }}
                >
                  <i className="bi bi-currency-dollar" style={{ color: colors.primaryRed, fontSize: isMobile ? '1rem' : '1.25rem' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-4">
          <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.lightGrayBorder}`, borderRadius: '12px' }}>
            <div className="card-body p-2 p-sm-3">
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-1">
                <div>
                  <p className="mb-0 text-muted" style={{ fontSize: isMobile ? "0.68rem" : "0.82rem", fontWeight: 500 }}>
                    EMPLOYERS
                  </p>
                  <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.primaryRed, fontSize: isMobile ? '0.95rem' : '1.45rem' }}>
                    {totalEmployers}
                  </h4>
                </div>
                <div
                  className="rounded-circle d-none d-sm-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ backgroundColor: '#FEF2F2', width: isMobile ? "32px" : "44px", height: isMobile ? "32px" : "44px" }}
                >
                  <i className="bi bi-people" style={{ color: colors.primaryRed, fontSize: isMobile ? '1rem' : '1.25rem' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-4">
          <div className="card shadow-sm h-100" style={{ border: `1px solid ${colors.lightGrayBorder}`, borderRadius: '12px' }}>
            <div className="card-body p-2 p-sm-3">
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-1">
                <div>
                  <p className="mb-0 text-muted" style={{ fontSize: isMobile ? "0.68rem" : "0.82rem", fontWeight: 500 }}>
                    TRANSACTIONS
                  </p>
                  <h4 className="fw-bold mb-0 mt-0.5" style={{ color: colors.primaryRed, fontSize: isMobile ? '0.95rem' : '1.45rem' }}>
                    {totalTransactions}
                  </h4>
                </div>
                <div
                  className="rounded-circle d-none d-sm-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ backgroundColor: '#FEF2F2', width: isMobile ? "32px" : "44px", height: isMobile ? "32px" : "44px" }}
                >
                  <i className="bi bi-arrow-left-right" style={{ color: colors.primaryRed, fontSize: isMobile ? '1rem' : '1.25rem' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PENDING REQUESTS SECTION */}
      {pendingRequests.length > 0 && (
        <div className="card shadow-sm mb-3 mb-md-4" style={{ borderRadius: 14, border: `1px solid ${colors.warningOrange}`, overflow: 'hidden' }}>
          <div className="card-header bg-white d-flex justify-content-between align-items-center py-2.5 px-3 px-sm-4" style={{ borderBottom: `1px solid ${colors.lightGrayBorder}` }}>
            <h5 className="fw-bold mb-0" style={{ color: colors.warningOrange, fontSize: isMobile ? '0.95rem' : '1.1rem' }}>
              Pending Credit Requests
            </h5>
            <span className="badge bg-warning text-dark px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
              {pendingRequests.length} New
            </span>
          </div>

          <div className="card-body p-0">
            {isMobile ? (
              /* Mobile Cards for Pending Requests */
              <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#FFFBEB' }}>
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="card border-0 shadow-sm"
                    style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #FDE68A' }}
                  >
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div>
                          <h6 className="fw-bold mb-0" style={{ color: colors.blackText, fontSize: '0.92rem' }}>
                            {req.employer_name}
                          </h6>
                          <div className="text-muted small" style={{ fontSize: '0.76rem' }}>
                            Requested By: <span className="fw-medium text-dark">{req.requested_by_name || 'Employer'}</span>
                          </div>
                        </div>
                        <div className="fw-bold" style={{ color: colors.primaryRed, fontSize: '1.05rem' }}>
                          ${parseFloat(req.amount || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="p-2 rounded-3 mb-2.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6', fontSize: '0.75rem' }}>
                        <div className="d-flex justify-content-between text-muted mb-1">
                          <span>Date:</span>
                          <span className="fw-medium text-dark">{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        {req.description && (
                          <div className="d-flex justify-content-between text-muted">
                            <span>Reason:</span>
                            <span className="fw-medium text-dark text-truncate" style={{ maxWidth: '70%' }}>{req.description}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm flex-fill fw-semibold py-1.5"
                          style={{ borderRadius: '8px', fontSize: '0.82rem' }}
                          onClick={() => handleApproveRequest(req.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm flex-fill fw-semibold py-1.5"
                          style={{ borderRadius: '8px', fontSize: '0.82rem' }}
                          onClick={() => handleRejectRequest(req.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table View for Pending Requests */
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead>
                    <tr style={{ background: '#FFF3E0', color: colors.darkGrayText, fontSize: '0.85rem' }}>
                      <th className="py-3 ps-4">Date</th>
                      <th className="py-3">Employer</th>
                      <th className="py-3">Requested By</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3">Reason</th>
                      <th className="py-3 pe-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((req) => (
                      <tr key={req.id}>
                        <td className="py-3 ps-4">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="py-3 fw-semibold">{req.employer_name}</td>
                        <td className="py-3">{req.requested_by_name}</td>
                        <td className="py-3 fw-bold text-danger">${parseFloat(req.amount || 0).toLocaleString()}</td>
                        <td className="py-3 text-muted">{req.description || "-"}</td>
                        <td className="py-3 pe-4 text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-success btn-sm px-3"
                              style={{ borderRadius: '6px' }}
                              onClick={() => handleApproveRequest(req.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm px-3"
                              style={{ borderRadius: '6px' }}
                              onClick={() => handleRejectRequest(req.id)}
                            >
                              Reject
                            </button>
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

      {/* CREDIT HISTORY TABLE */}
      <div className="card shadow-sm mb-4" style={{ borderRadius: 14, border: `1px solid ${colors.lightGrayBorder}`, overflow: 'hidden' }}>
        <div className="card-header bg-white py-2.5 py-sm-3 px-3 px-sm-4 d-flex justify-content-between align-items-center" style={{ borderBottom: `1px solid ${colors.lightGrayBorder}` }}>
          <h5 className="fw-bold mb-0" style={{ color: colors.blackText, fontSize: isMobile ? '0.98rem' : '1.15rem' }}>
            Credit History ({history.length})
          </h5>
        </div>

        <div className="card-body p-0">
          {isMobile ? (
            /* Mobile Cards for Credit History */
            <div className="p-2.5 d-flex flex-column gap-2.5" style={{ backgroundColor: '#F8FAFC' }}>
              {history.length === 0 ? (
                <div className="text-center py-4 text-muted small">No credit records found.</div>
              ) : (
                history.map((row, i) => (
                  <div
                    key={i}
                    className="card shadow-sm border-0"
                    style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', border: `1px solid ${colors.lightGrayBorder}` }}
                  >
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div>
                          <h6 className="fw-bold mb-0" style={{ color: colors.blackText, fontSize: '0.92rem' }}>
                            {row.employer}
                          </h6>
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            Mode: <span className="fw-medium text-dark">{row.mode}</span> • Txn: {row.txnId || "-"}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold" style={{ color: colors.primaryRed, fontSize: '1.05rem' }}>
                            ${parseFloat(row.amount || 0).toLocaleString()}
                          </div>
                          <span className="badge bg-light text-muted border px-1.5 py-0.5" style={{ fontSize: '0.7rem' }}>
                            {row.date ? String(row.date).split('T')[0] : "-"}
                          </span>
                        </div>
                      </div>

                      {row.ref && (
                        <div className="p-2 rounded-2 mb-2.5 text-muted" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6', fontSize: '0.74rem' }}>
                          Ref: <span className="text-dark fw-medium">{row.ref}</span>
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                        <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                          Added by: <strong>{row.addedBy}</strong>
                        </span>
                        <div className="d-flex gap-1.5">
                          <button
                            className="btn btn-sm btn-light border d-flex align-items-center gap-1 py-1 px-2 text-danger"
                            style={{ borderRadius: '6px', fontSize: '0.76rem', fontWeight: 600 }}
                            onClick={() => handleViewDetails(row)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i> Details
                          </button>
                          <button
                            className="btn btn-sm btn-light border py-1 px-2"
                            style={{ borderRadius: '6px', fontSize: '0.76rem' }}
                            onClick={() => handleEditCredit(row)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-light border text-danger py-1 px-2"
                            style={{ borderRadius: '6px', fontSize: '0.76rem' }}
                            onClick={() => handleTrashCredit(row)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Desktop Table View for Credit History */
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr style={{ background: colors.lightBackground, color: colors.darkGrayText, fontSize: '0.85rem' }}>
                    <th className="py-3 ps-4">Date</th>
                    <th className="py-3">Employer</th>
                    <th className="py-3">Amount</th>
                    <th className="py-3">Reference</th>
                    <th className="py-3">Mode</th>
                    <th className="py-3">Txn ID</th>
                    <th className="py-3 text-center pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted small">No credit records found.</td>
                    </tr>
                  ) : (
                    history.map((row, i) => (
                      <tr key={i}>
                        <td className="py-3 ps-4" style={{ color: colors.blackText }}>{row.date ? String(row.date).split('T')[0] : "-"}</td>
                        <td className="py-3 fw-semibold" style={{ color: colors.blackText }}>{row.employer}</td>
                        <td className="py-3 fw-bold" style={{ color: colors.primaryRed }}>${parseFloat(row.amount || 0).toLocaleString()}</td>
                        <td className="py-3 text-muted">{row.ref || "-"}</td>
                        <td className="py-3">{row.mode}</td>
                        <td className="py-3 text-muted">{row.txnId || "-"}</td>
                        <td className="py-3 text-center pe-4">
                          <div className="d-flex justify-content-center gap-1.5">
                            <button
                              className="btn btn-sm btn-light border text-danger"
                              style={{ borderRadius: "6px", padding: "4px 8px" }}
                              onClick={() => handleViewDetails(row)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-light border"
                              style={{ borderRadius: "6px", padding: "4px 8px" }}
                              onClick={() => handleEditCredit(row)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-light border text-danger"
                              style={{ borderRadius: "6px", padding: "4px 8px" }}
                              onClick={() => handleTrashCredit(row)}
                              title="Remove"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. ADD CREDIT MODAL                                      */}
      {/* ========================================================= */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
          style={{ background: "rgba(0,0,0,0.60)", zIndex: 9999 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-4 rounded-4 shadow-lg"
            style={{ width: "100%", maxWidth: "480px", animation: "zoomIn 0.2s" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: colors.primaryRed }}>
                <i className="bi bi-plus-circle me-2"></i>Add Employer Credit
              </h5>
              <button className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>

            <form onSubmit={handleSingleSubmit}>
              {/* Select Employer */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Select Employer *</label>
                <select
                  className="form-select"
                  value={formData.employerId}
                  onChange={(e) => setFormData({ ...formData, employerId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Employer --</option>
                  {employers.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Credit Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-control"
                  placeholder="e.g. 500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              {/* Payment Mode */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Payment Mode</label>
                <select
                  className="form-select"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                >
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online Gateway</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Reference */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Reference / Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Monthly top-up, Invoice #987"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>

              {/* Transaction ID */}
              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Transaction ID (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TXN987654321"
                  value={formData.txnId}
                  onChange={(e) => setFormData({ ...formData, txnId: e.target.value })}
                />
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-light border flex-fill fw-semibold"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn text-white flex-fill fw-semibold"
                  style={{ background: colors.primaryRed }}
                >
                  {submitting ? "Adding..." : "Add Credit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BULK ADD MODAL                                        */}
      {/* ========================================================= */}
      {showBulkModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
          style={{ background: "rgba(0,0,0,0.60)", zIndex: 9999 }}
          onClick={() => setShowBulkModal(false)}
        >
          <div
            className="bg-white p-4 rounded-4 shadow-lg"
            style={{ width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", animation: "zoomIn 0.2s" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: colors.darkRed }}>
                <i className="bi bi-plus-circle-fill me-2"></i>Bulk Credit Grant
              </h5>
              <button className="btn-close" onClick={() => setShowBulkModal(false)}></button>
            </div>

            <form onSubmit={handleBulkSubmit}>
              {/* Employers Multi-Select */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold text-dark mb-0">Select Employers ({bulkFormData.employers.length} selected) *</label>
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none p-0 fw-semibold"
                    style={{ fontSize: "0.78rem", color: colors.primaryRed }}
                    onClick={toggleSelectAllBulk}
                  >
                    {bulkFormData.employers.length === employers.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: "150px", overflowY: "auto", background: "#FAFBFD" }}
                >
                  {employers.length === 0 ? (
                    <div className="text-muted small p-2">No employers found.</div>
                  ) : (
                    employers.map((emp) => (
                      <div key={emp.id} className="form-check py-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`bulk_emp_${emp.id}`}
                          checked={bulkFormData.employers.includes(emp.id)}
                          onChange={() => toggleBulkEmployer(emp.id)}
                        />
                        <label className="form-check-label small text-dark" htmlFor={`bulk_emp_${emp.id}`}>
                          {emp.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Amount Per Employer */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Amount Per Employer ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-control"
                  placeholder="e.g. 1000"
                  value={bulkFormData.amount}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, amount: e.target.value })}
                  required
                />
                {bulkFormData.employers.length > 0 && bulkFormData.amount > 0 && (
                  <div className="small text-muted mt-1">
                    Total Disbursed: <strong className="text-danger">${(parseFloat(bulkFormData.amount) * bulkFormData.employers.length).toLocaleString()}</strong>
                  </div>
                )}
              </div>

              {/* Payment Mode */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Payment Mode</label>
                <select
                  className="form-select"
                  value={bulkFormData.mode}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, mode: e.target.value })}
                >
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online Gateway</option>
                  <option value="UPI">UPI / QR</option>
                </select>
              </div>

              {/* Reference */}
              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Reference / Reason</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Festival bonus / Quarterly recharge"
                  value={bulkFormData.reference}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, reference: e.target.value })}
                />
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-light border flex-fill fw-semibold"
                  onClick={() => setShowBulkModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn text-white flex-fill fw-semibold"
                  style={{ background: colors.darkRed }}
                >
                  {submitting ? "Processing..." : `Grant to ${bulkFormData.employers.length} Employers`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. VIEW DETAILS MODAL                                    */}
      {/* ========================================================= */}
      {showDetailsModal && selectedCredit && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
          style={{ background: "rgba(0,0,0,0.60)", zIndex: 9999 }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white p-4 rounded-4 shadow-lg"
            style={{ width: "100%", maxWidth: "480px", animation: "zoomIn 0.2s" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: colors.primaryRed }}>
                <i className="bi bi-info-circle me-2"></i>Credit Transaction Details
              </h5>
              <button className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
            </div>

            <table className="table table-borderless mb-3">
              <tbody>
                <tr><th style={{ color: colors.darkGrayText, width: '40%' }}>Date:</th><td style={{ color: colors.blackText }}>{selectedCredit.date ? String(selectedCredit.date).split('T')[0] : "-"}</td></tr>
                <tr><th style={{ color: colors.darkGrayText }}>Employer:</th><td style={{ color: colors.blackText, fontWeight: "600" }}>{selectedCredit.employer}</td></tr>
                <tr><th style={{ color: colors.darkGrayText }}>Amount:</th><td style={{ color: colors.primaryRed, fontWeight: "bold", fontSize: "1.1rem" }}>${selectedCredit.amount?.toLocaleString()}</td></tr>
                <tr><th style={{ color: colors.darkGrayText }}>Reference:</th><td style={{ color: colors.blackText }}>{selectedCredit.ref || "-"}</td></tr>
                <tr><th style={{ color: colors.darkGrayText }}>Mode:</th><td><span className="badge bg-light text-dark border">{selectedCredit.mode}</span></td></tr>
                <tr><th style={{ color: colors.darkGrayText }}>Transaction ID:</th><td style={{ color: colors.blackText, fontFamily: "monospace" }}>{selectedCredit.txnId || "-"}</td></tr>
                <tr><th style={{ color: colors.darkGrayText }}>Added By:</th><td style={{ color: colors.blackText }}>{selectedCredit.addedBy}</td></tr>
              </tbody>
            </table>

            <button
              className="btn fw-semibold w-100 text-white"
              style={{ borderRadius: 8, background: colors.primaryRed }}
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. EDIT CREDIT MODAL                                     */}
      {/* ========================================================= */}
      {showEditModal && selectedCredit && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
          style={{ background: "rgba(0,0,0,0.60)", zIndex: 9999 }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white p-4 rounded-4 shadow-lg"
            style={{ width: "100%", maxWidth: "480px", animation: "zoomIn 0.2s" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: colors.primaryRed }}>
                <i className="bi bi-pencil-square me-2"></i>Edit Credit Record
              </h5>
              <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Employer</label>
                <input
                  type="text"
                  className="form-control bg-light"
                  value={editFormData.employer}
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Payment Mode</label>
                <select
                  className="form-select"
                  value={editFormData.mode}
                  onChange={(e) => setEditFormData({ ...editFormData, mode: e.target.value })}
                >
                  <option value="Bank">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online Gateway</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Reference</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.reference}
                  onChange={(e) => setEditFormData({ ...editFormData, reference: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Transaction ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.txnId}
                  onChange={(e) => setEditFormData({ ...editFormData, txnId: e.target.value })}
                />
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-light border flex-fill fw-semibold"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn text-white flex-fill fw-semibold"
                  style={{ background: colors.primaryRed }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. DELETE / TRASH CONFIRMATION MODAL                     */}
      {/* ========================================================= */}
      {showTrashModal && selectedCredit && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
          style={{ background: "rgba(0,0,0,0.60)", zIndex: 9999 }}
          onClick={() => setShowTrashModal(false)}
        >
          <div
            className="bg-white p-4 rounded-4 shadow-lg text-center"
            style={{ width: "100%", maxWidth: "420px", animation: "zoomIn 0.2s" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center"
                style={{ width: "64px", height: "64px", background: "#FEE2E2", color: colors.primaryRed }}
              >
                <i className="bi bi-trash3-fill" style={{ fontSize: "28px" }}></i>
              </div>
            </div>

            <h5 className="fw-bold mb-2" style={{ color: colors.blackText }}>Delete Transaction?</h5>
            <p className="text-muted small mb-4">
              Are you sure you want to delete the credit transaction of <strong className="text-danger">${selectedCredit.amount?.toLocaleString()}</strong> for <strong>{selectedCredit.employer}</strong>? This action cannot be undone.
            </p>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-light border flex-fill fw-semibold py-2"
                onClick={() => setShowTrashModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                className="btn btn-danger flex-fill fw-semibold py-2"
                onClick={handleTrashSubmit}
              >
                {submitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Small Popup Animation CSS */}
      <style>{`
        @keyframes zoomIn {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AddCredit;