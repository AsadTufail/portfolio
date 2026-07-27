(function () {
    'use strict';

    const button = document.querySelector('.theme-switch');

    if (!button) {
        return;
    }

    const storedTheme = localStorage.getItem('portfolio-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const startDark = storedTheme ? storedTheme === 'dark' : prefersDark;

    function applyTheme(isDark) {
        document.body.setAttribute('data-dark-mode', String(isDark));
        button.setAttribute('aria-pressed', String(isDark));
        button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        button.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    applyTheme(startDark);

    button.addEventListener('click', function () {
        const isDark = button.getAttribute('aria-pressed') !== 'true';
        applyTheme(isDark);
        localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
    });
})();
