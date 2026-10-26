const { ChallengesDB } = require('../assets/js/challenges.js');

const normalize = (str) => {
    if (!str) return '';
    let s = String(str).trim();
    s = s.replace(/^[`"']+|[`"']+$/g, '').replace(/;+$/, '').trim();
    s = s.replace(/\s*([=+\-*/%<>!&|^~?:,()\[\]{}]+)\s*/g, '$1');
    return s.toLowerCase();
};

const ch = ChallengesDB[0]; // Challenge 1
const input = ';  ';
const normSubmitted = normalize(input);
const normSolution = normalize(ch.solution);
const normFlag = normalize(ch.flag);
const normExpectedFlag = normalize('AIODYSSEY{CHALLENGE_01_SOLVED}');

console.log('Input:', JSON.stringify(input));
console.log('normSubmitted:', JSON.stringify(normSubmitted));
console.log('normSolution:', JSON.stringify(normSolution));
console.log('normFlag:', JSON.stringify(normFlag));
console.log('normExpectedFlag:', JSON.stringify(normExpectedFlag));

ch.acceptedAnswers.forEach(ans => {
    const normAns = normalize(ans);
    console.log('ans:', JSON.stringify(ans), '=> normAns:', JSON.stringify(normAns), 'match?', normAns === normSubmitted);
});
