import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Table, Badge, Button, Container, Spinner } from "react-bootstrap";
import { FaMoneyBillWave, FaShoppingCart, FaCheckCircle, FaClipboardList, FaSignOutAlt, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { useFetchVendorProfile } from "../../hooks/useAPI";
import { vendorAPI } from "../../services/api";

const colors = {
  primary: "#C62828",
  primaryDark: "#B71C1C",
  secondary: "#FF5252",
  white: "#FFFFFF",
  black: "#000000",
  grayDark: "#4A4A4A",
  gray: "#757575",
  grayLight: "#F5F5F5",
  grayBorder: "#E0E0E0",
  success: "#4CAF50",
  warning: "#FF9800",
  danger: "#F44336",
};

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, loading: profileLoading } = useFetchVendorProfile();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAllContracts, setShowAllContracts] = useState(false);

  // Data from API
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalContracts: 0,
    completedContracts: 0,
    pendingPayments: 0,
  });
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);

  // Fetch vendor dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch combined dashboard data
        const response = await vendorAPI.getMyPayments();
        if (response?.data?.data) {
          const { summary, contracts, payments } = response.data.data;
          if (summary) setDashboardData(summary);
          if (contracts) setContracts(contracts || []);
          if (payments) setPayments(payments || []);
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

  // Update isMobile on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const cardStyle = {
    background: colors.white,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    overflow: "hidden",
    marginBottom: 24,
    border: `1px solid ${colors.grayBorder}`,
  };

  const cardHeaderStyle = {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: "10px 14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
  };

  const statCardStyle = {
    textAlign: "center",
    padding: "20px",
  };

  const buttonStyle = {
    backgroundColor: colors.primary,
    color: colors.white,
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "12px",
  };

  if (profileLoading || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" style={{ color: colors.primary }} />
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

  // Contracts Detail View
  const AllContractsView = () => (
    <Container fluid className="px-3 px-md-4 py-4">
      <Button variant="link" style={{ color: colors.primary }} onClick={() => setShowAllContracts(false)}>
        <FaArrowLeft /> Back
      </Button>
      <h2 style={{ color: colors.black }}>All Contracts</h2>

      <Card style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <Table hover className="align-middle mb-0" style={{ fontSize: '13px', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: colors.grayLight }}>
                <th>Contract ID</th>
                <th>Employer</th>
                <th>Amount</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(contract => (
                <tr key={contract.id}>
                  <td>{contract.id}</td>
                  <td>{contract.employer}</td>
                  <td>{formatCurrency(contract.amount)}</td>
                  <td>{formatDate(contract.startDate)}</td>
                  <td>{formatDate(contract.endDate)}</td>
                  <td>
                    <Badge bg={contract.status === 'Active' ? 'success' : contract.status === 'Completed' ? 'info' : 'warning'}>
                      {contract.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </Container>
  );

  // Main Dashboard View
  const DashboardView = () => (
    <Container fluid className="px-3 px-md-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: colors.black }}>Welcome, {profile?.companyName}!</h2>
      </div>

      {/* Key Metrics */}
      <Row className="g-3 g-md-4 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <Card style={cardStyle}>
            <div style={cardHeaderStyle}>
              <FaMoneyBillWave className="me-2" /> Total Revenue
            </div>
            <Card.Body style={statCardStyle}>
              <h3 style={{ color: colors.primary, fontWeight: '700', margin: 0 }}>
                {formatCurrency(dashboardData.totalRevenue)}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card style={cardStyle}>
            <div style={cardHeaderStyle}>
              <FaClipboardList className="me-2" /> Total Contracts
            </div>
            <Card.Body style={statCardStyle}>
              <h3 style={{ color: colors.primary, fontWeight: '700', margin: 0 }}>
                {dashboardData.totalContracts}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card style={cardStyle}>
            <div style={cardHeaderStyle}>
              <FaCheckCircle className="me-2" /> Completed
            </div>
            <Card.Body style={statCardStyle}>
              <h3 style={{ color: colors.success, fontWeight: '700', margin: 0 }}>
                {dashboardData.completedContracts}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card style={cardStyle}>
            <div style={cardHeaderStyle}>
              <FaShoppingCart className="me-2" /> Pending Payments
            </div>
            <Card.Body style={statCardStyle}>
              <h3 style={{ color: colors.warning, fontWeight: '700', margin: 0 }}>
                {formatCurrency(dashboardData.pendingPayments)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Active Contracts */}
      <Row className="g-3 g-md-4">
        <Col xs={12}>
          <Card style={cardStyle}>
            <div style={cardHeaderStyle}>
              <FaClipboardList className="me-2" /> Active Contracts
            </div>
            <Card.Body className="p-0">
              <div style={{ overflowX: 'auto' }}>
                <Table hover className="align-middle mb-0" style={{ fontSize: '13px', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.grayLight }}>
                      <th>Contract ID</th>
                      <th>Employer</th>
                      <th>Amount</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.filter(c => c.status === 'Active').slice(0, 5).map(contract => (
                      <tr key={contract.id}>
                        <td>{contract.id}</td>
                        <td>{contract.employer}</td>
                        <td>{formatCurrency(contract.amount)}</td>
                        <td>{formatDate(contract.startDate)}</td>
                        <td>{formatDate(contract.endDate)}</td>
                        <td>
                          <Badge bg="success">{contract.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="text-center mt-3 p-3">
                <Button style={buttonStyle} onClick={() => setShowAllContracts(true)}>
                  View All Contracts
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Payments */}
        <Col xs={12}>
          <Card style={cardStyle}>
            <div style={cardHeaderStyle}>
              <FaMoneyBillWave className="me-2" /> Recent Payments
            </div>
            <Card.Body className="p-0">
              <div style={{ overflowX: 'auto' }}>
                <Table hover className="align-middle mb-0" style={{ fontSize: '13px', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.grayLight }}>
                      <th>Payment ID</th>
                      <th>Contract ID</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 5).map(payment => (
                      <tr key={payment.id}>
                        <td>{payment.id}</td>
                        <td>{payment.contractId}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{formatDate(payment.date)}</td>
                        <td>
                          <Badge bg={payment.status === 'Completed' ? 'success' : 'warning'}>
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.white }}>
      {showAllContracts ? <AllContractsView /> : <DashboardView />}
    </div>
  );
};

export default VendorDashboard;
