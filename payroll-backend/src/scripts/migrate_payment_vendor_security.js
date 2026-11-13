const path = require('path');
const backendDir = 'c:/Users/Kiaan technology/Desktop/payroll/payroll-backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const db = require(path.join(backendDir, 'src/config/mysql'));

async function run() {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    console.log('[MIGRATION] Checking vendor_bank_accounts table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vendor_bank_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_id INT NULL,
        user_id INT NOT NULL,
        bank_name VARCHAR(100) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_type VARCHAR(50) DEFAULT 'Savings',
        ifsc_code VARCHAR(20) NOT NULL,
        branch VARCHAR(100) DEFAULT '',
        is_primary TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_vba_user (user_id),
        INDEX idx_vba_vendor (vendor_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[MIGRATION] vendor_bank_accounts table verified/created.');

    console.log('[MIGRATION] Checking unique index on payments(transaction_id)...');
    const [indexes] = await connection.query("SHOW INDEX FROM payments WHERE Key_name = 'uq_payments_transaction_id'");
    if (indexes.length === 0) {
      await connection.query("CREATE UNIQUE INDEX uq_payments_transaction_id ON payments (transaction_id)");
      console.log('[MIGRATION] Created unique index uq_payments_transaction_id on payments.');
    } else {
      console.log('[MIGRATION] Unique index uq_payments_transaction_id already exists.');
    }

    await connection.commit();
    console.log('[MIGRATION] All migrations applied successfully.');
    process.exit(0);
  } catch (err) {
    await connection.rollback();
    console.error('[MIGRATION ERROR]:', err);
    process.exit(1);
  } finally {
    connection.release();
  }
}

run();

