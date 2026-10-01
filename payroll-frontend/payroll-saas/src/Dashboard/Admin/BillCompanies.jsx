import React, { useState, useEffect } from "react";
import { adminAPI } from '../../services/api';
import { Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';

export default function BillCompaniesPage() {
  // --- Color Palette as per requirements ---
  const colors = {
    primary: "#C62828",      // Primary Red for buttons
    primaryDark: "#B71C1C",  // Dark Red for logo accent
    white: "#FFFFFF",        // Pure White for navbar background
    black: "#000000",        // Black Text for main text inside modal
    darkGray: "#4A4A4A",      // Dark Gray Text for secondary text
    border: "#E2E2E2",       // Light Gray Border for input borders
    modalOverlay: "rgba(0, 0, 0, 0.5)",
  };

  // --- State for detecting mobile view ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- State Management ---
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch companies from API
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getBillCompanies();
      if (response?.data?.success) {
        setCompanies(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState({}); // For Add/Edit

  // --- Handlers ---
  const openAddModal = () => {
    setCurrentCompany({ status: "Active", level: "National" }); // Reset for new company with default status and level
    setIsModalOpen(true);
  };

  const openEditModal = (company) => {
    setCurrentCompany(company);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCompany({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentCompany.id) {
        // Edit existing company
        await adminAPI.updateBillCompany(currentCompany.id, currentCompany);
      } else {
        // Add new company
        await adminAPI.createBillCompany(currentCompany);
      }
      closeModal();
      toast.success('Company saved successfully');
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save company');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        await adminAPI.deleteBillCompany(id);
        toast.success('Company deleted successfully');
        fetchCompanies();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete company');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCompany({ ...currentCompany, [name]: value });
  };

  // --- Filter companies based on search ---
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', padding: isMobile ? '10px' : '20px' }}>

      {/* --- HEADER --- */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        backgroundColor: colors.white,
        padding: isMobile ? '10px 15px' : '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '15px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            height: isMobile ? '30px' : '40px',
            width: isMobile ? '4px' : '5px',
            backgroundColor: colors.primary,
            marginRight: '15px',
            borderRadius: '2px'
          }}></div>
          <h1 style={{ color: colors.primary, margin: 0, fontSize: isMobile ? '1.5rem' : '1.75rem' }}>Bill Companies</h1>
        </div>
        <button onClick={openAddModal} style={styles.button(colors.primary, colors.white, isMobile ? 'small' : 'medium')}>
          + Add New Bill Company
        </button>
      </div>

      {/* --- SEARCH BOX --- */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by company name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...styles.input(colors.border), padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '14px' : '16px' }}
        />
      </div>

      {/* --- TABLE LIST / CARD LIST --- */}
      <div style={{ backgroundColor: colors.white, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {isMobile ? (
          // Mobile Card View
          <div style={{ padding: '10px' }}>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map(company => (
                <div key={company.id} style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: colors.primary, fontSize: '1.1rem' }}>{company.name}</h3>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: company.status === 'Active' ? '#e8f5e9' : '#ffcdd2',
                      color: company.status === 'Active' ? '#2e7d32' : '#c62828',
                    }}>
                      {company.status}
                    </span>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '0 0 5px', fontSize: '14px' }}><strong>Category:</strong> {company.category}</p>
                    <p style={{ margin: '0 0 5px', fontSize: '14px' }}><strong>Billing Code:</strong> {company.billingCode || company.billing_code}</p>
                    <p style={{ margin: '0 0 5px', fontSize: '14px' }}><strong>Level:</strong> {company.level}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => openEditModal(company)}
                      title="Edit Company"
                      style={{
                        backgroundColor: colors.primary,
                        padding: "4px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "500",
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.white,
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      <i className="bi bi-pencil-fill" style={{ fontSize: "12px" }}></i>
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
                      title="Delete Company"
                      style={{
                        backgroundColor: colors.primary,
                        padding: "4px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "500",
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.white,
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      <i className="bi bi-trash-fill" style={{ fontSize: "12px" }}></i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: colors.darkGray }}>
                No companies found.
              </div>
            )}
          </div>
        ) : (
          // Desktop Table View
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: colors.primary, color: colors.white }}>
              <tr>
                <th style={styles.th}>Company Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Billing Code</th>
                <th style={styles.th}>Level</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map(company => (
                  <tr key={company.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={styles.td}>{company.name}</td>
                    <td style={styles.td}>{company.category}</td>
                    <td style={styles.td}>{company.billingCode || company.billing_code}</td>
                    <td style={styles.td}>{company.level}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: company.status === 'Active' ? '#e8f5e9' : '#ffcdd2',
                        color: company.status === 'Active' ? '#2e7d32' : '#c62828',
                      }}>
                        {company.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditModal(company)}
                          title="Edit Company"
                          style={{
                            backgroundColor: colors.primary,
                            padding: "4px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "500",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.white,
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          <i className="bi bi-pencil-fill" style={{ fontSize: "12px" }}></i>
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          title="Delete Company"
                          style={{
                            backgroundColor: colors.primary,
                            padding: "4px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "500",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.white,
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          <i className="bi bi-trash-fill" style={{ fontSize: "12px" }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: 'center', padding: '20px', color: colors.darkGray }}>
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={{
            ...styles.modalBox(colors.white),
            width: isMobile ? '95%' : '90%',
            maxWidth: isMobile ? '95%' : '450px',
            maxHeight: isMobile ? '90vh' : '80vh',
            overflowY: 'auto',
            padding: isMobile ? '15px' : '25px'
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} style={styles.closeButton}>×</button>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                height: '30px',
                width: '4px',
                backgroundColor: colors.primaryDark,
                marginRight: '15px',
                borderRadius: '2px'
              }}></div>
              <h2 style={{ marginTop: 0, color: colors.black, fontSize: isMobile ? '1.2rem' : '1.4rem' }}>
                {currentCompany.id ? 'Edit Bill Company' : 'Add New Bill Company'}
              </h2>
            </div>
            <form onSubmit={handleSave}>
              <input
                type="text"
                name="name"
                placeholder="Company Name (e.g., HDFC Home Loan, LIC, Reliance Insurance)"
                value={currentCompany.name || ''}
                onChange={handleInputChange}
                required
                style={{ ...styles.input(colors.border), padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '14px' : '16px' }}
              />
              <select
                name="category"
                value={currentCompany.category || ''}
                onChange={handleInputChange}
                required
                style={{ ...styles.input(colors.border), padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '14px' : '16px' }}
              >
                <option value="">Select Category</option>
                <option value="Mortgage">Mortgage</option>
                <option value="EMI">EMI</option>
                <option value="Insurance">Insurance</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                name="billingCode"
                placeholder="Billing Code / Reference Number"
                value={currentCompany.billingCode || ''}
                onChange={handleInputChange}
                required
                style={{ ...styles.input(colors.border), padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '14px' : '16px' }}
              />
              <select
                name="level"
                value={currentCompany.level || 'National'}
                onChange={handleInputChange}
                required
                style={{ ...styles.input(colors.border), padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '14px' : '16px' }}
              >
                <option value="">Select Level</option>
                <option value="Local">Local</option>
                <option value="Regional">Regional</option>
                <option value="State">State</option>
                <option value="National">National</option>
                <option value="International">International</option>
              </select>
              <select
                name="status"
                value={currentCompany.status || 'Active'}
                onChange={handleInputChange}
                required
                style={{ ...styles.input(colors.border), padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '14px' : '16px' }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={closeModal} style={{ ...styles.button(colors.white, colors.darkGray, isMobile ? 'small' : 'medium'), background: colors.white, border: `1px solid ${colors.border}` }}>
                  Cancel
                </button>
                <button type="submit" style={styles.button(colors.primary, colors.white, isMobile ? 'small' : 'medium')}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable Styles ---
const styles = {
  button: (bg, color, size = 'medium') => ({
    backgroundColor: bg,
    color: color,
    border: 'none',
    padding: size === 'small' ? '8px 16px' : '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
    fontSize: size === 'small' ? '14px' : '16px',
  }),
  input: (borderColor) => ({
    width: '100%',
    padding: '10px',
    margin: '8px 0',
    border: `1px solid ${borderColor}`,
    borderRadius: '5px',
    boxSizing: 'border-box',
    fontSize: '14px',
  }),
  th: {
    padding: '12px 15px',
    textAlign: 'left',
    fontWeight: 'bold',
  },
  td: {
    padding: '12px 15px',
    color: '#000000',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBox: (bg) => ({
    backgroundColor: bg,
    padding: '25px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '450px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  }),
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#757575',
  },
};