const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'android') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            searchDir(fullPath, pattern);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx') || entry.name.endsWith('.json'))) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                    if (pattern.test(line)) {
                        console.log(fullPath + ':' + (idx + 1) + ': ' + line.trim());
                    }
                });
            } catch (e) {}
        }
    }
}

console.log('--- Search in payroll-frontend ---');
searchDir('payroll-frontend', /verifyAndRegister|planDbId|createRazorpayOrder/);
