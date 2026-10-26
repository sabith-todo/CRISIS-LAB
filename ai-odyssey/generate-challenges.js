/**
 * AI Odyssey - Challenge Generator
 * Run with: node generate-challenges.js
 * Generates all 50 challenge folders (Python, C, Java) with their HTML & flag files
 */

const fs = require('fs');
const path = require('path');
const challengesModule = require('./assets/js/challenges.js');
const ChallengesDB = challengesModule.ChallengesDB || challengesModule;

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function generateChallengeFiles(challenge) {
    const id = String(challenge.id).padStart(2, '0');
    const dir = path.join(__dirname, 'challenges', `challenge${id}`);
    
    // Create directory
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Read template
    let template = fs.readFileSync(path.join(__dirname, 'challenges', 'template.html'), 'utf8');
    
    // Replace placeholders
    template = template
        .replace(/%ID%/g, challenge.id)
        .replace(/%ID_PADDED%/g, id)
        .replace(/%TITLE%/g, challenge.title)
        .replace(/%CATEGORY%/g, challenge.category)
        .replace(/%DIFFICULTY%/g, challenge.difficulty)
        .replace(/%DIFFICULTY_UPPER%/g, challenge.difficulty.toUpperCase())
        .replace(/%POINTS%/g, challenge.points)
        .replace(/%DESCRIPTION%/g, challenge.description)
        .replace(/%OBJECTIVE%/g, challenge.objective)
        .replace(/%ERROR_OUTPUT%/g, escapeHtml(challenge.errorOutput || ''));

    // Write flag.txt (for boss/hard or solution for easy/medium)
    fs.writeFileSync(path.join(dir, 'flag.txt'), challenge.flag || challenge.solution || '');

    // Write index.html (preserve custom interactive layout for Grand Boss #66)
    if (challenge.id !== 66 || !fs.existsSync(path.join(dir, 'index.html'))) {
        fs.writeFileSync(path.join(dir, 'index.html'), template);
    }

    console.log(`✅ Generated challenge${id}: [${challenge.category}] ${challenge.title}`);
}

// Generate all challenges
console.log('🚀 Generating AI Odyssey Python, C, and Java Challenges...\n');
ChallengesDB.forEach(challenge => generateChallengeFiles(challenge));
console.log(`\n✅ All ${ChallengesDB.length} challenges generated successfully!`);
