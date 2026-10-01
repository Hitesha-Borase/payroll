import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Badge, Button, Modal, Form, Container, Image, InputGroup, Spinner } from 'react-bootstrap';
import {
  FaUser, FaMoneyBillWave, FaCalendarAlt, FaFileInvoiceDollar, FaHistory,
  FaEye, FaDownload, FaChartLine, FaBars, FaTimes, FaCamera, FaArrowLeft, FaSearch, FaSignOutAlt, FaWallet
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useFetchEmployeeProfile, useFetchEmployeeAttendance } from '../../hooks/useAPI';
import { employeeAPI } from '../../services/api';

const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#4A4A4A',
  lightGray: '#E2E2E2',
  lightBg: '#FFFFFF',
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { profile, loading: profileLoading, error: profileError, updateProfile: updateProfileAPI } = useFetchEmployeeProfile();
  const { attendance, loading: attendanceLoading, markAttendance } = useFetchEmployeeAttendance();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showSalaryHistory, setShowSalaryHistory] = useState(false);
  const [showAllBills, setShowAllBills] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data from API
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [bills, setBills] = useState([]);

  const fileInputRef = useRef(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch comprehensive summary
        const summaryRes = await employeeAPI.getDashboard();
        if (summaryRes?.data?.success) {
          setDashboardData(summaryRes.data.data);
          setTransactions(summaryRes.data.data.recent_transactions || []);
        }

        // Fetch deep lists for modals/views if needed
        const historyRes = await employeeAPI.getSalaryHistory();
        if (historyRes?.data?.success) {
          setSalaryHistory(historyRes.data.data);
        }

        const billsRes = await employeeAPI.getBills();
        if (billsRes?.data?.success) {
          setBills(billsRes.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Sync profile image if not set
  useEffect(() => {
    if (dashboardData?.profile?.profile_image) {
      setProfileImagePreview(dashboardData.profile.profile_image);
    }
  }, [dashboardData]);


  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: e.target.name.value,
        phone: e.target.phone.value,
        address: e.target.address.value,
        emergency_contact: e.target.emergency_contact?.value || ''
      };

      const res = await employeeAPI.updateProfile(updateData);
      if (res.data.success) {
        toast.success('Profile updated successfully!');
        setShowProfileModal(false);
        // Refresh dashboard data
        const summaryRes = await employeeAPI.getDashboard();
        if (summaryRes?.data?.success) setDashboardData(summaryRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to update profile: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle pay bill
  const handlePayBill = async (billId) => {
    try {
      const result = await employeeAPI.payBill?.(billId);
      if (result?.data?.success) {
        setBills(bills.map(bill =>
          bill.id === billId ? { ...bill, status: 'Paid' } : bill
        ));
        toast.success('Bill paid successfully!');
      } else {
        toast.error('Error paying bill');
      }
    } catch (err) {
      toast.error('Failed to pay bill');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Formatting functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Download payslip
  const downloadPayslipPDF = (salary) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const drawLine = (y) => {
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, pageWidth - 20, y);
    };

    doc.setFontSize(22);
    doc.setTextColor(colors.primaryRed);
    doc.text('Payslip', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`Pay Period: ${salary.month}`, pageWidth / 2, 35, { align: 'center' });

    drawLine(45);

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Employee Details', 20, 58);

    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text(`Name: ${profile?.name}`, 20, 68);
    doc.text(`Email: ${profile?.email}`, 20, 76);
    doc.text(`Department: ${profile?.department}`, 20, 84);

    const earningsData = [
      ['Basic Salary', formatCurrency(salary.basicSalary)],
      ['HRA', formatCurrency(salary.hra)],
      ['Allowances', formatCurrency(salary.allowances || 0)],
    ];

    doc.autoTable({
      head: [['Description', 'Amount']],
      body: earningsData,
      startY: 95,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 1.5 },
    });

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text('Gross Salary:', 20, doc.lastAutoTable.finalY + 10);
    doc.text(formatCurrency(salary.grossSalary), 110, doc.lastAutoTable.finalY + 10, { align: 'right' });

    const deductionsData = [
      ['PF', formatCurrency(salary.pf || 0)],
      ['TDS', formatCurrency(salary.tds || 0)],
    ];

    doc.autoTable({
      head: [['Description', 'Amount']],
      body: deductionsData,
      startY: doc.lastAutoTable.finalY + 20,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 1.5 },
    });

    doc.setFont(undefined, 'bold');
    doc.text('Net Salary:', 20, doc.lastAutoTable.finalY + 10);
    doc.text(formatCurrency(salary.netSalary), 110, doc.lastAutoTable.finalY + 10, { align: 'right' });

    doc.save(`Payslip_${profile?.name.replace(' ', '_')}_${salary.month}.pdf`);
  };

  // Filter data based on search
  const filteredTransactions = transactions.filter(t =>
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBills = bills.filter(b =>
    b.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSalaryHistory = salaryHistory.filter(s =>
    s.month?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardStyle = {
    backgroundColor: colors.white,
    border: `1px solid ${colors.lightGray}`,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '24px',
    height: '100%',
  };

  const headerStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    padding: '10px 14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
  };

  const buttonStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '12px',
  };

  if (profileLoading || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" style={{ color: colors.primaryRed }} />
      </div>
    );
  }

  if (error || profileError) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger">
          {error || profileError || 'Failed to load dashboard'}
        </div>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="py-5">
        <div className="alert alert-warning">Profile not found</div>
      </Container>
    );
  }

  // All Transactions View
  const AllTransactionsView = () => (
    <Container fluid className="px-3 px-md-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="link" style={{ color: colors.primaryRed }} onClick={() => setShowAllTransactions(false)}>
          <FaArrowLeft /> Back
        </Button>
        <h2 style={{ color: colors.black, margin: 0 }}>All Transactions</h2>
      </div>

      <Card style={cardStyle}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => (
                  <tr key={t.id}>
                    <td>
                      <Badge bg={t.type === 'credit' ? 'success' : 'warning'}>{t.type}</Badge>
                    </td>
                    <td>{t.description}</td>
                    <td>{formatDate(t.date)}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(t.amount)}</td>
                    <td>
                      <Badge bg={t.status === 'completed' ? 'success' : 'warning'}>{t.status}</Badge>
                    </td>
                    <td>
                      <Button variant="link" size="sm" style={{ color: colors.primaryRed, padding: 0 }}>
                        <FaDownload />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );

  // Salary History View
  const SalaryHistoryView = () => (
    <Container fluid className="px-3 px-md-4 py-4">
      <Button variant="link" style={{ color: colors.primaryRed }} onClick={() => setShowSalaryHistory(false)}>
        <FaArrowLeft /> Back
      </Button>
      <h2 style={{ color: colors.black }}>Salary History</h2>

      <Card style={cardStyle}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaryHistory.map(s => (
                  <tr key={s.id}>
                    <td>{s.month}</td>
                    <td>{formatCurrency(s.grossSalary)}</td>
                    <td>{formatCurrency((s.pf || 0) + (s.tds || 0))}</td>
                    <td style={{ fontWeight: '600', color: colors.primaryRed }}>{formatCurrency(s.netSalary)}</td>
                    <td>
                      <Badge bg="success">{s.status}</Badge>
                    </td>
                    <td>
                      <Button variant="link" size="sm" style={{ color: colors.primaryRed, padding: 0 }} onClick={() => downloadPayslipPDF(s)}>
                        <FaDownload />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );

  // Bills View
  const AllBillsView = () => (
    <Container fluid className="px-3 px-md-4 py-4">
      <Button variant="link" style={{ color: colors.primaryRed }} onClick={() => setShowAllBills(false)}>
        <FaArrowLeft /> Back
      </Button>
      <h2 style={{ color: colors.black }}>All Bills</h2>

      <Card style={cardStyle}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Bill Name</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(b => (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{formatCurrency(b.amount)}</td>
                    <td>{formatDate(b.dueDate)}</td>
                    <td>
                      <Badge bg={b.status === 'paid' ? 'success' : 'danger'}>{b.status}</Badge>
                    </td>
                    <td>
                      {b.status === 'pending' && (
                        <Button size="sm" style={buttonStyle} onClick={() => handlePayBill(b.id)}>
                          Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );

  // Main Dashboard View
  const DashboardView = () => (
    <Container fluid className="px-3 px-md-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: colors.black }}>Welcome, {dashboardData?.profile?.name?.split(' ')[0]}!</h2>
      </div>

      <Row className="g-3 g-md-4">
        {/* Profile Card */}
        <Col xs={12} lg={4} md={6}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaUser className="me-2" /> Employee Profile
            </div>
            <Card.Body className="text-center p-4">
              <h4 style={{ color: colors.black }}>{dashboardData?.profile?.name}</h4>
              <p style={{ color: colors.darkGray }}>{dashboardData?.profile?.designation || 'Employee'}</p>
              <p style={{ color: colors.darkGray, fontSize: '13px' }}>{dashboardData?.profile?.company || 'Jamaica Payroll'}</p>
              <Button style={buttonStyle} onClick={() => setShowProfileModal(true)}>
                Edit Profile
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Wallet Card */}
        <Col xs={12} lg={4} md={6}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaWallet className="me-2" /> Wallet Balance
            </div>
            <Card.Body className="p-4 text-center d-flex flex-column justify-content-center">
              <h5 style={{ color: colors.darkGray, fontSize: '14px' }}>Available Credit</h5>
              <h3 style={{ color: colors.primaryRed, fontWeight: '700' }}>
                {formatCurrency(dashboardData?.profile?.credit_balance || 0)}
              </h3>
              <p style={{ fontSize: '12px', color: colors.darkGray, marginTop: '8px' }}>
                Credits received from employer for internal usage.
              </p>
              <Button style={buttonStyle} onClick={() => navigate('/Employee/salary')}>
                Transaction History
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Salary Summary Card */}
        <Col xs={12} lg={4} md={6}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaMoneyBillWave className="me-2" /> Salary Summary
            </div>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between mb-2">
                <span style={{ color: colors.darkGray }}>Paid Salary:</span>
                <span style={{ fontWeight: '600', color: colors.successGreen }}>{formatCurrency(dashboardData?.salary?.paid || 0)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span style={{ color: colors.darkGray }}>Pending Salary:</span>
                <span style={{ fontWeight: '600', color: colors.primaryRed }}>{formatCurrency(dashboardData?.salary?.pending || 0)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 border-top pt-2">
                <span style={{ color: colors.darkGray }}>Last Payment:</span>
                <span style={{ fontWeight: '600' }}>{dashboardData?.salary?.last_payment ? formatDate(dashboardData.salary.last_payment) : 'N/A'}</span>
              </div>              <Button style={buttonStyle} className="w-100" onClick={() => navigate('/Employee/salary')}>
                <FaChartLine className="me-2" /> View Detailed History
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Attendance & Training Summary */}
        <Col xs={12} lg={4} md={6}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaCalendarAlt className="me-2" /> Quick Stats
            </div>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between mb-3">
                <div className="text-center">
                  <h6 style={{ color: colors.darkGray, fontSize: '12px' }}>Days Present</h6>
                  <h4 style={{ fontWeight: '700' }}>{dashboardData?.attendance?.present_this_month || 0}</h4>
                </div>
                <div className="text-center">
                  <h6 style={{ color: colors.darkGray, fontSize: '12px' }}>Late Entries</h6>
                  <h4 style={{ fontWeight: '700', color: colors.primaryRed }}>{dashboardData?.attendance?.late_this_month || 0}</h4>
                </div>
                <div className="text-center">
                  <h6 style={{ color: colors.darkGray, fontSize: '12px' }}>Trainings</h6>
                  <h4 style={{ fontWeight: '700', color: colors.primaryRed }}>{dashboardData?.trainings?.assigned_count || 0}</h4>
                </div>
              </div>
              <div className="border-top pt-2 mb-3">
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Bank Status: <Badge bg={dashboardData?.bank?.verification_status === 'verified' ? 'success' : 'warning'}>
                    {dashboardData?.bank?.verification_status || 'Not Added'}
                  </Badge>
                </p>
              </div>
              <Button style={buttonStyle} className="w-100" onClick={() => navigate('/Employee/attendance')}>
                Manage Attendance
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Bills Card */}
        <Col xs={12} lg={4} md={12}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaFileInvoiceDollar className="me-2" /> Bills & Payments
            </div>
            <Card.Body className="p-4">
              <div className="mb-3">
                <h5 style={{ color: colors.darkGray, fontSize: '14px' }}>
                  Total: {dashboardData?.bills?.total || 0} | Pending: <Badge bg="danger">{dashboardData?.bills?.pending || 0}</Badge>
                </h5>
              </div>
              {bills.slice(0, 2).map(bill => (
                <div key={bill.id} className="d-flex justify-content-between align-items-center mb-2 p-2" style={{ backgroundColor: colors.lightGray, borderRadius: '6px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '500', fontSize: '12px' }}>{bill.name}</p>
                    <p style={{ margin: 0, color: colors.darkGray, fontSize: '12px' }}>{formatCurrency(bill.amount)}</p>
                  </div>
                  <Badge bg={bill.status === 'paid' ? 'success' : 'warning'}>{bill.status}</Badge>
                </div>
              ))}
              <Button style={buttonStyle} className="w-100 mt-2" onClick={() => navigate('/Employee/bill-payment')}>
                Manage All Bills
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Transactions Card */}
        <Col xs={12}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaHistory className="me-2" /> Latest Transactions
            </div>
            <Card.Body className="p-4">
              {transactions.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 5).map(t => (
                          <tr key={t.id}>
                            <td><Badge bg={t.type === 'credit' ? 'success' : 'warning'}>{t.type}</Badge></td>
                            <td>{t.description}</td>
                            <td>{formatDate(t.date)}</td>
                            <td style={{ fontWeight: '600' }}>{formatCurrency(t.amount)}</td>
                            <td><Badge bg={t.status === 'completed' ? 'success' : 'warning'}>{t.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <div className="text-center mt-3">
                    <Button style={buttonStyle} onClick={() => setShowAllTransactions(true)}>
                      View All Transactions
                    </Button>
                  </div>
                </>
              ) : (
                <p style={{ color: colors.darkGray }}>No transactions found</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightBg }}>
      {showAllTransactions ? <AllTransactionsView /> :
        showSalaryHistory ? <SalaryHistoryView /> :
          showAllBills ? <AllBillsView /> :
            <DashboardView />}

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleProfileUpdate}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" name="name" defaultValue={dashboardData?.profile?.name} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" defaultValue={dashboardData?.profile?.email} disabled />
              <Form.Text className="text-muted">Email cannot be changed.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control type="text" name="phone" defaultValue={dashboardData?.profile?.phone} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control as="textarea" rows={2} name="address" defaultValue={dashboardData?.profile?.address} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Emergency Contact</Form.Label>
              <Form.Control type="text" name="emergency_contact" defaultValue={dashboardData?.profile?.emergency_contact} />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowProfileModal(false)}>
                Cancel
              </Button>
              <Button type="submit" style={buttonStyle}>
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;
