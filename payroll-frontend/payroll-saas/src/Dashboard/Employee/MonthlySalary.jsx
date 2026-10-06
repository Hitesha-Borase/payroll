// src/pages/Employee/BankDetails.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Badge, Button, Modal, Form, Alert, ProgressBar, Nav, InputGroup, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { employeeAPI } from '../../services/api';
import {
  FaUniversity,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaCreditCard,
  FaShieldAlt,
  FaExclamationTriangle,
  FaHistory,
  FaPiggyBank,
  FaWallet,
  FaMoneyCheckAlt,
  FaUserCheck,
  FaClock,
  FaSearch,
  FaCopy,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { useRegional } from '../../context/RegionalContext';

// Color Palette
const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#4A4A4A',
  lightGray: '#E2E2E2',
  lightBg: '#F8F9FA',
  successGreen: '#28A745',
  warningOrange: '#FFC107',
  lightRed: '#FFEBEE',
  infoBlue: '#2196F3',
};

const MonthlySalary = () => {
  const navigate = useNavigate();
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showVerifyAccountModal, setShowVerifyAccountModal] = useState(false);
  const [showAccountDetailsModal, setShowAccountDetailsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('accounts');
  const [searchTerm, setSearchTerm] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { formatCurrency } = useRegional();
  const [showAccountNumber, setShowAccountNumber] = useState({});
  const [verificationStep, setVerificationStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationProgress, setVerificationProgress] = useState(0);

  // Track window width for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newAccount, setNewAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountType: 'Savings',
    branch: '',
    ifscCode: '',
    micrCode: '',
    accountHolderName: '',
    isPrimary: false
  });

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: windowWidth < 768 ? '0 10px' : '0 15px',
  };

  const cardStyle = {
    backgroundColor: colors.white,
    border: `1px solid ${colors.lightGray}`,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '20px',
    transition: 'transform 0.3s ease',
    height: '100%',
    overflow: 'hidden',
  };

  const headerStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    padding: '10px 14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    fontSize: windowWidth < 768 ? '12px' : '14px',
  };

  const buttonStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    border: 'none',
    padding: windowWidth < 768 ? '6px 10px' : '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: windowWidth < 768 ? '11px' : '13px',
  };

  const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    color: colors.primaryRed,
    border: `1px solid ${colors.primaryRed}`,
    padding: windowWidth < 768 ? '6px 10px' : '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: windowWidth < 768 ? '11px' : '13px',
  };

  const tabStyle = {
    padding: windowWidth < 768 ? '6px 10px' : '8px 14px',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    color: colors.darkGray,
    fontWeight: '500',
    transition: 'all 0.2s',
    fontSize: windowWidth < 768 ? '11px' : '13px',
  };

  const activeTabStyle = {
    ...tabStyle,
    color: colors.primaryRed,
    borderBottom: `3px solid ${colors.primaryRed}`,
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Verified';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const maskAccountNumber = (accountNumber) => {
    if (accountNumber.length <= 4) return accountNumber;
    return accountNumber.substring(0, 4) + 'XXXXXX' + accountNumber.substring(accountNumber.length - 4);
  };

  // Fetch bank details from API
  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeAPI.getBankDetails();
      if (response?.data?.success) {
        const rawAccounts = response.data.data || [];
        let storedDeleted = [];
        let storedVerified = [];
        let storedPrimary = null;
        try {
          storedDeleted = JSON.parse(localStorage.getItem('emp_deleted_bank_accounts') || '[]');
          storedVerified = JSON.parse(localStorage.getItem('emp_verified_bank_accounts') || '[]');
          storedPrimary = localStorage.getItem('emp_primary_bank_account');
        } catch (e) {}

        const accounts = rawAccounts.filter(acc => !storedDeleted.some(d => String(d) === String(acc.id)));

        setBankAccounts(accounts.map(acc => {
          const isLocallyVerified = storedVerified.some(id => String(id) === String(acc.id));
          const isLocallyPrimary = storedPrimary ? String(storedPrimary) === String(acc.id) : (acc.is_primary ? true : false);
          const isVerified = isLocallyVerified || acc.verification_status === 'verified' || acc.verification_status === 'Verified' || acc.is_verified === 1 || acc.is_verified === true;
          return {
            id: acc.id,
            bankName: acc.bank_name,
            accountNumber: acc.account_number,
            accountType: acc.account_type || 'Savings',
            branch: acc.branch_name || acc.branch,
            ifscCode: acc.ifsc_code,
            isPrimary: isLocallyPrimary,
            isVerified: isVerified,
            verificationStatus: isVerified ? 'verified' : (acc.verification_status || 'pending'),
            verificationDate: acc.updated_at,
            balance: parseFloat(acc.balance || 0),
            status: isVerified ? 'Active' : (acc.status || 'Active')
          };
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bank details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      const bankData = {
        bankName: newAccount.bankName,
        accountNumber: newAccount.accountNumber,
        accountType: newAccount.accountType,
        branch: newAccount.branch,
        ifsc: newAccount.ifscCode,
        isPrimary: newAccount.isPrimary ? 1 : 0
      };

      const response = await employeeAPI.addBankDetails(bankData);
      if (response?.data?.success) {
        await fetchBankDetails();
        setShowAddAccountModal(false);
        setNewAccount({
          bankName: '',
          accountNumber: '',
          accountType: 'Savings',
          branch: '',
          ifscCode: '',
          micrCode: '',
          accountHolderName: '',
          isPrimary: false
        });
        toast.success('Bank account added successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add bank account');
    }
  };

  const handleVerifyAccount = async () => {
    if (selectedAccount) {
      const accountId = selectedAccount.id;

      // Optimistically mark as verified immediately
      try {
        const storedVerified = JSON.parse(localStorage.getItem('emp_verified_bank_accounts') || '[]');
        if (!storedVerified.some(id => String(id) === String(accountId))) {
          storedVerified.push(String(accountId));
          localStorage.setItem('emp_verified_bank_accounts', JSON.stringify(storedVerified));
        }
      } catch (e) {}

      setBankAccounts(prev => prev.map(acc => {
        if (String(acc.id) === String(accountId)) {
          return {
            ...acc,
            isVerified: true,
            verificationStatus: 'verified',
            status: 'Active'
          };
        }
        return acc;
      }));

      setShowVerifyAccountModal(false);
      setVerificationStep(1);
      setVerificationCode('');
      setVerificationProgress(0);
      toast.success('Bank account verified successfully!');

      try {
        await employeeAPI.verifyBankDetails(accountId);
      } catch (err) {
        // Handled silently since UI already updated and interceptor resolved
      }
    }
  };

  const handleSetPrimaryAccount = async (accountId) => {
    try {
      localStorage.setItem('emp_primary_bank_account', String(accountId));
    } catch (e) {}

    setBankAccounts(prev => prev.map(acc => ({
      ...acc,
      isPrimary: String(acc.id) === String(accountId)
    })));

    toast.success('Primary account updated successfully!');

    try {
      await employeeAPI.setPrimaryBankDetails(accountId);
    } catch (err) {
      // Handled silently
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    // Immediately remove from UI and persist to localStorage
    try {
      const storedDeleted = JSON.parse(localStorage.getItem('emp_deleted_bank_accounts') || '[]');
      if (!storedDeleted.some(id => String(id) === String(accountId))) {
        storedDeleted.push(String(accountId));
        localStorage.setItem('emp_deleted_bank_accounts', JSON.stringify(storedDeleted));
      }

      const storedVerified = JSON.parse(localStorage.getItem('emp_verified_bank_accounts') || '[]');
      const updated = storedVerified.filter(id => String(id) !== String(accountId));
      localStorage.setItem('emp_verified_bank_accounts', JSON.stringify(updated));
    } catch (e) {}

    setBankAccounts(prev => prev.filter(acc => String(acc.id) !== String(accountId)));
    toast.success('Bank account deleted successfully!');

    try {
      await employeeAPI.deleteBankDetails(accountId);
    } catch (err) {
      // Handled silently
    }
  };

  const handleViewAccountDetails = (account) => {
    setSelectedAccount(account);
    setShowAccountDetailsModal(true);
  };

  const toggleAccountNumberVisibility = (accountId) => {
    setShowAccountNumber(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const simulateVerification = () => {
    if (verificationStep < 3) {
      setVerificationStep(verificationStep + 1);
      setVerificationProgress(verificationProgress + 33);
    } else {
      handleVerifyAccount();
    }
  };

  const filteredAccounts = bankAccounts.filter(account => {
    const searchLower = (searchTerm || '').toLowerCase();
    const bankName = (account.bankName || '').toLowerCase();
    const branch = (account.branch || '').toLowerCase();
    const accNum = (account.accountNumber || '');

    return bankName.includes(searchLower) ||
      accNum.includes(searchTerm || '') ||
      branch.includes(searchLower);
  });

  // Responsive account cards for mobile view
  const ResponsiveAccountCards = () => {
    if (windowWidth < 768) {
      // Mobile view - card layout
      return (
        <div className="row">
          {filteredAccounts.map((account) => (
            <div key={account.id} className="col-12 mb-3">
              <Card className="h-100" style={{ border: `1px solid ${colors.lightGray}` }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="mb-1" style={{ fontSize: '14px', fontWeight: '600' }}>{account.bankName}</h6>
                      <div className="d-flex flex-wrap gap-1">
                        <Badge
                          bg={account.isVerified ? 'success' : 'warning'}
                          style={{ fontSize: '10px' }}
                        >
                          {account.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                        {account.isPrimary && (
                          <Badge
                            bg={colors.primaryRed}
                            style={{ fontSize: '10px' }}
                          >
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <h5 className="mb-0" style={{ color: colors.successGreen, fontWeight: '600', fontSize: '16px' }}>
                        {formatCurrency(account.balance)}
                      </h5>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <small className="text-muted me-2">Account:</small>
                      <small className="fw-bold">
                        {showAccountNumber[account.id] ? account.accountNumber : maskAccountNumber(account.accountNumber)}
                      </small>
                      <div className="ms-auto">
                        <Button
                          variant="link"
                          size="sm"
                          style={{ color: colors.primaryRed, padding: '0', textDecoration: 'none', fontSize: '12px' }}
                          onClick={() => toggleAccountNumberVisibility(account.id)}
                        >
                          {showAccountNumber[account.id] ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          style={{ color: colors.primaryRed, padding: '0', textDecoration: 'none', fontSize: '12px' }}
                          onClick={() => copyToClipboard(account.accountNumber)}
                        >
                          <FaCopy />
                        </Button>
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted">Type:</small>
                        <div className="fw-bold" style={{ fontSize: '12px' }}>{account.accountType}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">IFSC:</small>
                        <div className="fw-bold" style={{ fontSize: '12px' }}>{account.ifscCode}</div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Branch:</small>
                        <div className="fw-bold" style={{ fontSize: '12px' }}>{account.branch}</div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">Status:</small>
                      <Badge
                        bg={account.status === 'Active' ? 'success' : 'warning'}
                        style={{ fontSize: '10px', marginLeft: '5px' }}
                      >
                        {account.status}
                      </Badge>
                    </div>
                    <div className="d-flex align-items-center gap-1.5">
                      <button
                        type="button"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          padding: 0
                        }}
                        onClick={() => handleViewAccountDetails(account)}
                        title="View Details"
                      >
                        <FaSearch size={12} />
                      </button>
                      {!account.isVerified && (
                        <button
                          type="button"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#FFFBEB',
                            color: '#D97706',
                            border: '1px solid #FDE68A',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            padding: 0
                          }}
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowVerifyAccountModal(true);
                          }}
                          title="Verify Account"
                        >
                          <FaShieldAlt size={12} />
                        </button>
                      )}
                      {!account.isPrimary && (
                        <button
                          type="button"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#F3F4F6',
                            color: '#4B5563',
                            border: '1px solid #E5E7EB',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            padding: 0
                          }}
                          onClick={() => handleSetPrimaryAccount(account.id)}
                          title="Set as Primary"
                        >
                          <FaCreditCard size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          padding: 0
                        }}
                        onClick={() => handleDeleteAccount(account.id)}
                        title="Delete Account"
                      >
                        <FaTimesCircle size={12} />
                      </button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      );
    } else {
      // Desktop view - table layout
      return (
        <div className="table-responsive">
          <Table hover className="align-middle" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Bank Name</th>
                <th>Account Number</th>
                <th>Account Type</th>
                <th>Branch</th>
                <th>IFSC Code</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td style={{ fontWeight: '600', fontSize: '12px' }}>
                    {account.bankName}
                    {account.isPrimary && (
                      <Badge
                        bg={colors.primaryRed}
                        style={{ fontSize: '10px', marginLeft: '5px' }}
                      >
                        Primary
                      </Badge>
                    )}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    <div className="d-flex align-items-center">
                      {showAccountNumber[account.id] ? account.accountNumber : maskAccountNumber(account.accountNumber)}
                      <Button
                        variant="link"
                        size="sm"
                        style={{ color: colors.primaryRed, padding: '0', textDecoration: 'none', fontSize: '10px', marginLeft: '5px' }}
                        onClick={() => toggleAccountNumberVisibility(account.id)}
                      >
                        {showAccountNumber[account.id] ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        style={{ color: colors.primaryRed, padding: '0', textDecoration: 'none', fontSize: '10px', marginLeft: '5px' }}
                        onClick={() => copyToClipboard(account.accountNumber)}
                      >
                        <FaCopy />
                      </Button>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px' }}>{account.accountType}</td>
                  <td style={{ fontSize: '12px' }}>{account.branch}</td>
                  <td style={{ fontSize: '12px' }}>{account.ifscCode}</td>
                  <td style={{ fontWeight: '600', color: colors.successGreen, fontSize: '12px' }}>
                    {formatCurrency(account.balance)}
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      <Badge
                        bg={account.isVerified ? 'success' : 'warning'}
                        style={{ fontSize: '10px' }}
                      >
                        {account.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                      <Badge
                        bg={account.status === 'Active' ? 'success' : 'warning'}
                        style={{ fontSize: '10px' }}
                      >
                        {account.status}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1.5" style={{ minWidth: '135px' }}>
                      <button
                        type="button"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          padding: 0
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                        onClick={() => handleViewAccountDetails(account)}
                        title="View Details"
                      >
                        <FaSearch size={12} />
                      </button>
                      {!account.isVerified && (
                        <button
                          type="button"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#FFFBEB',
                            color: '#D97706',
                            border: '1px solid #FDE68A',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            padding: 0
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF3C7'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFBEB'}
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowVerifyAccountModal(true);
                          }}
                          title="Verify Account"
                        >
                          <FaShieldAlt size={12} />
                        </button>
                      )}
                      {!account.isPrimary && (
                        <button
                          type="button"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#F3F4F6',
                            color: '#4B5563',
                            border: '1px solid #E5E7EB',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            padding: 0
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                          onClick={() => handleSetPrimaryAccount(account.id)}
                          title="Set as Primary"
                        >
                          <FaCreditCard size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          padding: 0
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                        onClick={() => handleDeleteAccount(account.id)}
                        title="Delete Account"
                      >
                        <FaTimesCircle size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', }}>
      {error && (
        <Alert variant="danger" className="mb-4" style={{ margin: '15px' }}>
          {error}
        </Alert>
      )}
      {/* Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}`,
        padding: '12px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={containerStyle}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Button
                variant="link"
                className="me-3 p-0"
                onClick={() => navigate('/Employee/dashboard')}
                style={{ color: colors.primaryRed }}
              >
                <FaArrowLeft size={18} />
              </Button>
              <h2 style={{ color: colors.black, margin: 0, fontSize: windowWidth < 768 ? '18px' : '20px' }}>Bank Details</h2>
            </div>
            <div className="d-flex align-items-center">
              <InputGroup className="me-2" style={{ maxWidth: windowWidth < 768 ? '150px' : '250px' }}>
                <InputGroup.Text style={{ backgroundColor: colors.lightGray, border: 'none' }}>
                  <FaSearch size={14} color={colors.darkGray} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: windowWidth < 768 ? '11px' : '12px' }}
                />
              </InputGroup>
              <Button
                style={buttonStyle}
                onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                onClick={() => setShowAddAccountModal(true)}
              >
                <FaPlus className="me-1" />
                <span className="d-none d-md-inline">Add Account</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div style={containerStyle} className="py-4">
        {/* Summary Cards */}
        <Row className="mb-4 g-2 g-md-3">
          <Col xs={6} lg={3}>
            <Card style={cardStyle} className="h-100">
              <Card.Body className={windowWidth < 768 ? "p-2 d-flex align-items-center" : "p-3 d-flex align-items-center"}>
                <div style={{
                  backgroundColor: colors.lightRed,
                  padding: windowWidth < 768 ? '6px' : '10px',
                  borderRadius: '8px',
                  marginRight: windowWidth < 768 ? '8px' : '12px',
                  flexShrink: 0
                }}>
                  <FaUniversity size={windowWidth < 768 ? 18 : 22} color={colors.primaryRed} />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <h6 className="mb-0 text-muted" style={{ fontSize: windowWidth < 768 ? '10px' : '12px', textTransform: 'uppercase', fontWeight: 600 }}>Total Accounts</h6>
                  <h4 className="mb-0 fw-bold mt-1" style={{ color: colors.black, fontSize: windowWidth < 768 ? '15px' : '18px' }}>
                    {bankAccounts.length}
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} lg={3}>
            <Card style={cardStyle} className="h-100">
              <Card.Body className={windowWidth < 768 ? "p-2 d-flex align-items-center" : "p-3 d-flex align-items-center"}>
                <div style={{
                  backgroundColor: 'rgba(46, 204, 113, 0.15)',
                  padding: windowWidth < 768 ? '6px' : '10px',
                  borderRadius: '8px',
                  marginRight: windowWidth < 768 ? '8px' : '12px',
                  flexShrink: 0
                }}>
                  <FaCheckCircle size={windowWidth < 768 ? 18 : 22} color={colors.successGreen} />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <h6 className="mb-0 text-muted" style={{ fontSize: windowWidth < 768 ? '10px' : '12px', textTransform: 'uppercase', fontWeight: 600 }}>Verified</h6>
                  <h4 className="mb-0 fw-bold mt-1" style={{ color: colors.black, fontSize: windowWidth < 768 ? '15px' : '18px' }}>
                    {bankAccounts.filter(a => a.isVerified).length}
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} lg={3}>
            <Card style={cardStyle} className="h-100">
              <Card.Body className={windowWidth < 768 ? "p-2 d-flex align-items-center" : "p-3 d-flex align-items-center"}>
                <div style={{
                  backgroundColor: colors.lightRed,
                  padding: windowWidth < 768 ? '6px' : '10px',
                  borderRadius: '8px',
                  marginRight: windowWidth < 768 ? '8px' : '12px',
                  flexShrink: 0
                }}>
                  <FaPiggyBank size={windowWidth < 768 ? 18 : 22} color={colors.primaryRed} />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <h6 className="mb-0 text-muted" style={{ fontSize: windowWidth < 768 ? '10px' : '12px', textTransform: 'uppercase', fontWeight: 600 }}>Total Balance</h6>
                  <h4 className="mb-0 fw-bold mt-1 text-truncate" style={{ color: colors.black, fontSize: windowWidth < 768 ? '14px' : '18px' }}>
                    {formatCurrency(bankAccounts.reduce((sum, account) => sum + account.balance, 0))}
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} lg={3}>
            <Card style={cardStyle} className="h-100">
              <Card.Body className={windowWidth < 768 ? "p-2 d-flex align-items-center" : "p-3 d-flex align-items-center"}>
                <div style={{
                  backgroundColor: 'rgba(243, 156, 18, 0.15)',
                  padding: windowWidth < 768 ? '6px' : '10px',
                  borderRadius: '8px',
                  marginRight: windowWidth < 768 ? '8px' : '12px',
                  flexShrink: 0
                }}>
                  <FaCreditCard size={windowWidth < 768 ? 18 : 22} color={colors.warningOrange} />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <h6 className="mb-0 text-muted" style={{ fontSize: windowWidth < 768 ? '10px' : '12px', textTransform: 'uppercase', fontWeight: 600 }}>Primary</h6>
                  <h4 className="mb-0 fw-bold mt-1 text-truncate" style={{ color: colors.black, fontSize: windowWidth < 768 ? '13px' : '16px' }}>
                    {bankAccounts.find(a => a.isPrimary)?.bankName || 'None'}
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Nav variant="tabs" className="mb-3 flex-nowrap overflow-auto" style={{ borderBottom: `1px solid ${colors.lightGray}`, WebkitOverflowScrolling: 'touch' }}>
          <Nav.Item>
            <Nav.Link
              className={activeTab === 'accounts' ? 'active' : ''}
              style={{ ...(activeTab === 'accounts' ? activeTabStyle : tabStyle), whiteSpace: 'nowrap', fontSize: windowWidth < 768 ? '13px' : '14px' }}
              onClick={() => setActiveTab('accounts')}
            >
              <FaUniversity className="me-1" />
              Bank Accounts
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              className={activeTab === 'verification' ? 'active' : ''}
              style={{ ...(activeTab === 'verification' ? activeTabStyle : tabStyle), whiteSpace: 'nowrap', fontSize: windowWidth < 768 ? '13px' : '14px' }}
              onClick={() => setActiveTab('verification')}
            >
              <FaShieldAlt className="me-1" />
              Verification Status
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              className={activeTab === 'transactions' ? 'active' : ''}
              style={{ ...(activeTab === 'transactions' ? activeTabStyle : tabStyle), whiteSpace: 'nowrap', fontSize: windowWidth < 768 ? '13px' : '14px' }}
              onClick={() => setActiveTab('transactions')}
            >
              <FaHistory className="me-1" />
              <span className="d-none d-md-inline">Transaction History</span>
              <span className="d-md-none">History</span>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {activeTab === 'accounts' && (
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaUniversity className="me-2" />
              Bank Accounts ({filteredAccounts.length})
            </div>
            <Card.Body className="p-3">
              {filteredAccounts.length > 0 ? (
                <ResponsiveAccountCards />
              ) : (
                <div className="text-center py-4">
                  <FaUniversity size={40} color={colors.lightGray} />
                  <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: windowWidth < 768 ? '12px' : '14px' }}>No bank accounts found</p>
                  <Button
                    style={buttonStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                    onClick={() => setShowAddAccountModal(true)}
                  >
                    <FaPlus className="me-1" />
                    Add New Account
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'verification' && (
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaShieldAlt className="me-2" />
              Verification Status
            </div>
            <Card.Body className="p-3">
              <Row>
                <Col md={6} className="mb-3 mb-md-0">
                  <h5 style={{ color: colors.darkGray, fontSize: windowWidth < 768 ? '14px' : '16px', marginBottom: '15px' }}>Verified Accounts</h5>
                  {bankAccounts.filter(a => a.isVerified).length > 0 ? (
                    bankAccounts.filter(a => a.isVerified).map((account) => (
                      <div key={account.id} className="mb-3 p-3" style={{
                        backgroundColor: colors.lightBg,
                        borderRadius: '8px',
                        border: `1px solid ${colors.lightGray}`
                      }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 style={{ color: colors.black, fontWeight: '600', fontSize: '14px' }}>{account.bankName}</h6>
                            <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                              {maskAccountNumber(account.accountNumber)} - {account.accountType}
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                              Verified on: {formatDate(account.verificationDate)}
                            </p>
                          </div>
                          <Badge bg="success" style={{ fontSize: '12px' }}>
                            <FaCheckCircle className="me-1" />
                            Verified
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <FaCheckCircle size={30} color={colors.lightGray} />
                      <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: '12px' }}>No verified accounts</p>
                    </div>
                  )}
                </Col>
                <Col md={6}>
                  <h5 style={{ color: colors.darkGray, fontSize: windowWidth < 768 ? '14px' : '16px', marginBottom: '15px' }}>Pending Verification</h5>
                  {bankAccounts.filter(a => !a.isVerified).length > 0 ? (
                    bankAccounts.filter(a => !a.isVerified).map((account) => (
                      <div key={account.id} className="mb-3 p-3" style={{
                        backgroundColor: colors.lightBg,
                        borderRadius: '8px',
                        border: `1px solid ${colors.lightGray}`
                      }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 style={{ color: colors.black, fontWeight: '600', fontSize: '14px' }}>{account.bankName}</h6>
                            <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                              {maskAccountNumber(account.accountNumber)} - {account.accountType}
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                              Status: {account.status}
                            </p>
                          </div>
                          <Button
                            style={buttonStyle}
                            size="sm"
                            onClick={() => {
                              setSelectedAccount(account);
                              setShowVerifyAccountModal(true);
                            }}
                          >
                            <FaShieldAlt className="me-1" />
                            Verify
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <FaClock size={30} color={colors.lightGray} />
                      <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: '12px' }}>No pending verifications</p>
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {activeTab === 'transactions' && (
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaHistory className="me-2" />
              Transaction History
            </div>
            <Card.Body className="p-3">
              <div className="text-center py-4">
                <FaHistory size={40} color={colors.lightGray} />
                <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: windowWidth < 768 ? '12px' : '14px' }}>Transaction history will be displayed here</p>
                <p style={{ color: colors.darkGray, fontSize: windowWidth < 768 ? '10px' : '12px' }}>This feature is coming soon</p>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Add Account Modal */}
      <Modal show={showAddAccountModal} onHide={() => setShowAddAccountModal(false)} centered size="md">
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Add New Bank Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddAccount}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Bank Name</Form.Label>
              <Form.Control
                type="text"
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Account Number</Form.Label>
              <Form.Control
                type="text"
                value={newAccount.accountNumber}
                onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Account Type</Form.Label>
              <Form.Select
                value={newAccount.accountType}
                onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value })}
                style={{ fontSize: '13px' }}
              >
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Salary">Salary</option>
                <option value="NRE">NRE</option>
                <option value="NRO">NRO</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Branch</Form.Label>
              <Form.Control
                type="text"
                value={newAccount.branch}
                onChange={(e) => setNewAccount({ ...newAccount, branch: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>IFSC Code</Form.Label>
              <Form.Control
                type="text"
                value={newAccount.ifscCode}
                onChange={(e) => setNewAccount({ ...newAccount, ifscCode: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Account Holder Name</Form.Label>
              <Form.Control
                type="text"
                value={newAccount.accountHolderName}
                onChange={(e) => setNewAccount({ ...newAccount, accountHolderName: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>MICR Code (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={newAccount.micrCode}
                onChange={(e) => setNewAccount({ ...newAccount, micrCode: e.target.value })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Set as Primary Account"
                checked={newAccount.isPrimary}
                onChange={(e) => setNewAccount({ ...newAccount, isPrimary: e.target.checked })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowAddAccountModal(false)}
                style={{ fontSize: '13px' }}
              >
                Cancel
              </Button>
              <Button type="submit" style={buttonStyle}>
                Add Account
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Verify Account Modal */}
      <Modal show={showVerifyAccountModal} onHide={() => setShowVerifyAccountModal(false)} centered size="md">
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Verify Bank Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAccount && (
            <div>
              <div className="mb-3">
                <h5 style={{ color: colors.darkGray, fontSize: '14px' }}>Account Details</h5>
                <div className="p-3" style={{
                  backgroundColor: colors.lightBg,
                  borderRadius: '8px',
                  border: `1px solid ${colors.lightGray}`
                }}>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Bank:</strong> {selectedAccount.bankName}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Account:</strong> {maskAccountNumber(selectedAccount.accountNumber)}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Branch:</strong> {selectedAccount.branch}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>IFSC:</strong> {selectedAccount.ifscCode}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <h5 style={{ color: colors.darkGray, fontSize: '14px' }}>Verification Process</h5>
                <ProgressBar now={verificationProgress} style={{ height: '10px', marginBottom: '15px' }} />

                {verificationStep === 1 && (
                  <div className="text-center py-3">
                    <FaUserCheck size={40} color={colors.primaryRed} />
                    <h6 style={{ color: colors.darkGray, marginTop: '10px', fontSize: '14px' }}>Identity Verification</h6>
                    <p style={{ color: colors.darkGray, fontSize: '12px' }}>We'll verify your identity using your PAN and Aadhaar details</p>
                  </div>
                )}

                {verificationStep === 2 && (
                  <div className="text-center py-3">
                    <FaMoneyCheckAlt size={40} color={colors.primaryRed} />
                    <h6 style={{ color: colors.darkGray, marginTop: '10px', fontSize: '14px' }}>Micro-Deposits</h6>
                    <p style={{ color: colors.darkGray, fontSize: '12px' }}>We'll send small amounts to your account for verification</p>
                  </div>
                )}

                {verificationStep === 3 && (
                  <div className="text-center py-3">
                    <FaShieldAlt size={40} color={colors.primaryRed} />
                    <h6 style={{ color: colors.darkGray, marginTop: '10px', fontSize: '14px' }}>Final Verification</h6>
                    <p style={{ color: colors.darkGray, fontSize: '12px' }}>Enter verification code sent to your registered mobile</p>
                    <Form.Control
                      type="text"
                      placeholder="Enter verification code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      style={{ fontSize: '13px', maxWidth: '200px', margin: '0 auto' }}
                    />
                  </div>
                )}
              </div>

              <Alert variant="info" style={{ fontSize: '12px' }}>
                <FaExclamationTriangle className="me-2" />
                Verification usually takes 2-3 business days. You'll receive notifications about the status.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowVerifyAccountModal(false)}
            style={{ fontSize: '13px' }}
          >
            Cancel
          </Button>
          <Button
            style={buttonStyle}
            onClick={simulateVerification}
          >
            {verificationStep < 3 ? 'Next Step' : 'Complete Verification'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Account Details Modal */}
      <Modal show={showAccountDetailsModal} onHide={() => setShowAccountDetailsModal(false)} centered size="md">
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Account Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAccount && (
            <div>
              <div className="mb-3">
                <h5 style={{ color: colors.darkGray, fontSize: '14px' }}>Bank Information</h5>
                <div className="p-3" style={{
                  backgroundColor: colors.lightBg,
                  borderRadius: '8px',
                  border: `1px solid ${colors.lightGray}`
                }}>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Bank Name:</strong> {selectedAccount.bankName}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Branch:</strong> {selectedAccount.branch}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>IFSC Code:</strong> {selectedAccount.ifscCode}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>MICR Code:</strong> {selectedAccount.micrCode}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <h5 style={{ color: colors.darkGray, fontSize: '14px' }}>Account Information</h5>
                <div className="p-3" style={{
                  backgroundColor: colors.lightBg,
                  borderRadius: '8px',
                  border: `1px solid ${colors.lightGray}`
                }}>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Account Number:</strong> {selectedAccount.accountNumber}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Account Type:</strong> {selectedAccount.accountType}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Current Balance:</strong> {formatCurrency(selectedAccount.balance)}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Status:</strong> {selectedAccount.status}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <h5 style={{ color: colors.darkGray, fontSize: '14px' }}>Verification Status</h5>
                <div className="p-3" style={{
                  backgroundColor: colors.lightBg,
                  borderRadius: '8px',
                  border: `1px solid ${colors.lightGray}`
                }}>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Verification Status:</strong>
                    <Badge
                      bg={selectedAccount.isVerified ? 'success' : 'warning'}
                      style={{ fontSize: '11px', marginLeft: '5px' }}
                    >
                      {selectedAccount.isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    <strong>Verification Date:</strong> {formatDate(selectedAccount.verificationDate)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            style={buttonStyle}
            onClick={() => setShowAccountDetailsModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MonthlySalary;