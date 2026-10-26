const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'challenges');
const dirs = fs.readdirSync(baseDir);

let updated = 0;
dirs.forEach(d => {
    const indexPath = path.join(baseDir, d, 'index.html');
    if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');
        if (!content.includes('ai-coach.js')) {
            content = content.replace(
                '<script src="../../assets/js/main.js"></script>',
                '<script src="../../assets/js/ai-coach.js"></script>\n    <script src="../../assets/js/main.js"></script>'
            );
            fs.writeFileSync(indexPath, content, 'utf8');
            updated++;
        }
    }
});

console.log(`Included ai-coach.js in ${updated} challenge files.`);
