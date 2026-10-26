/* ============================================
   CRISIS LAB - Theme Manager Engine
   Seamless Dark / Light Cyberpunk Mode
   ============================================ */

const ThemeManager = {
    STORAGE_KEY: 'ai-odyssey-theme',

    init() {
        // Retrieve saved theme or default to dark
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'dark';
        this.setTheme(savedTheme, false);

        // Bind existing theme toggle buttons or inject one into the navbar
        this.bindToggleButtons();

        // Listen for system theme changes if no preference is explicitly set
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem(this.STORAGE_KEY)) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    },

    setTheme(theme, save = true) {
        const activeTheme = theme === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', activeTheme);
        if (save) {
            localStorage.setItem(this.STORAGE_KEY, activeTheme);
        }

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', activeTheme === 'light' ? '#f4f6fb' : '#080814');
        }

        // Update all toggle button icons & aria-labels
        this.updateToggleIcons(activeTheme);

        // Dispatch custom event for chart/canvas redraws
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: activeTheme } }));
    },

    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    },

    toggle() {
        const current = this.getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
        
        if (typeof AnimationManager !== 'undefined' && typeof AnimationManager.showToast === 'function') {
            AnimationManager.showToast(next === 'light' ? '☀️ Light Mode Activated' : '🌙 Dark Cyberpunk Mode Activated', 'info', 2500);
        }
    },

    updateToggleIcons(theme) {
        const toggles = document.querySelectorAll('#themeToggle, .theme-toggle, .btn-theme-toggle');
        toggles.forEach(btn => {
            btn.style.display = 'inline-flex';
            const iconSpan = btn.querySelector('.theme-icon') || btn;
            if (theme === 'light') {
                btn.setAttribute('title', 'Switch to Dark Mode');
                btn.setAttribute('aria-label', 'Switch to Dark Mode');
                if (btn.querySelector('.theme-icon')) {
                    btn.querySelector('.theme-icon').textContent = '🌙';
                } else if (!btn.querySelector('*')) {
                    btn.textContent = '🌙';
                }
            } else {
                btn.setAttribute('title', 'Switch to Light Mode');
                btn.setAttribute('aria-label', 'Switch to Light Mode');
                if (btn.querySelector('.theme-icon')) {
                    btn.querySelector('.theme-icon').textContent = '☀️';
                } else if (!btn.querySelector('*')) {
                    btn.textContent = '☀️';
                }
            }
        });
    },

    bindToggleButtons() {
        const toggles = document.querySelectorAll('#themeToggle, .theme-toggle, .btn-theme-toggle');
        toggles.forEach(btn => {
            btn.style.display = 'inline-flex';
            btn.onclick = (e) => {
                e.preventDefault();
                this.toggle();
            };
        });

        // If no theme toggle exists in nav-controls, inject a stylish one
        const navControls = document.querySelector('.nav-controls');
        if (navControls && !document.getElementById('themeToggle')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'themeToggle';
            toggleBtn.className = 'theme-toggle btn-icon';
            toggleBtn.setAttribute('aria-label', 'Toggle light/dark theme');
            toggleBtn.innerHTML = '<span class="theme-icon">' + (this.getTheme() === 'light' ? '🌙' : '☀️') + '</span>';
            toggleBtn.style.cssText = 'background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 1.1rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease; margin-left: 0.5rem;';
            toggleBtn.onclick = (e) => {
                e.preventDefault();
                this.toggle();
            };
            navControls.insertBefore(toggleBtn, navControls.firstChild);
        }

        this.updateToggleIcons(this.getTheme());
    }
};

// Immediate pre-render theme application
(function() {
    try {
        const saved = localStorage.getItem('ai-odyssey-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
    } catch (e) {}
})();

// Init once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}
