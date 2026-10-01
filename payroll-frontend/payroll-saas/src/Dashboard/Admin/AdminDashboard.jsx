import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaMoneyBillWave, FaUsers, FaExchangeAlt, FaSignOutAlt, FaArrowLeft } from "react-icons/fa";
import { Card, Row, Col, Table, Badge, Button, Container, Spinner } from "react-bootstrap";
import { Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, ArcElement, LineElement, Tooltip, Legend } from "chart.js";
import { useAuth } from "../../hooks/useAuth";
import { useFetchAdminProfile } from "../../hooks/useAPI";
import { adminAPI } from "../../services/api";

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, loading: profileLoading } = useFetchAdminProfile();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showEmployerDetails, setShowEmployerDetails] = useState(false);

  // Data from API
  const [summary, setSummary] = useState({
    totalCreditsAdded: 0,
    creditsAssigned: 0,
    totalTransactions: 0,
    totalEmployers: 0,
    totalEmployees: 0,
  });
  const [employers, setEmployers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch summary
        const summaryRes = await adminAPI.getDashboardSummary?.();
        if (summaryRes?.data?.data) {
          setSummary(summaryRes.data.data);
        }

        // Fetch employers list
        const empRes = await adminAPI.getEmployers?.();
        if (empRes?.data?.data) {
          setEmployers(empRes.data.data);
        }

        // Fetch employees list
        const empyRes = await adminAPI.getEmployees?.();
        if (empyRes?.data?.data) {
          setEmployees(empyRes.data.data);
        }

        // Fetch transactions
        const transRes = await adminAPI.getTransactions?.();
        if (transRes?.data?.data) {
          setTransactions(transRes.data.data);
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

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const lineData = {
    labels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Credits Added",
        data: [22000, 27000, 35000, 42000, 39000, summary.totalCreditsAdded],
        borderColor: colors.primaryRed,
        backgroundColor: `rgba(198,40,40,0.18)`,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const doughnutData = {
    labels: ["Assigned", "Remaining"],
    datasets: [
      {
        data: [summary.creditsAssigned, summary.totalCreditsAdded - summary.creditsAssigned],
        backgroundColor: [colors.primaryRed, colors.lightGray],
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: isMobile ? 'bottom' : 'top',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

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

  // Employer Details View
  const EmployerDetailsView = () => (
    <Container fluid className="px-3 px-md-4 py-4">
      <Button variant="link" style={{ color: colors.primaryRed }} onClick={() => setShowEmployerDetails(false)}>
        <FaArrowLeft /> Back
      </Button>
      <h2 style={{ color: colors.black }}>Employer Management</h2>

      <Card style={cardStyle}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Employer Name</th>
                  <th>Credits Used</th>
                  <th>Remaining</th>
                  <th>Transactions</th>
                  <th>Last Payment</th>
                </tr>
              </thead>
              <tbody>
                {employers.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.company_name || emp.user?.name || 'N/A'}</td>
                    <td>{formatCurrency((emp.credit?.total_added || 0) - (emp.credit?.balance || 0))}</td>
                    <td>{formatCurrency(emp.credit?.balance || 0)}</td>
                    <td>{emp.transactions_count || 0}</td>
                    <td>{emp.last_payment_date ? new Date(emp.last_payment_date).toLocaleDateString() : 'No payments'}</td>
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
        <h2 style={{ color: colors.black }}>Admin Dashboard</h2>
      </div>

      <Row className="g-3 g-md-4 mb-4">
        {/* Key Metrics - Row 1 */}
        <Col xs={12} sm={6} lg={3}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaMoneyBillWave className="me-2" /> Total Credits
            </div>
            <Card.Body className="p-4">
              <h3 style={{ color: colors.primaryRed, fontWeight: '700', marginBottom: '0.5rem' }}>
                {formatCurrency(summary.totalCreditsAdded)}
              </h3>
              <div style={{ fontSize: '0.85rem', color: colors.darkGray }}>
                <div>Assigned: {formatCurrency(summary.creditsAssigned)}</div>
                <div className="mt-1">Available: {formatCurrency(summary.totalCreditsAdded - summary.creditsAssigned)}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaUsers className="me-2" /> Employers
            </div>
            <Card.Body className="p-4">
              <h3 style={{ color: colors.primaryRed, fontWeight: '700', marginBottom: '0.5rem' }}>
                {summary.totalEmployers}
              </h3>
              <div style={{ fontSize: '0.85rem', color: colors.darkGray }}>
                <div>Active: {summary.activeEmployers || 0}</div>
                <div className="mt-1">Inactive: {summary.totalEmployers - (summary.activeEmployers || 0)}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaUsers className="me-2" /> Employees
            </div>
            <Card.Body className="p-4">
              <h3 style={{ color: colors.primaryRed, fontWeight: '700', marginBottom: '0.5rem' }}>
                {summary.totalEmployees}
              </h3>
              <div style={{ fontSize: '0.85rem', color: colors.darkGray }}>
                <div>Active: {summary.activeEmployees || 0}</div>
                <div className="mt-1">Inactive: {summary.totalEmployees - (summary.activeEmployees || 0)}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaExchangeAlt className="me-2" /> Transactions
            </div>
            <Card.Body className="p-4">
              <h3 style={{ color: colors.primaryRed, fontWeight: '700', marginBottom: '0.5rem' }}>
                {summary.totalTransactions}
              </h3>
              <div style={{ fontSize: '0.85rem', color: colors.darkGray }}>
                <div>Last 7 days: {summary.recentTransactions || 0}</div>
                <div className="mt-1">Avg/day: {Math.round((summary.recentTransactions || 0) / 7)}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats Row */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={6} md={3}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Card.Body className="p-3">
              <div style={{ fontSize: '0.75rem', color: colors.darkGray, marginBottom: '0.5rem' }}>Vendors</div>
              <h4 style={{ color: colors.primaryRed, fontWeight: '700', margin: 0 }}>{summary.totalVendors || 0}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Card.Body className="p-3">
              <div style={{ fontSize: '0.75rem', color: colors.darkGray, marginBottom: '0.5rem' }}>Job Vacancies</div>
              <h4 style={{ color: colors.primaryRed, fontWeight: '700', margin: 0 }}>{summary.activeJobs || 0}/{summary.totalJobs || 0}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Card.Body className="p-3">
              <div style={{ fontSize: '0.75rem', color: colors.darkGray, marginBottom: '0.5rem' }}>Training Courses</div>
              <h4 style={{ color: colors.primaryRed, fontWeight: '700', margin: 0 }}>{summary.ongoingTrainings || 0}/{summary.totalTrainings || 0}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Card.Body className="p-3">
              <div style={{ fontSize: '0.75rem', color: colors.darkGray, marginBottom: '0.5rem' }}>Subscriptions</div>
              <h4 style={{ color: colors.primaryRed, fontWeight: '700', margin: 0 }}>{summary.activeSubscriptions || 0}/{summary.totalSubscriptions || 0}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} lg={6}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaMoneyBillWave className="me-2" /> Credit Allocation
            </div>
            <Card.Body className="p-4">
              <div style={{ height: '300px' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaMoneyBillWave className="me-2" /> Credits Trend
            </div>
            <Card.Body className="p-4">
              <div style={{ height: '300px' }}>
                <Line data={lineData} options={lineOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Employers Section */}
      <Row className="g-3 g-md-4">
        <Col xs={12}>
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaUsers className="me-2" /> Top Employers
            </div>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Employer Name</th>
                      <th>Credits Used</th>
                      <th>Remaining</th>
                      <th>Transactions</th>
                      <th>Last Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employers.slice(0, 5).map(emp => (
                      <tr key={emp.id}>
                        <td>{emp.company_name || emp.user?.name || 'N/A'}</td>
                        <td>{formatCurrency((emp.credit?.total_added || 0) - (emp.credit?.balance || 0))}</td>
                        <td>{formatCurrency(emp.credit?.balance || 0)}</td>
                        <td>{emp.transactions_count || 0}</td>
                        <td>{emp.last_payment_date ? new Date(emp.last_payment_date).toLocaleDateString() : 'No payments'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="text-center mt-3 p-3">
                <Button style={buttonStyle} onClick={() => setShowEmployerDetails(true)}>
                  View All Employers
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
      {showEmployerDetails ? <EmployerDetailsView /> : <DashboardView />}
    </div>
  );
};

export default AdminDashboard;
