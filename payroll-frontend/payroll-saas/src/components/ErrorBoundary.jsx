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

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#F7EFE9' }}>
                    <div className="text-center p-5" style={{ maxWidth: '600px' }}>
                        <div className="mb-4">
                            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '4rem', color: '#C62828' }}></i>
                        </div>
                        <h1 className="display-4 mb-4" style={{ color: '#000000', fontWeight: 'bold' }}>
                            Oops! Something went wrong
                        </h1>
                        <p className="lead mb-4" style={{ color: '#4A4A4A' }}>
                            We're sorry for the inconvenience. The application encountered an unexpected error.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="alert alert-danger text-start mb-4">
                                <strong>Error Details (Development Mode):</strong>
                                <pre className="mt-2 mb-0" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                    {this.state.error.toString()}
                                </pre>
                            </div>
                        )}

                        <div className="d-flex gap-3 justify-content-center">
                            <button
                                className="btn btn-primary px-4 py-2"
                                onClick={this.handleReset}
                                style={{
                                    backgroundColor: '#C62828',
                                    borderColor: '#C62828',
                                    fontWeight: '500'
                                }}
                            >
                                <i className="bi bi-house-door-fill me-2"></i>
                                Go to Home
                            </button>
                            <button
                                className="btn btn-outline-secondary px-4 py-2"
                                onClick={() => window.location.reload()}
                                style={{ fontWeight: '500' }}
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
