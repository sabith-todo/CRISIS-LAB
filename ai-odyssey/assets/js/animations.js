/* ============================================
   AI ODYSSEY / CRISIS LAB - ADVANCED ANIMATION MANAGER
   3D Tilt Engine, Matrix Canvas, Sound Synthesizer & VFX
   ============================================ */

const SoundFX = {
    audioCtx: null,
    muted: false,

    initContext() {
        if (!this.audioCtx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },

    playClick() {
        if (this.muted) return;
        try {
            this.initContext();
            if (!this.audioCtx) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.05);
        } catch (e) {
            // Audio context safely ignored if blocked by autoplay policy
        }
    },

    playSolve() {
        if (this.muted) return;
        try {
            this.initContext();
            if (!this.audioCtx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.08);
                gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + idx * 0.08 + 0.25);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(this.audioCtx.currentTime + idx * 0.08);
                osc.stop(this.audioCtx.currentTime + idx * 0.08 + 0.25);
            });
        } catch (e) {}
    },

    playError() {
        if (this.muted) return;
        try {
            this.initContext();
            if (!this.audioCtx) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, this.audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(80, this.audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.2);
        } catch (e) {}
    },

    playHint() {
        if (this.muted) return;
        try {
            this.initContext();
            if (!this.audioCtx) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.15);
        } catch (e) {}
    }
};

const AnimationManager = {
    init() {
        this.initCounters();
        this.initRevealAnimations();
        this.initTerminalAnimation();
        this.initCodeRain();
        this.init3DTilt();
        this.bindMicroInteractions();
    },

    // Smooth Spring-Eased Numerical Counters
    initCounters() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        if (!counters.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.dataset.target, 10);
                    this.animateCounter(counter, target);
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.3 });

        counters.forEach(counter => observer.observe(counter));
    },

    animateCounter(element, target) {
        if (!element || isNaN(target)) return;
        if (target === 0) {
            element.textContent = '0';
            return;
        }

        const duration = 1800; // ms
        const startTime = performance.now();

        const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const update = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);
            const current = Math.floor(easedProgress * target);

            // Format with commas if > 999
            element.textContent = current > 999 ? current.toLocaleString() : current;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target > 999 ? target.toLocaleString() : target;
            }
        };

        requestAnimationFrame(update);
    },

    // Staggered Scroll Reveal Animations
    initRevealAnimations() {
        const reveals = document.querySelectorAll('[data-aos], .reveal');
        if (!reveals.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.dataset.delay, 10) || 0;

                    setTimeout(() => {
                        el.classList.add('visible');
                        el.style.opacity = '1';
                        el.style.transform = 'translate(0, 0) scale(1)';
                    }, delay);

                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.1 });

        reveals.forEach(el => {
            el.style.opacity = '0';
            if (!el.classList.contains('reveal')) {
                el.style.transform = 'translateY(30px)';
            }
            el.style.transition = 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
            observer.observe(el);
        });
    },

    // Interactive 3D Card Tilt Engine with Specular Glare
    init3DTilt() {
        const tiltCards = document.querySelectorAll('.card, .stat-card, .diff-card, .difficulty-card, .challenge-card, .category-card, .about-card');
        
        tiltCards.forEach(card => {
            card.style.transformStyle = 'preserve-3d';
            card.style.willChange = 'transform';

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -8;
                const rotateY = ((x - centerX) / centerX) * 8;

                card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale(1.015)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
                card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            });

            card.addEventListener('mouseenter', () => {
                card.style.transition = 'none';
            });
        });
    },

    // Terminal typing animation with prompt trails
    initTerminalAnimation() {
        const terminalLines = document.querySelectorAll('.terminal-line');
        if (!terminalLines.length) return;

        terminalLines.forEach(line => {
            const delay = parseInt(line.dataset.delay, 10) || 0;
            line.style.animationDelay = `${delay}ms`;
        });
    },

    // High-Performance Matrix Code Rain Canvas
    initCodeRain() {
        const container = document.getElementById('codeRain');
        if (!container) return;

        container.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.className = 'code-rain-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width, height, columns, drops;
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン{}[]()<>=+*/$#@!%&|~^';

        const resize = () => {
            width = canvas.width = container.offsetWidth || 400;
            height = canvas.height = container.offsetHeight || 400;
            columns = Math.floor(width / 18);
            drops = Array(columns).fill(0).map(() => Math.floor(Math.random() * -30));
        };

        resize();
        window.addEventListener('resize', resize);

        let lastTime = 0;
        const fps = 28;
        const interval = 1000 / fps;

        const drawRain = (time) => {
            requestAnimationFrame(drawRain);
            const delta = time - lastTime;
            if (delta < interval) return;
            lastTime = time - (delta % interval);

            ctx.fillStyle = 'rgba(6, 8, 20, 0.12)';
            ctx.fillRect(0, 0, width, height);

            ctx.font = '13px "JetBrains Mono", monospace';

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * 18;
                const y = drops[i] * 18;

                // Bright glowing white/cyan leading head
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 8;
                ctx.fillText(char, x, y);

                // Normal matrix trail
                ctx.fillStyle = '#00f0ff';
                ctx.shadowBlur = 0;
                ctx.fillText(char, x, y - 18);

                if (y > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        requestAnimationFrame(drawRain);
    },

    // Interactive Button Click Audio Micro-Feedback
    bindMicroInteractions() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn, .nav-link, .filter-btn, .dg-diff-btn, .token');
            if (btn) {
                SoundFX.playClick();
            }
        });
    },

    // Cyberpunk Confetti & Victory Particle Shards
    createConfetti(count = 60) {
        SoundFX.playSolve();
        const colors = ['#00f0ff', '#7b2ff7', '#ff2d95', '#00ff88', '#ffd700', '#ffffff'];

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-20px';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            const size = Math.random() * 9 + 4;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size * (Math.random() > 0.5 ? 1.8 : 1)}px`;
            confetti.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
            confetti.style.boxShadow = `0 0 10px ${confetti.style.background}`;
            confetti.style.animationDuration = `${Math.random() * 2 + 2.2}s`;
            confetti.style.animationDelay = `${Math.random() * 0.4}s`;

            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4500);
        }
    },

    // Cyber Toast Notification System
    showToast(message, type = 'info', duration = 3500) {
        if (type === 'error') SoundFX.playError();
        else if (type === 'success') SoundFX.playSolve();
        else if (type === 'warning') SoundFX.playHint();
        else SoundFX.playClick();

        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '⚡',
            error: '⚠️',
            warning: '⏱',
            info: '⌘'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || '⌘'}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';
            toast.style.transform = 'translateX(110%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 320);
        }, duration);
    }
};

// Global audio & animation exports
window.AnimationManager = AnimationManager;
window.SoundFX = SoundFX;

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AnimationManager.init());
} else {
    AnimationManager.init();
}
