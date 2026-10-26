const { ChallengesDB } = require('../assets/js/challenges.js');

const normalize = (str) => {
    if (!str || typeof str !== 'string') return '';
    let s = str.trim();
    s = s.replace(/^[`"']+|[`"']+$/g, '').trim();
    s = s.replace(/;+$/, '').trim();
    s = s.replace(/\s*([=+\-*/%<>!&|^~?:,()\[\]{}]+)\s*/g, '$1');
    return s.toLowerCase();
};

function validateAnswer(challenge, submittedAnswer) {
    const rawSubmitted = (submittedAnswer || '').trim();
    const normSubmitted = normalize(rawSubmitted);

    // CRITICAL: Empty submissions or semicolon/whitespace-only submissions must ALWAYS fail
    if (!normSubmitted || normSubmitted.length === 0 || /^;+$/.test(rawSubmitted.replace(/\s+/g, ''))) {
        return false;
    }

    const normSolution = normalize(challenge.solution || '');
    const normFlag = challenge.flag ? normalize(challenge.flag) : '';
    const expectedFlag = `AIODYSSEY{CHALLENGE_${String(challenge.id).padStart(2, '0')}_SOLVED}`;
    const normExpectedFlag = normalize(expectedFlag);
    const acceptedAnswers = Array.isArray(challenge.acceptedAnswers) ? challenge.acceptedAnswers : [];

    if (normSolution && normSubmitted === normSolution) return true;
    if (normFlag && normSubmitted === normFlag) return true;
    if (normExpectedFlag && normSubmitted === normExpectedFlag) return true;
    if (challenge.solution && rawSubmitted.toLowerCase() === challenge.solution.trim().toLowerCase()) return true;

    return acceptedAnswers.some(ans => {
        if (!ans) return false;
        const normAns = normalize(ans);
        if (!normAns) return false;
        return normAns === normSubmitted || ans.trim().toLowerCase() === rawSubmitted.toLowerCase();
    });
}

const badInputs = [';', ';  ', ' ; ', '', '   ', ';;', '";"', "';'", '; ; ;', '  ;  ', ';;;;;'];
let exploitsFound = 0;

ChallengesDB.forEach(ch => {
    badInputs.forEach(input => {
        if (validateAnswer(ch, input)) {
            exploitsFound++;
            console.log(`❌ EXPLOIT on CH #${ch.id} (${ch.title}) with input ${JSON.stringify(input)}`);
        }
    });
});

console.log(`\nResults: ${exploitsFound} exploits found across all 76 challenges (0 expected).`);

// Also verify legitimate answers still PASS!
let validPassed = 0;
ChallengesDB.forEach(ch => {
    if (ch.solution && validateAnswer(ch, ch.solution)) {
        validPassed++;
    } else if (ch.flag && validateAnswer(ch, ch.flag)) {
        validPassed++;
    } else if (ch.acceptedAnswers && ch.acceptedAnswers[0] && validateAnswer(ch, ch.acceptedAnswers[0])) {
        validPassed++;
    } else {
        console.log(`⚠️ Warning: Legitimate solution failed on CH #${ch.id} (${ch.title}): solution=${JSON.stringify(ch.solution)}`);
    }
});

console.log(`Legitimate answers verified: ${validPassed} / ${ChallengesDB.length} challenges passed.`);
