import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCreditCard, FaHistory, FaMoneyBillWave, FaUserFriends, FaSearch,
  FaPlus, FaFilter, FaDownload, FaEye, FaCheckCircle, FaTimesCircle, FaTimes, FaSignOutAlt, FaArrowLeft
} from "react-icons/fa";
import { Card, Row, Col, Table, Badge, Button, Modal, Form, Container, Spinner } from "react-bootstrap";
import { Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, ArcElement, LineElement, Tooltip, Legend } from "chart.js";
import { useAuth } from "../../hooks/useAuth";
import { useFetchEmployerProfile } from "../../hooks/useAPI";
import { employerAPI } from "../../services/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement);

const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#4A4A4A',
  lightGray: '#E2E2E2',
  lightBg: '#FFFFFF',
};

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, loading: profileLoading } = useFetchEmployerProfile();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);

  // Data from API
  const [creditBalance, setCreditBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [creditHistory, setCreditHistory] = useState([]);
  const [chartData, setChartData] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch credit balance
        const balanceRes = await employerAPI.getCreditBalance?.();
        if (balanceRes?.data?.data) {
          setCreditBalance(balanceRes.data.data.balance || 0);
        }

        // Fetch transactions
        const transRes = await employerAPI.getTransactions?.();
        if (transRes?.data?.data) {
          setTransactions(transRes.data.data);
        }

        // Fetch beneficiaries
        const benRes = await employerAPI.getBeneficiaries?.();
        if (benRes?.data?.data) {
          setBeneficiaries(benRes.data.data);
        }

        // Fetch credit history
        const histRes = await employerAPI.getCreditHistory?.();
        if (histRes?.data?.data) {
          setCreditHistory(histRes.data.data);
        }

        // Prepare chart data
        const chartRes = await employerAPI.getTransactionChart?.();
        if (chartRes?.data?.data) {
          setChartData(chartRes.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Default chart data
  const defaultLineData = {
    labels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Credit Balance",
        data: [8000, 9500, 7500, 11000, 9000, creditBalance],
        borderColor: colors.primaryRed,
        backgroundColor: `rgba(198,40,40,0.18)`,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const defaultDoughnutData = {
    labels: ["Used", "Available"],
    datasets: [
      {
        data: [creditBalance * 0.4, creditBalance * 0.6],
        backgroundColor: [colors.primaryRed, colors.lightGray],
        borderColor: colors.white,
        borderWidth: 2,
      },
    ],
  };

  const filteredTransactions = transactions.filter(t =>
    t.beneficiary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  // Transactions Detail View
  const AllTransactionsView = () => (
    <Container fluid className="px-3 px-md-4 py-4">
      <Button variant="link" style={{ color: colors.primaryRed }} onClick={() => setShowAllTransactions(false)}>
        <FaArrowLeft /> Back
      </Button>
      <h2 style={{ color: colors.black }}>All Transactions</h2>

      <Card style={cardStyle}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Beneficiary</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.beneficiary}</td>
                    <td>{t.description}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(t.amount)}</td>
                    <td>
                      <Badge bg={t.status === 'Success' ? 'success' : 'warning'}>{t.status}</Badge>
                    </td>
                    <td>{t.reference}</td>
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
        <h2 style={{ color: colors.black }}>Welcome, {profile?.companyName}!</h2>
      </div>

      <Row className="g-3 g-md-4">
        {/* Credit Balance Card */}
        <Col xs={12} lg={6} md={12}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaCreditCard className="me-2" /> Credit Balance
            </div>
            <Card.Body className="p-4">
              <div className="mb-4">
                <h5 style={{ color: colors.darkGray }}>Available Balance</h5>
                <h2 style={{ color: colors.primaryRed, fontWeight: '700' }}>{formatCurrency(creditBalance)}</h2>
              </div>
              <div style={{ height: '200px' }}>
                <Doughnut data={defaultDoughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col xs={12} lg={6} md={12}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaMoneyBillWave className="me-2" /> Payment Stats
            </div>
            <Card.Body className="p-4">
              <Row>
                <Col xs={6} className="mb-3">
                  <div style={{ textAlign: 'center' }}>
                    <h5 style={{ color: colors.darkGray, fontSize: '12px' }}>Total Transactions</h5>
                    <h3 style={{ color: colors.primaryRed, fontWeight: '700' }}>{transactions.length}</h3>
                  </div>
                </Col>
                <Col xs={6} className="mb-3">
                  <div style={{ textAlign: 'center' }}>
                    <h5 style={{ color: colors.darkGray, fontSize: '12px' }}>Successful</h5>
                    <h3 style={{ color: 'green', fontWeight: '700' }}>
                      {transactions.filter(t => t.status === 'Success').length}
                    </h3>
                  </div>
                </Col>
                <Col xs={6} className="mb-3">
                  <div style={{ textAlign: 'center' }}>
                    <h5 style={{ color: colors.darkGray, fontSize: '12px' }}>Pending</h5>
                    <h3 style={{ color: 'orange', fontWeight: '700' }}>
                      {transactions.filter(t => t.status === 'Pending').length}
                    </h3>
                  </div>
                </Col>
                <Col xs={6}>
                  <div style={{ textAlign: 'center' }}>
                    <h5 style={{ color: colors.darkGray, fontSize: '12px' }}>Beneficiaries</h5>
                    <h3 style={{ color: colors.primaryRed, fontWeight: '700' }}>{beneficiaries.length}</h3>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Transactions Chart */}
        <Col xs={12}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaHistory className="me-2" /> Credit Balance Trend
            </div>
            <Card.Body className="p-4">
              <div style={{ height: '300px' }}>
                <Line data={defaultLineData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Transactions */}
        <Col xs={12}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaMoneyBillWave className="me-2" /> Recent Transactions
            </div>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Beneficiary</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map(t => (
                      <tr key={t.id}>
                        <td>{formatDate(t.date)}</td>
                        <td>{t.beneficiary}</td>
                        <td>{t.description}</td>
                        <td style={{ fontWeight: '600' }}>{formatCurrency(t.amount)}</td>
                        <td>
                          <Badge bg={t.status === 'Success' ? 'success' : 'warning'}>{t.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="text-center mt-3 p-3">
                <Button style={buttonStyle} onClick={() => setShowAllTransactions(true)}>
                  View All Transactions
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightBg }}>
      {showAllTransactions ? <AllTransactionsView /> : <DashboardView />}
    </div>
  );
};

export default EmployerDashboard;
