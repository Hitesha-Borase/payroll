import axios from 'axios';

// API Base Configuration
let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/';

// Ensure it ends with / so relative paths append correctly
if (!API_BASE_URL.endsWith('/')) {
    API_BASE_URL += '/';
}

// Create axios instance
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to attach token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                    localStorage.setItem('authToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================
export const authAPI = {
    register: (data) => axiosInstance.post('/auth/register', data),
    login: (email, password) => axiosInstance.post('/auth/login', { email, password }),
    adminLogin: (email, password) => axiosInstance.post('/auth/admin/login', { email, password }),
    logout: () => axiosInstance.post('/auth/logout'),
    refreshToken: (refreshToken) => axiosInstance.post('/auth/refresh-token', { refreshToken }),
    forgotPassword: (email) => axiosInstance.post('/auth/forgot-password/send-otp', { email }),
    sendOTP: (email) => axiosInstance.post('/auth/forgot-password/send-otp', { email }),
    verifyReset: (data) => axiosInstance.post('/auth/forgot-password/verify-reset', data),
};

// ==================== PROFILE API ====================
export const profileAPI = {
    getProfile: () => axiosInstance.get('/profile'),
    updateProfile: (data) => axiosInstance.put('/profile/update', data),
    changePassword: (data) => axiosInstance.put('/profile/change-password', data),
};

// ==================== EMPLOYEE API ====================
export const employeeAPI = {
    getDashboard: () => axiosInstance.get('/employee/dashboard'),
    getProfile: () => axiosInstance.get('/employee/profile'),
    updateProfile: (data) => axiosInstance.put('/employee/profile/update', data),
    getWallet: () => axiosInstance.get('/employee/wallet'),
    getSalary: () => axiosInstance.get('/employee/salary/list'),
    getSalaryHistory: () => axiosInstance.get('/employee/salary/list'),
    getBills: () => axiosInstance.get('/employee/bill/list'),
    createBill: (data) => axiosInstance.post('/employee/bill/create', data),
    payBill: (billId) => axiosInstance.post('/employee/bill/pay', { billId }),
    checkIn: (data) => axiosInstance.post('/employee/check-in', data),
    checkOut: (data) => axiosInstance.post('/employee/check-out', data),
    getAttendance: () => axiosInstance.get('/employee/attendance/list'),
    getTrainings: () => axiosInstance.get('/employee/training/list'),
    getTests: () => axiosInstance.get('/employee/tests'),
    getCertificates: () => axiosInstance.get('/employee/certificates'),
    getBankDetails: () => axiosInstance.get('/employee/bank/list'),
    addBankDetails: (data) => axiosInstance.post('/employee/bank/add', data),
    getTransactions: () => axiosInstance.get('/employee/transactions'),
    getMyApplications: () => axiosInstance.get('/employee/job/applications'),
    getAllJobs: () => axiosInstance.get('/employee/jobs'),
    applyForJob: (jobId, data) => axiosInstance.post(`/employee/job/apply/${jobId}`, data),
};

// ==================== EMPLOYER API ====================
export const employerAPI = {
    getDashboard: () => axiosInstance.get('/employer/dashboard'),
    getCreditBalance: () => axiosInstance.get('/employer/credit-balance'),
    getTransactions: () => axiosInstance.get('/employer/transactions'),
    getBeneficiaries: () => axiosInstance.get('/employer/beneficiaries'),
    getTransactionChart: () => axiosInstance.get('/employer/transaction-chart'),
    createJob: (data) => axiosInstance.post('/employer/jobs', data),
    getAllJobs: () => axiosInstance.get('/employer/jobs'),
    getJobById: (jobId) => axiosInstance.get(`/employer/jobs/${jobId}`),
    updateJob: (jobId, data) => axiosInstance.put(`/employer/jobs/${jobId}`, data),
    deleteJob: (jobId) => axiosInstance.delete(`/employer/jobs/${jobId}`),
    getJobApplications: (jobId) => axiosInstance.get(`/employer/jobs/${jobId}/applications`),
    updateApplicationStatus: (applicationId, status) =>
        axiosInstance.put(`/employer/applications/${applicationId}/status`, { status }),
    getMyEmployees: () => axiosInstance.get('/employer/employees'),
    addEmployee: (data) => axiosInstance.post('/employer/employees', data),
    updateEmployee: (employeeId, data) => axiosInstance.put(`/employer/employees/${employeeId}`, data),
    deleteEmployee: (employeeId) => axiosInstance.delete(`/employer/employees/${employeeId}`),
    getMyVendors: () => axiosInstance.get('/employer/vendors'),
    addVendor: (data) => axiosInstance.post('/employer/vendors', data),
    updateVendor: (vendorId, data) => axiosInstance.put(`/employer/vendors/${vendorId}`, data),
    getEmployeeAttendance: (employeeId, params) => axiosInstance.get(`/employer/employees/${employeeId}/attendance`, { params }),
    markAttendance: (employeeId, data) => axiosInstance.post(`/employer/employees/${employeeId}/attendance`, data),
    createTraining: (data) => axiosInstance.post('/employer/trainings', data),
    getAllTrainings: () => axiosInstance.get('/employer/trainings'),
    assignTrainingToEmployees: (trainingId, data) => axiosInstance.post(`/employer/trainings/${trainingId}/assign`, data),
    paySalary: (employeeId, data) => axiosInstance.post(`/employer/employees/${employeeId}/pay-salary`, data),
    payVendor: (vendorId, data) => axiosInstance.post(`/employer/vendors/${vendorId}/pay`, data),
    getWalletBalance: () => axiosInstance.get('/credits/employer/wallet'),
    getCreditHistory: (params) => axiosInstance.get('/credits/employer/credits', { params }),
    requestCredit: (data) => axiosInstance.post('/employer/request-credit', data),
};

// ==================== ADMIN API ====================
export const adminAPI = {
    getDashboard: () => axiosInstance.get('/admin/dashboard'),
    getDashboardSummary: () => axiosInstance.get('/admin/dashboard-summary'),
    getTransactions: () => axiosInstance.get('/admin/transactions'),
    deleteTransaction: (id) => axiosInstance.delete(`/admin/transactions/${id}`),
    createEmployer: (data) => axiosInstance.post('/admin/employers', data),
    getAllEmployers: () => axiosInstance.get('/admin/employers'),
    getEmployers: () => axiosInstance.get('/admin/employers'),
    getEmployerById: (employerId) => axiosInstance.get(`/admin/employers/${employerId}`),
    updateEmployer: (employerId, data) => axiosInstance.put(`/admin/employers/${employerId}`, data),
    deleteEmployer: (employerId) => axiosInstance.delete(`/admin/employers/${employerId}`),
    addCredit: (employerId, data) => axiosInstance.post(`/admin/employers/${employerId}/credit`, data),
    addCreditSingle: (data) => axiosInstance.post('/admin/credits/add', data),
    addCreditBulk: (data) => axiosInstance.post('/admin/credits/bulk-add', data),
    getCreditStats: () => axiosInstance.get('/admin/credits/stats'),
    getAdminCreditHistory: (params) => axiosInstance.get('/admin/credits', { params }),
    getPendingCreditRequests: () => axiosInstance.get('/admin/credits/requests'),
    approveCreditRequest: (id) => axiosInstance.post(`/admin/credits/requests/${id}/approve`),
    rejectCreditRequest: (id, data) => axiosInstance.post(`/admin/credits/requests/${id}/reject`, data),
    toggleUserStatus: (userId, status) => axiosInstance.post(`/admin/users/${userId}/toggle-status`, { status }),
    createEmployee: (data) => axiosInstance.post('/admin/employees', data),
    getAllEmployees: () => axiosInstance.get('/admin/employees'),
    getEmployees: () => axiosInstance.get('/admin/employees'),
    updateEmployee: (employeeId, data) => axiosInstance.put(`/admin/employees/${employeeId}`, data),
    deleteEmployee: (employeeId) => axiosInstance.delete(`/admin/employees/${employeeId}`),
    createVendor: (data) => axiosInstance.post('/admin/vendors', data),
    getAllVendors: () => axiosInstance.get('/admin/vendors'),
    updateVendor: (vendorId, data) => axiosInstance.put(`/admin/vendors/${vendorId}`, data),
    deleteVendor: (vendorId) => axiosInstance.delete(`/admin/vendors/${vendorId}`),
    purchasePlan: (data) => axiosInstance.post('/admin/purchase-plan', data),
    createRazorpayOrder: (data) => axiosInstance.post('/payment/razorpay/create-order', data),
    verifyRazorpayPayment: (data) => axiosInstance.post('/payment/razorpay/verify-payment', data),
    getMySubscription: () => axiosInstance.get('/admin/subscription'),
    getSubscriptionStatus: () => axiosInstance.get('/admin/subscription/status'),
    getMyPayments: () => axiosInstance.get('/admin/payments'),
    getAllJobs: () => axiosInstance.get('/admin/jobs'),
    createJob: (data) => axiosInstance.post('/admin/jobs', data),
    updateJob: (jobId, data) => axiosInstance.put(`/admin/jobs/${jobId}`, data),
    deleteJob: (jobId) => axiosInstance.delete(`/admin/jobs/${jobId}`),
    getJobVacancies: () => axiosInstance.get('/admin/job-vacancies'),
    createJobVacancy: (data) => axiosInstance.post('/admin/job-vacancies', data),
    updateJobVacancy: (id, data) => axiosInstance.put(`/admin/job-vacancies/${id}`, data),
    deleteJobVacancy: (id) => axiosInstance.delete(`/admin/job-vacancies/${id}`),
    getJobSeekers: () => axiosInstance.get('/admin/job-seekers'),
    getJobSeekerById: (id) => axiosInstance.get(`/admin/job-seekers/${id}`),
    createJobSeeker: (data) => axiosInstance.post('/admin/job-seekers', data),
    updateJobSeeker: (id, data) => axiosInstance.put(`/admin/job-seekers/${id}`, data),
    deleteJobSeeker: (id) => axiosInstance.delete(`/admin/job-seekers/${id}`),
    createBillCompany: (data) => axiosInstance.post('/admin/bill-company', data),
    getBillCompanies: () => axiosInstance.get('/admin/bill-company'),
    updateBillCompany: (id, data) => axiosInstance.put(`/admin/bill-company/${id}`, data),
    deleteBillCompany: (id) => axiosInstance.delete(`/admin/bill-company/${id}`),
    createPaymentSetup: (data) => axiosInstance.post('/admin/payment-setup', data),
    getPaymentSetups: () => axiosInstance.get('/admin/payment-setup'),
    updatePaymentSetup: (id, data) => axiosInstance.put(`/admin/payment-setup/${id}`, data),
    getAttendance: (params) => axiosInstance.get('/admin/attendance', { params }),
    markAttendance: (data) => axiosInstance.post('/admin/attendance', data),
    getTrainings: () => axiosInstance.get('/admin/trainings'),
    createTraining: (data) => axiosInstance.post('/admin/trainings', data),
    assignTraining: (data) => axiosInstance.post('/admin/trainings/assign', data),
    getTrainingMaterials: () => axiosInstance.get('/admin/trainings/materials'),
    uploadTrainingMaterial: (data) => axiosInstance.post('/admin/trainings/material', data),
    markTrainingCompletion: (data) => axiosInstance.post('/admin/trainings/completion', data),
    getTrainingResults: () => axiosInstance.get('/admin/trainings/results'),
    deleteTraining: (id) => axiosInstance.delete(`/admin/trainings/${id}`),
    updateTraining: (id, data) => axiosInstance.put(`/admin/trainings/${id}`, data),
    getAuditLogs: (params) => axiosInstance.get('/admin/audit-logs', { params }),
    getAuditStats: () => axiosInstance.get('/admin/audit-logs/stats'),
    getAuditActions: () => axiosInstance.get('/admin/audit-logs/actions'),
    getAllTickets: (params) => axiosInstance.get('/admin/tickets', { params }),
    createTicket: (data) => axiosInstance.post('/admin/tickets', data),
    replyTicket: (id, data) => axiosInstance.post(`/admin/tickets/${id}/reply`, data),
    updateTicketStatus: (id, status) => axiosInstance.put(`/admin/tickets/${id}/status`, { status }),
    getPaymentGateways: () => axiosInstance.get('/admin/payment-gateways'),
    createPaymentGateway: (data) => axiosInstance.post('/admin/payment-gateways', data),
    updatePaymentGateway: (id, data) => axiosInstance.put(`/admin/payment-gateways/${id}`, data),
    deletePaymentGateway: (id) => axiosInstance.delete(`/admin/payment-gateways/${id}`),
    getBankAccounts: () => axiosInstance.get('/admin/bank-accounts'),
    createBankAccount: (data) => axiosInstance.post('/admin/bank-accounts', data),
    updateBankAccount: (id, data) => axiosInstance.put(`/admin/bank-accounts/${id}`, data),
    deleteBankAccount: (id) => axiosInstance.delete(`/admin/bank-accounts/${id}`),
    // Backup & Recovery System
    getBackups: () => axiosInstance.get('/admin/backups'),
    createBackup: (data) => axiosInstance.post('/admin/backups/create', data),
    sendBackupEmail: (data) => axiosInstance.post('/admin/backups/send-email', data),
    getAutomatedReportStatus: () => axiosInstance.get('/admin/backups/automated-report/status'),
    triggerAutomatedReport: (data) => axiosInstance.post('/admin/backups/automated-report/trigger', data),
    deleteBackup: (filename) => axiosInstance.delete(`/admin/backups/${encodeURIComponent(filename)}`),
    restoreBackup: (filename) => axiosInstance.post('/admin/backups/restore', { filename }),
    uploadAndRestoreBackup: (formData) => axiosInstance.post('/admin/backups/upload-restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getDownloadBackupUrl: (filename) => `${API_BASE_URL}admin/backups/download/${encodeURIComponent(filename)}`,
};

// ==================== SUPERADMIN API ====================
export const superadminAPI = {
    getDashboard: () => axiosInstance.get('/superadmin/dashboard'),
    getAnalytics: () => axiosInstance.get('/superadmin/analytics'),
    createAdmin: (data) => axiosInstance.post('/superadmin/admins', data),
    getAllAdmins: () => axiosInstance.get('/superadmin/admins'),
    updateAdmin: (adminId, data) => axiosInstance.put(`/superadmin/admins/${adminId}`, data),
    updateAdminStatus: (adminId, status) => axiosInstance.put(`/superadmin/admins/${adminId}/status`, { status }),
    deleteAdmin: (adminId) => axiosInstance.delete(`/superadmin/admins/${adminId}`),
    toggleUserStatus: (userId, status) =>
        axiosInstance.put(`/superadmin/users/${userId}/status`, { status }),
    createPlan: (data) => axiosInstance.post('/superadmin/plans', data),
    getAllPlans: () => axiosInstance.get('/superadmin/plans'),
    getPlanById: (planId) => axiosInstance.get(`/superadmin/plans/${planId}`),
    updatePlan: (planId, data) => axiosInstance.put(`/superadmin/plans/${planId}`, data),
    deletePlan: (planId) => axiosInstance.delete(`/superadmin/plans/${planId}`),
    createCompany: (data) => axiosInstance.post('/superadmin/companies', data),
    getAllCompanies: () => axiosInstance.get('/superadmin/companies'),
    updateCompany: (employerId, data) => axiosInstance.put(`/superadmin/companies/${employerId}`, data),
    deleteCompany: (employerId) => axiosInstance.delete(`/superadmin/companies/${employerId}`),
    assignPlanToCompany: (employerId, data) =>
        axiosInstance.post(`/superadmin/companies/${employerId}/assign-plan`, data),
    toggleCompanyStatus: (employerId, status) =>
        axiosInstance.put(`/superadmin/companies/${employerId}/status`, { status }),
    generateInvoice: (data) => axiosInstance.post('/superadmin/invoices', data),
    recordPayment: (data) => axiosInstance.post('/superadmin/payments', data),
    getPaymentInvoiceHistory: (employerId) =>
        axiosInstance.get('/superadmin/invoices', { params: { employer_id: employerId } }),
    getAllPayments: (params) => axiosInstance.get('/superadmin/payments', { params }),
    getAllSubscriptions: (params) => axiosInstance.get('/superadmin/subscriptions', { params }),
    activateSubscription: (id) => axiosInstance.post(`/superadmin/subscriptions/${id}/activate`),
    getAllCompanyRequests: (params) => axiosInstance.get('/superadmin/company-requests', { params }),
    getCompanyRequestById: (requestId) => axiosInstance.get(`/superadmin/company-requests/${requestId}`),
    acceptCompanyRequest: (requestId, data) => axiosInstance.post(`/superadmin/company-requests/${requestId}/accept`, data),
    rejectCompanyRequest: (requestId, data) => axiosInstance.post(`/superadmin/company-requests/${requestId}/reject`, data),
    updateCompanyRequestPaymentStatus: (requestId, data) => axiosInstance.put(`/superadmin/company-requests/${requestId}/payment-status`, data),
    deleteCompanyRequest: (requestId) => axiosInstance.delete(`/superadmin/company-requests/${requestId}`),
    updateProfile: (data) => axiosInstance.put('/superadmin/profile', data),
    getProfile: () => axiosInstance.get('/superadmin/profile'),
    resetAdminPassword: (data) => axiosInstance.post('/superadmin/reset-admin-password', data),
    changePassword: (data) => axiosInstance.post('/auth/change-password', data),
    getAllTickets: (params) => axiosInstance.get('/superadmin/tickets', { params }),
    createTicket: (data) => axiosInstance.post('/superadmin/tickets', data),
    replyTicket: (id, data) => axiosInstance.post(`/superadmin/tickets/${id}/reply`, data),
    updateTicketStatus: (id, status) => axiosInstance.put(`/superadmin/tickets/${id}/status`, { status }),
    getEmailLogs: (params) => axiosInstance.get('/superadmin/email-logs', { params }),
    getAllUserRequests: () => axiosInstance.get('/superadmin/user-requests'),
    deleteUserRequest: (id) => axiosInstance.post(`/superadmin/user-requests/${id}/delete`),
    getCustomPlanRequests: () => axiosInstance.get('/superadmin/custom-plan-requests'),
    updateCustomPlanRequestStatus: (id, status) => axiosInstance.put(`/superadmin/custom-plan-requests/${id}/status`, { status }),
    deleteCustomPlanRequest: (id) => axiosInstance.delete(`/superadmin/custom-plan-requests/${id}`),
    getAuditLogs: (params) => axiosInstance.get('/superadmin/audit-logs', { params }),
    getAuditStats: () => axiosInstance.get('/superadmin/audit-logs/stats'),
    getAuditActions: () => axiosInstance.get('/superadmin/audit-logs/actions'),
    // SMTP Configuration
    getSMTPConfig: () => axiosInstance.get('/superadmin/smtp-config'),
    updateSMTPConfig: (data) => axiosInstance.put('/superadmin/smtp-config', data),
    testSMTPConfig: (data) => axiosInstance.post('/superadmin/smtp-config/test', data),
    // Backup & Recovery System
    getBackups: () => axiosInstance.get('/superadmin/backups'),
    createBackup: (data) => axiosInstance.post('/superadmin/backups/create', data),
    sendBackupEmail: (data) => axiosInstance.post('/superadmin/backups/send-email', data),
    getAutomatedReportStatus: () => axiosInstance.get('/superadmin/backups/automated-report/status'),
    triggerAutomatedReport: (data) => axiosInstance.post('/superadmin/backups/automated-report/trigger', data),
    deleteBackup: (filename) => axiosInstance.delete(`/superadmin/backups/${encodeURIComponent(filename)}`),
    restoreBackup: (filename) => axiosInstance.post('/superadmin/backups/restore', { filename }),
    uploadAndRestoreBackup: (formData) => axiosInstance.post('/superadmin/backups/upload-restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getDownloadBackupUrl: (filename) => `${API_BASE_URL}superadmin/backups/download/${encodeURIComponent(filename)}`,
};

// ==================== VENDOR API ====================
export const vendorAPI = {
    getDashboard: () => axiosInstance.get('/vendor/dashboard'),
    getPaymentStatus: () => axiosInstance.get('/vendor/payment-status'),
    getMyPayments: () => axiosInstance.get('/vendor/payments'),
    getDashboardOverview: () => axiosInstance.get('/vendor/payments'),
    getContracts: () => axiosInstance.get('/vendor/payments'),
    getPayments: () => axiosInstance.get('/vendor/payments'),
    updateContractDetails: (data) => axiosInstance.put('/vendor/contract-details', data),
};

// ==================== JOB SEEKER API ====================
export const jobSeekerAPI = {
    getDashboardJobs: () => axiosInstance.get('/jobseeker/dashboard'),
    getStats: () => axiosInstance.get('/jobseeker/stats'),
    getJobDetails: (id) => axiosInstance.get(`/jobseeker/jobs/${id}`),
    submitResume: (formData) => axiosInstance.post('/jobseeker/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getMyResumes: () => axiosInstance.get('/jobseeker/resume'),
    applyJob: (jobId, data) => axiosInstance.post(`/jobseeker/apply/${jobId}`, data),
    getAppliedJobs: () => axiosInstance.get('/jobseeker/applications'),
    withdrawApplication: (id) => axiosInstance.put(`/jobseeker/applications/${id}/withdraw`),
    getProfile: () => axiosInstance.get('/jobseeker/profile'),
    updateProfile: (data) => axiosInstance.put('/jobseeker/profile', data),
    addSkill: (data) => axiosInstance.post('/jobseeker/skills', data),
    deleteSkill: (id) => axiosInstance.delete(`/jobseeker/skills/${id}`),
    addExperience: (data) => axiosInstance.post('/jobseeker/experience', data),
    addEducation: (data) => axiosInstance.post('/jobseeker/education', data),
};

// ==================== PUBLIC API ====================
export const publicAPI = {
    // Job Portal (No auth required)
    getAllJobs: (params) => axiosInstance.get('public/jobs', { params }),
    getJobById: (jobId) => axiosInstance.get(`public/jobs/${jobId}`),

    // These should now use jobSeekerAPI, but keeping aliases for backward compatibility if needed
    // or pointing them to consolidated jobseeker routes
    applyForJob: (jobId, data) => jobSeekerAPI.applyJob(jobId, data),
    getDashboard: () => jobSeekerAPI.getStats(),
    getAppliedJobs: () => jobSeekerAPI.getAppliedJobs(),
    getProfile: () => jobSeekerAPI.getProfile(),
    updateProfile: (data) => jobSeekerAPI.updateProfile(data),
    submitResume: (formData) => jobSeekerAPI.submitResume(formData),
    uploadResume: (formData) => jobSeekerAPI.submitResume(formData),
    getResumes: () => jobSeekerAPI.getMyResumes(),

    // Plans (No auth required - for landing page)
    getActivePlans: () => axiosInstance.get('public/plans'),

    // Company Signup Request (No auth required - from landing page)
    createCompanyRequest: (data) => axiosInstance.post('public/company-request', data),
    updateCompanyRequestPaymentStatus: (id, data) => axiosInstance.put(`public/company-request/${id}/payment-status`, data),

    // User Requests (No auth required - from landing page registration forms)
    createRequest: (data) => axiosInstance.post('public/user-request', data),

    // Support Ticket Request (No auth required - from Support Center Modal)
    createSupportTicket: (data) => axiosInstance.post('public/support-ticket', data),

    // Custom Plan Requirement Request (No auth required)
    createCustomPlanRequest: (data) => axiosInstance.post('custom-plan-request', data),

    // Razorpay Online Checkout (Public / Registration)
    createRazorpayOrder: (data) => axiosInstance.post('payment/razorpay/create-order', data),
    verifyAndRegister: (data) => axiosInstance.post('payment/razorpay/verify-and-register', data),
};

// ==================== WHATSAPP CONNECTIVITY API ====================
export const whatsappAPI = {
    getStatus: () => axiosInstance.get('/admin/whatsapp/status'),
    connect: (phoneNumber) => axiosInstance.post('/admin/whatsapp/connect', { phoneNumber }),
    getPairingCode: (phoneNumber) => axiosInstance.post('/admin/whatsapp/pairing-code', { phoneNumber }),
    disconnect: () => axiosInstance.post('/admin/whatsapp/disconnect'),
    updatePreferences: (data) => axiosInstance.put('/admin/whatsapp/preferences', data),
    sendTestMessage: (data) => axiosInstance.post('/admin/whatsapp/test', data),
    getLogs: (limit = 50) => axiosInstance.get(`/admin/whatsapp/logs?limit=${limit}`),
};

export default axiosInstance;
