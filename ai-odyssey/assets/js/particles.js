/* ============================================
   AI ODYSSEY / CRISIS LAB - ULTRA-OPTIMIZED PARTICLE SYSTEM
   High Performance, Zero-Lag Canvas Constellation
   ============================================ */

const ParticleSystem = {
    canvas: null,
    ctx: null,
    container: null,
    particles: [],
    mouse: { x: null, y: null, radius: 120, radiusSq: 14400 },
    animationFrameId: null,
    isPaused: false,
    config: {
        particleCount: 36,
        maxDistance: 110,
        maxDistSq: 12100,
        baseSpeed: 0.45,
        colors: ['#00f0ff', '#7b2ff7', '#ff2d95', '#00ff88']
    },

    init() {
        this.container = document.getElementById('particles');
        if (!this.container) return;

        this.container.innerHTML = '';
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'particles-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d', { alpha: true });
        if (!this.ctx) return;

        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    },

    resize() {
        if (!this.canvas || !this.container) return;
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;

        if (this.width < 768) {
            this.config.particleCount = 18;
            this.config.maxDistance = 80;
            this.config.maxDistSq = 6400;
        } else {
            this.config.particleCount = 36;
            this.config.maxDistance = 110;
            this.config.maxDistSq = 12100;
        }
    },

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            const size = Math.random() * 2 + 1;
            const color = this.config.colors[i % this.config.colors.length];
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * this.config.baseSpeed,
                vy: (Math.random() - 0.5) * this.config.baseSpeed,
                size: size,
                baseSize: size,
                color: color,
                alpha: Math.random() * 0.4 + 0.3,
                pulse: Math.random() * Math.PI
            });
        }
    },

    bindEvents() {
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.resize();
                this.createParticles();
            }, 200);
        }, { passive: true });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        }, { passive: true });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        }, { passive: true });

        // Sleep when tab is hidden to save CPU/GPU
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isPaused = true;
                if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
            } else {
                this.isPaused = false;
                this.animate();
            }
        });
    },

    animate() {
        if (this.isPaused) return;

        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const particles = this.particles;
        const len = particles.length;
        const maxDistSq = this.config.maxDistSq;
        const maxDist = this.config.maxDistance;
        const mx = this.mouse.x;
        const my = this.mouse.y;
        const mRadiusSq = this.mouse.radiusSq;

        ctx.clearRect(0, 0, w, h);

        // 1. Draw connecting lines fast with single path per color
        for (let i = 0; i < len; i++) {
            const p = particles[i];

            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Bounce
            if (p.x < 0 || p.x > w) p.vx = -p.vx;
            if (p.y < 0 || p.y > h) p.vy = -p.vy;

            // Fast mouse interaction
            if (mx !== null && my !== null) {
                const dx = mx - p.x;
                const dy = my - p.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < mRadiusSq) {
                    const dist = Math.sqrt(distSq);
                    const force = (120 - dist) / 120;
                    p.x -= (dx / dist) * force * 2.5;
                    p.y -= (dy / dist) * force * 2.5;
                }
            }

            // Connect nearby nodes
            for (let j = i + 1; j < len; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < maxDistSq) {
                    const alpha = (1 - distSq / maxDistSq) * 0.18;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = p.color;
                    ctx.globalAlpha = alpha;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }

        // 2. Draw particle nodes without shadowBlur overhead
        for (let i = 0; i < len; i++) {
            const p = particles[i];
            p.pulse += 0.025;
            const alpha = p.alpha + Math.sin(p.pulse) * 0.12;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, 6.283185);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0.1, Math.min(0.8, alpha));
            ctx.fill();
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ParticleSystem.init());
} else {
    ParticleSystem.init();
}
