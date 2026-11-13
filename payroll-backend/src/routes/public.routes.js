const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// TRULY Public routes (no authentication required)

// Job routes
router.get('/jobs', publicController.getAllJobs);
router.get('/jobs/:id', publicController.getJobById);

// Plans route
router.get('/plans', publicController.getActivePlans);

// Company signup request
router.post('/company-request', publicController.createCompanyRequest);
// REMOVED FOR SECURITY: Company request payment status must only be modified by authorized superadmins via /api/superadmin/company-requests/:id/payment-status

// Support ticket route (Public)
router.post('/support-ticket', publicController.createPublicSupportTicket);

// Custom Plan Requirement route (Public)
router.post('/custom-plan-request', publicController.createCustomPlanRequest);

// Privacy Policy route (Public - Google Play Store & Web Compliance)
router.get('/privacy-policy', publicController.getPrivacyPolicy);

// How To Use Operating Guide route (Public)
router.get('/how-to-use', publicController.getHowToUseGuides);

module.exports = router;
