import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserTie, FaBuilding, FaUniversity, FaTimes, FaEye, FaCalendarAlt, FaMoneyBillWave, FaUser, FaStore, FaFilter, FaSearch, FaExchangeAlt, FaArrowRight, FaCheckCircle, FaClock, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { employerAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useRegional } from '../../context/RegionalContext';

const PaymentEmployer = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useRegional();
  // --- STATE MANAGEMENT ---
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for active tab in payment history
  const [activeHistoryTab, setActiveHistoryTab] = useState('all');

  // Modal visibility states
  const [showPayEmployeeModal, setShowPayEmployeeModal] = useState(false);
  const [showPayVendorModal, setShowPayVendorModal] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form data states
  const [employeePayment, setEmployeePayment] = useState({
    employeeId: '',
    amount: '',
    accountNumber: '',
    ifsc: '',
    notes: ''
  });

  const [vendorPayment, setVendorPayment] = useState({
    vendorId: '',
    amount: '',
    accountNumber: '',
    ifsc: '',
    notes: ''
  });

  const [bankTransfer, setBankTransfer] = useState({
    fromAccount: '',
    toAccount: '',
    toIFSC: '',
    amount: '',
    notes: '',
    recipientName: '' // Added recipient name field
  });

  // State for viewing receipt
  const [selectedPayment, setSelectedPayment] = useState(null);

  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesRes, vendorsRes, transactionsRes, creditRes] = await Promise.all([
        employerAPI.getMyEmployees(),
        employerAPI.getMyVendors(),
        employerAPI.getTransactions(),
        employerAPI.getCreditBalance()
      ]);

      if (employeesRes?.data?.success) {
        const empData = (employeesRes.data.data || []).map(emp => ({
          id: emp.id,
          name: emp.user?.name || 'Unknown',
          accountNumber: emp.bank_detail?.account_number || '',
          ifsc: emp.bank_detail?.ifsc_code || ''
        }));
        setEmployees(empData);
      }

      // Vendors
      const rawVendors = vendorsRes?.data;
      let apiVendors = [];
      if (Array.isArray(rawVendors)) apiVendors = rawVendors;
      else if (Array.isArray(rawVendors?.data)) apiVendors = rawVendors.data;
      else if (Array.isArray(rawVendors?.vendors)) apiVendors = rawVendors.vendors;

      const vendorData = apiVendors.map(vendor => ({
        id: vendor.id,
        name: vendor.user?.name || vendor.contact_person || vendor.company_name || vendor.name || 'Unknown',
        accountNumber: vendor.account_number || '',
        ifsc: vendor.ifsc_code || ''
      }));

      // Merge with custom local vendors so created vendors are always payable
      try {
        const userKey = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'current';
        const localVendors = JSON.parse(localStorage.getItem(`employer_vendors_${userKey}`) || localStorage.getItem('employer_custom_vendors') || '[]');
        localVendors.forEach(loc => {
          const exists = vendorData.some(v => String(v.id) === String(loc.id) || (v.name && v.name === (loc.name || loc.companyName)));
          if (!exists) {
            vendorData.push({
              id: loc.id,
              name: loc.name || loc.companyName || 'Vendor',
              accountNumber: loc.accountNumber || '',
              ifsc: loc.ifsc || ''
            });
          }
        });
      } catch (storageErr) {
        console.warn('Could not read stored vendors in PaymentEmployer:', storageErr);
      }

      setVendors(vendorData);

      if (creditRes?.data?.success) {
        setCreditBalance(creditRes.data.data?.balance || 0);
      }

      if (transactionsRes?.data?.success) {
        const payments = (transactionsRes.data.data || []).map(t => ({
          id: t.id,
          date: t.date || t.created_at ? new Date(t.date || t.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          recipient: t.recipient_name || t.employee_name || t.vendor_name || t.user_name || t.name || t.description || 'Payment',
          type: t.type === 'salary' ? 'Employee' : t.type === 'vendor_payment' ? 'Vendor' : 'Bank Transfer',
          amount: parseFloat(t.amount) || 0,
          method: 'Bank Transfer',
          status: (t.status === 'success' || t.status === 'completed' || t.status === 'paid') ? 'Success' : t.status === 'pending' ? 'Pending' : 'Failed',
          notes: t.description || '',
          accountNumber: t.account_number || ''
        }));
        setRecentPayments(payments);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER FUNCTIONS ---

  // Handle Pay Employee submission
  const handlePayEmployee = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const employee = employees.find(emp => emp.id == employeePayment.employeeId);
    if (!employee || !employeePayment.amount || !employeePayment.accountNumber || !employeePayment.ifsc) {
      const msg = 'Please fill in all required fields.';
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
      return;
    }

    const payAmount = parseFloat(employeePayment.amount) || 0;
    if (creditBalance < payAmount) {
      const msg = `Insufficient credit balance. Required: ${formatCurrency(payAmount)}, Available: ${formatCurrency(creditBalance)}. Please add credits from 'My Credits'.`;
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
      return;
    }

    try {
      const response = await employerAPI.paySalary(employeePayment.employeeId, {
        amount: parseFloat(employeePayment.amount),
        account_number: employeePayment.accountNumber,
        ifsc_code: employeePayment.ifsc,
        notes: employeePayment.notes || 'Salary payment'
      });

      if (response?.data?.success) {
        toast.success(`Salary of ${formatCurrency(employeePayment.amount)} paid to ${employee.name} successfully.`);
        setSuccessMessage(`Bank transfer of ${formatCurrency(employeePayment.amount)} to ${employee.name} initiated successfully.`);
        setShowPayEmployeeModal(false);
        setEmployeePayment({ employeeId: '', amount: '', accountNumber: '', ifsc: '', notes: '' });
        fetchData(); // Refresh data
      } else {
        const msg = response?.data?.message || 'Failed to process payment.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error('paySalary error:', err);
      const msg = err.response?.data?.message || 'Failed to process payment.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Pay Vendor submission
  const handlePayVendor = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const vendor = vendors.find(v => v.id == vendorPayment.vendorId);
    if (!vendor || !vendorPayment.amount || !vendorPayment.accountNumber || !vendorPayment.ifsc) {
      const msg = 'Please fill in all required fields.';
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
      return;
    }

    const payAmount = parseFloat(vendorPayment.amount) || 0;
    if (creditBalance < payAmount) {
      const msg = `Insufficient credit balance. Required: ${formatCurrency(payAmount)}, Available: ${formatCurrency(creditBalance)}. Please add credits from 'My Credits'.`;
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
      return;
    }

    try {
      const response = await employerAPI.payVendor(vendorPayment.vendorId, {
        amount: parseFloat(vendorPayment.amount),
        account_number: vendorPayment.accountNumber,
        ifsc_code: vendorPayment.ifsc,
        notes: vendorPayment.notes || 'Vendor payment'
      });

      if (response?.data?.success) {
        toast.success(`Bank transfer of ${formatCurrency(vendorPayment.amount)} to ${vendor.name} initiated successfully.`);
        setSuccessMessage(`Bank transfer of ${formatCurrency(vendorPayment.amount)} to ${vendor.name} initiated successfully.`);
        setShowPayVendorModal(false);
        setVendorPayment({ vendorId: '', amount: '', accountNumber: '', ifsc: '', notes: '' });
        fetchData(); // Refresh data
      } else {
        const msg = response?.data?.message || 'Failed to process payment.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error('payVendor error:', err);
      const msg = err.response?.data?.message || 'Failed to process payment.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Bank Transfer submission
  const handleBankTransfer = (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!bankTransfer.fromAccount || !bankTransfer.toAccount || !bankTransfer.toIFSC || !bankTransfer.amount || !bankTransfer.recipientName) {
      toast.error('Please fill in all bank details.');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      const newPayment = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        recipient: bankTransfer.recipientName, // Use recipient name instead of account number
        type: 'Bank Transfer',
        amount: parseFloat(bankTransfer.amount),
        method: 'Bank-to-Bank Transfer',
        status: Math.random() > 0.1 ? 'Success' : 'Failed', // Simulate status
        notes: bankTransfer.notes,
        accountNumber: bankTransfer.toAccount
      };

      setRecentPayments([newPayment, ...recentPayments]);
      setIsLoading(false);
      if (newPayment.status === 'Success') {
        toast.success(`Bank transfer of ${formatCurrency(newPayment.amount)} to ${bankTransfer.recipientName} is successful.`);
      } else {
        toast.error(`Bank transfer of ${formatCurrency(newPayment.amount)} to ${bankTransfer.recipientName} failed.`);
      }
      setShowBankTransferModal(false);
      setBankTransfer({ fromAccount: '', toAccount: '', toIFSC: '', amount: '', notes: '', recipientName: '' }); // Reset form
    }, 1500);
  };

  // Handle View Receipt
  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  // Auto-fill employee details when selected
  const handleEmployeeSelect = (employeeId) => {
    // Use loose equality (==) because API ID might be Number and select value is String
    const employee = employees.find(emp => emp.id == employeeId);
    if (employee) {
      setEmployeePayment({
        ...employeePayment,
        employeeId,
        accountNumber: employee.accountNumber || '',
        ifsc: employee.ifsc || ''
      });
    } else {
      setEmployeePayment({
        ...employeePayment,
        employeeId,
        accountNumber: '',
        ifsc: ''
      });
    }
  };

  // Auto-fill vendor details when selected
  const handleVendorSelect = (vendorId) => {
    const vendor = vendors.find(v => v.id == vendorId);
    if (vendor) {
      setVendorPayment({
        ...vendorPayment,
        vendorId,
        accountNumber: vendor.accountNumber || '',
        ifsc: vendor.ifsc || ''
      });
    } else {
      setVendorPayment({
        ...vendorPayment,
        vendorId,
        accountNumber: '',
        ifsc: ''
      });
    }
  };

  // Filter payments based on search, status, and type
  const filteredPayments = recentPayments.filter(payment => {
    const matchesSearch = payment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status.toLowerCase() === filterStatus.toLowerCase();

    // Filter by history tab
    let matchesType = true;
    if (activeHistoryTab === 'employee') {
      matchesType = payment.type === 'Employee';
    } else if (activeHistoryTab === 'vendor') {
      matchesType = payment.type === 'Vendor';
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Success':
        return <FaCheckCircle className="me-1" />;
      case 'Pending':
        return <FaClock className="me-1" />;
      case 'Failed':
        return <FaExclamationCircle className="me-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4" style={{ minHeight: "100vh" }}>
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Loading payment data...</p>
        </div>
      )}

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {successMessage && <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>{successMessage}</Alert>}

      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <h2 className="fw-bold mb-3 mb-md-0" style={{ color: "#C62828" }}>Payments</h2>
        <div className="d-flex align-items-center">
          <div className="bg-white rounded-pill p-2 px-3 shadow-sm">
            <span className="text-muted small me-2">Available Credits:</span>
            <span className="fw-bold" style={{ color: "#C62828" }}>{formatCurrency(creditBalance)}</span>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0 transition-all hover-card" style={{ borderRadius: "16px", overflow: "hidden" }}>
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: "rgba(198, 40, 40, 0.1)" }}>
                  <FaUserTie size={24} style={{ color: "#C62828" }} />
                </div>
                <div>
                  <h5 className="fw-bold mb-0">Pay Employee</h5>
                  <p className="text-muted small mb-0">Direct Bank Transfer</p>
                </div>
              </div>
              <p className="text-muted small">Process salary and other payments to your employees quickly.</p>
              <button className="btn text-white mt-3 w-100 d-flex align-items-center justify-content-center" style={{ background: "#C62828", borderRadius: "8px" }} onClick={() => setShowPayEmployeeModal(true)}>
                Pay Now <FaArrowRight className="ms-2" />
              </button>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0 transition-all hover-card" style={{ borderRadius: "16px", overflow: "hidden" }}>
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: "rgba(198, 40, 40, 0.1)" }}>
                  <FaBuilding size={24} style={{ color: "#C62828" }} />
                </div>
                <div>
                  <h5 className="fw-bold mb-0">Pay Vendor</h5>
                  <p className="text-muted small mb-0">Direct Bank Transfer</p>
                </div>
              </div>
              <p className="text-muted small">Make payments to your registered vendors for services and goods.</p>
              <button className="btn text-white mt-3 w-100 d-flex align-items-center justify-content-center" style={{ background: "#C62828", borderRadius: "8px" }} onClick={() => setShowPayVendorModal(true)}>
                Pay Vendor <FaArrowRight className="ms-2" />
              </button>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0 transition-all hover-card" style={{ borderRadius: "16px", overflow: "hidden" }}>
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: "rgba(198, 40, 40, 0.1)" }}>
                  <FaExchangeAlt size={24} style={{ color: "#C62828" }} />
                </div>
                <div>
                  <h5 className="fw-bold mb-0">Bank Transfer</h5>
                  <p className="text-muted small mb-0">Bank-to-Bank Transfer</p>
                </div>
              </div>
              <p className="text-muted small">Send a direct deposit to any bank account.</p>
              <button className="btn text-white mt-3 w-100 d-flex align-items-center justify-content-center" style={{ background: "#C62828", borderRadius: "8px" }} onClick={() => setShowBankTransferModal(true)}>
                Proceed <FaArrowRight className="ms-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Logs Table */}
      <div className="card shadow-sm border-0" style={{ borderRadius: "16px" }}>
        <div className="card-header bg-white p-4 border-0">
          <div className="row align-items-center">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <h5 className="fw-bold mb-0">Payment History</h5>
              <p className="text-muted small mb-0">View and manage all your payment transactions</p>
            </div>
            <div className="col-12 col-md-6">
              <div className="d-flex flex-column flex-md-row gap-2">
                <div className="position-relative flex-grow-1">
                  <input
                    type="text"
                    className="form-control ps-4"
                    style={{ border: "1px solid #E2E2E2", borderRadius: "8px" }}
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch
                    size={16}
                    color="#C62828"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)"
                    }}
                  />
                </div>
                <div className="d-flex gap-2">
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

          {/* Payment History Tabs */}
          <div className="mt-3 overflow-auto">
            <div className="d-flex gap-2 flex-nowrap" style={{ borderBottom: "1px solid #E2E2E2", paddingBottom: '4px' }}>
              <button
                className={`btn btn-sm ${activeHistoryTab === 'all' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                onClick={() => setActiveHistoryTab('all')}
                style={{
                  fontWeight: '600',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  fontSize: '0.85rem',
                  padding: '6px 14px'
                }}
              >
                All Payments
              </button>
              <button
                className={`btn btn-sm ${activeHistoryTab === 'employee' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                onClick={() => setActiveHistoryTab('employee')}
                style={{
                  fontWeight: '600',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  fontSize: '0.85rem',
                  padding: '6px 14px'
                }}
              >
                Employee Payments
              </button>
              <button
                className={`btn btn-sm ${activeHistoryTab === 'vendor' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                onClick={() => setActiveHistoryTab('vendor')}
                style={{
                  fontWeight: '600',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  fontSize: '0.85rem',
                  padding: '6px 14px'
                }}
              >
                Vendor Payments
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {/* Desktop Table View */}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: "#FFF5F5" }}>
                <tr>
                  <th>Date</th>
                  {/* DYNAMIC TABLE HEADER */}
                  <th>
                    {activeHistoryTab === 'employee' ? 'Employee' :
                      activeHistoryTab === 'vendor' ? 'Vendor' :
                        'Employee / Vendor'}
                  </th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-4">
                      <p className="text-muted mb-0">No payments found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.slice(0, 10).map((payment) => (
                    <tr key={payment.id} className="transition-all">
                      <td>{payment.date}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className={`me-2 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: "32px", height: "32px", backgroundColor: payment.type === 'Employee' ? '#e3f2fd' : payment.type === 'Vendor' ? '#f3e5f5' : '#e8f5e9' }}>
                            {payment.type === 'Employee' ? <FaUser size={16} color="#1976d2" /> : payment.type === 'Vendor' ? <FaStore size={16} color="#7b1fa2" /> : <FaExchangeAlt size={16} color="#388e3c" />}
                          </div>
                          <div>
                            <div className="fw-semibold">{payment.recipient}</div>
                            <div className="text-muted small" style={{ fontSize: "0.75rem" }}>Acc: {payment.accountNumber ? payment.accountNumber.substring(0, 4) + 'XXXX' + payment.accountNumber.substring(payment.accountNumber.length - 4) : 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold">{formatCurrency ? formatCurrency(payment.amount) : `₹${payment.amount.toLocaleString()}`}</td>
                      <td>{payment.method}</td>
                      <td>
                        <span className={`badge rounded-pill d-flex align-items-center ${payment.status === 'Success' ? 'bg-success' :
                          payment.status === 'Pending' ? 'bg-warning text-dark' :
                            'bg-danger'
                          }`}>
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </span>
                      </td>
                      <td className="text-truncate" style={{ maxWidth: '150px' }}>{payment.notes}</td>
                      <td>
                        <button className="btn btn-sm d-flex align-items-center" style={{ color: "#C62828" }} onClick={() => handleViewReceipt(payment)}>
                          <FaEye /> <span className="d-none d-lg-inline ms-1">View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="d-md-none p-3">
            {filteredPayments.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted">No payments found matching your criteria.</p>
              </div>
            ) : (
              filteredPayments.slice(0, 10).map((payment) => (
                <div key={payment.id} className="card mb-3 border" style={{ borderRadius: "12px" }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <div className={`me-2 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: "32px", height: "32px", backgroundColor: payment.type === 'Employee' ? '#e3f2fd' : payment.type === 'Vendor' ? '#f3e5f5' : '#e8f5e9' }}>
                          {payment.type === 'Employee' ? <FaUser size={16} color="#1976d2" /> : payment.type === 'Vendor' ? <FaStore size={16} color="#7b1fa2" /> : <FaExchangeAlt size={16} color="#388e3c" />}
                        </div>
                        <div>
                          <span className="fw-semibold">{payment.recipient}</span>
                          <div className="text-muted small" style={{ fontSize: "0.75rem" }}>Acc: {payment.accountNumber ? payment.accountNumber.substring(0, 4) + 'XXXX' + payment.accountNumber.substring(payment.accountNumber.length - 4) : 'N/A'}</div>
                        </div>
                      </div>
                      <span className={`badge rounded-pill d-flex align-items-center ${payment.status === 'Success' ? 'bg-success' :
                        payment.status === 'Pending' ? 'bg-warning text-dark' :
                          'bg-danger'
                        }`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small">{payment.date}</span>
                      <span className="fw-bold" style={{ color: "#C62828" }}>{formatCurrency ? formatCurrency(payment.amount) : `₹${payment.amount.toLocaleString()}`}</span>
                    </div>
                    <div className="mb-2">
                      <p className="text-muted small mb-0">{payment.method}</p>
                    </div>
                    <div className="mb-2">
                      <p className="text-muted small mb-0">{payment.notes}</p>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button className="btn btn-sm d-flex align-items-center" style={{ color: "#C62828" }} onClick={() => handleViewReceipt(payment)}>
                        <FaEye /> <span className="ms-1">View Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Pay Employee Modal */}
      {showPayEmployeeModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '500px', width: '95%' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-2 me-3" style={{ backgroundColor: "rgba(198, 40, 40, 0.1)" }}>
                    <FaUserTie size={24} style={{ color: "#C62828" }} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-1">Pay Employee</h5>
                    <p className="text-muted small mb-0">Direct Bank Transfer</p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowPayEmployeeModal(false)}></button>
              </div>
              <form onSubmit={handlePayEmployee}>
                <div className="modal-body p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {error && (
                    <div className="alert alert-danger py-2 px-3 mb-3 small d-flex justify-content-between align-items-center">
                      <span>{error}</span>
                      <button type="button" className="btn-close btn-sm" onClick={() => setError(null)}></button>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center small mb-3 p-2 px-3 rounded" style={{ backgroundColor: creditBalance <= 0 ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${creditBalance <= 0 ? '#FCA5A5' : '#E2E8F0'}` }}>
                    <div>
                      <span className="text-muted me-1">Available Credit Balance:</span>
                      <strong style={{ color: creditBalance <= 0 ? '#DC2626' : '#16A34A' }}>{formatCurrency(creditBalance)}</strong>
                    </div>
                    {creditBalance <= 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-0 px-2 fw-semibold"
                        style={{ fontSize: '11.5px' }}
                        onClick={() => {
                          setShowPayEmployeeModal(false);
                          navigate('/employer/credits/balance');
                        }}
                      >
                        + Add Credits
                      </button>
                    )}
                  </div>
                  <div className="alert alert-info d-flex align-items-center" role="alert">
                    <FaInfoCircle className="me-2" />
                    <div className="small">Payment will be processed directly to employee's bank account.</div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Select Employee</label>
                    <select
                      className="form-select form-select-lg"
                      value={employeePayment.employeeId}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                      required
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Amount ($)</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        value={employeePayment.amount}
                        onChange={(e) => setEmployeePayment({ ...employeePayment, amount: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6 mb-3 mb-md-0">
                      <label className="form-label fw-semibold">Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={employeePayment.accountNumber}
                        onChange={(e) => setEmployeePayment({ ...employeePayment, accountNumber: e.target.value })}
                        placeholder="Enter account number"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">IFSC Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={employeePayment.ifsc}
                        onChange={(e) => setEmployeePayment({ ...employeePayment, ifsc: e.target.value })}
                        placeholder="Enter IFSC code"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={employeePayment.notes}
                      onChange={(e) => setEmployeePayment({ ...employeePayment, notes: e.target.value })}
                      placeholder="Add any notes or reference..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0">
                  <button
                    type="button"
                    className="btn btn-light px-4"
                    onClick={() => setShowPayEmployeeModal(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white px-4 d-flex align-items-center"
                    style={{ background: "#C62828" }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay Now <FaArrowRight className="ms-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pay Vendor Modal */}
      {showPayVendorModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '500px', width: '95%' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-2 me-3" style={{ backgroundColor: "rgba(198, 40, 40, 0.1)" }}>
                    <FaBuilding size={24} style={{ color: "#C62828" }} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-1">Pay Vendor</h5>
                    <p className="text-muted small mb-0">Direct Bank Transfer</p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowPayVendorModal(false)}></button>
              </div>
              <form onSubmit={handlePayVendor}>
                <div className="modal-body p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {error && (
                    <div className="alert alert-danger py-2 px-3 mb-3 small d-flex justify-content-between align-items-center">
                      <span>{error}</span>
                      <button type="button" className="btn-close btn-sm" onClick={() => setError(null)}></button>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center small mb-3 p-2 px-3 rounded" style={{ backgroundColor: creditBalance <= 0 ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${creditBalance <= 0 ? '#FCA5A5' : '#E2E8F0'}` }}>
                    <div>
                      <span className="text-muted me-1">Available Credit Balance:</span>
                      <strong style={{ color: creditBalance <= 0 ? '#DC2626' : '#16A34A' }}>{formatCurrency(creditBalance)}</strong>
                    </div>
                    {creditBalance <= 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-0 px-2 fw-semibold"
                        style={{ fontSize: '11.5px' }}
                        onClick={() => {
                          setShowPayVendorModal(false);
                          navigate('/employer/credits/balance');
                        }}
                      >
                        + Add Credits
                      </button>
                    )}
                  </div>
                  <div className="alert alert-info d-flex align-items-center" role="alert">
                    <FaInfoCircle className="me-2" />
                    <div className="small">Payment will be processed directly to the vendor's bank account.</div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Select Vendor</label>
                    <select
                      className="form-select form-select-lg"
                      value={vendorPayment.vendorId}
                      onChange={(e) => handleVendorSelect(e.target.value)}
                      required
                    >
                      <option value="">Choose a vendor...</option>
                      {vendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Amount ($)</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        value={vendorPayment.amount}
                        onChange={(e) => setVendorPayment({ ...vendorPayment, amount: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6 mb-3 mb-md-0">
                      <label className="form-label fw-semibold">Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={vendorPayment.accountNumber}
                        onChange={(e) => setVendorPayment({ ...vendorPayment, accountNumber: e.target.value })}
                        placeholder="Enter account number"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">IFSC Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={vendorPayment.ifsc}
                        onChange={(e) => setVendorPayment({ ...vendorPayment, ifsc: e.target.value })}
                        placeholder="Enter IFSC code"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={vendorPayment.notes}
                      onChange={(e) => setVendorPayment({ ...vendorPayment, notes: e.target.value })}
                      placeholder="Add any notes or reference..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0">
                  <button
                    type="button"
                    className="btn btn-light px-4"
                    onClick={() => setShowPayVendorModal(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white px-4 d-flex align-items-center"
                    style={{ background: "#C62828" }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay Vendor <FaArrowRight className="ms-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Modal */}
      {showBankTransferModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '500px', width: '95%' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-2 me-3" style={{ backgroundColor: "rgba(198, 40, 40, 0.1)" }}>
                    <FaExchangeAlt size={24} style={{ color: "#C62828" }} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-1">Bank Transfer</h5>
                    <p className="text-muted small mb-0">Bank-to-Bank Transfer</p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowBankTransferModal(false)}></button>
              </div>
              <form onSubmit={handleBankTransfer}>
                <div className="modal-body p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <div className="alert alert-info d-flex align-items-center" role="alert">
                    <FaInfoCircle className="me-2" />
                    <div className="small">Transfer funds directly between bank accounts.</div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">From Account</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={bankTransfer.fromAccount}
                      onChange={(e) => setBankTransfer({ ...bankTransfer, fromAccount: e.target.value })}
                      placeholder="Enter your account number"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Recipient Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={bankTransfer.recipientName}
                      onChange={(e) => setBankTransfer({ ...bankTransfer, recipientName: e.target.value })}
                      placeholder="Enter recipient's name"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">To Account</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={bankTransfer.toAccount}
                      onChange={(e) => setBankTransfer({ ...bankTransfer, toAccount: e.target.value })}
                      placeholder="Enter recipient's account number"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Recipient IFSC Code</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      value={bankTransfer.toIFSC}
                      onChange={(e) => setBankTransfer({ ...bankTransfer, toIFSC: e.target.value })}
                      placeholder="Enter IFSC code"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Amount ($)</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        value={bankTransfer.amount}
                        onChange={(e) => setBankTransfer({ ...bankTransfer, amount: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={bankTransfer.notes}
                      onChange={(e) => setBankTransfer({ ...bankTransfer, notes: e.target.value })}
                      placeholder="Add any notes or reference..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0">
                  <button
                    type="button"
                    className="btn btn-light px-4"
                    onClick={() => setShowBankTransferModal(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white px-4 d-flex align-items-center"
                    style={{ background: "#C62828" }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        Transfer Now <FaArrowRight className="ms-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '450px', width: '95%' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-2 me-3" style={{ backgroundColor: "rgba(198, 40, 40, 0.1)" }}>
                    <FaEye size={24} style={{ color: "#C62828" }} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-1">Payment Receipt</h5>
                    <p className="text-muted small mb-0">Transaction details</p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowReceiptModal(false)}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="card bg-light mb-4 border-0">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">Transaction ID</p>
                        <p className="fw-bold mb-0">#{selectedPayment.id}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-muted small mb-1">Date</p>
                        <p className="fw-bold mb-0">{selectedPayment.date}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Status</span>
                    <span className={`badge rounded-pill d-flex align-items-center ${selectedPayment.status === 'Success' ? 'bg-success' :
                      selectedPayment.status === 'Pending' ? 'bg-warning text-dark' :
                        'bg-danger'
                      }`}>
                      {getStatusIcon(selectedPayment.status)}
                      {selectedPayment.status}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Recipient</span>
                    <span className="fw-semibold">{selectedPayment.recipient}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Type</span>
                    <span className="fw-semibold">{selectedPayment.type}</span>
                  </div>

                  {selectedPayment.accountNumber && (
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-muted">Account</span>
                      <span className="fw-semibold">{selectedPayment.accountNumber.substring(0, 4) + 'XXXX' + selectedPayment.accountNumber.substring(selectedPayment.accountNumber.length - 4)}</span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Payment Method</span>
                    <span className="fw-semibold">{selectedPayment.method}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Notes</span>
                    <span className="fw-semibold">{selectedPayment.notes || '-'}</span>
                  </div>
                </div>

                <div className="card border-0" style={{ backgroundColor: "#FFF5F5" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">Amount</span>
                      <span className="fw-bold" style={{ color: "#C62828", fontSize: '1.5rem' }}>{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button type="button" className="btn text-white w-100" style={{ background: "#C62828" }} onClick={() => setShowReceiptModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentEmployer;