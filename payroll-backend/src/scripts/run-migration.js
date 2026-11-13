const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/mysql');

async function runMigration() {
  const connection = await db.getConnection();
  try {
    console.log('[MIGRATION] Applying Google Play columns to subscriptions table...');

    const columnsToAdd = [
      { name: 'payment_gateway', def: "VARCHAR(50) NOT NULL DEFAULT 'razorpay' AFTER auto_renew" },
      { name: 'google_product_id', def: "VARCHAR(100) NULL AFTER payment_gateway" },
      { name: 'google_base_plan_id', def: "VARCHAR(100) NULL AFTER google_product_id" },
      { name: 'google_purchase_token', def: "VARCHAR(500) NULL AFTER google_base_plan_id" },
      { name: 'google_order_id', def: "VARCHAR(150) NULL AFTER google_purchase_token" },
      { name: 'google_subscription_state', def: "VARCHAR(50) NULL AFTER google_order_id" },
      { name: 'last_sync_at', def: "DATETIME NULL AFTER google_subscription_state" }
    ];

    const [existingCols] = await connection.query('SHOW COLUMNS FROM subscriptions');
    const existingColNames = existingCols.map(c => c.Field);

    for (const col of columnsToAdd) {
      if (!existingColNames.includes(col.name)) {
        console.log(`Adding column ${col.name}...`);
        await connection.query(`ALTER TABLE subscriptions ADD COLUMN ${col.name} ${col.def}`);
      } else {
        console.log(`Column ${col.name} already exists.`);
      }
    }

    const [indexes] = await connection.query('SHOW INDEX FROM subscriptions');
    const indexNames = indexes.map(i => i.Key_name);

    if (!indexNames.includes('uq_google_purchase_token')) {
      console.log('Adding unique index uq_google_purchase_token...');
      await connection.query('ALTER TABLE subscriptions ADD UNIQUE INDEX uq_google_purchase_token (google_purchase_token(255))');
    }

    if (!indexNames.includes('idx_google_order_id')) {
      console.log('Adding index idx_google_order_id...');
      await connection.query('ALTER TABLE subscriptions ADD INDEX idx_google_order_id (google_order_id)');
    }

    console.log('[MIGRATION] Successfully updated schema!');
    const [finalCols] = await connection.query('SHOW COLUMNS FROM subscriptions');
    finalCols.forEach(c => console.log(`  - ${c.Field} (${c.Type})`));

  } catch (err) {
    console.error('[MIGRATION ERROR]:', err);
    process.exit(1);
  } finally {
    connection.release();
    await db.end();
  }
}

runMigration();
