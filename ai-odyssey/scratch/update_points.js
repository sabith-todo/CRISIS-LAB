const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'assets', 'js', 'challenges.js');
let code = fs.readFileSync(target, 'utf8');

// Update medium to 150 pts, hard to 300 pts, boss to 1000 pts
code = code.replace(/difficulty:\s*["']medium["'],\s*points:\s*\d+/g, "difficulty: 'medium',\n        points: 150");
code = code.replace(/difficulty:\s*["']hard["'],\s*points:\s*\d+/g, "difficulty: 'hard',\n        points: 300");
code = code.replace(/difficulty:\s*["']boss["'],\s*points:\s*\d+/g, "difficulty: 'boss',\n        points: 1000");

fs.writeFileSync(target, code, 'utf8');
console.log('✅ Successfully updated challenge points: Easy=50, Medium=150, Hard=300, Boss=1000');
