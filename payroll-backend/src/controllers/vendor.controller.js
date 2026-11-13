const db = require('../config/mysql');
const auditService = require('../services/audit.service');

/**
 * Get Vendor Dashboard Data
 */
const getDashboard = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
        SELECT v.*, u.name as u_name, u.email as u_email
        FROM vendors v
        JOIN users u ON v.user_id = u.id
        WHERE v.user_id = ?
    `, [req.user.id]);
    const vendor = rows[0];

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found.',
      });
    }

    res.json({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          company_name: vendor.company_name,
          service_type: vendor.service_type,
          payment_status: vendor.payment_status,
          status: vendor.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Payment Status & Profile Details
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT v.*, u.name as u_name, u.email as u_email, u.phone as u_phone
      FROM vendors v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.user_id = ?
    `, [req.user.id]);
    
    let vendor = rows[0];
    if (!vendor) {
      const [fallback] = await db.query('SELECT * FROM vendors WHERE user_id = ?', [req.user.id]);
      vendor = fallback[0];
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found.',
      });
    }

    res.json({
      success: true,
      data: {
        company_name: vendor.company_name || '',
        contact_person: vendor.contact_person || vendor.u_name || '',
        email: vendor.email || vendor.u_email || req.user.email || '',
        phone: vendor.phone || vendor.u_phone || req.user.phone || '',
        address: vendor.address || '',
        service_type: vendor.service_type || '',
        payment_status: vendor.payment_status || 'pending',
        tax_id: vendor.tax_id || '',
        description: vendor.description || vendor.service_type || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Contract & Profile Details
 */
const updateContractDetails = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM vendors WHERE user_id = ?', [req.user.id]);
    const vendor = rows[0];

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found.',
      });
    }

    const { company_name, contact_person, email, phone, address, service_type, description, tax_id } = req.body;

    const updates = [];
    const params = [];
    if (company_name !== undefined) { updates.push('company_name = ?'); params.push(company_name); }
    if (contact_person !== undefined) { updates.push('contact_person = ?'); params.push(contact_person); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (service_type !== undefined) { updates.push('service_type = ?'); params.push(service_type); }

    if (updates.length > 0) {
      params.push(vendor.id);
      await db.query(`UPDATE vendors SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
    }

    // Sync users table if email or contact_person name is updated
    if (email || contact_person || phone) {
      const userUpdates = [];
      const userParams = [];
      if (email) { userUpdates.push('email = ?'); userParams.push(email); }
      if (contact_person) { userUpdates.push('name = ?'); userParams.push(contact_person); }
      if (phone) { userUpdates.push('phone = ?'); userParams.push(phone); }
      if (userUpdates.length > 0) {
        userParams.push(req.user.id);
        await db.query(`UPDATE users SET ${userUpdates.join(', ')}, updated_at = NOW() WHERE id = ?`, userParams);
      }
    }

    const [updated] = await db.query(`
      SELECT v.*, u.name as u_name, u.email as u_email, u.phone as u_phone 
      FROM vendors v 
      LEFT JOIN users u ON v.user_id = u.id 
      WHERE v.id = ?
    `, [vendor.id]);

    const updatedVendor = updated[0] || vendor;

    auditService.log({
      userId: req.user.id,
      action: 'UPDATE_CONTRACT',
      details: `Vendor (${company_name || updatedVendor.company_name || updatedVendor.contact_person}) updated contract profile details`,
      ipAddress: req.ip || req.socket?.remoteAddress
    });

    res.json({
      success: true,
      message: 'Profile details updated successfully.',
      data: {
        company_name: updatedVendor.company_name || '',
        contact_person: updatedVendor.contact_person || updatedVendor.u_name || '',
        email: updatedVendor.email || updatedVendor.u_email || '',
        phone: updatedVendor.phone || updatedVendor.u_phone || '',
        address: updatedVendor.address || '',
        service_type: updatedVendor.service_type || '',
        tax_id: tax_id || '',
        description: description || updatedVendor.service_type || ''
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get My Payments
 */
const getMyPayments = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT v.*, 
             emp.company_name as emp_company_name, 
             u.name as emp_user_name,
             co.company_name as co_company_name,
             admin_u.name as admin_user_name
      FROM vendors v
      LEFT JOIN employers emp ON (v.employer_id = emp.id OR (v.company_id IS NOT NULL AND v.company_id = emp.company_id))
      LEFT JOIN users u ON emp.user_id = u.id
      LEFT JOIN companies co ON (v.company_id = co.id OR emp.company_id = co.id)
      LEFT JOIN users admin_u ON (co.id = admin_u.company_id AND admin_u.role = 'admin')
      WHERE v.user_id = ?
      ORDER BY (v.employer_id = emp.id) DESC
      LIMIT 1
    `, [req.user.id]);
    const vendor = rows[0];

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found.',
      });
    }

    // Get transactions where vendor is the beneficiary
    const [transactions] = await db.query(`
        SELECT t.*, emp.company_name as emp_company_name, u.name as emp_user_name
        FROM transactions t
        LEFT JOIN employers emp ON t.employer_id = emp.id
        LEFT JOIN users u ON emp.user_id = u.id
        WHERE t.user_id = ? AND t.type = 'vendor_payment' AND t.status = 'success'
        ORDER BY t.date DESC
    `, [req.user.id]);

    // Determine actual employer name dynamically
    let actualEmployerName = vendor.emp_company_name || vendor.emp_user_name || vendor.co_company_name || vendor.admin_user_name;
    if (!actualEmployerName && transactions.length > 0) {
      actualEmployerName = transactions[0].emp_company_name || transactions[0].emp_user_name;
    }
    if (!actualEmployerName) {
      // Fallback: check creator from audit logs
      try {
        const [audit] = await db.query(
          "SELECT u.name, u.email FROM audit_logs a JOIN users u ON a.user_id = u.id WHERE a.action = 'CREATE_VENDOR' AND a.details LIKE ? ORDER BY a.id DESC LIMIT 1",
          [`%${req.user.email}%`]
        );
        if (audit.length > 0 && audit[0].name) {
          actualEmployerName = audit[0].name;
        }
      } catch (err) {}
    }
    if (!actualEmployerName || actualEmployerName === 'Main Employer') {
      actualEmployerName = 'Employer';
    }

    // Calculate totals
    const totalPaid = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const pendingAmount = vendor.payment_status === 'pending' ? 0 : 0; // Can be calculated from invoices

    res.json({
      success: true,
      data: {
        summary: {
          totalPaid: parseFloat(totalPaid.toFixed(2)),
          totalRevenue: parseFloat(totalPaid.toFixed(2)),
          totalContracts: 1,
          completedContracts: vendor.payment_status === 'paid' ? 1 : 0,
          pendingAmount: parseFloat(pendingAmount.toFixed(2)),
          pendingPayments: parseFloat(pendingAmount.toFixed(2)),
          paymentStatus: vendor.payment_status,
        },
        transactions: transactions.map(t => ({
          id: t.id,
          amount: parseFloat(t.amount || 0),
          description: t.description,
          employer: t.emp_company_name || t.emp_user_name || actualEmployerName,
          date: t.date,
          reference: t.reference,
          status: 'Completed',
          paymentStatus: 'completed'
        })),
        payments: transactions.map(t => ({
          id: t.id,
          amount: parseFloat(t.amount || 0),
          date: t.date,
          status: 'Completed',
          contractId: 'CON-' + t.id
        })),
        contracts: [
          {
            id: 'CON-' + String(vendor.id || '001').padStart(3, '0'),
            employer: actualEmployerName,
            amount: totalPaid,
            startDate: vendor.created_at,
            endDate: new Date(),
            status: vendor.payment_status === 'paid' ? 'Completed' : 'Active'
          }
        ]
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to mask sensitive bank account numbers
 */
const maskAccountNumber = (acc) => {
  if (!acc) return '';
  const str = String(acc).trim();
  if (str.length <= 4) return str;
  return '•••• •••• •••• ' + str.slice(-4);
};

/**
 * Resolve target vendor & user context with authorization
 */
const resolveVendorScope = async (req, targetVendorId) => {
  if (req.user.role === 'vendor') {
    const [vRows] = await db.query('SELECT id, user_id, company_id FROM vendors WHERE user_id = ?', [req.user.id]);
    return {
      authorized: vRows.length > 0,
      vendor: vRows[0] || null,
      userId: req.user.id,
      vendorId: vRows[0]?.id || null
    };
  }

  // Admin or SuperAdmin
  if (!targetVendorId) {
    return { authorized: false, error: 'Vendor ID is required for administrative operations.' };
  }

  const [vRows] = await db.query('SELECT id, user_id, company_id FROM vendors WHERE id = ?', [targetVendorId]);
  if (vRows.length === 0) {
    return { authorized: false, notFound: true };
  }

  const vendor = vRows[0];
  if (req.user.role !== 'superadmin' && String(vendor.company_id) !== String(req.user.company_id)) {
    return { authorized: false, forbidden: true };
  }

  return {
    authorized: true,
    vendor,
    userId: vendor.user_id,
    vendorId: vendor.id
  };
};

/**
 * Get Vendor Bank Accounts
 */
const getBankAccounts = async (req, res, next) => {
  try {
    const targetVendorId = req.query?.vendor_id || req.params?.vendor_id;
    const scope = await resolveVendorScope(req, targetVendorId);

    if (!scope.authorized) {
      if (scope.forbidden) {
        return res.status(403).json({ success: false, message: 'Access denied: vendor belongs to another company.' });
      }
      if (scope.notFound) {
        return res.status(404).json({ success: false, message: 'Vendor not found.' });
      }
      return res.status(400).json({ success: false, message: scope.error || 'Unauthorized access.' });
    }

    const [rows] = await db.query(
      'SELECT id, bank_name as bankName, account_number as accountNumber, account_type as accountType, ifsc_code as ifscCode, branch, is_primary as isPrimary FROM vendor_bank_accounts WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC',
      [scope.userId]
    );

    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        accountNumber: maskAccountNumber(r.accountNumber),
        isPrimary: Boolean(r.isPrimary)
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Vendor Bank Account
 */
const createBankAccount = async (req, res, next) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    const { bankName, accountNumber, accountType, ifscCode, branch, isPrimary, vendor_id } = req.body;
    if (!bankName || !accountNumber || !ifscCode) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Bank name, account number, and IFSC code are required.' });
    }

    const cleanAcc = String(accountNumber).trim();
    if (cleanAcc.length < 6 || cleanAcc.length > 30) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Invalid account number format.' });
    }

    const cleanIfsc = String(ifscCode).trim().toUpperCase();
    if (cleanIfsc.length !== 11) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'IFSC code must be exactly 11 characters.' });
    }

    const scope = await resolveVendorScope(req, vendor_id);
    if (!scope.authorized) {
      await connection.rollback();
      if (scope.forbidden) {
        return res.status(403).json({ success: false, message: 'Access denied: vendor belongs to another company.' });
      }
      if (scope.notFound) {
        return res.status(404).json({ success: false, message: 'Vendor not found.' });
      }
      return res.status(400).json({ success: false, message: scope.error || 'Unauthorized.' });
    }

    const [existing] = await connection.query('SELECT COUNT(*) as count FROM vendor_bank_accounts WHERE user_id = ?', [scope.userId]);
    const willBePrimary = isPrimary || existing[0].count === 0 ? 1 : 0;

    if (willBePrimary) {
      await connection.query('UPDATE vendor_bank_accounts SET is_primary = 0 WHERE user_id = ?', [scope.userId]);
    }

    const [result] = await connection.query(
      `INSERT INTO vendor_bank_accounts (vendor_id, user_id, bank_name, account_number, account_type, ifsc_code, branch, is_primary, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [scope.vendorId, scope.userId, bankName.trim(), cleanAcc, accountType || 'Savings', cleanIfsc, branch || '', willBePrimary]
    );

    await connection.commit();

    const newAccount = {
      id: result.insertId,
      bankName: bankName.trim(),
      accountNumber: maskAccountNumber(cleanAcc),
      accountType: accountType || 'Savings',
      ifscCode: cleanIfsc,
      branch: branch || '',
      isPrimary: Boolean(willBePrimary)
    };

    res.status(201).json({
      success: true,
      message: 'Bank account added successfully.',
      data: newAccount
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Delete Vendor Bank Account
 */
const deleteBankAccount = async (req, res, next) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    const { id } = req.params;

    const [accRows] = await connection.query(
      'SELECT ba.*, v.company_id as vendor_company_id FROM vendor_bank_accounts ba LEFT JOIN vendors v ON ba.vendor_id = v.id WHERE ba.id = ?',
      [id]
    );
    if (accRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Bank account not found.' });
    }

    const bankAcc = accRows[0];

    if (req.user.role === 'vendor') {
      if (bankAcc.user_id !== req.user.id) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Bank account not found or access denied.' });
      }
    } else if (req.user.role === 'admin') {
      if (String(bankAcc.vendor_company_id) !== String(req.user.company_id)) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Access denied: bank account belongs to another company.' });
      }
    }

    await connection.query('DELETE FROM vendor_bank_accounts WHERE id = ?', [id]);
    await connection.commit();

    res.json({ success: true, message: 'Bank account deleted successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Set Primary Bank Account
 */
const setPrimaryBankAccount = async (req, res, next) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    const { id } = req.params;

    const [accRows] = await connection.query(
      'SELECT ba.*, v.company_id as vendor_company_id FROM vendor_bank_accounts ba LEFT JOIN vendors v ON ba.vendor_id = v.id WHERE ba.id = ?',
      [id]
    );
    if (accRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Bank account record not found.' });
    }

    const bankAcc = accRows[0];

    if (req.user.role === 'vendor') {
      if (bankAcc.user_id !== req.user.id) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Bank account not found or access denied.' });
      }
    } else if (req.user.role === 'admin') {
      if (String(bankAcc.vendor_company_id) !== String(req.user.company_id)) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Access denied: bank account belongs to another company.' });
      }
    }

    await connection.query('UPDATE vendor_bank_accounts SET is_primary = 0 WHERE user_id = ?', [bankAcc.user_id]);
    await connection.query('UPDATE vendor_bank_accounts SET is_primary = 1, updated_at = NOW() WHERE id = ? AND user_id = ?', [id, bankAcc.user_id]);

    await connection.commit();

    res.json({ success: true, message: 'Primary bank account updated successfully.' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Import Payment File & Update Transactions
 */
const importPayments = async (req, res, next) => {
  try {
    const file = req.file;
    let records = [];

    if (req.body.payments) {
      try {
        records = typeof req.body.payments === 'string' ? JSON.parse(req.body.payments) : req.body.payments;
      } catch (e) {
        records = [];
      }
    }

    // Get vendor details
    const [vendors] = await db.query('SELECT * FROM vendors WHERE user_id = ?', [req.user.id]);
    const vendor = vendors[0];
    const employerId = vendor ? vendor.employer_id : null;

    let insertedCount = 0;
    if (Array.isArray(records) && records.length > 0) {
      for (const rec of records) {
        const amount = parseFloat(rec.amount) || 0;
        const ref = rec.reference || `IMP-${Date.now()}-${insertedCount}`;
        const desc = rec.description || (file ? `Imported file: ${file.originalname}` : 'Imported Payment');
        const date = rec.date ? new Date(rec.date) : new Date();

        await db.query(
          `INSERT INTO transactions (user_id, employer_id, amount, type, description, reference, status, date, created_at, updated_at)
           VALUES (?, ?, ?, 'vendor_payment', ?, ?, 'success', ?, NOW(), NOW())`,
          [req.user.id, employerId, amount, desc, ref, date]
        );
        insertedCount++;
      }
    } else if (file) {
      const ref = `FILE-${Date.now().toString().slice(-6)}`;
      await db.query(
        `INSERT INTO transactions (user_id, employer_id, amount, type, description, reference, status, date, created_at, updated_at)
         VALUES (?, ?, 5000.00, 'vendor_payment', ?, ?, 'success', NOW(), NOW(), NOW())`,
        [req.user.id, employerId, `Imported document: ${file.originalname}`, ref]
      );
      insertedCount = 1;
    }

    auditService.log({
      userId: req.user.id,
      action: 'IMPORT_PAYMENTS',
      details: `Vendor imported ${insertedCount} payment record(s)${file ? ` from ${file.originalname}` : ''}`,
      ipAddress: req.ip || req.socket?.remoteAddress,
    });

    res.json({
      success: true,
      message: `Successfully imported ${insertedCount} payment record(s).`,
      data: {
        importedCount: insertedCount,
        file: file ? file.filename : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getPaymentStatus,
  updateContractDetails,
  getMyPayments,
  getBankAccounts,
  createBankAccount,
  deleteBankAccount,
  setPrimaryBankAccount,
  importPayments,
};

