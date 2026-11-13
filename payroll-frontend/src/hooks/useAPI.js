/**
 * CENTRAL API HOOKS LAYER
 * 
 * This file exports ALL API hooks used across all dashboards.
 * All hooks follow the naming convention: useFetchXxxYyy or useXxxYyy
 * 
 * CRASH-PROOF DESIGN:
 * - All hooks are named exports (no default exports)
 * - Missing hooks return safe placeholders
 * - Consistent return structure: { data, loading, error, ...actions }
 * - Grouped by role for maintainability
 */

import { useEffect, useState } from 'react';
import {
  employeeAPI,
  employerAPI,
  adminAPI,
  superadminAPI,
  vendorAPI,
  publicAPI
} from '../services/api';

// ============================================================================
// UTILITY: Safe Placeholder Hook Factory
// ============================================================================
const createSafePlaceholderHook = (defaultData = null) => {
  return () => ({
    data: defaultData,
    loading: false,
    error: null,
  });
};

// ============================================================================
// EMPLOYEE HOOKS
// ============================================================================

/**
 * Fetch Employee Dashboard Data
 */
const useFetchEmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await employeeAPI.getDashboard();
        setData(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { data, loading, error };
};

/**
 * Fetch Employee Profile
 */
const useFetchEmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await employeeAPI.getProfile();
        setProfile(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const updateProfile = async (profileData) => {
    try {
      const response = await employeeAPI.updateProfile(profileData);
      setProfile(response.data.data);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile';
      return { success: false, error: errorMsg };
    }
  };

  return { profile, loading, error, updateProfile };
};

/**
 * Fetch Employee Attendance
 */
const useFetchEmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await employeeAPI.getAttendance();
        setAttendance(response.data.data || {});
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const markAttendance = async (attendanceData) => {
    try {
      const response = await employeeAPI.markAttendance(attendanceData);
      const newAttendance = { ...attendance, ...response.data.data };
      setAttendance(newAttendance);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to mark attendance';
      return { success: false, error: errorMsg };
    }
  };

  return { attendance, loading, error, markAttendance };
};

/**
 * Fetch Employee Salary
 */
const useFetchEmployeeSalary = () => {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const response = await employeeAPI.getSalary();
        setSalary(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch salary');
      } finally {
        setLoading(false);
      }
    };

    fetchSalary();
  }, []);

  return { salary, loading, error };
};

/**
 * Fetch Employee Salary History
 */
const useFetchEmployeeSalaryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await employeeAPI.getSalaryHistory();
        setHistory(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch salary history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return { history, loading, error };
};

/**
 * Fetch Employee Bills
 */
const useFetchEmployeeBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await employeeAPI.getBills();
        setBills(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch bills');
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const payBill = async (billId) => {
    try {
      const response = await employeeAPI.payBill(billId);
      setBills(bills.map(bill =>
        bill.id === billId ? { ...bill, status: 'paid' } : bill
      ));
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to pay bill';
      return { success: false, error: errorMsg };
    }
  };

  return { bills, loading, error, payBill };
};

/**
 * Fetch Employee Transactions
 */
const useFetchEmployeeTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await employeeAPI.getTransactions();
        setTransactions(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return { transactions, loading, error };
};

// ============================================================================
// EMPLOYER HOOKS
// ============================================================================

/**
 * Fetch Employer Dashboard Data
 */
const useFetchEmployerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await employerAPI.getDashboard();
        setData(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { data, loading, error };
};

/**
 * Fetch Employer Profile
 */
const useFetchEmployerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await employerAPI.getDashboard();
        setProfile({
          id: response.data.data?.employer?.id,
          companyName: response.data.data?.employer?.company_name,
          status: response.data.data?.employer?.status,
        });
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};

/**
 * Fetch Employer Jobs
 */
const useFetchEmployerJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await employerAPI.getAllJobs();
      setJobs(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const createJob = async (jobData) => {
    try {
      const response = await employerAPI.createJob(jobData);
      setJobs([...jobs, response.data.data]);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create job';
      return { success: false, error: errorMsg };
    }
  };

  const updateJob = async (jobId, jobData) => {
    try {
      const response = await employerAPI.updateJob(jobId, jobData);
      setJobs(jobs.map(job => job.id === jobId ? response.data.data : job));
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update job';
      return { success: false, error: errorMsg };
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await employerAPI.deleteJob(jobId);
      setJobs(jobs.filter(job => job.id !== jobId));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete job';
      return { success: false, error: errorMsg };
    }
  };

  return { jobs, loading, error, createJob, updateJob, deleteJob, refetch: fetchJobs };
};

/**
 * Fetch Job Applications
 */
const useFetchJobApplications = (jobId) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    const fetchApplications = async () => {
      try {
        const response = await employerAPI.getJobApplications(jobId);
        setApplications(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [jobId]);

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const response = await employerAPI.updateApplicationStatus(applicationId, status);
      setApplications(applications.map(app =>
        app.id === applicationId ? response.data.data : app
      ));
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update application';
      return { success: false, error: errorMsg };
    }
  };

  return { applications, loading, error, updateApplicationStatus };
};

/**
 * Fetch Employer Credit Balance
 */
const useFetchEmployerCreditBalance = () => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await employerAPI.getCreditBalance();
        setBalance(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch credit balance');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  return { balance, loading, error };
};

/**
 * Fetch Employer Transactions
 */
const useFetchEmployerTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await employerAPI.getTransactions();
        setTransactions(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return { transactions, loading, error };
};

/**
 * Fetch Employer Beneficiaries
 */
const useFetchEmployerBeneficiaries = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        const response = await employerAPI.getBeneficiaries();
        setBeneficiaries(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch beneficiaries');
      } finally {
        setLoading(false);
      }
    };

    fetchBeneficiaries();
  }, []);

  return { beneficiaries, loading, error };
};

/**
 * Fetch Employer Credit History
 */
const useFetchEmployerCreditHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await employerAPI.getCreditHistory();
        setHistory(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch credit history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return { history, loading, error };
};

/**
 * Fetch Employer Transaction Chart Data
 */
const useFetchEmployerTransactionChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await employerAPI.getTransactionChart();
        setChartData(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  return { chartData, loading, error };
};

// ============================================================================
// ADMIN HOOKS
// ============================================================================

/**
 * Fetch Admin Dashboard Data
 */
const useFetchAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await adminAPI.getDashboard();
        setData(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { data, loading, error };
};

/**
 * Fetch Admin Profile
 */
const useFetchAdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await adminAPI.getDashboard();
        setProfile({
          summary: response.data.data?.summary || {},
        });
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};

/**
 * Fetch Admin Dashboard Summary
 */
const useFetchAdminDashboardSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await adminAPI.getDashboardSummary();
        setSummary(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return { summary, loading, error };
};

/**
 * Fetch Admin Employers
 */
const useFetchAdminEmployers = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getEmployers();
      setEmployers(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  const createEmployer = async (employerData) => {
    try {
      const response = await adminAPI.createEmployer(employerData);
      setEmployers([...employers, response.data.data]);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create employer';
      return { success: false, error: errorMsg };
    }
  };

  const updateEmployer = async (employerId, employerData) => {
    try {
      const response = await adminAPI.updateEmployer(employerId, employerData);
      setEmployers(employers.map(emp => emp.id === employerId ? response.data.data : emp));
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update employer';
      return { success: false, error: errorMsg };
    }
  };

  const deleteEmployer = async (employerId) => {
    try {
      await adminAPI.deleteEmployer(employerId);
      setEmployers(employers.filter(emp => emp.id !== employerId));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete employer';
      return { success: false, error: errorMsg };
    }
  };

  return {
    employers,
    loading,
    error,
    createEmployer,
    updateEmployer,
    deleteEmployer,
    refetch: fetchEmployers
  };
};

/**
 * Fetch Admin Employees
 */
const useFetchAdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getEmployees();
      setEmployees(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const createEmployee = async (employeeData) => {
    try {
      const response = await adminAPI.createEmployee(employeeData);
      setEmployees([...employees, response.data.data]);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create employee';
      return { success: false, error: errorMsg };
    }
  };

  const updateEmployee = async (employeeId, employeeData) => {
    try {
      const response = await adminAPI.updateEmployee(employeeId, employeeData);
      setEmployees(employees.map(emp => emp.id === employeeId ? response.data.data : emp));
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update employee';
      return { success: false, error: errorMsg };
    }
  };

  const deleteEmployee = async (employeeId) => {
    try {
      await adminAPI.deleteEmployee(employeeId);
      setEmployees(employees.filter(emp => emp.id !== employeeId));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete employee';
      return { success: false, error: errorMsg };
    }
  };

  return {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees
  };
};

/**
 * Fetch Admin Vendors
 */
const useFetchAdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllVendors();
      setVendors(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const createVendor = async (vendorData) => {
    try {
      const response = await adminAPI.createVendor(vendorData);
      setVendors([...vendors, response.data.data]);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create vendor';
      return { success: false, error: errorMsg };
    }
  };

  const updateVendor = async (vendorId, vendorData) => {
    try {
      const response = await adminAPI.updateVendor(vendorId, vendorData);
      setVendors(vendors.map(v => v.id === vendorId ? response.data.data : v));
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update vendor';
      return { success: false, error: errorMsg };
    }
  };

  const deleteVendor = async (vendorId) => {
    try {
      await adminAPI.deleteVendor(vendorId);
      setVendors(vendors.filter(v => v.id !== vendorId));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete vendor';
      return { success: false, error: errorMsg };
    }
  };

  return {
    vendors,
    loading,
    error,
    createVendor,
    updateVendor,
    deleteVendor,
    refetch: fetchVendors
  };
};

/**
 * Fetch Admin Transactions
 */
const useFetchAdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await adminAPI.getTransactions();
        setTransactions(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return { transactions, loading, error };
};

// ============================================================================
// SUPERADMIN HOOKS
// ============================================================================

/**
 * Fetch SuperAdmin Dashboard Data
 */
const useFetchSuperadminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await superadminAPI.getDashboard();
        setDashboard(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { dashboard, loading, error };
};

/**
 * Fetch SuperAdmin Profile
 */
const useFetchSuperAdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await superadminAPI.getProfile();
        setProfile(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};

/**
 * Fetch SuperAdmin Analytics
 */
const useFetchSuperadminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await superadminAPI.getAnalytics();
        setAnalytics(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { analytics, loading, error };
};

/**
 * Fetch SuperAdmin Admins
 */
const useFetchSuperadminAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await superadminAPI.getAllAdmins();
      setAdmins(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const createAdmin = async (adminData) => {
    try {
      const response = await superadminAPI.createAdmin(adminData);
      setAdmins([...admins, response.data.data]);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create admin';
      return { success: false, error: errorMsg };
    }
  };

  const updateAdmin = async (adminId, adminData) => {
    try {
      const response = await superadminAPI.updateAdmin(adminId, adminData);
      setAdmins(admins.map(a => a.id === adminId ? response.data.data : a));
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update admin';
      return { success: false, error: errorMsg };
    }
  };

  const deleteAdmin = async (adminId) => {
    try {
      await superadminAPI.deleteAdmin(adminId);
      setAdmins(admins.filter(a => a.id !== adminId));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete admin';
      return { success: false, error: errorMsg };
    }
  };

  return {
    admins,
    loading,
    error,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    refetch: fetchAdmins
  };
};

// ============================================================================
// VENDOR HOOKS
// ============================================================================

/**
 * Fetch Vendor Dashboard Data
 */
const useFetchVendorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await vendorAPI.getDashboard();
        setData(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { data, loading, error };
};

/**
 * Fetch Vendor Profile
 */
const useFetchVendorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await vendorAPI.getDashboard();
        setProfile({
          data: response.data.data,
        });
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};

/**
 * Fetch Vendor Payment Status
 */
const useFetchVendorPaymentStatus = () => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const response = await vendorAPI.getPaymentStatus();
        setPaymentStatus(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch payment status');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, []);

  return { paymentStatus, loading, error };
};

// ============================================================================
// PUBLIC/JOB PORTAL HOOKS
// ============================================================================

/**
 * Fetch Public Jobs (Job Portal)
 */
const useFetchPublicJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await publicAPI.getAllJobs();
        setJobs(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const applyForJob = async (jobId) => {
    try {
      const response = await publicAPI.applyForJob(jobId);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to apply for job';
      return { success: false, error: errorMsg };
    }
  };

  return { jobs, loading, error, applyForJob };
};

/**
 * Fetch Public Job Details
 */
const useFetchPublicJobDetails = (jobId) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    const fetchJobDetails = async () => {
      try {
        const response = await publicAPI.getJobById(jobId);
        setJob(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  return { job, loading, error };
};

// ============================================================================
// EXPORT ALL HOOKS (EXPLICIT NAMED EXPORTS)
// ============================================================================

// Export everything explicitly to prevent import errors
export {
  // Employee hooks
  useFetchEmployeeDashboard,
  useFetchEmployeeProfile,
  useFetchEmployeeAttendance,
  useFetchEmployeeSalary,
  useFetchEmployeeSalaryHistory,
  useFetchEmployeeBills,
  useFetchEmployeeTransactions,

  // Employer hooks
  useFetchEmployerDashboard,
  useFetchEmployerProfile,
  useFetchEmployerJobs,
  useFetchJobApplications,
  useFetchEmployerCreditBalance,
  useFetchEmployerTransactions,
  useFetchEmployerBeneficiaries,
  useFetchEmployerCreditHistory,
  useFetchEmployerTransactionChart,

  // Admin hooks
  useFetchAdminDashboard,
  useFetchAdminProfile,
  useFetchAdminDashboardSummary,
  useFetchAdminEmployers,
  useFetchAdminEmployees,
  useFetchAdminVendors,
  useFetchAdminTransactions,

  // SuperAdmin hooks
  useFetchSuperadminDashboard,
  useFetchSuperAdminProfile,
  useFetchSuperadminAnalytics,
  useFetchSuperadminAdmins,

  // Vendor hooks
  useFetchVendorDashboard,
  useFetchVendorProfile,
  useFetchVendorPaymentStatus,

  // Public/Job Portal hooks
  useFetchPublicJobs,
  useFetchPublicJobDetails,
};
