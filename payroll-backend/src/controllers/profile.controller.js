const db = require('../config/mysql');
const bcrypt = require('bcrypt');
const { generateTokens } = require('../utils/jwt'); // In case we need to refresh token on profile change, though not requested
const { validationResult } = require('express-validator'); // If we use express-validator

/**
 * Get User Profile
 */
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Fetch fetching generic user data
        const [users] = await db.query('SELECT id, name, email, phone, role FROM users WHERE id = ?', [userId]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Return user profile
        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Update User Profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, phone } = req.body;

        // Basic validation
        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        // Update user
        await db.query('UPDATE users SET name = ?, phone = ?, updated_at = NOW() WHERE id = ?', [name, phone || null, userId]);

        // Updated user for response
        const [users] = await db.query('SELECT id, name, email, phone, role FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: users[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Change Password
 */
const changePassword = async (req, res, next) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        // Get user for password verification
        const [users] = await connection.query('SELECT password FROM users WHERE id = ?', [userId]);
        const user = users[0];

        if (!user) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await connection.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, userId]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Delete Account (Soft-Delete & Anonymization for Google Play Compliance)
 * Requires re-authentication with current password.
 * Anonymizes PII (Name, Email, Phone, Address, Password) and marks status = 'deleted'.
 * Retains financial invoices, salary payments, and audit logs for statutory compliance.
 */
const deleteAccount = async (req, res, next) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const userId = req.user?.id;
        const callerRole = (req.user?.role || '').toLowerCase();

        const { password } = req.body;

        if (!password) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Current password is required to confirm account deletion.' });
        }

        // 2. Fetch user record for re-authentication
        const [users] = await connection.query('SELECT id, name, email, role, password, company_id FROM users WHERE id = ?', [userId]);
        const user = users[0];

        if (!user) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'User account not found.' });
        }

        const dbRole = (user.role || '').toLowerCase();

        // 3. Re-authenticate
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Incorrect password. Account deletion aborted.' });
        }

        const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

        // 4. Role-Specific Logic:
        // EMPLOYER / ADMIN / SUPERADMIN: Deleting company account must deactivate company and associated accounts without affecting other companies.
        if (dbRole === 'employer' || dbRole === 'admin' || dbRole === 'superadmin') {
            let adminCompanyId = user.company_id;
            if (!adminCompanyId) {
                const [cRows] = await connection.query(
                    'SELECT id FROM companies WHERE user_id = ? OR id IN (SELECT company_id FROM employers WHERE user_id = ?) OR admin_id IN (SELECT id FROM admins WHERE user_id = ?) LIMIT 1',
                    [userId, userId, userId]
                );
                if (cRows && cRows.length > 0) adminCompanyId = cRows[0].id;
            }

            if (adminCompanyId) {
                // 1. Cancel subscriptions strictly for this company
                await connection.query(
                    "UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE employer_id IN (SELECT id FROM employers WHERE company_id = ? OR user_id = ?)",
                    [adminCompanyId, userId]
                );

                // 2. Deactivate company record
                await connection.query(
                    "UPDATE companies SET status = 'inactive', updated_at = NOW() WHERE id = ?",
                    [adminCompanyId]
                );

                // 3. Deactivate all employers of this company
                await connection.query(
                    "UPDATE employers SET status = 'inactive', updated_at = NOW() WHERE company_id = ? OR user_id = ?",
                    [adminCompanyId, userId]
                );

                // 4. Deactivate all employees of this company and scrub bank details
                await connection.query(
                    "UPDATE employees SET status = 'inactive', updated_at = NOW() WHERE company_id = ?",
                    [adminCompanyId]
                );
                await connection.query(
                    "UPDATE bank_details SET account_number = CONCAT('DEL_', id), ifsc_code = 'XXXX0000000', account_holder_name = 'Deactivated User' WHERE employee_id IN (SELECT id FROM employees WHERE company_id = ?)",
                    [adminCompanyId]
                );

                // 5. Deactivate all vendors for this company
                await connection.query(
                    "UPDATE vendors SET status = 'inactive', updated_at = NOW() WHERE company_id = ?",
                    [adminCompanyId]
                );

                // 6. Soft-delete and anonymize all member users of this company
                const [associatedUsers] = await connection.query(
                    'SELECT id FROM users WHERE company_id = ? AND id != ?',
                    [adminCompanyId, userId]
                );
                if (associatedUsers && Array.isArray(associatedUsers)) {
                    for (const aUser of associatedUsers) {
                        const anonAssociatedEmail = `deleted_comp_${adminCompanyId}_user_${aUser.id}_${Date.now()}@deactivated.local`;
                        const scrPw = await bcrypt.hash(`DELETED_${Date.now()}_${Math.random()}`, 10);
                        await connection.query(
                            `UPDATE users 
                             SET name = 'Deactivated User', 
                                 email = ?, 
                                 phone = NULL, 
                                 address = NULL, 
                                 profile_image = NULL, 
                                 password = ?, 
                                 status = 'deleted', 
                                 updated_at = NOW() 
                             WHERE id = ?`,
                            [anonAssociatedEmail, scrPw, aUser.id]
                        );
                    }
                }
            }
        } else if (dbRole === 'employee') {
            // Employee personal account deactivation: Company and other employees are completely unaffected.
            await connection.query(
                "UPDATE employees SET status = 'inactive', updated_at = NOW() WHERE user_id = ?",
                [userId]
            );
            await connection.query(
                "UPDATE bank_details SET account_number = CONCAT('DEL_', id), ifsc_code = 'XXXX0000000', account_holder_name = 'Deactivated User' WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ?)",
                [userId]
            );
        } else if (dbRole === 'vendor') {
            await connection.query(
                "UPDATE vendors SET status = 'inactive', updated_at = NOW() WHERE user_id = ?",
                [userId]
            );
            try {
                await connection.query(
                    "UPDATE vendor_bank_accounts SET account_number = CONCAT('DEL_', id), ifsc_code = 'XXXX0000000' WHERE user_id = ?",
                    [userId]
                );
            } catch (vErr) {}
        }

        // 5. Soft-delete and Anonymize Personal User Record (Scrub PII, invalidate password and email)
        const anonymizedEmail = `deleted_${userId}_${Date.now()}@deactivated.local`;
        const scrambledPassword = await bcrypt.hash(`DELETED_${Date.now()}_${Math.random()}`, 10);

        await connection.query(
            `UPDATE users 
             SET name = 'Deactivated User', 
                 email = ?, 
                 phone = NULL, 
                 address = NULL, 
                 profile_image = NULL, 
                 password = ?, 
                 status = 'deleted', 
                 updated_at = NOW() 
             WHERE id = ?`,
            [anonymizedEmail, scrambledPassword, userId]
        );

        // 6. Statutory Audit Log (financial & tax retention notice)
        await connection.query(
            'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
            [userId, 'ACCOUNT_DELETED', 'User initiated account deletion. Personal contact details scrubbed. Statutory financial records retained per regulatory mandates.', ipAddress]
        );

        await connection.commit();

        res.json({
            success: true,
            message: (dbRole === 'admin' || dbRole === 'superadmin' || dbRole === 'employer')
                ? 'Your company account and associated member accounts have been deactivated, and personal data has been anonymized. Historical statutory financial, invoice, and tax records are retained in compliance with regulatory mandates.'
                : 'Your personal account has been deleted and contact information anonymized. Historical statutory payroll, tax, invoice, and disbursement records are retained in compliance with regulatory mandates.'
        });

    } catch (error) {
        if (connection) await connection.rollback();
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount
};
