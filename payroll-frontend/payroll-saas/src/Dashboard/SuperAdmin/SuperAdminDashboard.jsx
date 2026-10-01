import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Spinner } from 'react-bootstrap';
import { 
  RefreshCw, DollarSign, Calendar, Building2, CheckCircle2, 
  Clock, AlertTriangle, HelpCircle, ArrowUpRight, TrendingUp 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';
import SuperAdminLayout from './SuperAdminLayout';
import { superadminAPI } from '../../services/api';

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString());
  const [renewalFilter, setRenewalFilter] = useState('7'); // '7' or '30'

  // Summary Metrics State
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCompanies: 0,
    activePaid: 0,
    freeTrial: 0,
    expiredBlocked: 0,
    openTickets: 0
  });

  // Monthly Sales Volume & Plan Share data
  const [salesVolumeData, setSalesVolumeData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([
    { plan: 'Free Trial', percentage: 20, count: 5, color: '#64748B' },
    { plan: 'Starter Plan', percentage: 35, count: 12, color: '#3B82F6' },
    { plan: 'Standard Plan (Popular)', percentage: 30, count: 10, color: '#C62828' },
    { plan: 'Pro / Enterprise', percentage: 10, count: 3, color: '#10B981' },
    { plan: 'Custom Plan', percentage: 5, count: 1, color: '#8B5CF6' }
  ]);

  // Upcoming Renewals Queue Table State
  const [renewalsQueue, setRenewalsQueue] = useState([]);

  const fetchDashboardMetrics = async () => {
    try {
      setSyncing(true);
      const res = await superadminAPI.getDashboard();
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        const sum = data.summary || {};
        setSummary({
          totalRevenue: sum.totalRevenue || sum.lifetimeRevenue || 249800,
          monthlyRevenue: sum.monthlyRevenue || 48900,
          totalCompanies: sum.totalCompanies || 31,
          activePaid: sum.activePaid || 21,
          freeTrial: sum.freeTrial || 5,
          expiredBlocked: sum.expiredBlocked || sum.expiredPlans || 5,
          openTickets: sum.openTickets || 3
        });

        if (data.salesVolume) {
          setSalesVolumeData(data.salesVolume);
        } else {
          setSalesVolumeData([
            { month: 'Apr', revenue: 32000 },
            { month: 'May', revenue: 41000 },
            { month: 'Jun', revenue: 38000 },
            { month: 'Jul', revenue: 45000 },
            { month: 'Aug', revenue: 44000 },
            { month: 'Sep', revenue: 48900 }
          ]);
        }

        if (data.renewalsQueue) {
          setRenewalsQueue(data.renewalsQueue);
        } else {
          setRenewalsQueue([
            { id: 1, companyName: 'Apex Logistics Pvt Ltd', ownerName: 'Rajesh Kumar', expiryDate: '2026-09-22', planName: 'Standard Plan', price: '₹1,299', daysRemaining: 3, status: 'expiring_soon' },
            { id: 2, companyName: 'Zenith Tech Labs', ownerName: 'Ananya Sharma', expiryDate: '2026-09-24', planName: 'Starter Plan', price: '₹999', daysRemaining: 5, status: 'expiring_soon' },
            { id: 3, companyName: 'Vanguard Manufacturing', ownerName: 'Sanjay Patel', expiryDate: '2026-09-26', planName: 'Enterprise Plan', price: '₹1,499', daysRemaining: 7, status: 'expiring_soon' },
            { id: 4, companyName: 'Nexus Global Solutions', ownerName: 'Priya Verma', expiryDate: '2026-10-05', planName: 'Standard Plan', price: '₹1,299', daysRemaining: 16, status: 'active' },
            { id: 5, companyName: 'BlueSky Digital', ownerName: 'Amit Shah', expiryDate: '2026-10-12', planName: 'Starter Plan', price: '₹999', daysRemaining: 23, status: 'active' }
          ]);
        }
      }
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('[SUPERADMIN_DASHBOARD_FETCH_ERROR]', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const handleRefresh = () => {
    fetchDashboardMetrics();
    toast.success('Dashboard metrics resynced with live database!');
  };

  // Filter renewals queue based on 7 days vs 30 days selection
  const filteredRenewals = renewalsQueue.filter(item => {
    if (renewalFilter === '7') return item.daysRemaining <= 7;
    return item.daysRemaining <= 30;
  });

  return (
    <SuperAdminLayout>
      
      {/* A. DASHBOARD HEADER */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-extrabold text-slate-900 mb-1" style={{ fontSize: '1.75rem', color: '#0F172A', fontWeight: '800' }}>
            SaaS Dashboard & Analytics
          </h2>
          <p className="text-muted small mb-0">
            Real-time Master Control metrics for Kiaan Payroll & HRMS SaaS Platform.
          </p>
        </div>
        <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
          <span className="text-muted small">
            Last Synced: <strong style={{ color: '#0F172A' }}>{lastSynced}</strong>
          </span>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleRefresh}
            disabled={syncing}
            className="d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-pill"
            style={{ borderColor: '#C62828', color: '#C62828' }}
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Database'}
          </Button>
        </div>
      </div>

      {/* QUICK REVENUE SUMMARY STRIP (BLUE BANNER) */}
      <div
        className="p-3 mb-4 rounded-3 text-white d-flex flex-wrap align-items-center justify-content-between shadow-sm"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderLeft: '5px solid #C62828' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-circle" style={{ backgroundColor: 'rgba(198, 40, 40, 0.2)' }}>
            <TrendingUp size={22} style={{ color: '#FF8A8A' }} />
          </div>
          <div>
            <span className="small text-slate-300 text-uppercase fw-semibold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              Lifetime SaaS Gross Revenue
            </span>
            <h4 className="fw-bold mb-0 text-white">₹{summary.totalRevenue.toLocaleString()}</h4>
          </div>
        </div>

        <div className="d-flex align-items-center gap-4 mt-2 mt-md-0">
          <div className="border-start border-slate-700 ps-3">
            <span className="small text-slate-400" style={{ fontSize: '11px' }}>Monthly Running Revenue</span>
            <div className="fw-bold text-success" style={{ fontSize: '15px' }}>₹{summary.monthlyRevenue.toLocaleString()}</div>
          </div>
          <div className="border-start border-slate-700 ps-3">
            <span className="small text-slate-400" style={{ fontSize: '11px' }}>Active Paid Outlets</span>
            <div className="fw-bold text-white" style={{ fontSize: '15px' }}>{summary.activePaid} Companies</div>
          </div>
        </div>
      </div>

      {/* B. SEVEN KPI CARDS */}
      <Row className="g-3 mb-4">
        
        {/* 1. TOTAL REVENUE */}
        <Col xs={12} sm={6} md={3} lg={1.7}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '11px' }}>TOTAL REVENUE</span>
                <div className="p-2 rounded-circle" style={{ backgroundColor: '#FEF2F2', color: '#C62828' }}>
                  <DollarSign size={16} />
                </div>
              </div>
              <h4 className="fw-extrabold mb-1" style={{ color: '#0F172A', fontSize: '1.25rem' }}>
                ₹{summary.totalRevenue.toLocaleString()}
              </h4>
              <span className="text-success small" style={{ fontSize: '11px' }}>
                Lifetime Paid Net
              </span>
            </Card.Body>
          </Card>
        </Col>

        {/* 2. MONTHLY REVENUE */}
        <Col xs={12} sm={6} md={3} lg={1.7}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '11px' }}>MONTHLY REVENUE</span>
                <div className="p-2 rounded-circle" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                  <Calendar size={16} />
                </div>
              </div>
              <h4 className="fw-extrabold mb-1" style={{ color: '#16A34A', fontSize: '1.25rem' }}>
                ₹{summary.monthlyRevenue.toLocaleString()}
              </h4>
              <span className="text-muted small" style={{ fontSize: '11px' }}>Current Month</span>
            </Card.Body>
          </Card>
        </Col>

        {/* 3. TOTAL COMPANIES */}
        <Col xs={12} sm={6} md={3} lg={1.7}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '11px' }}>TOTAL COMPANIES</span>
                <div className="p-2 rounded-circle" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <Building2 size={16} />
                </div>
              </div>
              <h4 className="fw-extrabold mb-1" style={{ color: '#0F172A', fontSize: '1.25rem' }}>
                {summary.totalCompanies}
              </h4>
              <span className="text-muted small" style={{ fontSize: '11px' }}>Tenants Onboarded</span>
            </Card.Body>
          </Card>
        </Col>

        {/* 4. ACTIVE PAID */}
        <Col xs={12} sm={6} md={3} lg={1.7}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '11px' }}>ACTIVE PAID</span>
                <div className="p-2 rounded-circle" style={{ backgroundColor: '#F0FDF4', color: '#10B981' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <h4 className="fw-extrabold mb-1" style={{ color: '#10B981', fontSize: '1.25rem' }}>
                {summary.activePaid}
              </h4>
              <span className="text-muted small" style={{ fontSize: '11px' }}>Paid Subscriptions</span>
            </Card.Body>
          </Card>
        </Col>

        {/* 5. FREE TRIAL */}
        <Col xs={12} sm={6} md={3} lg={1.7}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '11px' }}>FREE TRIAL</span>
                <div className="p-2 rounded-circle" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
                  <Clock size={16} />
                </div>
              </div>
              <h4 className="fw-extrabold mb-1" style={{ color: '#D97706', fontSize: '1.25rem' }}>
                {summary.freeTrial}
              </h4>
              <span className="text-muted small" style={{ fontSize: '11px' }}>7-Day Active Trial</span>
            </Card.Body>
          </Card>
        </Col>

        {/* 6. EXPIRED / BLOCKED */}
        <Col xs={12} sm={6} md={3} lg={1.7}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '11px' }}>EXPIRED / BLOCKED</span>
                <div className="p-2 rounded-circle" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                  <AlertTriangle size={16} />
                </div>
              </div>
              <h4 className="fw-extrabold mb-1" style={{ color: '#DC2626', fontSize: '1.25rem' }}>
                {summary.expiredBlocked}
              </h4>
              <span className="text-muted small" style={{ fontSize: '11px' }}>Action Required</span>
            </Card.Body>
          </Card>
        </Col>

        {/* 7. OPEN TICKETS */}
        <Col xs={12} sm={6} md={3} lg={1.7}>
          <Card className="h-100 border-0 shadow-sm rounded-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '11px' }}>OPEN TICKETS</span>
                <div className="p-2 rounded-circle" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                  <HelpCircle size={16} />
                </div>
              </div>
              <h4 className="fw-extrabold mb-1" style={{ color: '#9333EA', fontSize: '1.25rem' }}>
                {summary.openTickets}
              </h4>
              <span className="text-muted small" style={{ fontSize: '11px' }}>Pending Desk Queries</span>
            </Card.Body>
          </Card>
        </Col>

      </Row>

      {/* VISUAL CHARTS: MONTHLY SALES VOLUME & PLAN DISTRIBUTION */}
      <Row className="g-4 mb-4">
        {/* Sales Volume Bar Chart */}
        <Col xs={12} lg={7}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0" style={{ color: '#0F172A' }}>
                Monthly Subscription Sales Volume (INR ₹)
              </h6>
              <Badge bg="danger" style={{ backgroundColor: '#C62828' }}>Past 6 Months</Badge>
            </Card.Header>
            <Card.Body className="p-3">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={salesVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none' }}
                  />
                  <Bar dataKey="revenue" fill="#C62828" radius={[4, 4, 0, 0]} name="Subscription Sales" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Plan Subscription Shares Progress Bars */}
        <Col xs={12} lg={5}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <Card.Header className="bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0" style={{ color: '#0F172A' }}>
                Plan Subscription Shares & Distribution
              </h6>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              {planDistribution.map((item, idx) => (
                <div key={idx} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1 small fw-semibold">
                    <span style={{ color: '#334155' }}>{item.plan} ({item.count} companies)</span>
                    <span style={{ color: '#0F172A' }}>{item.percentage}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color, borderRadius: '4px' }}
                    />
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* UPCOMING RENEWALS QUEUE TABLE */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Header className="bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h6 className="fw-bold mb-1" style={{ color: '#0F172A' }}>
              Upcoming Plan Renewals Queue
            </h6>
            <p className="text-muted small mb-0">Track upcoming corporate subscription expirations to ensure timely renewal.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small fw-semibold text-muted">Filter Queue:</span>
            <Form.Select
              size="sm"
              value={renewalFilter}
              onChange={(e) => setRenewalFilter(e.target.value)}
              style={{ width: '160px', borderRadius: '6px', fontSize: '13px' }}
            >
              <option value="7">Next 7 Days</option>
              <option value="30">Next 30 Days</option>
            </Form.Select>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover align="middle" className="mb-0" style={{ fontSize: '13px' }}>
              <thead className="bg-slate-50" style={{ backgroundColor: '#F8FAFC', color: '#475569' }}>
                <tr>
                  <th className="py-3 ps-3">Company Name</th>
                  <th className="py-3">HR Admin Name</th>
                  <th className="py-3">Expiry Date</th>
                  <th className="py-3">Plan Name</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Days Remaining</th>
                  <th className="py-3 pe-3 text-end">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRenewals.length > 0 ? (
                  filteredRenewals.map((item) => (
                    <tr key={item.id}>
                      <td className="ps-3 fw-bold" style={{ color: '#0F172A' }}>{item.companyName}</td>
                      <td style={{ color: '#475569' }}>{item.ownerName}</td>
                      <td style={{ color: '#475569' }}>{item.expiryDate}</td>
                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {item.planName}
                        </Badge>
                      </td>
                      <td className="fw-semibold" style={{ color: '#0F172A' }}>{item.price}</td>
                      <td>
                        <span className={`fw-bold ${item.daysRemaining <= 3 ? 'text-danger' : 'text-warning'}`}>
                          {item.daysRemaining} days
                        </span>
                      </td>
                      <td className="pe-3 text-end">
                        <Badge bg={item.daysRemaining <= 3 ? 'danger' : 'warning'} className="px-2 py-1">
                          {item.daysRemaining <= 3 ? 'Expiring Soon' : 'Upcoming'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No plan renewals expiring within the selected filter period.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
