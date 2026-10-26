/* ============================================================
   CRISIS LAB — Debug Game Engine (DG)
   Single-bug isolation & code fix engine
   ============================================================ */

const DG = {
    state: {
        difficulty: 'easy',
        queue: [],
        index: 0,
        current: null,
        score: 0,
        streak: 0,
        solved: 0,
        hintsUsed: 0,
        hintsMax: 3,
        answered: false,
        timer: null,
        timeLeft: 90,
        timerMax: 90,
        globalTimer: null,
        globalTimeLeft: 90 * 60, // 90 mins arena
    },

    init() {
        // Any init logic
    },

    selectDifficulty(diff) {
        this.state.difficulty = diff;
        const selEl = document.getElementById('dgSelectedDiff');
        if (selEl) {
            selEl.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
        }
        document.getElementById('dgWelcome').style.display = 'none';
        document.getElementById('dgGame').style.display = 'block';
        document.getElementById('dgStartBanner').style.display = 'block';
        document.getElementById('dgChallengeCard').style.display = 'none';
    },

    startGame() {
        document.getElementById('dgStartBanner').style.display = 'none';
        document.getElementById('dgGlobalTimerBanner').style.display = 'flex';
        document.getElementById('dgChallengeCard').style.display = 'block';

        // Filter challenges by difficulty
        const all = typeof DG_CHALLENGES !== 'undefined' ? DG_CHALLENGES : [];
        let list = all.filter(c => c.difficulty === this.state.difficulty);
        if (list.length === 0) list = all;

        // Shuffle
        this.state.queue = [...list].sort(() => Math.random() - 0.5);
        this.state.index = 0;
        this.state.score = 0;
        this.state.streak = 0;
        this.state.solved = 0;

        this.startGlobalTimer();
        this.loadChallenge();
    },

    startGlobalTimer() {
        if (this.state.globalTimer) clearInterval(this.state.globalTimer);
        this.state.globalTimeLeft = 90 * 60; // 90 minutes
        this.updateGlobalTimerUI();

        this.state.globalTimer = setInterval(() => {
            this.state.globalTimeLeft--;
            this.updateGlobalTimerUI();
            if (this.state.globalTimeLeft <= 0) {
                clearInterval(this.state.globalTimer);
                this.timeUpGlobal();
            }
        }, 1000);
    },

    updateGlobalTimerUI() {
        const el = document.getElementById('dgGlobalTime');
        if (!el) return;
        const total = Math.max(0, this.state.globalTimeLeft);
        const mins = Math.floor(total / 60);
        const secs = total % 60;
        el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    loadChallenge() {
        this.state.answered = false;
        this.state.hintsUsed = 0;

        if (this.state.index >= this.state.queue.length) {
            this.state.queue = [...this.state.queue].sort(() => Math.random() - 0.5);
            this.state.index = 0;
        }

        const ch = this.state.queue[this.state.index];
        this.state.current = ch;

        // Tags & Headers
        const diffTag = document.getElementById('dgDiffTag');
        if (diffTag) diffTag.textContent = ch.difficulty.toUpperCase();
        
        const langTag = document.getElementById('dgLangTag');
        if (langTag) langTag.textContent = ch.language;

        const chNum = document.getElementById('dgChNum');
        if (chNum) chNum.textContent = `Challenge ${this.state.index + 1} / ${this.state.queue.length}`;

        const codeLang = document.getElementById('dgCodeLang');
        if (codeLang) codeLang.textContent = ch.langTag || 'code';

        const desc = document.getElementById('dgDesc');
        if (desc) desc.textContent = ch.description;

        const ptsPill = document.getElementById('dgPtsPill');
        if (ptsPill) ptsPill.textContent = `+${ch.marks || 50} pts`;

        // Render code
        const codePre = document.getElementById('dgCodePre');
        if (codePre) {
            codePre.textContent = ch.code;
        }

        // Reset input
        const input = document.getElementById('dgAnswerInput');
        if (input) {
            input.value = '';
            input.disabled = false;
            input.focus();
        }

        // Reset hints
        const hintsList = document.getElementById('dgHintsList');
        if (hintsList) hintsList.innerHTML = '';

        const hintsLeft = document.getElementById('dgHintsLeft');
        if (hintsLeft) hintsLeft.textContent = this.state.hintsMax;

        const hintBtn = document.getElementById('dgHintBtn');
        if (hintBtn) {
            hintBtn.disabled = false;
            hintBtn.style.display = 'block';
        }

        // Hide result
        const resEl = document.getElementById('dgResult');
        if (resEl) resEl.style.display = 'none';

        // Per challenge timer
        const timeMap = { easy: 90, medium: 60, hard: 45 };
        this.state.timeLeft = timeMap[ch.difficulty] || 60;
        this.state.timerMax = this.state.timeLeft;
        this.startChallengeTimer();
    },

    startChallengeTimer() {
        if (this.state.timer) clearInterval(this.state.timer);
        this.updateTimerUI();
        this.state.timer = setInterval(() => {
            this.state.timeLeft--;
            this.updateTimerUI();
            if (this.state.timeLeft <= 0) {
                clearInterval(this.state.timer);
                this.timeUpChallenge();
            }
        }, 1000);
    },

    updateTimerUI() {
        const numEl = document.getElementById('dgTimerNum');
        if (numEl) numEl.textContent = this.state.timeLeft;

        const bar = document.getElementById('dgTimerBar');
        if (bar) {
            const circumference = 157; // 2 * pi * 25
            const progress = this.state.timeLeft / this.state.timerMax;
            bar.style.strokeDashoffset = circumference * (1 - progress);
            if (this.state.timeLeft <= 10) {
                bar.classList.add('danger');
            } else {
                bar.classList.remove('danger');
            }
        }
    },

    cleanInput(str) {
        if (!str) return '';
        let s = String(str).trim();
        s = s.replace(/^[`"']+|[`"']+$/g, '').replace(/;+$/, '').trim();
        // Collapse spaces around operators (+, -, *, /, %, <, >, <=, >=, ==, !=, =, &, |, !)
        s = s.replace(/\s*([=+\-*/%<>!&|^~?:,()\[\]{}]+)\s*/g, '$1');
        return s.toLowerCase();
    },

    checkAnswer() {
        if (this.state.answered) return;
        const input = document.getElementById('dgAnswerInput');
        if (!input) return;

        const raw = input.value.trim();
        if (!raw) {
            this.toast('Type the bug word or code fix first!', 'info');
            input.focus();
            return;
        }

        const ch = this.state.current;
        const userNorm = this.cleanInput(raw);
        const bugNorm = this.cleanInput(ch.bugWord);
        const fixNorm = this.cleanInput(ch.correctWord);
        const accepted = (ch.acceptedAnswers || []).map(a => this.cleanInput(a));

        const isCorrect = userNorm === bugNorm ||
            userNorm === fixNorm ||
            raw.toLowerCase() === (ch.bugWord || '').toLowerCase() ||
            raw.toLowerCase() === (ch.correctWord || '').toLowerCase() ||
            accepted.includes(userNorm);

        if (isCorrect) {
            clearInterval(this.state.timer);
            this.state.answered = true;
            input.classList.add('correct');

            let points = ch.marks || 50;
            const hintPenalty = this.state.hintsUsed * 5;
            points = Math.max(10, points - hintPenalty);

            this.state.streak++;
            this.state.solved++;
            this.state.score += points;

            this.updateStatsUI();
            this.showResult(true, points);
        } else {
            input.classList.add('wrong');
            setTimeout(() => {
                input.classList.remove('wrong');
            }, 600);
            this.toast('❌ Not quite! Check the code and error output.', 'error');
            input.select();
        }
    },

    onEnter(e) {
        if (e.key === 'Enter') this.checkAnswer();
    },

    useHint() {
        const ch = this.state.current;
        if (!ch || !ch.hints) return;
        if (this.state.hintsUsed >= ch.hints.length || this.state.hintsUsed >= this.state.hintsMax) return;

        const hintText = ch.hints[this.state.hintsUsed];
        this.state.hintsUsed++;

        const hintsList = document.getElementById('dgHintsList');
        if (hintsList) {
            const el = document.createElement('div');
            el.className = 'dg-hint-item';
            el.innerHTML = `💡 <strong>Hint ${this.state.hintsUsed}:</strong> ${hintText}`;
            hintsList.appendChild(el);
        }

        const left = this.state.hintsMax - this.state.hintsUsed;
        const hintsLeft = document.getElementById('dgHintsLeft');
        if (hintsLeft) hintsLeft.textContent = left;

        if (left <= 0) {
            const btn = document.getElementById('dgHintBtn');
            if (btn) btn.disabled = true;
        }
    },

    showResult(success, points) {
        const ch = this.state.current;
        const resEl = document.getElementById('dgResult');
        if (!resEl) return;

        resEl.style.display = 'block';

        const icon = document.getElementById('dgResultIcon');
        const title = document.getElementById('dgResultTitle');
        const sub = document.getElementById('dgResultSub');
        const explain = document.getElementById('dgExplain');
        const ptsEl = document.getElementById('dgRsPts');
        const totalEl = document.getElementById('dgRsTotal');
        const streakEl = document.getElementById('dgRsStreak');

        if (success) {
            if (icon) icon.textContent = this.state.streak >= 3 ? '🔥' : '✅';
            if (title) title.textContent = this.state.streak >= 3 ? `${this.state.streak}x Streak Combo!` : 'Bug Resolved!';
            if (sub) sub.innerHTML = `Bug was <code>${ch.bugWord}</code> → Corrected to <code>${ch.correctWord}</code>`;
            if (ptsEl) ptsEl.textContent = `+${points}`;
        } else {
            if (icon) icon.textContent = '⏱';
            if (title) title.textContent = 'Time Up!';
            if (sub) sub.innerHTML = `The bug was <code>${ch.bugWord}</code> (Fix: <code>${ch.correctWord}</code>)`;
            if (ptsEl) ptsEl.textContent = '+0';
        }

        if (totalEl) totalEl.textContent = this.state.score;
        if (streakEl) streakEl.textContent = `🔥 ${this.state.streak}`;
        if (explain) explain.innerHTML = ch.explanation || '';
    },

    nextChallenge() {
        this.state.index++;
        this.loadChallenge();
    },

    skipChallenge() {
        this.state.streak = 0;
        this.nextChallenge();
    },

    timeUpChallenge() {
        this.state.answered = true;
        this.state.streak = 0;
        this.updateStatsUI();
        this.showResult(false, 0);
    },

    timeUpGlobal() {
        this.toast('⏱ 90-Minute Arena Session Concluded!', 'warning');
        alert('⏱ 90-Minute Arena Session Concluded!');
    },

    updateStatsUI() {
        const scoreEl = document.getElementById('dgTotalScore');
        if (scoreEl) scoreEl.textContent = this.state.score;

        const solvedEl = document.getElementById('dgSolvedCount');
        if (solvedEl) solvedEl.textContent = this.state.solved;

        const streakEl = document.getElementById('dgStreakDisplay');
        if (streakEl) streakEl.textContent = `🔥 ${this.state.streak} streak`;
    },

    copyCode() {
        if (!this.state.current) return;
        navigator.clipboard.writeText(this.state.current.code);
        this.toast('📋 Code copied to clipboard', 'info');
    },

    goHome() {
        if (this.state.timer) clearInterval(this.state.timer);
        if (this.state.globalTimer) clearInterval(this.state.globalTimer);
        document.getElementById('dgWelcome').style.display = 'block';
        document.getElementById('dgGame').style.display = 'none';
        document.getElementById('dgResult').style.display = 'none';
    },

    toast(msg, type = 'info') {
        const c = document.getElementById('dgToastContainer');
        if (!c) return;
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.style.cssText = `
            background: #13142e;
            color: #fff;
            padding: 12px 20px;
            border-radius: 8px;
            border-left: 4px solid ${type === 'error' ? '#ff3b30' : type === 'success' ? '#30d158' : '#00f0ff'};
            font-size: 0.9rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        `;
        el.textContent = msg;
        c.appendChild(el);
        setTimeout(() => el.remove(), 3500);
    }
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => DG.init());
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DG;
}
