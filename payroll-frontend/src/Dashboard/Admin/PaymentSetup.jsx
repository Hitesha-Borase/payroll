import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { adminAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
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
};

// Predefined logos for payment gateways
const getGatewayLogo = (gatewayName) => {
  switch (gatewayName) {
    case "Razorpay":
      return "https://cdn.iconscout.com/icon/free/png-256/free-razorpay-3629155-3030152.png";
    case "Stripe":
      return "https://cdn.iconscout.com/icon/free/png-256/free-stripe-3629147-3030144.png";
    case "PayPal":
      return "https://cdn.iconscout.com/icon/free/png-256/free-paypal-3629149-3030146.png";
    case "PayU":
      return "https://cdn.iconscout.com/icon/free/png-256/free-payu-3629151-3030148.png";
    case "CCAvenue":
      return "https://cdn.iconscout.com/icon/free/png-256/free-ccavenue-3629153-3030150.png";
    default:
      return "https://cdn.iconscout.com/icon/free/png-256/free-payment-gateway-3629156-3030153.png";
  }
};

const PaymentSetup = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState("gateway"); // "gateway" or "bank"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGateway, setCurrentGateway] = useState({});
  const [currentBank, setCurrentBank] = useState({});
  const [editMode, setEditMode] = useState(false);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [paymentGateways, setPaymentGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch payment gateways (Note: This API endpoint may need to be created)
  // Fetch payment gateways
  const fetchGateways = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getPaymentGateways();
      if (response?.data?.success && Array.isArray(response.data.data)) {
        setPaymentGateways(response.data.data.map(g => {
          let methods = [];
          if (Array.isArray(g.supported_methods)) {
            methods = g.supported_methods;
          } else if (typeof g.supported_methods === 'string') {
            try {
              const parsed = JSON.parse(g.supported_methods);
              methods = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
            } catch (e) {
              methods = g.supported_methods.split(',').map(m => m.trim()).filter(Boolean);
            }
          } else if (Array.isArray(g.supportedMethods)) {
            methods = g.supportedMethods;
          }
          return {
            ...g,
            supportedMethods: Array.isArray(methods) ? methods : [],
            apiKey: g.api_key || g.apiKey || '',
            webhookUrl: g.webhook_url || g.webhookUrl || '',
            transactionFee: g.transaction_fee || g.transactionFee || ''
          };
        }));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch payment gateways');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await adminAPI.getBankAccounts();
      if (response?.data?.success && Array.isArray(response.data.data)) {
        setBankAccounts(response.data.data.map(b => ({
          ...b,
          bankName: b.bank_name || b.bankName || '',
          accountHolder: b.account_holder || b.accountHolder || '',
          accountNumber: b.account_number || b.accountNumber || '',
          ifscCode: b.ifsc_code || b.ifscCode || '',
          transactionLimit: b.transaction_limit || b.transactionLimit || 'N/A',
          processingTime: b.processing_time || b.processingTime || 'N/A'
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [bankAccounts, setBankAccounts] = useState([]);

  // Handlers for payment gateways
  const openAddGatewayModal = () => {
    setCurrentGateway({ status: "Active", logo: getGatewayLogo("") });
    setEditMode(false);
    setIsModalOpen(true);
  };

  const openEditGatewayModal = (gateway) => {
    setCurrentGateway(gateway);
    setEditMode(true);
    setIsModalOpen(true);
  };

  const openAddBankModal = () => {
    setCurrentBank({ status: "Pending Verification" });
    setEditMode(false);
    setIsModalOpen(true);
  };

  const openEditBankModal = (bank) => {
    setCurrentBank(bank);
    setEditMode(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentGateway({});
    setCurrentBank({});
    setEditMode(false);
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await adminAPI.updatePaymentGateway(currentGateway.id, currentGateway);
        toast.success('Gateway updated successfully');
      } else {
        const newGateway = {
          ...currentGateway,
          logo: currentGateway.logo || getGatewayLogo(currentGateway.name)
        };
        await adminAPI.createPaymentGateway(newGateway);
        toast.success('Gateway added successfully');
      }
      closeModal();
      fetchGateways();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save gateway');
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await adminAPI.updateBankAccount(currentBank.id, currentBank);
        toast.success('Bank account updated successfully');
      } else {
        await adminAPI.createBankAccount(currentBank);
        toast.success('Bank account added successfully');
      }
      closeModal();
      fetchBankAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bank account');
    }
  };

  const handleDeleteGateway = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment gateway?")) {
      try {
        await adminAPI.deletePaymentGateway(id);
        toast.success('Gateway deleted successfully');
        fetchGateways();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete gateway');
      }
    }
  };

  const handleDeleteBank = async (id) => {
    if (window.confirm("Are you sure you want to delete this bank account?")) {
      try {
        await adminAPI.deleteBankAccount(id);
        toast.success('Bank account deleted successfully');
        fetchBankAccounts();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete bank account');
      }
    }
  };

  const handleGatewayInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setCurrentGateway({
        ...currentGateway,
        [name]: value,
        logo: getGatewayLogo(value)
      });
    } else {
      setCurrentGateway({ ...currentGateway, [name]: value });
    }
  };

  const handleGatewayImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload this to a server
      // For now, we'll use a FileReader to create a local URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentGateway({ ...currentGateway, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBankInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBank({ ...currentBank, [name]: value });
  };

  const toggleGatewayStatus = async (gatewayOrId) => {
    try {
      const gateway = typeof gatewayOrId === 'object' && gatewayOrId !== null
        ? gatewayOrId
        : paymentGateways.find(g => g.id === gatewayOrId);
      if (!gateway) return;
      const newStatus = gateway.status === "Active" ? "Inactive" : "Active";
      await adminAPI.updatePaymentGateway(gateway.id, { ...gateway, status: newStatus });
      fetchGateways();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const toggleBankStatus = async (bankOrId) => {
    try {
      const bank = typeof bankOrId === 'object' && bankOrId !== null
        ? bankOrId
        : bankAccounts.find(b => b.id === bankOrId);
      if (!bank) return;
      const newStatus = bank.status === "Verified" ? "Inactive" : "Verified";
      await adminAPI.updateBankAccount(bank.id, { ...bank, status: newStatus });
      fetchBankAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" style={{ color: colors.primaryRed }} />
      </div>
    );
  }

  return (
    <div className="container-fluid py-2 py-md-4" style={{ minHeight: "100vh" }}>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-column flex-md-row">
        <div className="d-flex align-items-center mb-3 mb-md-0">
          <div style={{
            height: isMobile ? '30px' : '40px',
            width: isMobile ? '4px' : '5px',
            backgroundColor: colors.primaryRed,
            marginRight: '15px',
            borderRadius: '2px'
          }}></div>
          <div className="d-flex align-items-center">
            <i className="bi bi-credit-card-fill me-3" style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              color: colors.primaryRed
            }}></i>
            <h2 className="fw-bold mb-0" style={{ color: colors.blackText, fontSize: isMobile ? '1.5rem' : '2rem' }}>Payment Setup</h2>
          </div>
        </div>
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
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "gateway" ? "active" : ""}`}
                style={{
                  color: activeTab === "gateway" ? colors.primaryRed : colors.darkGrayText,
                  fontWeight: activeTab === "gateway" ? "bold" : "normal",
                  borderBottom: activeTab === "gateway" ? `3px solid ${colors.primaryRed}` : "none",
                  borderRadius: "0",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
                onClick={() => setActiveTab("gateway")}
              >
                <i className="bi bi-credit-card me-2"></i>
                Payment Gateway Settings
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "bank" ? "active" : ""}`}
                style={{
                  color: activeTab === "bank" ? colors.primaryRed : colors.darkGrayText,
                  fontWeight: activeTab === "bank" ? "bold" : "normal",
                  borderBottom: activeTab === "bank" ? `3px solid ${colors.primaryRed}` : "none",
                  borderRadius: "0",
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
                onClick={() => setActiveTab("bank")}
              >
                <i className="bi bi-bank me-2"></i>
                Bank-to-Bank Direct Deposit Setup
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "gateway" ? (
        // Payment Gateway Settings
        <div className="card shadow-sm" style={{ border: `1px solid ${colors.lightGrayBorder}` }}>
          <div className="card-header py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.pureWhite, borderBottom: `1px solid ${colors.lightGrayBorder}` }}>
            <h5 className="mb-0 fw-bold" style={{ color: colors.blackText, fontSize: isMobile ? '1.125rem' : '1.25rem' }}>
              <i className="bi bi-credit-card me-2"></i>
              Payment Gateways
            </h5>
            <button
              className="btn btn-sm px-3 py-2 text-white"
              style={{ backgroundColor: colors.primaryRed, fontSize: isMobile ? '0.875rem' : '1rem' }}
              onClick={openAddGatewayModal}
            >
              <i className="bi bi-plus-circle me-2"></i>Add Gateway
            </button>
          </div>
          <div className="card-body p-0">
            {isMobile ? (
              // Mobile Card View
              <div className="p-3">
                {(paymentGateways || []).map((gateway) => (
                  <div key={gateway.id} className="card mb-3 border" style={{ borderRadius: "10px" }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center">
                          <img
                            src={gateway.logo}
                            alt={gateway.name}
                            style={{
                              width: "40px",
                              height: "40px",
                              marginRight: "10px",
                              objectFit: "contain",
                              backgroundColor: colors.pureWhite,
                              padding: "5px",
                              borderRadius: "4px",
                              border: `1px solid ${colors.lightGrayBorder}`
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getGatewayLogo("");
                            }}
                          />
                          <h6 className="fw-bold mb-0" style={{ color: colors.blackText, fontSize: '0.9rem' }}>{gateway.name}</h6>
                        </div>
                        <span className={`badge px-2 py-1 ${gateway.status === "Active" ? "bg-success" : "bg-secondary"}`} style={{ fontSize: '0.75rem' }}>
                          {gateway.status}
                        </span>
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>API Key</small>
                          <span style={{ fontSize: '0.8rem' }}>{gateway.apiKey ? `${gateway.apiKey.substring(0, 10)}...` : 'N/A'}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Transaction Fee</small>
                          <span style={{ fontSize: '0.8rem' }}>{gateway.transactionFee || 'N/A'}</span>
                        </div>
                        <div className="col-12">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Supported Methods</small>
                          <div style={{ fontSize: '0.8rem' }}>
                            {Array.isArray(gateway.supportedMethods) && gateway.supportedMethods.length > 0 ? (
                              gateway.supportedMethods.map((method, index) => (
                                <span key={index} className="badge bg-light text-dark me-1 mb-1" style={{ fontSize: '0.7rem' }}>
                                  {method}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>None</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 d-flex justify-content-between">
                        <button
                          className="btn btn-sm me-2"
                          style={{
                            color: colors.pureWhite,
                            backgroundColor: gateway.status === "Active" ? colors.darkGrayText : colors.primaryRed,
                            border: "none",
                            borderRadius: "4px",
                            padding: "0.25rem 0.5rem",
                            fontSize: '0.8rem'
                          }}
                          onClick={() => toggleGatewayStatus(gateway.id)}
                        >
                          {gateway.status === "Active" ? "Disable" : "Enable"}
                        </button>
                        <div>
                          <button
                            className="btn btn-sm me-1"
                            style={{
                              color: colors.pureWhite,
                              backgroundColor: colors.primaryRed,
                              border: "none",
                              borderRadius: "4px",
                              padding: "0.25rem 0.5rem",
                              fontSize: '0.8rem'
                            }}
                            onClick={() => openEditGatewayModal(gateway)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{
                              color: colors.pureWhite,
                              backgroundColor: colors.primaryRed,
                              border: "none",
                              borderRadius: "4px",
                              padding: "0.25rem 0.5rem",
                              fontSize: '0.8rem'
                            }}
                            onClick={() => handleDeleteGateway(gateway.id)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
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
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Gateway</th>
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>API Key</th>
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Webhook URL</th>
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Transaction Fee</th>
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Status</th>
                      <th className="border-0 py-3 text-center" style={{ color: colors.darkGrayText }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(paymentGateways || []).map((gateway) => (
                      <tr key={gateway.id}>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <img
                              src={gateway.logo}
                              alt={gateway.name}
                              style={{
                                width: "40px",
                                height: "40px",
                                marginRight: "10px",
                                objectFit: "contain",
                                backgroundColor: colors.pureWhite,
                                padding: "5px",
                                borderRadius: "4px",
                                border: `1px solid ${colors.lightGrayBorder}`
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getGatewayLogo("");
                              }}
                            />
                            <span style={{ color: colors.blackText }}>{gateway.name}</span>
                          </div>
                        </td>
                        <td className="py-3" style={{ color: colors.blackText }}>{gateway.apiKey ? `${gateway.apiKey.substring(0, 10)}...` : 'N/A'}</td>
                        <td className="py-3" style={{ color: colors.blackText }}>{gateway.webhookUrl || 'N/A'}</td>
                        <td className="py-3" style={{ color: colors.blackText }}>{gateway.transactionFee || 'N/A'}</td>
                        <td className="py-3">
                          <span className={`badge px-2 py-1 ${gateway.status === "Active" ? "bg-success" : "bg-secondary"}`}>
                            {gateway.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="d-flex justify-content-center">
                            <button
                              className="btn btn-sm me-1"
                              style={{
                                color: colors.pureWhite,
                                backgroundColor: gateway.status === "Active" ? colors.darkGrayText : colors.primaryRed,
                                border: "none",
                                borderRadius: "4px",
                                padding: "0.25rem 0.5rem"
                              }}
                              onClick={() => toggleGatewayStatus(gateway.id)}
                            >
                              {gateway.status === "Active" ? "Disable" : "Enable"}
                            </button>
                            <button
                              className="btn btn-sm me-1"
                              style={{
                                color: colors.pureWhite,
                                backgroundColor: colors.primaryRed,
                                border: "none",
                                borderRadius: "4px",
                                padding: "0.25rem 0.5rem"
                              }}
                              onClick={() => openEditGatewayModal(gateway)}
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{
                                color: colors.pureWhite,
                                backgroundColor: colors.primaryRed,
                                border: "none",
                                borderRadius: "4px",
                                padding: "0.25rem 0.5rem"
                              }}
                              onClick={() => handleDeleteGateway(gateway.id)}
                            >
                              <i className="bi bi-trash-fill"></i>
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
      ) : (
        // Bank-to-Bank Direct Deposit Setup
        <div className="card shadow-sm" style={{ border: `1px solid ${colors.lightGrayBorder}` }}>
          <div className="card-header py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: colors.pureWhite, borderBottom: `1px solid ${colors.lightGrayBorder}` }}>
            <h5 className="mb-0 fw-bold" style={{ color: colors.blackText, fontSize: isMobile ? '1.125rem' : '1.25rem' }}>
              <i className="bi bi-bank me-2"></i>
              Bank Accounts
            </h5>
            <button
              className="btn btn-sm px-3 py-2 text-white"
              style={{ backgroundColor: colors.primaryRed, fontSize: isMobile ? '0.875rem' : '1rem' }}
              onClick={openAddBankModal}
            >
              <i className="bi bi-plus-circle me-2"></i>Add Bank Account
            </button>
          </div>
          <div className="card-body p-0">
            {isMobile ? (
              // Mobile Card View
              <div className="p-3">
                {(bankAccounts || []).map((bank) => (
                  <div key={bank.id} className="card mb-3 border" style={{ borderRadius: "10px" }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0" style={{ color: colors.blackText, fontSize: '0.9rem' }}>{bank.bankName}</h6>
                        <span className={`badge px-2 py-1 ${bank.status === "Verified" ? "bg-success" : bank.status === "Pending Verification" ? "bg-warning" : "bg-secondary"}`} style={{ fontSize: '0.75rem' }}>
                          {bank.status}
                        </span>
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Account Holder</small>
                          <span style={{ fontSize: '0.8rem' }}>{bank.accountHolder}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Account Number</small>
                          <span style={{ fontSize: '0.8rem' }}>{bank.accountNumber}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>IFSC Code</small>
                          <span style={{ fontSize: '0.8rem' }}>{bank.ifscCode}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Branch</small>
                          <span style={{ fontSize: '0.8rem' }}>{bank.branch}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Transaction Limit</small>
                          <span style={{ fontSize: '0.8rem' }}>{bank.transactionLimit}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Processing Time</small>
                          <span style={{ fontSize: '0.8rem' }}>{bank.processingTime}</span>
                        </div>
                      </div>
                      <div className="mt-2 d-flex justify-content-between">
                        <button
                          className="btn btn-sm me-2"
                          style={{
                            color: colors.pureWhite,
                            backgroundColor: bank.status === "Verified" ? colors.darkGrayText : colors.primaryRed,
                            border: "none",
                            borderRadius: "4px",
                            padding: "0.25rem 0.5rem",
                            fontSize: '0.8rem'
                          }}
                          onClick={() => toggleBankStatus(bank.id)}
                        >
                          {bank.status === "Verified" ? "Deactivate" : "Verify"}
                        </button>
                        <div>
                          <button
                            className="btn btn-sm me-1"
                            style={{
                              color: colors.pureWhite,
                              backgroundColor: colors.primaryRed,
                              border: "none",
                              borderRadius: "4px",
                              padding: "0.25rem 0.5rem",
                              fontSize: '0.8rem'
                            }}
                            onClick={() => openEditBankModal(bank)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{
                              color: colors.pureWhite,
                              backgroundColor: colors.primaryRed,
                              border: "none",
                              borderRadius: "4px",
                              padding: "0.25rem 0.5rem",
                              fontSize: '0.8rem'
                            }}
                            onClick={() => handleDeleteBank(bank.id)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
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
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Bank Name</th>
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Account Holder</th>
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Account Number</th>
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>IFSC Code</th>
                      <th className="border-0 py-3" style={{ color: colors.darkGrayText }}>Status</th>
                      <th className="border-0 py-3 text-center" style={{ color: colors.darkGrayText }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bankAccounts || []).map((bank) => (
                      <tr key={bank.id}>
                        <td className="py-3" style={{ color: colors.blackText }}>{bank.bankName}</td>
                        <td className="py-3" style={{ color: colors.blackText }}>{bank.accountHolder}</td>
                        <td className="py-3" style={{ color: colors.blackText }}>{bank.accountNumber}</td>
                        <td className="py-3" style={{ color: colors.blackText }}>{bank.ifscCode}</td>
                        <td className="py-3">
                          <span className={`badge px-2 py-1 ${bank.status === "Verified" ? "bg-success" : bank.status === "Pending Verification" ? "bg-warning" : "bg-secondary"}`}>
                            {bank.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="d-flex justify-content-center">
                            <button
                              className="btn btn-sm me-1"
                              style={{
                                color: colors.pureWhite,
                                backgroundColor: bank.status === "Verified" ? colors.darkGrayText : colors.primaryRed,
                                border: "none",
                                borderRadius: "4px",
                                padding: "0.25rem 0.5rem"
                              }}
                              onClick={() => toggleBankStatus(bank.id)}
                            >
                              {bank.status === "Verified" ? "Deactivate" : "Verify"}
                            </button>
                            <button
                              className="btn btn-sm me-1"
                              style={{
                                color: colors.pureWhite,
                                backgroundColor: colors.primaryRed,
                                border: "none",
                                borderRadius: "4px",
                                padding: "0.25rem 0.5rem"
                              }}
                              onClick={() => openEditBankModal(bank)}
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{
                                color: colors.pureWhite,
                                backgroundColor: colors.primaryRed,
                                border: "none",
                                borderRadius: "4px",
                                padding: "0.25rem 0.5rem"
                              }}
                              onClick={() => handleDeleteBank(bank.id)}
                            >
                              <i className="bi bi-trash-fill"></i>
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

      {/* Add/Edit Gateway Modal - Redesigned with cleaner UI */}
      {isModalOpen && activeTab === "gateway" && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className={`modal-dialog modal-dialog-centered ${isMobile ? 'modal-lg' : 'modal-xl'}`}>
            <div className="modal-content" style={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <div className="modal-header border-0" style={{ backgroundColor: colors.pureWhite, borderRadius: "12px 12px 0 0", borderBottom: `1px solid ${colors.lightGrayBorder}` }}>
                <div className="d-flex align-items-center">
                  <div style={{
                    height: '30px',
                    width: '4px',
                    backgroundColor: colors.primaryRed,
                    marginRight: '15px',
                    borderRadius: '2px'
                  }}></div>
                  <h5 className="modal-title fw-bold mb-0" style={{ color: colors.blackText, fontSize: isMobile ? '1.125rem' : '1.25rem' }}>
                    <i className="bi bi-credit-card me-2"></i>
                    {editMode ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body p-0" style={{ backgroundColor: colors.pureWhite }}>
                <div className="row g-0">
                  {/* Left Column - Form Fields */}
                  <div className={`col-12 ${!isMobile ? 'col-md-7' : ''} pe-0`}>
                    <div className="p-4" style={{ backgroundColor: colors.lightBackground, borderRadius: "0 0 12px 12px" }}>
                      <form onSubmit={handleSaveGateway}>
                        {/* Logo Preview */}
                        {currentGateway.logo && (
                          <div className="col-12 text-center mb-3">
                            <img
                              src={currentGateway.logo}
                              alt="Gateway Logo Preview"
                              style={{
                                height: "80px",
                                border: `1px solid ${colors.lightGrayBorder}`,
                                borderRadius: "8px",
                                objectFit: "contain",
                                backgroundColor: colors.pureWhite,
                                padding: "10px"
                              }}
                            />
                          </div>
                        )}

                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label fw-bold" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>Gateway Name</label>
                            <div className="input-group">
                              <span className="input-group-text" style={{ backgroundColor: colors.pureWhite, border: `1px solid ${colors.lightGrayBorder}`, borderRight: 'none' }}>
                                <i className="bi bi-credit-card"></i>
                              </span>
                              <select
                                className="form-select"
                                name="name"
                                value={currentGateway.name || ''}
                                onChange={handleGatewayInputChange}
                                required
                                style={{
                                  border: `1px solid ${colors.lightGrayBorder}`,
                                  fontSize: isMobile ? '0.875rem' : '1rem',
                                  borderLeft: 'none'
                                }}
                              >
                                <option value="">Select Gateway</option>
                                <option value="Razorpay">Razorpay</option>
                                <option value="Stripe">Stripe</option>
                                <option value="PayPal">PayPal</option>
                                <option value="PayU">PayU</option>
                                <option value="CCAvenue">CCAvenue</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-bold" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>Gateway Logo</label>
                            <div className="input-group">
                              <span className="input-group-text" style={{ backgroundColor: colors.pureWhite, border: `1px solid ${colors.lightGrayBorder}`, borderRight: 'none' }}>
                                <i className="bi bi-image"></i>
                              </span>
                              <input
                                type="file"
                                className="form-control"
                                name="logo"
                                accept="image/*"
                                onChange={handleGatewayImageChange}
                                style={{
                                  border: `1px solid ${colors.lightGrayBorder}`,
                                  fontSize: isMobile ? '0.875rem' : '1rem',
                                  borderLeft: 'none'
                                }}
                              />
                            </div>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Upload custom logo or leave blank to use default</small>
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-bold" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>API Key</label>
                            <div className="input-group">
                              <span className="input-group-text" style={{ backgroundColor: colors.pureWhite, border: `1px solid ${colors.lightGrayBorder}`, borderRight: 'none' }}>
                                <i className="bi bi-key"></i>
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                name="apiKey"
                                placeholder="Enter API Key"
                                value={currentGateway.apiKey || ''}
                                onChange={handleGatewayInputChange}
                                required
                                style={{
                                  border: `1px solid ${colors.lightGrayBorder}`,
                                  fontSize: isMobile ? '0.875rem' : '1rem',
                                  borderLeft: 'none'
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-bold" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>Webhook URL</label>
                            <div className="input-group">
                              <span className="input-group-text" style={{ backgroundColor: colors.pureWhite, border: `1px solid ${colors.lightGrayBorder}`, borderRight: 'none' }}>
                                <i className="bi bi-link-45deg"></i>
                              </span>
                              <input
                                type="url"
                                className="form-control"
                                name="webhookUrl"
                                placeholder="https://example.com/webhook"
                                value={currentGateway.webhookUrl || ''}
                                onChange={handleGatewayInputChange}
                                required
                                style={{
                                  border: `1px solid ${colors.lightGrayBorder}`,
                                  fontSize: isMobile ? '0.875rem' : '1rem',
                                  borderLeft: 'none'
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-bold" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>Transaction Fee</label>
                            <div className="input-group">
                              <span className="input-group-text" style={{ backgroundColor: colors.pureWhite, border: `1px solid ${colors.lightGrayBorder}`, borderRight: 'none' }}>
                                <i className="bi bi-percent"></i>
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                name="transactionFee"
                                placeholder="e.g., 2% or 2.9% + $0.30"
                                value={currentGateway.transactionFee || ''}
                                onChange={handleGatewayInputChange}
                                required
                                style={{
                                  border: `1px solid ${colors.lightGrayBorder}`,
                                  fontSize: isMobile ? '0.875rem' : '1rem',
                                  borderLeft: 'none'
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-bold" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem', marginBottom: '8px' }}>Status</label>
                            <div className="input-group">
                              <span className="input-group-text" style={{ backgroundColor: colors.pureWhite, border: `1px solid ${colors.lightGrayBorder}`, borderRight: 'none' }}>
                                <i className="bi bi-toggle-on"></i>
                              </span>
                              <select
                                className="form-select"
                                name="status"
                                value={currentGateway.status || 'Active'}
                                onChange={handleGatewayInputChange}
                                required
                                style={{
                                  border: `1px solid ${colors.lightGrayBorder}`,
                                  fontSize: isMobile ? '0.875rem' : '1rem',
                                  borderLeft: 'none'
                                }}
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                          <button
                            type="button"
                            className="btn px-4 py-2"
                            style={{
                              backgroundColor: colors.pureWhite,
                              color: colors.darkGrayText,
                              border: `1px solid ${colors.lightGrayBorder}`,
                              fontSize: isMobile ? '0.875rem' : '1rem',
                              borderRadius: '6px'
                            }}
                            onClick={closeModal}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn px-4 py-2 text-white"
                            style={{
                              backgroundColor: colors.primaryRed,
                              fontSize: isMobile ? '0.875rem' : '1rem',
                              borderRadius: '6px'
                            }}
                          >
                            {editMode ? 'Update' : 'Save'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Column - Info Cards */}
                  {!isMobile && (
                    <div className="col-12 col-md-5 ps-0">
                      <div className="p-4" style={{ backgroundColor: colors.lightBackground, borderRadius: "0 12px 12px 0" }}>
                        <h6 className="fw-bold mb-3" style={{ color: colors.primaryRed, fontSize: isMobile ? '0.95rem' : '1.05rem' }}>Payment Gateway Information</h6>

                        <div className="card mb-3 border" style={{ borderRadius: "8px", backgroundColor: colors.pureWhite }}>
                          <div className="card-body p-3">
                            <h6 className="fw-bold mb-2" style={{ color: colors.blackText, fontSize: isMobile ? '0.9rem' : '1rem' }}>
                              <i className="bi bi-info-circle me-2" style={{ color: colors.primaryRed }}></i>
                              API Key Format
                            </h6>
                            <p className="mb-0" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: colors.darkGrayText }}>
                              Each payment gateway provides a unique API key that authenticates your application with their services.
                            </p>
                          </div>
                        </div>

                        <div className="card mb-3 border" style={{ borderRadius: "8px", backgroundColor: colors.pureWhite }}>
                          <div className="card-body p-3">
                            <h6 className="fw-bold mb-2" style={{ color: colors.blackText, fontSize: isMobile ? '0.9rem' : '1rem' }}>
                              <i className="bi bi-link-45deg me-2" style={{ color: colors.primaryRed }}></i>
                              Webhook URL
                            </h6>
                            <p className="mb-0" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: colors.darkGrayText }}>
                              The URL where payment notifications will be sent after transactions.
                            </p>
                          </div>
                        </div>

                        <div className="card mb-3 border" style={{ borderRadius: "8px", backgroundColor: colors.pureWhite }}>
                          <div className="card-body p-3">
                            <h6 className="fw-bold mb-2" style={{ color: colors.blackText, fontSize: isMobile ? '0.9rem' : '1rem' }}>
                              <i className="bi bi-percent me-2" style={{ color: colors.primaryRed }}></i>
                              Transaction Fee
                            </h6>
                            <p className="mb-0" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: colors.darkGrayText }}>
                              The fee charged for each transaction processed through this gateway.
                            </p>
                          </div>
                        </div>

                        <div className="card mb-3 border" style={{ borderRadius: "8px", backgroundColor: colors.pureWhite }}>
                          <div className="card-body p-3">
                            <h6 className="fw-bold mb-2" style={{ color: colors.blackText, fontSize: isMobile ? '0.9rem' : '1rem' }}>
                              <i className="bi bi-image me-2" style={{ color: colors.primaryRed }}></i>
                              Gateway Logo
                            </h6>
                            <p className="mb-0" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: colors.darkGrayText }}>
                              Upload a custom logo for the payment gateway or use the default logo based on the gateway type.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Bank Account Modal */}
      {isModalOpen && activeTab === "bank" && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className={`modal-dialog modal-dialog-centered ${isMobile ? 'modal-sm' : ''}`}>
            <div className="modal-content">
              <div className="modal-header border-0" style={{ backgroundColor: colors.pureWhite }}>
                <h5 className="modal-title fw-bold" style={{ color: colors.blackText, fontSize: isMobile ? '1.125rem' : '1.25rem' }}>
                  <i className="bi bi-bank me-2"></i>
                  {editMode ? 'Edit Bank Account' : 'Add Bank Account'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body" style={{ backgroundColor: colors.pureWhite }}>
                <form onSubmit={handleSaveBank}>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Bank Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="bankName"
                      placeholder="Enter Bank Name"
                      value={currentBank.bankName || ''}
                      onChange={handleBankInputChange}
                      required
                      style={{ border: `1px solid ${colors.lightGrayBorder}`, fontSize: isMobile ? '0.875rem' : '1rem' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Account Holder Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="accountHolder"
                      placeholder="Enter Account Holder Name"
                      value={currentBank.accountHolder || ''}
                      onChange={handleBankInputChange}
                      required
                      style={{ border: `1px solid ${colors.lightGrayBorder}`, fontSize: isMobile ? '0.875rem' : '1rem' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Account Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="accountNumber"
                      placeholder="Enter Account Number"
                      value={currentBank.accountNumber || ''}
                      onChange={handleBankInputChange}
                      required
                      style={{ border: `1px solid ${colors.lightGrayBorder}`, fontSize: isMobile ? '0.875rem' : '1rem' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>IFSC Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="ifscCode"
                      placeholder="Enter IFSC Code"
                      value={currentBank.ifscCode || ''}
                      onChange={handleBankInputChange}
                      required
                      style={{ border: `1px solid ${colors.lightGrayBorder}`, fontSize: isMobile ? '0.875rem' : '1rem' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Branch</label>
                    <input
                      type="text"
                      className="form-control"
                      name="branch"
                      placeholder="Enter Branch Name"
                      value={currentBank.branch || ''}
                      onChange={handleBankInputChange}
                      required
                      style={{ border: `1px solid ${colors.lightGrayBorder}`, fontSize: isMobile ? '0.875rem' : '1rem' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Transaction Limit</label>
                    <input
                      type="text"
                      className="form-control"
                      name="transactionLimit"
                      placeholder="e.g., $500,000/day"
                      value={currentBank.transactionLimit || ''}
                      onChange={handleBankInputChange}
                      required
                      style={{ border: `1px solid ${colors.lightGrayBorder}`, fontSize: isMobile ? '0.875rem' : '1rem' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Processing Time</label>
                    <input
                      type="text"
                      className="form-control"
                      name="processingTime"
                      placeholder="e.g., 2-3 hours"
                      value={currentBank.processingTime || ''}
                      onChange={handleBankInputChange}
                      required
                      style={{ border: `1px solid ${colors.lightGrayBorder}`, fontSize: isMobile ? '0.875rem' : '1rem' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: colors.darkGrayText, fontSize: isMobile ? '0.875rem' : '1rem' }}>Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={currentBank.status || 'Pending Verification'}
                      onChange={handleBankInputChange}
                      required
                      style={{ border: `1px solid ${colors.lightGrayBorder}`, fontSize: isMobile ? '0.875rem' : '1rem' }}
                    >
                      <option value="Pending Verification">Pending Verification</option>
                      <option value="Verified">Verified</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button
                      type="button"
                      className="btn px-4 py-2"
                      style={{
                        backgroundColor: colors.pureWhite,
                        color: colors.darkGrayText,
                        border: `1px solid ${colors.lightGrayBorder}`,
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }}
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn px-4 py-2 text-white"
                      style={{ backgroundColor: colors.primaryRed, fontSize: isMobile ? '0.875rem' : '1rem' }}
                    >
                      {editMode ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSetup; 