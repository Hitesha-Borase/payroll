// src/pages/Employee/BillPayments.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Badge, Button, Modal, Form, Nav, InputGroup, Dropdown, ToggleButton, ToggleButtonGroup, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { employeeAPI } from '../../services/api';
import {
  FaFileInvoiceDollar,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaBuilding,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaMobileAlt,
  FaWindowClose,
  FaEllipsisV,
  FaHistory,
  FaToggleOn,
  FaToggleOff,
  FaClock,
  FaCreditCard,
  FaRobot
} from 'react-icons/fa';
import { useRegional } from '../../context/RegionalContext';

// Color Palette
const colors = {
  primaryRed: '#C62828',
  darkRed: '#B71C1C',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#4A4A4A',
  lightGray: '#E2E2E2',
  lightBg: '#F8F9FA',
  successGreen: '#28A745',
  warningOrange: '#FFC107',
  lightRed: '#FFEBEE',
};

const BillPayment = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useRegional();
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAutoDeductionModal, setShowAutoDeductionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('bills');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCompany, setEditingCompany] = useState(null);
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaidByEmployer, setFilterPaidByEmployer] = useState('all');
  const [filterDueDate, setFilterDueDate] = useState('all');
  const [filterAmountRange, setFilterAmountRange] = useState('all');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window width for responsive adjustments
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [companies, setCompanies] = useState([]);
  const [pendingBills, setPendingBills] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch bills from API
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        setError(null);

        const billsRes = await employeeAPI.getBills();
        if (billsRes?.data?.success) {
          const bills = billsRes.data.data || [];
          const pending = bills.filter(bill => bill.status === 'Pending' || bill.status === 'pending');
          const paid = bills.filter(bill => bill.status === 'Paid' || bill.status === 'paid');

          setPendingBills(pending.map(bill => ({
            id: bill.id,
            company: bill.company_name || bill.company || 'N/A',
            billNumber: bill.bill_number || bill.id,
            amount: parseFloat(bill.amount || 0),
            dueDate: bill.due_date || bill.created_at,
            status: bill.status || 'Pending',
            paidByEmployer: bill.paid_by_employer || false,
            category: bill.category || 'Utilities',
            autoDeduction: bill.auto_deduction || false,
          })));

          setPaidBills(paid.map(bill => ({
            id: bill.id,
            company: bill.company_name || bill.company || 'N/A',
            billNumber: bill.bill_number || bill.id,
            amount: parseFloat(bill.amount || 0),
            dueDate: bill.due_date || bill.created_at,
            paymentDate: bill.payment_date || bill.updated_at,
            status: bill.status || 'Paid',
            paidByEmployer: bill.paid_by_employer || false,
            category: bill.category || 'Utilities',
            paymentMethod: bill.payment_method || 'Direct Deposit',
            transactionId: bill.transaction_id || '',
          })));

          // Extract unique companies from bills
          const uniqueCompanies = [...new Set(bills.map(bill => bill.company_name || bill.company))];
          setCompanies(uniqueCompanies.map((name, idx) => ({
            id: idx + 1,
            name,
            category: bills.find(b => (b.company_name || b.company) === name)?.category || 'Utilities',
            contact: '',
            website: '',
            autoDeduction: bills.find(b => (b.company_name || b.company) === name)?.auto_deduction || false,
          })));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch bills');
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const handlePayBill = async (billId) => {
    try {
      const response = await employeeAPI.payBill(billId);
      if (response?.data?.success) {
        // Refresh bills
        const billsRes = await employeeAPI.getBills();
        if (billsRes?.data?.success) {
          const bills = billsRes.data.data || [];
          const pending = bills.filter(bill => bill.status === 'Pending' || bill.status === 'pending');
          const paid = bills.filter(bill => bill.status === 'Paid' || bill.status === 'paid');
          setPendingBills(pending.map(bill => ({
            id: bill.id,
            company: bill.company_name || bill.company || 'N/A',
            billNumber: bill.bill_number || bill.id,
            amount: parseFloat(bill.amount || 0),
            dueDate: bill.due_date || bill.created_at,
            status: bill.status || 'Pending',
            paidByEmployer: bill.paid_by_employer || false,
            category: bill.category || 'Utilities',
            autoDeduction: bill.auto_deduction || false,
          })));
          setPaidBills(paid.map(bill => ({
            id: bill.id,
            company: bill.company_name || bill.company || 'N/A',
            billNumber: bill.bill_number || bill.id,
            amount: parseFloat(bill.amount || 0),
            dueDate: bill.due_date || bill.created_at,
            paymentDate: bill.payment_date || bill.updated_at,
            status: bill.status || 'Paid',
            paidByEmployer: bill.paid_by_employer || false,
            category: bill.category || 'Utilities',
            paymentMethod: bill.payment_method || 'Direct Deposit',
            transactionId: bill.transaction_id || '',
          })));
        }
        toast.success('Bill paid successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pay bill');
    }
  };

  const [newCompany, setNewCompany] = useState({
    name: '',
    category: 'Utilities',
    contact: '',
    website: '',
    autoDeduction: false
  });

  const [newBill, setNewBill] = useState({
    company: '',
    billNumber: '',
    amount: '',
    dueDate: '',
    paidByEmployer: false,
    category: 'Utilities',
    autoDeduction: false
  });

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: windowWidth < 768 ? '0 12px' : '0 20px',
  };

  const cardStyle = {
    backgroundColor: colors.white,
    border: `1px solid ${colors.lightGray}`,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    marginBottom: '20px',
    transition: 'transform 0.3s ease',
    overflow: 'visible',
  };

  const headerStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    padding: windowWidth < 768 ? '12px 14px' : '14px 18px',
    fontWeight: '600',
    display: 'flex',
    flexDirection: windowWidth < 576 ? 'column' : 'row',
    alignItems: windowWidth < 576 ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    gap: '10px',
    fontSize: windowWidth < 768 ? '13px' : '14px',
    borderTopLeftRadius: '11px',
    borderTopRightRadius: '11px',
    position: 'relative',
  };

  const buttonStyle = {
    backgroundColor: colors.primaryRed,
    color: colors.white,
    border: 'none',
    padding: windowWidth < 768 ? '4px 8px' : '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: windowWidth < 768 ? '10px' : '12px',
  };

  const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    color: colors.primaryRed,
    border: `1px solid ${colors.primaryRed}`,
    padding: windowWidth < 768 ? '4px 8px' : '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: windowWidth < 768 ? '10px' : '12px',
  };

  const tabStyle = {
    padding: '8px 14px',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    color: colors.darkGray,
    fontWeight: '500',
    transition: 'all 0.2s',
    fontSize: windowWidth < 768 ? '11px' : '13px',
  };

  const activeTabStyle = {
    ...tabStyle,
    color: colors.primaryRed,
    borderBottom: `3px solid ${colors.primaryRed}`,
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return String(dateString);
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return d.toLocaleDateString('en-US', options);
    } catch (e) {
      return String(dateString);
    }
  };

  const handleAddCompany = (e) => {
    e.preventDefault();
    const newId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1;
    setCompanies([...companies, { ...newCompany, id: newId }]);
    setNewCompany({ name: '', category: 'Utilities', contact: '', website: '', autoDeduction: false });
    setShowAddCompanyModal(false);
  };

  const handleEditCompany = (e) => {
    e.preventDefault();
    setCompanies(companies.map(company =>
      company.id === editingCompany.id ? editingCompany : company
    ));
    setEditingCompany(null);
    setShowEditCompanyModal(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterPaidByEmployer('all');
    setFilterDueDate('all');
    setFilterAmountRange('all');
    setSortBy('dueDate');
    setSortOrder('asc');
    setShowFilterModal(false);
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      const billData = {
        title: newBill.company,
        name: newBill.company,
        amount: parseFloat(newBill.amount),
        description: `Bill Number: ${newBill.billNumber || 'N/A'}`,
        bill_number: newBill.billNumber,
        billNumber: newBill.billNumber,
        due_date: newBill.dueDate,
        dueDate: newBill.dueDate,
        category: newBill.category || 'Utilities',
        auto_deduction: newBill.autoDeduction ? 1 : 0,
        autoDeduction: newBill.autoDeduction ? 1 : 0
      };

      const response = await employeeAPI.createBill(billData);
      if (response?.data?.success) {
        // Refresh bills
        const billsRes = await employeeAPI.getBills();
        if (billsRes?.data?.success) {
          const bills = billsRes.data.data || [];
          const pending = bills.filter(bill => (bill.status || '').toLowerCase() === 'pending');
          const paid = bills.filter(bill => (bill.status || '').toLowerCase() === 'paid');

          setPendingBills(pending.map(bill => ({
            id: bill.id,
            company: bill.company_name || bill.name || bill.company || 'N/A',
            billNumber: bill.bill_number || bill.id,
            amount: parseFloat(bill.amount || 0),
            dueDate: bill.due_date || bill.created_at,
            status: bill.status || 'Pending',
            paidByEmployer: bill.paid_by_employer || bill.paid_by_company ? true : false,
            category: bill.category || 'Utilities',
            autoDeduction: bill.auto_deduction ? true : false,
          })));

          setPaidBills(paid.map(bill => ({
            id: bill.id,
            company: bill.company_name || bill.name || bill.company || 'N/A',
            billNumber: bill.bill_number || bill.id,
            amount: parseFloat(bill.amount || 0),
            dueDate: bill.due_date || bill.created_at,
            paymentDate: bill.payment_date || bill.paid_date || bill.updated_at,
            status: bill.status || 'Paid',
            paidByEmployer: bill.paid_by_employer || bill.paid_by_company ? true : false,
            category: bill.category || 'Utilities',
            paymentMethod: bill.payment_method || (bill.auto_deduction ? 'Auto-Deduction' : 'Direct Deposit'),
            transactionId: bill.transaction_id || '',
            autoDeduction: bill.auto_deduction ? true : false,
          })));
        }
        setNewBill({
          company: '',
          billNumber: '',
          amount: '',
          dueDate: '',
          paidByEmployer: false,
          category: 'Utilities',
          autoDeduction: false
        });
        setShowAddBillModal(false);
        toast.success('Bill added successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add bill');
    }
  };

  const handleDeleteCompany = (companyId) => {
    setCompanies(companies.filter(company => company.id !== companyId));
  };

  const handleEditCompanyClick = (company) => {
    setEditingCompany(company);
    setShowEditCompanyModal(true);
  };

  const handleToggleAutoDeduction = (companyId) => {
    setCompanies(companies.map(company =>
      company.id === companyId ? { ...company, autoDeduction: !company.autoDeduction } : company
    ));

    // Also update pending bills for this company
    setPendingBills(pendingBills.map(bill =>
      bill.company === companies.find(c => c.id === companyId).name
        ? { ...bill, autoDeduction: !companies.find(c => c.id === companyId).autoDeduction }
        : bill
    ));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const applyFilters = (bills) => {
    let filtered = bills.filter(bill =>
      (bill.company || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.billNumber || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterCategory !== 'all') {
      filtered = filtered.filter(bill => bill.category === filterCategory);
    }

    if (filterPaidByEmployer !== 'all') {
      filtered = filtered.filter(bill => bill.paidByEmployer === (filterPaidByEmployer === 'true'));
    }

    // Due Date Range Filter
    if (filterDueDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(bill => {
        if (!bill.dueDate) return false;
        const bDate = new Date(bill.dueDate);
        if (isNaN(bDate.getTime())) return true;
        const billDay = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());
        
        if (filterDueDate === 'today') {
          return billDay.getTime() === today.getTime();
        } else if (filterDueDate === 'thisWeek') {
          const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return billDay >= today && billDay <= oneWeekFromNow;
        } else if (filterDueDate === 'thisMonth') {
          return billDay.getFullYear() === today.getFullYear() && billDay.getMonth() === today.getMonth();
        } else if (filterDueDate === 'overdue') {
          return billDay < today && (bill.status || '').toLowerCase() !== 'paid';
        }
        return true;
      });
    }

    // Amount Range Filter
    if (filterAmountRange !== 'all') {
      filtered = filtered.filter(bill => {
        const amt = parseFloat(bill.amount) || 0;
        if (filterAmountRange === 'under50') return amt < 50;
        if (filterAmountRange === '50to100') return amt >= 50 && amt <= 100;
        if (filterAmountRange === 'above100') return amt > 100;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'amount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortBy === 'dueDate' || sortBy === 'paymentDate' || sortBy === 'paidDate') {
        aValue = aValue ? new Date(aValue).getTime() || 0 : 0;
        bValue = bValue ? new Date(bValue).getTime() || 0 : 0;
      } else {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }

      if (aValue === bValue) return 0;
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filterCompanies = () => {
    return companies.filter(company =>
      (company.name || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.category || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.contact || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.website || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredPendingBills = applyFilters(pendingBills);
  const filteredPaidBills = applyFilters(paidBills);
  const filteredCompanies = filterCompanies();

  const getSearchPlaceholder = () => {
    return activeTab === 'bills' ? 'Search bills...' : 'Search companies...';
  };

  // Responsive company cards for mobile view
  const ResponsiveCompanyCards = () => {
    if (windowWidth < 768) {
      // Mobile view - card layout
      return (
        <div className="company-cards">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="mb-3" style={{ border: `1px solid ${colors.lightGray}` }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 style={{ fontSize: '14px', fontWeight: '600' }}>{company.name}</h6>
                    <Badge bg="light" text="dark" style={{ fontSize: '11px' }}>{company.category}</Badge>
                  </div>
                  <div className="d-flex">
                    <Button
                      variant="link"
                      size="sm"
                      style={{ color: colors.darkGray, padding: '0', textDecoration: 'none', fontSize: '12px', marginRight: '10px' }}
                      onClick={() => handleEditCompanyClick(company)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      style={{ color: colors.primaryRed, padding: '0', textDecoration: 'none', fontSize: '12px' }}
                      onClick={() => handleDeleteCompany(company.id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
                <div className="mb-2">
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    Contact: {company.contact}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    Website: {company.website}
                  </p>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span style={{ fontSize: '12px', color: colors.darkGray }}>Auto-Deduction:</span>
                    <Button
                      variant="link"
                      size="sm"
                      style={{
                        color: company.autoDeduction ? colors.successGreen : colors.darkGray,
                        padding: '0',
                        textDecoration: 'none',
                        fontSize: '12px',
                        marginLeft: '5px'
                      }}
                      onClick={() => handleToggleAutoDeduction(company.id)}
                    >
                      {company.autoDeduction ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      );
    } else {
      // Desktop view - table layout
      return (
        <div className="table-responsive">
          <Table hover className="align-middle" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Category</th>
                <th>Contact</th>
                <th>Website</th>
                <th>Auto-Deduction</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td style={{ fontWeight: '600', fontSize: '12px' }}>{company.name}</td>
                  <td style={{ fontSize: '12px' }}>{company.category}</td>
                  <td style={{ fontSize: '12px' }}>{company.contact}</td>
                  <td style={{ fontSize: '12px' }}>{company.website}</td>
                  <td>
                    <Button
                      variant="link"
                      size="sm"
                      style={{
                        color: company.autoDeduction ? colors.successGreen : colors.darkGray,
                        padding: '0',
                        textDecoration: 'none',
                        fontSize: '12px'
                      }}
                      onClick={() => handleToggleAutoDeduction(company.id)}
                    >
                      {company.autoDeduction ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant="link"
                      size="sm"
                      style={{ color: colors.darkGray, padding: '0', textDecoration: 'none', fontSize: '12px', marginRight: '10px' }}
                      onClick={() => handleEditCompanyClick(company)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      style={{ color: colors.primaryRed, padding: '0', textDecoration: 'none', fontSize: '12px' }}
                      onClick={() => handleDeleteCompany(company.id)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );
    }
  };

  // Responsive bill cards for mobile view
  const ResponsiveBillCards = ({ bills, type }) => {
    if (windowWidth < 768) {
      // Mobile view - card layout
      return (
        <div className="bill-cards">
          {bills.map((bill) => (
            <Card key={bill.id} className="mb-3" style={{ border: `1px solid ${colors.lightGray}` }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 style={{ fontSize: '14px', fontWeight: '600' }}>{bill.company}</h6>
                    <Badge bg={bill.status === 'Paid' ? 'success' : 'warning'} style={{ fontSize: '11px' }}>
                      {bill.status}
                    </Badge>
                  </div>
                  <h5 style={{ color: colors.primaryRed, fontWeight: '600', fontSize: '16px' }}>
                    {formatCurrency(bill.amount)}
                  </h5>
                </div>
                <div className="mb-2">
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    Bill No: {bill.billNumber}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    Due Date: {formatDate(bill.dueDate)}
                  </p>
                  {bill.status === 'Paid' && (
                    <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                      Paid Date: {formatDate(bill.paidDate)}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                    Paid by Employer: {bill.paidByEmployer ? 'Yes' : 'No'}
                  </p>
                  {bill.paymentMethod && (
                    <p style={{ margin: 0, fontSize: '12px', color: colors.darkGray }}>
                      Payment Method: {bill.paymentMethod}
                    </p>
                  )}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span style={{ fontSize: '12px', color: colors.darkGray }}>Auto-Deduction:</span>
                    <span style={{
                      fontSize: '12px',
                      color: bill.autoDeduction ? colors.successGreen : colors.darkGray,
                      marginLeft: '5px'
                    }}>
                      {bill.autoDeduction ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {bill.status === 'Pending' && (
                    <Button
                      variant="link"
                      size="sm"
                      style={{ color: colors.primaryRed, padding: '0', textDecoration: 'none', fontSize: '12px' }}
                      onClick={() => handlePayBill(bill.id)}
                    >
                      <FaMoneyBillWave /> Pay Now
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      );
    } else {
      // Desktop view - table layout
      return (
        <div className="table-responsive">
          <Table hover className="align-middle" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th onClick={() => handleSort('company')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Company {getSortIcon('company')}
                </th>
                <th onClick={() => handleSort('billNumber')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Bill Number {getSortIcon('billNumber')}
                </th>
                <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Amount {getSortIcon('amount')}
                </th>
                <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Due Date {getSortIcon('dueDate')}
                </th>
                {type === 'paid' && (
                  <th onClick={() => handleSort('paymentDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Paid Date {getSortIcon('paymentDate')}
                  </th>
                )}
                <th onClick={() => handleSort('paidByEmployer')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Paid by Employer {getSortIcon('paidByEmployer')}
                </th>
                <th onClick={() => handleSort('autoDeduction')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Auto-Deduction {getSortIcon('autoDeduction')}
                </th>
                {type === 'paid' && <th>Payment Method</th>}
                {type === 'pending' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td style={{ fontWeight: '600', fontSize: '12px' }}>{bill.company}</td>
                  <td style={{ fontSize: '12px' }}>{bill.billNumber}</td>
                  <td style={{ fontWeight: '600', fontSize: '12px' }}>{formatCurrency(bill.amount)}</td>
                  <td style={{ fontSize: '12px' }}>{formatDate(bill.dueDate)}</td>
                  {type === 'paid' && <td style={{ fontSize: '12px' }}>{formatDate(bill.paidDate)}</td>}
                  <td>
                    <Badge
                      bg={bill.paidByEmployer ? 'success' : 'warning'}
                      style={{ fontSize: '11px' }}
                    >
                      {bill.paidByEmployer ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      bg={bill.autoDeduction ? 'success' : 'secondary'}
                      style={{ fontSize: '11px' }}
                    >
                      {bill.autoDeduction ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </td>
                  {type === 'paid' && (
                    <td>
                      <Badge
                        bg={bill.paymentMethod === 'Auto-Deduction' ? 'info' : 'light'}
                        text={bill.paymentMethod === 'Auto-Deduction' ? 'white' : 'dark'}
                        style={{ fontSize: '11px' }}
                      >
                        {bill.paymentMethod}
                      </Badge>
                    </td>
                  )}
                  {type === 'pending' && (
                    <td>
                      <Button
                        variant="link"
                        size="sm"
                        style={{ color: colors.primaryRed, padding: '0', textDecoration: 'none', fontSize: '12px' }}
                        onClick={() => handlePayBill(bill.id)}
                      >
                        <FaMoneyBillWave /> Pay Now
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', }}>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {/* Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}`,
        padding: '12px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={containerStyle}>
          <div className="d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center flex-shrink-0">
              <Button
                variant="link"
                className="me-2 me-md-3 p-0"
                onClick={() => navigate('/Employee/dashboard')}
                style={{ color: colors.primaryRed }}
              >
                <FaArrowLeft size={18} />
              </Button>
              <h2 style={{ color: colors.black, margin: 0, fontSize: windowWidth < 768 ? '16px' : '20px', fontWeight: '700' }}>Bill Payments</h2>
            </div>
            <div className="d-flex align-items-center justify-content-end" style={{ maxWidth: '240px' }}>
              <div className="input-group">
                <span className="input-group-text py-1 px-2" style={{ backgroundColor: colors.lightGray, border: 'none' }}>
                  <FaSearch size={13} color={colors.darkGray} />
                </span>
                <input
                  type="text"
                  className="form-control py-1 px-2"
                  placeholder={getSearchPlaceholder()}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: windowWidth < 768 ? '12px' : '13px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={containerStyle} className="py-3 py-md-4">
        {/* Tabs */}
        <div className="d-flex mb-3 gap-2" style={{ borderBottom: `1px solid ${colors.lightGray}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div
            style={activeTab === 'bills' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('bills')}
          >
            Bills ({pendingBills.length + paidBills.length})
          </div>
          <div
            style={activeTab === 'companies' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('companies')}
          >
            Companies ({companies.length})
          </div>
          <div
            style={activeTab === 'history' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory className="me-1" />
            <span>History</span>
          </div>
        </div>

        {activeTab === 'bills' && (
          <>
            {/* Pending Bills Card */}
            <Card style={cardStyle}>
              <div style={headerStyle}>
                <div className="d-flex align-items-center">
                  <FaFileInvoiceDollar className="me-2" />
                  <span>Pending Bills ({filteredPendingBills.length})</span>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap ms-0 ms-sm-auto w-100 w-sm-auto justify-content-start justify-content-sm-end">
                  {/* Due Date Dropdown */}
                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant={sortBy === 'dueDate' || filterDueDate !== 'all' ? 'light' : 'outline-light'}
                      size="sm"
                      id="dropdown-due-date"
                      style={{
                        fontSize: windowWidth < 768 ? '11px' : '12px',
                        padding: '4px 8px',
                        fontWeight: (sortBy === 'dueDate' || filterDueDate !== 'all') ? '600' : '500',
                        color: (sortBy === 'dueDate' || filterDueDate !== 'all') ? colors.primaryRed : colors.white,
                        backgroundColor: (sortBy === 'dueDate' || filterDueDate !== 'all') ? colors.white : 'transparent',
                        borderColor: colors.white
                      }}
                    >
                      <FaCalendarAlt className="me-1" />
                      Due Date {filterDueDate !== 'all' ? `(${filterDueDate})` : (sortBy === 'dueDate' ? (sortOrder === 'asc' ? '↑' : '↓') : '▾')}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      align="end"
                      popperConfig={{
                        strategy: 'fixed',
                        modifiers: [
                          {
                            name: 'preventOverflow',
                            options: { boundary: 'viewport', padding: 10 },
                          },
                        ],
                      }}
                      style={{
                        fontSize: '12px',
                        minWidth: '170px',
                        maxWidth: 'min(230px, calc(100vw - 24px))',
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                        border: '1px solid #E2E8F0',
                        zIndex: 1060
                      }}
                    >
                      <Dropdown.Header>Sort Order</Dropdown.Header>
                      <Dropdown.Item onClick={() => { setSortBy('dueDate'); setSortOrder('asc'); }}>
                        Earliest Due First {sortBy === 'dueDate' && sortOrder === 'asc' ? '✓' : ''}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => { setSortBy('dueDate'); setSortOrder('desc'); }}>
                        Latest Due First {sortBy === 'dueDate' && sortOrder === 'desc' ? '✓' : ''}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Header>Filter by Due Date</Dropdown.Header>
                      <Dropdown.Item onClick={() => setFilterDueDate('all')} active={filterDueDate === 'all'}>
                        All Due Dates
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterDueDate('today')} active={filterDueDate === 'today'}>
                        Due Today
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterDueDate('thisWeek')} active={filterDueDate === 'thisWeek'}>
                        Due This Week (Next 7 Days)
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterDueDate('thisMonth')} active={filterDueDate === 'thisMonth'}>
                        Due This Month
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterDueDate('overdue')} active={filterDueDate === 'overdue'}>
                        Overdue Bills
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>

                  {/* Amount Dropdown */}
                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant={sortBy === 'amount' || filterAmountRange !== 'all' ? 'light' : 'outline-light'}
                      size="sm"
                      id="dropdown-amount"
                      style={{
                        fontSize: windowWidth < 768 ? '11px' : '12px',
                        padding: '4px 8px',
                        fontWeight: (sortBy === 'amount' || filterAmountRange !== 'all') ? '600' : '500',
                        color: (sortBy === 'amount' || filterAmountRange !== 'all') ? colors.primaryRed : colors.white,
                        backgroundColor: (sortBy === 'amount' || filterAmountRange !== 'all') ? colors.white : 'transparent',
                        borderColor: colors.white
                      }}
                    >
                      <FaMoneyBillWave className="me-1" />
                      Amount {filterAmountRange !== 'all' ? `(${filterAmountRange})` : (sortBy === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : '▾')}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      align="end"
                      popperConfig={{
                        strategy: 'fixed',
                        modifiers: [
                          {
                            name: 'preventOverflow',
                            options: { boundary: 'viewport', padding: 10 },
                          },
                        ],
                      }}
                      style={{
                        fontSize: '12px',
                        minWidth: '170px',
                        maxWidth: 'min(230px, calc(100vw - 24px))',
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                        border: '1px solid #E2E8F0',
                        zIndex: 1060
                      }}
                    >
                      <Dropdown.Header>Sort Order</Dropdown.Header>
                      <Dropdown.Item onClick={() => { setSortBy('amount'); setSortOrder('asc'); }}>
                        Lowest Amount First {sortBy === 'amount' && sortOrder === 'asc' ? '✓' : ''}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => { setSortBy('amount'); setSortOrder('desc'); }}>
                        Highest Amount First {sortBy === 'amount' && sortOrder === 'desc' ? '✓' : ''}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Header>Filter by Amount</Dropdown.Header>
                      <Dropdown.Item onClick={() => setFilterAmountRange('all')} active={filterAmountRange === 'all'}>
                        All Amounts
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterAmountRange('under50')} active={filterAmountRange === 'under50'}>
                        Under $50
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterAmountRange('50to100')} active={filterAmountRange === '50to100'}>
                        $50 - $100
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterAmountRange('above100')} active={filterAmountRange === 'above100'}>
                        Above $100
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>

                  <Button
                    style={buttonStyle}
                    className="py-1 px-2.5"
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                    onClick={() => setShowAddBillModal(true)}
                  >
                    <FaPlus className="me-1" />
                    <span>Add Bill</span>
                  </Button>
                </div>
              </div>
              <Card.Body className="p-3">
                {filteredPendingBills.length > 0 ? (
                  <ResponsiveBillCards bills={filteredPendingBills} type="pending" />
                ) : (
                  <div className="text-center py-4">
                    <FaFileInvoiceDollar size={40} color={colors.lightGray} />
                    <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: windowWidth < 768 ? '12px' : '14px' }}>No pending bills found</p>
                    <Button
                      style={buttonStyle}
                      onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                      onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                      onClick={() => setShowAddBillModal(true)}
                    >
                      <FaPlus className="me-1" />
                      Add New Bill
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Paid Bills Card */}
            <Card style={cardStyle}>
              <div style={headerStyle}>
                <FaCheckCircle className="me-2" />
                Paid Bills ({filteredPaidBills.length})
              </div>
              <Card.Body className="p-3">
                {filteredPaidBills.length > 0 ? (
                  <ResponsiveBillCards bills={filteredPaidBills} type="paid" />
                ) : (
                  <div className="text-center py-4">
                    <FaCheckCircle size={40} color={colors.lightGray} />
                    <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: windowWidth < 768 ? '12px' : '14px' }}>No paid bills found</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}

        {activeTab === 'companies' && (
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaBuilding className="me-2" />
              Bill Payment Companies
              <Button
                style={{ ...buttonStyle, marginLeft: 'auto' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                onClick={() => setShowAddCompanyModal(true)}
              >
                <FaPlus className="me-1" />
                <span className="d-none d-md-inline">Add Company</span>
              </Button>
            </div>
            <Card.Body className="p-3">
              {filteredCompanies.length > 0 ? (
                <ResponsiveCompanyCards />
              ) : (
                <div className="text-center py-4">
                  <FaBuilding size={40} color={colors.lightGray} />
                  <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: windowWidth < 768 ? '12px' : '14px' }}>No companies found</p>
                  <Button
                    style={buttonStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.darkRed}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryRed}
                    onClick={() => setShowAddCompanyModal(true)}
                  >
                    <FaPlus className="me-1" />
                    Add Company
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card style={cardStyle}>
            <div style={headerStyle}>
              <FaHistory className="me-2" />
              Bill Payment History
            </div>
            <Card.Body className="p-3">
              {filteredPaidBills.length > 0 ? (
                <ResponsiveBillCards bills={filteredPaidBills} type="paid" />
              ) : (
                <div className="text-center py-4">
                  <FaHistory size={40} color={colors.lightGray} />
                  <p style={{ color: colors.darkGray, marginTop: '10px', fontSize: windowWidth < 768 ? '12px' : '14px' }}>No payment history found</p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Add Company Modal */}
      <Modal show={showAddCompanyModal} onHide={() => setShowAddCompanyModal(false)} centered size="md">
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Add New Company</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddCompany}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Company Name</Form.Label>
              <Form.Control
                type="text"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Category</Form.Label>
              <Form.Select
                value={newCompany.category}
                onChange={(e) => setNewCompany({ ...newCompany, category: e.target.value })}
                style={{ fontSize: '13px' }}
              >
                <option value="Utilities">Utilities</option>
                <option value="Internet">Internet</option>
                <option value="Telecom">Telecom</option>
                <option value="Insurance">Insurance</option>
                <option value="Loan">Loan</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Contact Number</Form.Label>
              <Form.Control
                type="text"
                value={newCompany.contact}
                onChange={(e) => setNewCompany({ ...newCompany, contact: e.target.value })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Website</Form.Label>
              <Form.Control
                type="text"
                value={newCompany.website}
                onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Auto-Deduction"
                checked={newCompany.autoDeduction}
                onChange={(e) => setNewCompany({ ...newCompany, autoDeduction: e.target.checked })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowAddCompanyModal(false)}
                style={{ fontSize: '13px' }}
              >
                Cancel
              </Button>
              <Button type="submit" style={buttonStyle}>
                Add Company
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Company Modal */}
      <Modal show={showEditCompanyModal} onHide={() => setShowEditCompanyModal(false)} centered size="md">
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Edit Company</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditCompany}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Company Name</Form.Label>
              <Form.Control
                type="text"
                value={editingCompany?.name || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Category</Form.Label>
              <Form.Select
                value={editingCompany?.category || 'Utilities'}
                onChange={(e) => setEditingCompany({ ...editingCompany, category: e.target.value })}
                style={{ fontSize: '13px' }}
              >
                <option value="Utilities">Utilities</option>
                <option value="Internet">Internet</option>
                <option value="Telecom">Telecom</option>
                <option value="Insurance">Insurance</option>
                <option value="Loan">Loan</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Contact Number</Form.Label>
              <Form.Control
                type="text"
                value={editingCompany?.contact || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, contact: e.target.value })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Website</Form.Label>
              <Form.Control
                type="text"
                value={editingCompany?.website || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, website: e.target.value })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Auto-Deduction"
                checked={editingCompany?.autoDeduction || false}
                onChange={(e) => setEditingCompany({ ...editingCompany, autoDeduction: e.target.checked })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowEditCompanyModal(false)}
                style={{ fontSize: '13px' }}
              >
                Cancel
              </Button>
              <Button type="submit" style={buttonStyle}>
                Update Company
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Bill Modal */}
      <Modal show={showAddBillModal} onHide={() => setShowAddBillModal(false)} centered size="md">
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Add New Bill</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddBill}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Company</Form.Label>
              <Form.Select
                value={newBill.company}
                onChange={(e) => {
                  const selectedCompany = companies.find(c => c.name === e.target.value);
                  setNewBill({
                    ...newBill,
                    company: e.target.value,
                    category: selectedCompany ? selectedCompany.category : 'Utilities',
                    autoDeduction: selectedCompany ? selectedCompany.autoDeduction : false
                  });
                }}
                required
                style={{ fontSize: '13px' }}
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.name}>{company.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Bill Number</Form.Label>
              <Form.Control
                type="text"
                value={newBill.billNumber}
                onChange={(e) => setNewBill({ ...newBill, billNumber: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Amount</Form.Label>
              <Form.Control
                type="number"
                value={newBill.amount}
                onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Due Date</Form.Label>
              <Form.Control
                type="date"
                value={newBill.dueDate}
                onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                required
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Paid by Employer"
                checked={newBill.paidByEmployer}
                onChange={(e) => setNewBill({ ...newBill, paidByEmployer: e.target.checked })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Auto-Deduction"
                checked={newBill.autoDeduction}
                onChange={(e) => setNewBill({ ...newBill, autoDeduction: e.target.checked })}
                style={{ fontSize: '13px' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowAddBillModal(false)}
                style={{ fontSize: '13px' }}
              >
                Cancel
              </Button>
              <Button type="submit" style={buttonStyle}>
                Add Bill
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Filter Modal */}
      <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered size="md">
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Filter Bills</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Category</Form.Label>
              <Form.Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ fontSize: '13px' }}
              >
                <option value="all">All Categories</option>
                <option value="Utilities">Utilities</option>
                <option value="Internet">Internet</option>
                <option value="Telecom">Telecom</option>
                <option value="Insurance">Insurance</option>
                <option value="Loan">Loan</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Paid by Employer</Form.Label>
              <Form.Select
                value={filterPaidByEmployer}
                onChange={(e) => setFilterPaidByEmployer(e.target.value)}
                style={{ fontSize: '13px' }}
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Due Date Filter</Form.Label>
              <Form.Select
                value={filterDueDate}
                onChange={(e) => setFilterDueDate(e.target.value)}
                style={{ fontSize: '13px' }}
              >
                <option value="all">All Due Dates</option>
                <option value="today">Due Today</option>
                <option value="thisWeek">Due Next 7 Days</option>
                <option value="thisMonth">Due This Month</option>
                <option value="overdue">Overdue Bills</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '13px' }}>Amount Range</Form.Label>
              <Form.Select
                value={filterAmountRange}
                onChange={(e) => setFilterAmountRange(e.target.value)}
                style={{ fontSize: '13px' }}
              >
                <option value="all">All Amounts</option>
                <option value="under50">Under $50</option>
                <option value="50to100">$50 - $100</option>
                <option value="above100">Above $100</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={resetFilters}
                style={{ fontSize: '13px' }}
              >
                Reset
              </Button>
              <Button
                style={buttonStyle}
                onClick={() => setShowFilterModal(false)}
              >
                Apply Filters
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Auto-Deduction Modal */}
      <Modal show={showAutoDeductionModal} onHide={() => setShowAutoDeductionModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: colors.primaryRed, color: colors.white }}>
          <Modal.Title>Auto-Deduction Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h5 style={{ color: colors.darkGray, fontSize: '14px' }}>Enable/Disable Auto-Deduction for Companies</h5>
            <p style={{ fontSize: '12px', color: colors.darkGray }}>
              Auto-deduction allows bills to be paid automatically on their due date. You can enable or disable this feature for each company below.
            </p>
          </div>
          <div className="table-responsive">
            <Table hover className="align-middle" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Category</th>
                  <th>Auto-Deduction</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td style={{ fontWeight: '600', fontSize: '12px' }}>{company.name}</td>
                    <td style={{ fontSize: '12px' }}>{company.category}</td>
                    <td>
                      <Button
                        variant="link"
                        size="sm"
                        style={{
                          color: company.autoDeduction ? colors.successGreen : colors.darkGray,
                          padding: '0',
                          textDecoration: 'none',
                          fontSize: '12px'
                        }}
                        onClick={() => handleToggleAutoDeduction(company.id)}
                      >
                        {company.autoDeduction ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="d-flex justify-content-end mt-3">
            <Button
              style={buttonStyle}
              onClick={() => setShowAutoDeductionModal(false)}
            >
              Done
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BillPayment;