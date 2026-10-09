import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaMoneyBillWave, FaUsers, FaExchangeAlt, FaSignOutAlt, FaArrowLeft } from "react-icons/fa";
import { Card, Row, Col, Table, Badge, Button, Container, Spinner } from "react-bootstrap";
import { Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, ArcElement, LineElement, Tooltip, Legend } from "chart.js";
import { useAuth } from "../../hooks/useAuth";
import { useFetchAdminProfile } from "../../hooks/useAPI";
import { adminAPI } from "../../services/api";
import { useRegional } from "../../context/RegionalContext";
import TrialExpiryModal from "../../components/TrialExpiryModal";
import { ShieldAlert, ArrowRight } from "lucide-react";

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
  const { formatCurrency } = useRegional();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showEmployerDetails, setShowEmployerDetails] = useState(false);

  // 7-Day Free Trial Banner & Modal States
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [is7DayTrialUser, setIs7DayTrialUser] = useState(false);
  const [trialBannerInfo, setTrialBannerInfo] = useState({
    registeredDate: '',
    expiryDate: '',
    dayOfTrial: 1,
    daysLeft: 7,
  });

  // Fetch and check 7-Day Free Trial status
  useEffect(() => {
    const checkTrialSubscription = async () => {
      try {
        const subRes = await adminAPI.getMySubscription?.();
        if (subRes?.data?.success && subRes.data.data) {
          const sub = subRes.data.data;
          const planName = (sub.plan?.name || sub.plan_name || '').toUpperCase();
          const is7DayTrial = planName.includes('FREE TRIAL') || planName.includes('TRIAL') || sub.plan_id === 1;

          // Only apply trial logic if on 7-Day Free Trial
          if (is7DayTrial) {
            setIs7DayTrialUser(true);
            const startDate = new Date(sub.start_date || sub.created_at || Date.now());

            let endDate;
            if (sub.end_date) {
              const customEnd = new Date(sub.end_date);
              const diffFromStart = (customEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
              if (diffFromStart <= 8 && diffFromStart > 0) {
                endDate = customEnd;
              } else {
                endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
              }
            } else {
              endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            }

            const now = new Date();
            const diffMs = endDate.getTime() - now.getTime();
            const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            const expired = daysRemaining <= 0 || sub.status === 'expired';

            // Calculate current Day X of 7 dynamically
            const msFromStart = Math.max(0, now.getTime() - startDate.getTime());
            const daysFromStart = Math.floor(msFromStart / (1000 * 60 * 60 * 24));
            const currentDayNumber = Math.min(7, Math.max(1, daysFromStart + 1));

            const formatDate = (d) => {
              try {
                return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              } catch {
                return '';
              }
            };

            setTrialDaysLeft(daysRemaining);
            setIsTrialExpired(expired);
            setTrialBannerInfo({
              registeredDate: formatDate(startDate),
              expiryDate: formatDate(endDate),
              dayOfTrial: currentDayNumber,
              daysLeft: daysRemaining,
            });

            // If expired, access is blocked immediately (cannot be dismissed)
            if (expired) {
              return;
            }

            // If active trial, show popup (unless user dismissed it in this browser session)
            if (sessionStorage.getItem('trial_modal_dismissed') !== 'true') {
              setShowTrialModal(true);
            }
          }
        }
      } catch (err) {
        // Silently catch error
      }
    };

    checkTrialSubscription();
  }, []);

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
      {/* 7-Day Free Trial Dynamic Banner matching software theme */}
      {is7DayTrialUser && !isTrialExpired && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF7F7 100%)',
            border: '1px solid rgba(198, 40, 40, 0.28)',
            boxShadow: '0 4px 16px rgba(198, 40, 40, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03)',
            borderRadius: '16px',
            padding: '16px 22px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}
        >
          {/* Top Line: Badge + Dynamic Details */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Kiaan Red 7-Day Free Trial Badge */}
            <span
              style={{
                background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)',
                color: '#FFFFFF',
                fontWeight: '750',
                fontSize: '11.5px',
                padding: '4px 14px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(198, 40, 40, 0.3)',
              }}
            >
              ✨ 7-DAY FREE TRIAL
            </span>

            {/* Dynamic Status Text */}
            <div
              style={{
                color: '#0F172A',
                fontSize: '14.5px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span>
                Registered on <strong style={{ color: '#0F172A' }}>{trialBannerInfo.registeredDate}</strong> • Day{' '}
                <strong style={{ color: '#0F172A' }}>{trialBannerInfo.dayOfTrial}</strong> of 7
              </span>
              <span style={{ color: '#CBD5E1' }}>|</span>
              <span style={{ color: '#C62828', fontWeight: '800' }}>
                ⏳ {trialBannerInfo.daysLeft} {trialBannerInfo.daysLeft === 1 ? 'Day' : 'Days'} Remaining
              </span>
              <span style={{ color: '#64748B', fontSize: '13.5px' }}>
                (Expires {trialBannerInfo.expiryDate})
              </span>
            </div>
          </div>

          {/* Bottom Line: Upgrade Button */}
          <div>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '13px',
                padding: '7px 20px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(198, 40, 40, 0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(198, 40, 40, 0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(198, 40, 40, 0.35)';
              }}
            >
              Upgrade Plan / Buy Now <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

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

  // When 7-Day Free Trial is expired, completely block access to dashboard and sidebar
  if (isTrialExpired) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(198, 40, 40, 0.06)',
            padding: '42px 36px 36px 36px',
            textAlign: 'center',
            color: '#0F172A',
            maxWidth: '500px',
            width: '100%',
          }}
        >
          {/* Lock / Access Denied Icon Badge */}
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '2px solid rgba(239, 68, 68, 0.25)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 22px auto',
            }}
          >
            <ShieldAlert size={38} style={{ color: '#DC2626' }} />
          </div>

          {/* Heading */}
          <h3
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#0F172A',
              marginBottom: '14px',
              letterSpacing: '-0.3px',
            }}
          >
            Access Denied: Free Trial Expired!
          </h3>

          {/* Description */}
          <p
            style={{
              color: '#64748B',
              fontSize: '15px',
              lineHeight: '1.6',
              marginBottom: '28px',
            }}
          >
            Your <strong style={{ color: '#DC2626' }}>7-Day Free Trial</strong> period has ended. Access to your company payroll dashboard, employee records, and workforce management is locked. Please upgrade your subscription plan now to regain full access.
          </p>

          {/* Upgrade Plan Button */}
          <button
            onClick={() => navigate('/pricing')}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '15px',
              letterSpacing: '0.5px',
              boxShadow: '0 8px 24px rgba(198, 40, 40, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(198, 40, 40, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(198, 40, 40, 0.35)';
            }}
          >
            UPGRADE PLAN NOW <ArrowRight size={18} />
          </button>

          {/* Logout Button */}
          <div>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0F172A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
              }}
            >
              <FaSignOutAlt size={14} /> Logout from Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightBg }}>
      {showEmployerDetails ? <EmployerDetailsView /> : <DashboardView />}
      <TrialExpiryModal
        show={showTrialModal}
        onHide={() => {
          sessionStorage.setItem('trial_modal_dismissed', 'true');
          setShowTrialModal(false);
        }}
        daysRemaining={trialDaysLeft}
        isExpired={isTrialExpired}
        onUpgradeClick={() => {
          sessionStorage.setItem('trial_modal_dismissed', 'true');
          setShowTrialModal(false);
          navigate('/pricing');
        }}
      />
    </div>
  );
};

export default AdminDashboard;
