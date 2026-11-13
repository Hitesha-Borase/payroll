import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getDashboardUrl = () => {
    switch (user?.role) {
      case 'superadmin':
        return '/superadmin/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'employer':
        return '/employer/dashboard';
      case 'employee':
        return '/employee/dashboard';
      case 'jobseeker':
        return '/job-portal/dashboard';
      case 'vendor':
        return '/vendor/dashboard';
      default:
        return '/';
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 py-5">
      <Card className="shadow-lg border-0 text-center p-4 p-md-5" style={{ maxWidth: '520px', borderRadius: '16px' }}>
        <div className="mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
          <ShieldAlert size={44} />
        </div>
        <h2 className="fw-bold text-dark mb-2">Access Denied (403)</h2>
        <p className="text-muted mb-4">
          You do not have the required permissions to view this section with your current account ({user?.role?.toUpperCase() || 'Guest'}).
        </p>
        <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
          <Button variant="outline-secondary" onClick={() => navigate(-1)} className="d-flex align-items-center justify-content-center gap-2">
            <ArrowLeft size={16} /> Go Back
          </Button>
          <Button variant="danger" onClick={() => navigate(getDashboardUrl())} className="d-flex align-items-center justify-content-center gap-2">
            <Home size={16} /> Back to Dashboard
          </Button>
        </div>
      </Card>
    </Container>
  );
};

export default Unauthorized;
