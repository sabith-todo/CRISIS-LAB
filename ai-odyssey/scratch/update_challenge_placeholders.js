const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'challenges');
const dirs = fs.readdirSync(baseDir);

let updatedCount = 0;

dirs.forEach(d => {
    const indexPath = path.join(baseDir, d, 'index.html');
    if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');
        let modified = false;

        if (content.includes('Enter the code modification to fix the bug (e.g. single operator like')) {
            content = content.replace(
                /<p style="color: var\(--text-secondary\); font-size: 0\.9rem; margin-bottom: 1rem;">\s*Enter the code modification to fix the bug \(e\.g\. single operator like.*?<\/p>/s,
                `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">\n                    Enter your code fix or corrected expression below:\n                </p>`
            );
            modified = true;
        }

        if (content.includes('placeholder="Type your code fix (e.g. A+D, A < B, !=, +, -)..."')) {
            content = content.replace(
                'placeholder="Type your code fix (e.g. A+D, A < B, !=, +, -)..."',
                'placeholder="Enter your fix here..."'
            );
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(indexPath, content, 'utf8');
            updatedCount++;
        }
    }
});

console.log(`Updated ${updatedCount} challenge HTML files cleanly.`);
