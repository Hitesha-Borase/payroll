import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        this.setState({ errorInfo });

        // TODO: Send to error logging service (Sentry, LogRocket, etc.)
        // Example: logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    handleGoBack = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-4" style={{ backgroundColor: '#F7EFE9' }}>
                    <div className="text-center p-3 p-sm-4 p-md-5 rounded-4 bg-white shadow-sm w-100" style={{ maxWidth: '520px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div className="mb-3">
                            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3.2rem', color: '#C62828' }}></i>
                        </div>
                        <h1 className="h3 fw-bold mb-2 text-dark">
                            Oops! Something went wrong
                        </h1>
                        <p className="text-muted small mb-4" style={{ color: '#4A4A4A', lineHeight: 1.5 }}>
                            We're sorry for the inconvenience. The application encountered an unexpected error.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="alert alert-danger text-start mb-4 p-3 small">
                                <strong>Error Details:</strong>
                                <pre className="mt-1 mb-0" style={{ fontSize: '0.78rem', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>
                                    {this.state.error.toString()}
                                </pre>
                            </div>
                        )}

                        <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                            <button
                                className="btn px-4 py-2 text-white fw-semibold shadow-sm"
                                onClick={this.handleReset}
                                style={{
                                    backgroundColor: '#C62828',
                                    borderColor: '#C62828',
                                    borderRadius: '50px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <i className="bi bi-house-door-fill me-2"></i>
                                Go to Home
                            </button>
                            <button
                                className="btn btn-outline-secondary px-4 py-2 fw-semibold"
                                onClick={() => window.location.reload()}
                                style={{
                                    borderRadius: '50px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
