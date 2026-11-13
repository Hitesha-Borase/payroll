const fs = require('fs');
let content = fs.readFileSync('payroll-frontend/vite.config.js', 'utf8');
content = content.replace(/(employer_id:\s*6,\r?\n\s*)plan_id:\s*1,/, '$1plan_id: 4,');
content = content.replace(/(employer_id:\s*1,\r?\n\s*)plan_id:\s*1,/, '$1plan_id: 4,');
fs.writeFileSync('payroll-frontend/vite.config.js', content, 'utf8');
console.log('Successfully updated vite.config.js');

