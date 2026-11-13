import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Printer, ExternalLink } from 'lucide-react';
import officialBrochureImg from '../assets/kiaan_official_brochure.jpg';

const Brochure = () => {
    const navigate = useNavigate();

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = officialBrochureImg;
        link.download = 'Kiaan_Technology_Payroll_SaaS_Brochure.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ backgroundColor: '#0F172A', minHeight: '100vh', padding: '20px 12px' }}>
            {/* Top Control Bar (Hidden when Printing) */}
            <div className="container mb-3 d-print-none" style={{ maxWidth: '960px' }}>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white p-3 rounded-4 shadow-sm border">
                    <div className="d-flex align-items-center gap-2">
                        <button 
                            onClick={() => navigate('/')} 
                            className="btn btn-sm btn-outline-dark d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3"
                        >
                            <ArrowLeft size={16} /> Back to Landing Page
                        </button>
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1.5 rounded-pill small fw-bold d-none d-sm-inline-block">
                            Kiaan SaaS Official Brochure
                        </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button 
                            onClick={handlePrint} 
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 fw-semibold px-3 py-2 rounded-3"
                        >
                            <Printer size={16} /> Print
                        </button>
                        <button 
                            onClick={handleDownload} 
                            className="btn btn-sm btn-danger text-white d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-3 shadow-sm"
                            style={{ backgroundColor: '#C62828', borderColor: '#B71C1C' }}
                        >
                            <Download size={16} /> Download High-Res
                        </button>
                    </div>
                </div>
            </div>

            {/* Official Brochure Image Container */}
            <div 
                className="mx-auto bg-white rounded-3 shadow-2xl overflow-hidden position-relative"
                style={{
                    maxWidth: '920px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <img 
                    src={officialBrochureImg} 
                    alt="Kiaan Technology Payroll & Workforce Management Official Brochure" 
                    className="w-100 h-auto d-block"
                    style={{
                        objectFit: 'contain',
                        imageRendering: 'auto'
                    }}
                />
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        background-color: #FFFFFF !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .d-print-none {
                        display: none !important;
                    }
                    .shadow-2xl {
                        box-shadow: none !important;
                    }
                    img {
                        max-width: 100% !important;
                        height: auto !important;
                        page-break-inside: avoid;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default Brochure;
