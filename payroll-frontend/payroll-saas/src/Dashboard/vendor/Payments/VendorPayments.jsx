import React, { useState, useEffect } from "react";
import { vendorAPI } from '../../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';

const COLORS = {
  primary: "#C62828",
  primaryDark: "#B71C1C",
  white: "#FFFFFF",
  black: "#000000",
  text: "#4A4A4A",
  border: "#E2E2E2",
  chartLine: "#4BA8FF",
  blueLabel: "#8BAFE3",
  oliveLabel: "#95A98A",
  success: "#2E7D32",
  warning: "#F57C00",
  danger: "#D32F2F",
  lightGray: "#F5F5F5",
  hoverBg: "#F0F0F0",
  info: "#1976D2",
};

// Common style objects to reduce duplication
const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif"
  },
  contentContainer: (isMobile) => ({
    maxWidth: "1200px",
    margin: "0 auto",
    padding: isMobile ? "15px" : "20px"
  }),
  header: {
    title: (isMobile) => ({
      fontSize: isMobile ? "24px" : "28px",
      fontWeight: 700,
      margin: 0,
      color: COLORS.black
    }),
    subtitle: (isMobile) => ({
      fontSize: isMobile ? "14px" : "16px",
      color: COLORS.text,
      marginTop: "8px"
    }),
    container: (isMobile) => ({
      marginBottom: isMobile ? "20px" : "24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "15px" : "0"
    }),
    tabButton: (isActive, isMobile) => ({
      flex: isMobile ? 1 : "none",
      padding: isMobile ? "8px 10px" : "10px 16px",
      borderRadius: "8px",
      backgroundColor: isActive ? COLORS.primary : COLORS.lightGray,
      color: isActive ? COLORS.white : COLORS.text,
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: isMobile ? "13px" : "14px",
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease"
    }),
    tabContainer: (isMobile) => ({
      display: "flex",
      gap: isMobile ? "6px" : "12px",
      width: isMobile ? "100%" : "auto",
      justifyContent: isMobile ? "space-between" : "flex-start"
    })
  },
  card: {
    base: (isMobile) => ({
      backgroundColor: COLORS.white,
      borderRadius: "12px",
      padding: isMobile ? "15px" : "20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
    }),
    withMargin: (isMobile) => ({
      ...styles.card.base(isMobile),
      marginBottom: isMobile ? "20px" : "24px"
    }),
    withShadow: {
      backgroundColor: COLORS.white,
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      overflow: "hidden"
    },
    stat: (isMobile) => ({
      ...styles.card.base(isMobile),
      display: "flex",
      alignItems: "center",
      gap: "16px"
    }),
    icon: (color) => ({
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      backgroundColor: color + "20",
      color: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto"
    }),
    sectionTitle: (isMobile) => ({
      fontSize: isMobile ? "18px" : "20px",
      fontWeight: 600,
      margin: 0,
      color: COLORS.black
    })
  },
  button: {
    primary: (isMobile) => ({
      padding: "10px 16px",
      borderRadius: "8px",
      backgroundColor: COLORS.primary,
      border: "none",
      color: COLORS.white,
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.2s ease",
      width: isMobile ? "100%" : "auto"
    }),
    secondary: (isMobile) => ({
      padding: "10px 16px",
      borderRadius: "8px",
      backgroundColor: COLORS.lightGray,
      border: "none",
      color: COLORS.text,
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
      width: isMobile ? "100%" : "auto"
    }),
    view: {
      padding: "6px 12px",
      borderRadius: "6px",
      border: "none",
      color: COLORS.white,
      cursor: "pointer",
      backgroundColor: COLORS.primary,
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    danger: {
      padding: "6px 12px",
      borderRadius: "6px",
      border: "none",
      color: COLORS.danger,
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: "transparent",
      transition: "all 0.2s ease"
    },
    setPrimary: {
      padding: "6px 12px",
      borderRadius: "6px",
      border: "none",
      color: COLORS.white,
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: COLORS.primary,
      transition: "all 0.2s ease"
    }
  },
  input: {
    base: {
      width: "100%",
      border: `1px solid ${COLORS.border}`,
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      transition: "border-color 0.2s ease"
    },
    label: {
      fontSize: "14px",
      fontWeight: 600,
      color: COLORS.text,
      marginBottom: "8px",
      display: "block"
    },
    container: {
      marginBottom: "16px"
    }
  },
  modal: {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px"
    },
    content: (isMobile) => ({
      background: COLORS.white,
      padding: isMobile ? "20px" : "24px",
      width: isMobile ? "95%" : "500px",
      maxWidth: "90vw",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      maxHeight: "90vh",
      overflowY: "auto"
    }),
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      paddingBottom: "12px",
      borderBottom: `1px solid ${COLORS.border}`
    },
    title: (isMobile) => ({
      margin: 0,
      fontWeight: 600,
      fontSize: isMobile ? "18px" : "20px",
      color: COLORS.black
    }),
    closeButton: {
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: COLORS.text,
      padding: "4px",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    footer: (isMobile) => ({
      marginTop: "24px",
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      flexDirection: isMobile ? "column" : "row"
    })
  },
  table: {
    container: {
      overflowX: "auto"
    },
    header: {
      padding: "16px",
      fontWeight: 600,
      color: COLORS.text,
      fontSize: "14px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      textAlign: "left"
    },
    cell: {
      padding: "16px",
      fontSize: "14px"
    },
    row: (index) => ({
      backgroundColor: index % 2 === 0 ? COLORS.white : COLORS.lightGray,
      transition: "background-color 0.2s ease"
    })
  },
  status: {
    badge: (status) => ({
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: status + "20",
      color: status
    }),
    primary: {
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: COLORS.primary + "20",
      color: COLORS.primary
    }
  },
  mobilePaymentCard: {
    container: {
      backgroundColor: COLORS.lightGray,
      borderRadius: "8px",
      padding: "15px",
      marginBottom: "15px",
      border: `1px solid ${COLORS.border}`
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px"
    },
    name: {
      fontWeight: 600,
      color: COLORS.black
    },
    reference: {
      fontSize: "14px",
      color: COLORS.text,
      marginBottom: "5px"
    },
    date: {
      fontSize: "14px",
      color: COLORS.text,
      marginBottom: "10px"
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    amount: {
      fontSize: "18px",
      fontWeight: 700,
      color: COLORS.oliveLabel
    }
  },
  filter: {
    container: (isMobile, showMobileFilters) => ({
      display: isMobile ? (showMobileFilters ? "block" : "none") : "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
      gap: isMobile ? "15px" : "16px",
      alignItems: "end"
    }),
    toggleButton: {
      width: "100%",
      padding: "10px 12px",
      backgroundColor: COLORS.lightGray,
      color: COLORS.text,
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "14px"
    }
  }
};

const VendorPayments = () => {
  const [activeTab, setActiveTab] = useState("payments");
  const [payments, setPayments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [vendorProfile, setVendorProfile] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    description: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    paymentStatus: 'pending'
  });

  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [paymentsRes, paymentStatusRes] = await Promise.all([
        vendorAPI.getMyPayments(),
        vendorAPI.getPaymentStatus()
      ]);

      if (paymentsRes?.data?.success) {
        const paymentData = paymentsRes.data.data;
        if (paymentData.summary) {
          setSummary(paymentData.summary);
        }
        if (paymentData.transactions) {
          const paymentList = paymentData.transactions.map(t => ({
            id: t.id,
            date: t.date || new Date().toISOString().split('T')[0],
            paidBy: t.employer || 'Unknown Employer',
            amount: t.amount || 0,
            status: t.paymentStatus === 'completed' ? 'Completed' :
              t.paymentStatus === 'pending' ? 'Pending' : 'Failed',
            reference: t.reference || `PAY-${t.id}`,
            description: t.description || 'Payment'
          }));
          setPayments(paymentList);
        }
      }

      if (paymentStatusRes?.data?.success) {
        const statusData = paymentStatusRes.data.data;
        setVendorProfile({
          businessName: statusData.company_name || '',
          contactPerson: statusData.contact_person || '',
          email: statusData.email || '',
          phone: statusData.phone || '',
          address: statusData.address || '',
          taxId: statusData.tax_id || '',
          description: statusData.description || ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.paidBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    const matchesDateRange = (!dateRange.start || payment.date >= dateRange.start) &&
      (!dateRange.end || payment.date <= dateRange.end);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const totalAmount = summary.totalPaid || filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return COLORS.oliveLabel;
      case "Pending": return COLORS.warning;
      case "Failed": return COLORS.danger;
      default: return COLORS.text;
    }
  };

  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountNumber: "",
    accountType: "Savings",
    ifscCode: "",
    branch: "",
    isPrimary: false
  });

  const [profileForm, setProfileForm] = useState({ ...vendorProfile });

  const handleExportPDF = () => {
    let htmlContent = `
      <html>
        <head>
          <title>Payment Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin:20px; }
            h1 { color: ${COLORS.primary}; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid ${COLORS.border}; padding: 8px; text-align: left; }
            th { background-color: ${COLORS.lightGray}; }
            .total { font-weight: bold; margin-top: 20px; }
            .status-completed { color: ${COLORS.oliveLabel}; }
            .status-pending { color: ${COLORS.warning}; }
            .status-failed { color: ${COLORS.danger}; }
          </style>
        </head>
        <body>
          <h1>Payment Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Paid By</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
    `;

    filteredPayments.forEach(payment => {
      htmlContent += `
        <tr>
          <td>${formatDate(payment.date)}</td>
          <td>${payment.paidBy}</td>
          <td>${payment.reference}</td>
          <td class="status-${payment.status.toLowerCase()}">${payment.status}</td>
          <td>$${payment.amount.toLocaleString()}</td>
        </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>
          <div class="total">Total: $${totalAmount.toLocaleString()}</div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment_report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportPDF = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.html,.csv';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        toast.success(`File "${file.name}" would be processed here. In a real implementation, this would parse file and update payments data.`, { icon: '🚧' });
      }
    };

    input.click();
  };

  const handleAddBankAccount = (e) => {
    e.preventDefault();
    const newAccount = {
      ...bankForm,
      id: bankAccounts.length + 1
    };

    if (bankForm.isPrimary) {
      setBankAccounts(bankAccounts.map(account => ({
        ...account,
        isPrimary: account.id === newAccount.id
      })));
    } else {
      setBankAccounts([...bankAccounts, newAccount]);
    }

    setBankForm({
      bankName: "",
      accountNumber: "",
      accountType: "Savings",
      ifscCode: "",
      branch: "",
      isPrimary: false
    });
    setShowAddBankModal(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await vendorAPI.updateContractDetails({
        company_name: profileForm.businessName,
        contact_person: profileForm.contactPerson,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        tax_id: profileForm.taxId,
        description: profileForm.description
      });

      if (response?.data?.success) {
        setSuccessMessage("Profile updated successfully!");
        setVendorProfile(profileForm);
        setShowEditProfileModal(false);
        fetchData(); // Refresh data
      } else {
        setError(response?.data?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimaryBank = (id) => {
    setBankAccounts(bankAccounts.map(account => ({
      ...account,
      isPrimary: account.id === id
    })));
  };

  const handleDeleteBankAccount = (id) => {
    if (window.confirm("Are you sure you want to delete this bank account?")) {
      setBankAccounts(bankAccounts.filter(account => account.id !== id));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentContainer(isMobile)}>
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Loading payment data...</p>
          </div>
        )}

        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {successMessage && <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>{successMessage}</Alert>}

        {/* Header Section with Tabs */}
        <div style={styles.header.container(isMobile)}>
          <div>
            <h1 style={styles.header.title(isMobile)}>
              Vendor Management
            </h1>
            <p style={styles.header.subtitle(isMobile)}>
              Manage your vendor profile, bank accounts, and payment history
            </p>
          </div>
          <div style={styles.header.tabContainer(isMobile)}>
            <button
              style={styles.header.tabButton(activeTab === "payments", isMobile)}
              onClick={() => setActiveTab("payments")}
            >
              {isMobile ? "Payments" : "Payment History"}
            </button>
            <button
              style={styles.header.tabButton(activeTab === "bank", isMobile)}
              onClick={() => setActiveTab("bank")}
            >
              {isMobile ? "Bank" : "Bank Accounts"}
            </button>
            <button
              style={styles.header.tabButton(activeTab === "profile", isMobile)}
              onClick={() => setActiveTab("profile")}
            >
              {isMobile ? "Profile" : "Vendor Profile"}
            </button>
          </div>
        </div>

        {/* Payment History Tab */}
        {activeTab === "payments" && (
          <>
            {/* Stats Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : (isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)"),
              gap: isMobile ? "12px" : "16px",
              marginBottom: isMobile ? "20px" : "24px"
            }}>
              <div style={styles.card.stat(isMobile)}>
                <div style={styles.card.icon(COLORS.chartLine)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "4px" }}>Total Received</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: COLORS.black }}>${totalAmount.toLocaleString()}</div>
                </div>
              </div>
              <div style={styles.card.stat(isMobile)}>
                <div style={styles.card.icon(COLORS.oliveLabel)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "4px" }}>Completed</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: COLORS.black }}>{payments.filter(p => p.status === "Completed").length}</div>
                </div>
              </div>
              <div style={styles.card.stat(isMobile)}>
                <div style={styles.card.icon(COLORS.warning)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "4px" }}>Pending</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: COLORS.black }}>${summary.pendingAmount || payments.filter(p => p.status === "Pending").reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div style={styles.card.withMargin(isMobile)}>
              {isMobile && (
                <button
                  style={styles.filter.toggleButton}
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <span>Filters</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              )}

              <div style={styles.filter.container(isMobile, showMobileFilters)}>
                <div style={styles.input.container}>
                  <label style={styles.input.label}>Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.input.base}
                    placeholder="Search by name or reference"
                  />
                </div>
                <div style={styles.input.container}>
                  <label style={styles.input.label}>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={styles.input.base}
                  >
                    <option value="all">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div style={styles.input.container}>
                  <label style={styles.input.label}>From Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    style={styles.input.base}
                  />
                </div>
                <div style={styles.input.container}>
                  <label style={styles.input.label}>To Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    style={styles.input.base}
                  />
                </div>
                <div style={styles.input.container}>
                  <button
                    style={styles.button.secondary(isMobile)}
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                      setDateRange({ start: "", end: "" });
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Payments Table */}
            <div style={styles.card.withShadow}>
              <div style={{
                padding: isMobile ? "15px" : "20px",
                borderBottom: `1px solid ${COLORS.border}`
              }}>
                <h2 style={styles.card.sectionTitle(isMobile)}>
                  Payments Received
                </h2>
              </div>

              {isMobile ? (
                <div style={{ padding: isMobile ? "15px" : "20px" }}>
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      style={styles.mobilePaymentCard.container}
                    >
                      <div style={styles.mobilePaymentCard.header}>
                        <div style={styles.mobilePaymentCard.name}>{payment.paidBy}</div>
                        <span style={styles.status.badge(getStatusColor(payment.status))}>
                          {payment.status}
                        </span>
                      </div>
                      <div style={styles.mobilePaymentCard.reference}>
                        {payment.reference}
                      </div>
                      <div style={styles.mobilePaymentCard.date}>
                        {formatDate(payment.date)}
                      </div>
                      <div style={styles.mobilePaymentCard.footer}>
                        <div style={styles.mobilePaymentCard.amount}>
                          ${payment.amount.toLocaleString()}
                        </div>
                        <button
                          style={styles.button.view}
                          onClick={() => setSelectedPayment(payment)}
                          title="View Details"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.table.container}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: COLORS.lightGray }}>
                        <th style={styles.table.header}>Date</th>
                        <th style={styles.table.header}>Paid By</th>
                        <th style={styles.table.header}>Reference</th>
                        <th style={styles.table.header}>Status</th>
                        <th style={{ ...styles.table.header, textAlign: "right" }}>Amount</th>
                        <th style={{ ...styles.table.header, textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment, index) => (
                        <tr
                          key={payment.id}
                          style={styles.table.row(index)}
                        >
                          <td style={styles.table.cell}>{formatDate(payment.date)}</td>
                          <td style={{ ...styles.table.cell, fontWeight: 600 }}>{payment.paidBy}</td>
                          <td style={styles.table.cell}>{payment.reference}</td>
                          <td style={styles.table.cell}>
                            <span style={styles.status.badge(getStatusColor(payment.status))}>
                              {payment.status}
                            </span>
                          </td>
                          <td style={{ ...styles.table.cell, textAlign: "right", fontWeight: 600, color: COLORS.oliveLabel }}>
                            ${payment.amount.toLocaleString()}
                          </td>
                          <td style={{ ...styles.table.cell, textAlign: "center" }}>
                            <button
                              style={styles.button.view}
                              onClick={() => setSelectedPayment(payment)}
                              title="View Details"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Export/Import Buttons */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "12px" : "0"
            }}>
              <button
                style={styles.button.primary(isMobile)}
                onClick={handleImportPDF}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {isMobile ? "Import" : "Import PDF"}
              </button>
              <button
                style={styles.button.primary(isMobile)}
                onClick={handleExportPDF}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {isMobile ? "Export" : "Export PDF"}
              </button>
            </div>
          </>
        )}

        {/* Bank Accounts Tab */}
        {activeTab === "bank" && (
          <>
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: isMobile ? "flex-start" : "space-between",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? "12px" : "0",
              marginBottom: "20px"
            }}>
              <h2 style={styles.header.title(isMobile)}>
                Bank Accounts
              </h2>
              <button
                style={styles.button.primary(isMobile)}
                onClick={() => setShowAddBankModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Bank Account
              </button>
            </div>

            <div style={styles.card.withShadow}>
              {bankAccounts.length > 0 ? (
                <div style={{ padding: isMobile ? "15px" : "20px" }}>
                  {bankAccounts.map((account, index) => (
                    <div
                      key={account.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? COLORS.white : COLORS.lightGray,
                        padding: isMobile ? "15px" : "20px",
                        borderBottom: `1px solid ${COLORS.border}`,
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between",
                        alignItems: isMobile ? "stretch" : "center",
                        gap: isMobile ? "14px" : "0"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                          <h3 style={{
                            fontSize: isMobile ? "16px" : "18px",
                            fontWeight: 600,
                            margin: 0,
                            color: COLORS.black
                          }}>
                            {account.bankName}
                          </h3>
                          {account.isPrimary && (
                            <span style={styles.status.primary}>
                              Primary
                            </span>
                          )}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "10px" }}>
                          <div>
                            <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "4px" }}>Account Number</div>
                            <div style={{ fontSize: "16px", fontWeight: 500, color: COLORS.black }}>
                              {account.accountNumber.replace(/(\d{4})(\d{4})(\d{4})/, "$1XXXXXX$3")}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "4px" }}>Account Type</div>
                            <div style={{ fontSize: "16px", fontWeight: 500, color: COLORS.black }}>
                              {account.accountType}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "4px" }}>IFSC Code</div>
                            <div style={{ fontSize: "16px", fontWeight: 500, color: COLORS.black }}>
                              {account.ifscCode}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "4px" }}>Branch</div>
                            <div style={{ fontSize: "16px", fontWeight: 500, color: COLORS.black }}>
                              {account.branch}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        justifyContent: isMobile ? "flex-end" : "flex-start",
                        marginTop: isMobile ? "8px" : "0"
                      }}>
                        {!account.isPrimary && (
                          <button
                            style={styles.button.setPrimary}
                            onClick={() => handleSetPrimaryBank(account.id)}
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          style={styles.button.danger}
                          onClick={() => handleDeleteBankAccount(account.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: isMobile ? "35px 20px" : "40px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <div style={styles.card.icon(COLORS.text)}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="7" y1="8" x2="17" y2="8"></line>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: isMobile ? "18px" : "20px",
                    fontWeight: 600,
                    margin: "15px 0 10px",
                    color: COLORS.black
                  }}>
                    No Bank Accounts
                  </h3>
                  <p style={{
                    fontSize: isMobile ? "14px" : "16px",
                    color: COLORS.text,
                    margin: 0
                  }}>
                    Add your bank account to receive direct deposits from clients
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Vendor Profile Tab */}
        {activeTab === "profile" && (
          <>
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: isMobile ? "flex-start" : "space-between",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? "12px" : "0",
              marginBottom: "20px"
            }}>
              <h2 style={styles.header.title(isMobile)}>
                Vendor Profile
              </h2>
              <button
                style={styles.button.primary(isMobile)}
                onClick={() => {
                  setProfileForm(vendorProfile);
                  setShowEditProfileModal(true);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 2.5z"></path>
                </svg>
                Edit Profile
              </button>
            </div>

            <div style={styles.card.withShadow}>
              <div style={{ padding: isMobile ? "20px" : "30px" }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "20px" }}>
                  <div>
                    <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "8px" }}>Business Name</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: COLORS.black }}>
                      {vendorProfile.businessName || "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "8px" }}>Contact Person</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: COLORS.black }}>
                      {vendorProfile.contactPerson || "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "8px" }}>Email</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: COLORS.black }}>
                      {vendorProfile.email || "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "8px" }}>Phone</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: COLORS.black }}>
                      {vendorProfile.phone || "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "8px" }}>Tax ID</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: COLORS.black }}>
                      {vendorProfile.taxId || "-"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "8px" }}>Address</div>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: COLORS.black, marginBottom: "20px" }}>
                    {vendorProfile.address || "-"}
                  </div>

                  <div style={{ fontSize: "14px", color: COLORS.text, marginBottom: "8px" }}>Description</div>
                  <div style={{ fontSize: "16px", fontWeight: 500, color: COLORS.black }}>
                    {vendorProfile.description || "-"}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div style={styles.modal.overlay}>
          <div style={styles.modal.content(isMobile)}>
            <div style={styles.modal.header}>
              <h2 style={styles.modal.title(isMobile)}>
                Payment Details
              </h2>
              <button
                style={styles.modal.closeButton}
                onClick={() => setSelectedPayment(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{
              backgroundColor: COLORS.lightGray,
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: 600, color: COLORS.text, fontSize: "14px" }}>Reference</span>
                <span style={{ fontWeight: 500, color: COLORS.black, fontSize: "14px" }}>{selectedPayment.reference}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: 600, color: COLORS.text, fontSize: "14px" }}>Date</span>
                <span style={{ fontWeight: 500, color: COLORS.black, fontSize: "14px" }}>{formatDate(selectedPayment.date)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: 600, color: COLORS.text, fontSize: "14px" }}>Paid By</span>
                <span style={{ fontWeight: 500, color: COLORS.black, fontSize: "14px" }}>{selectedPayment.paidBy}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0" }}>
                <span style={{ fontWeight: 600, color: COLORS.text, fontSize: "14px" }}>Amount</span>
                <span style={{
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: 700,
                  color: COLORS.oliveLabel
                }}>
                  ${selectedPayment.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: COLORS.lightGray,
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: 600, color: COLORS.text, fontSize: "14px" }}>Status</span>
                <span style={styles.status.badge(getStatusColor(selectedPayment.status))}>
                  {selectedPayment.status}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0" }}>
                <span style={{ fontWeight: 600, color: COLORS.text, fontSize: "14px" }}>Description</span>
                <span style={{ fontWeight: 500, color: COLORS.black, fontSize: "14px" }}>{selectedPayment.description}</span>
              </div>
            </div>

            <div style={styles.modal.footer(isMobile)}>
              <button
                style={styles.button.primary(isMobile)}
                onClick={() => toast.success("Run payment functionality", { icon: '🚧' })}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Run Payment
              </button>
              <button
                style={styles.button.secondary(isMobile)}
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {showAddBankModal && (
        <div style={styles.modal.overlay}>
          <div style={styles.modal.content(isMobile)}>
            <div style={styles.modal.header}>
              <h2 style={styles.modal.title(isMobile)}>
                Add Bank Account
              </h2>
              <button
                style={styles.modal.closeButton}
                onClick={() => setShowAddBankModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddBankAccount}>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Bank Name</label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Account Number</label>
                <input
                  type="text"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Account Type</label>
                <select
                  value={bankForm.accountType}
                  onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                  style={styles.input.base}
                >
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="Salary">Salary</option>
                </select>
              </div>
              <div style={styles.input.container}>
                <label style={styles.input.label}>IFSC Code</label>
                <input
                  type="text"
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Branch</label>
                <input
                  type="text"
                  value={bankForm.branch}
                  onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: COLORS.text
                }}>
                  <input
                    type="checkbox"
                    checked={bankForm.isPrimary}
                    onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                    style={{ marginRight: "8px" }}
                  />
                  Set as Primary Account
                </label>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px"
              }}>
                <button
                  type="button"
                  style={styles.button.secondary(isMobile)}
                  onClick={() => setShowAddBankModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.button.primary(isMobile)}
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div style={styles.modal.overlay}>
          <div style={{ ...styles.modal.content(isMobile), width: isMobile ? "95%" : "600px" }}>
            <div style={styles.modal.header}>
              <h2 style={styles.modal.title(isMobile)}>
                Edit Vendor Profile
              </h2>
              <button
                style={styles.modal.closeButton}
                onClick={() => setShowEditProfileModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Business Name</label>
                <input
                  type="text"
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Contact Person</label>
                <input
                  type="text"
                  value={profileForm.contactPerson}
                  onChange={(e) => setProfileForm({ ...profileForm, contactPerson: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={styles.input.container}>
                <label style={styles.input.label}>Tax ID</label>
                <input
                  type="text"
                  value={profileForm.taxId}
                  onChange={(e) => setProfileForm({ ...profileForm, taxId: e.target.value })}
                  required
                  style={styles.input.base}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={styles.input.label}>Description</label>
                <textarea
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  rows="4"
                  style={{
                    ...styles.input.base,
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px"
              }}>
                <button
                  type="button"
                  style={styles.button.secondary(isMobile)}
                  onClick={() => setShowEditProfileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.button.primary(isMobile)}
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPayments;