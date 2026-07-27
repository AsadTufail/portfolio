(function ($) {
    'use strict';

    const $html = $('html');
    const $header = $('.header--sticky');
    const $mobileMenu = $('.popup-mobile-menu');
    const $menuButton = $('.hamberger-menu');
    const $backToTop = $('.backto-top');
    const $navLinks = $('.primary-menu .nav-link[href^="#"]');

    function openMobileMenu() {
        $mobileMenu.addClass('menu-open').attr('aria-hidden', 'false');
        $menuButton.attr('aria-expanded', 'true');
        $html.css('overflow', 'hidden');
        $mobileMenu.find('.close-menu-activation').trigger('focus');
    }

    function closeMobileMenu() {
        $mobileMenu.removeClass('menu-open').attr('aria-hidden', 'true');
        $menuButton.attr('aria-expanded', 'false');
        $html.css('overflow', '');
    }

    function scrollToTarget(target) {
        const $target = $(target);

        if (!$target.length) {
            return;
        }

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const top = Math.max($target.offset().top - 70, 0);

        if (reducedMotion) {
            window.scrollTo(0, top);
        } else {
            $('html, body').stop().animate({ scrollTop: top }, 350);
        }
    }

    function updateNavigation() {
        const headerOffset = ($header.outerHeight() || 0) + 40;
        const scrollPosition = $(window).scrollTop() + headerOffset;
        let activeTarget = '#home';

        $navLinks.each(function () {
            const target = $(this).attr('href');
            const $section = $(target);

            if ($section.length && $section.offset().top <= scrollPosition) {
                activeTarget = target;
            }
        });

        $navLinks
            .removeClass('active')
            .filter('[href="' + activeTarget + '"]')
            .addClass('active');
    }

    function updateHeader() {
        const scrollTop = $(window).scrollTop();
        $header.toggleClass('sticky', scrollTop > 80);
        $backToTop.toggleClass('is-visible', scrollTop > 400);
        updateNavigation();
    }

    function initHeroTyping() {
        const element = document.querySelector('.hero-typed-text');

        if (!element) {
            return;
        }

        const phrases = (element.dataset.phrases || '')
            .split('|')
            .map(function (phrase) {
                return phrase.trim();
            })
            .filter(Boolean);

        if (!phrases.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            element.textContent = phrases[0] || element.textContent;
            return;
        }

        let phraseIndex = 0;
        let characterIndex = 0;
        let deleting = false;

        element.textContent = '';

        function typeNextCharacter() {
            const phrase = phrases[phraseIndex];

            if (!deleting) {
                characterIndex += 1;
                element.textContent = phrase.slice(0, characterIndex);

                if (characterIndex === phrase.length) {
                    deleting = true;
                    window.setTimeout(typeNextCharacter, 1500);
                    return;
                }

                window.setTimeout(typeNextCharacter, 85);
                return;
            }

            characterIndex -= 1;
            element.textContent = phrase.slice(0, characterIndex);

            if (characterIndex === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                window.setTimeout(typeNextCharacter, 300);
                return;
            }

            window.setTimeout(typeNextCharacter, 45);
        }

        window.setTimeout(typeNextCharacter, 450);
    }

    function initProjectEnquiry() {
        const form = document.querySelector('#project-enquiry-form');

        if (!form) {
            return;
        }

        const textFields = Array.from(form.querySelectorAll('input[type="text"], textarea'));

        textFields.forEach(function (field) {
            field.addEventListener('input', function () {
                field.setCustomValidity('');
            });
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const emptyField = textFields.find(function (field) {
                return !field.value.trim();
            });

            if (emptyField) {
                emptyField.setCustomValidity('Please complete this field.');
                emptyField.reportValidity();
                return;
            }

            const data = new FormData(form);
            const message = [
                'Hi Asad, I’d like to discuss a project.',
                '',
                'Name: ' + data.get('name').trim(),
                'Email: ' + data.get('email').trim(),
                'Project type: ' + data.get('projectType'),
                'Estimated budget: ' + data.get('budget').trim(),
                'Timeline: ' + data.get('timeline').trim(),
                '',
                'Project requirements:',
                data.get('description').trim()
            ].join('\n');
            const whatsappUrl = 'https://wa.me/923126399437?text=' + encodeURIComponent(message);
            const enquiryWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

            if (enquiryWindow) {
                enquiryWindow.opener = null;
            } else {
                window.location.assign(whatsappUrl);
            }
        });
    }

    function initReviewCarousel() {
        const carousel = document.querySelector('[data-review-carousel]');

        if (!carousel) {
            return;
        }

        const viewport = carousel.querySelector('.fiverr-review-viewport');
        const track = carousel.querySelector('.fiverr-review-track');
        const cards = Array.from(carousel.querySelectorAll('.fiverr-review-card'));
        const previousButton = carousel.querySelector('[data-review-prev]');
        const nextButton = carousel.querySelector('[data-review-next]');
        const toggleButton = carousel.querySelector('[data-review-toggle]');
        const toggleLabel = carousel.querySelector('[data-review-toggle-label]');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const autoScrollDelay = 5000;
        let currentIndex = 0;
        let autoScrollTimer = null;
        let temporarilyPaused = false;
        let manuallyPaused = reducedMotion.matches;
        let resizeTimer = null;

        if (!viewport || !track || cards.length < 2 || !previousButton || !nextButton || !toggleButton) {
            return;
        }

        function getVisibleCardCount() {
            const cardWidth = cards[0].getBoundingClientRect().width;
            const trackStyle = window.getComputedStyle(track);
            const gap = parseFloat(trackStyle.columnGap || trackStyle.gap) || 0;

            if (!cardWidth) {
                return 1;
            }

            return Math.max(1, Math.round((viewport.clientWidth + gap) / (cardWidth + gap)));
        }

        function getMaximumIndex() {
            return Math.max(0, cards.length - getVisibleCardCount());
        }

        function updateToggleButton() {
            toggleButton.classList.toggle('is-paused', manuallyPaused);
            toggleButton.setAttribute('aria-pressed', manuallyPaused ? 'true' : 'false');
            toggleButton.setAttribute(
                'aria-label',
                manuallyPaused ? 'Resume automatic review scrolling' : 'Pause automatic review scrolling'
            );

            if (toggleLabel) {
                toggleLabel.textContent = manuallyPaused ? 'Play' : 'Pause';
            }
        }

        function stopAutoScroll() {
            if (autoScrollTimer) {
                window.clearInterval(autoScrollTimer);
                autoScrollTimer = null;
            }
        }

        function startAutoScroll() {
            stopAutoScroll();

            if (manuallyPaused || temporarilyPaused || document.hidden || reducedMotion.matches) {
                return;
            }

            autoScrollTimer = window.setInterval(function () {
                showCard(currentIndex >= getMaximumIndex() ? 0 : currentIndex + 1);
            }, autoScrollDelay);
        }

        function showCard(index, behavior) {
            const maximumIndex = getMaximumIndex();
            currentIndex = Math.min(Math.max(index, 0), maximumIndex);
            const left = cards[currentIndex].offsetLeft - track.offsetLeft;

            viewport.scrollTo({
                left: left,
                behavior: behavior || (reducedMotion.matches ? 'auto' : 'smooth')
            });
        }

        function restartAutoScroll() {
            stopAutoScroll();
            startAutoScroll();
        }

        previousButton.addEventListener('click', function () {
            showCard(currentIndex <= 0 ? getMaximumIndex() : currentIndex - 1);
            restartAutoScroll();
        });

        nextButton.addEventListener('click', function () {
            showCard(currentIndex >= getMaximumIndex() ? 0 : currentIndex + 1);
            restartAutoScroll();
        });

        toggleButton.addEventListener('click', function () {
            manuallyPaused = !manuallyPaused;
            updateToggleButton();
            restartAutoScroll();
        });

        carousel.addEventListener('mouseenter', function () {
            temporarilyPaused = true;
            stopAutoScroll();
        });

        carousel.addEventListener('mouseleave', function () {
            temporarilyPaused = false;
            startAutoScroll();
        });

        carousel.addEventListener('focusin', function () {
            temporarilyPaused = true;
            stopAutoScroll();
        });

        carousel.addEventListener('focusout', function (event) {
            if (!carousel.contains(event.relatedTarget)) {
                temporarilyPaused = false;
                startAutoScroll();
            }
        });

        viewport.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                showCard(
                    event.key === 'ArrowLeft'
                        ? (currentIndex <= 0 ? getMaximumIndex() : currentIndex - 1)
                        : (currentIndex >= getMaximumIndex() ? 0 : currentIndex + 1)
                );
                restartAutoScroll();
            }
        });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                stopAutoScroll();
            } else {
                startAutoScroll();
            }
        });

        window.addEventListener('resize', function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(function () {
                showCard(Math.min(currentIndex, getMaximumIndex()), 'auto');
            }, 150);
        });

        if (typeof reducedMotion.addEventListener === 'function') {
            reducedMotion.addEventListener('change', function (event) {
                if (event.matches) {
                    manuallyPaused = true;
                    stopAutoScroll();
                    showCard(currentIndex, 'auto');
                }

                updateToggleButton();
            });
        }

        updateToggleButton();
        startAutoScroll();
    }

    if (window.feather) {
        window.feather.replace();
    }

    if (window.AOS) {
        window.AOS.init({
            duration: 500,
            once: true,
            disable: function () {
                return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            }
        });
    }

    $menuButton.on('click', openMobileMenu);
    $('.close-menu-activation').on('click', closeMobileMenu);

    $mobileMenu.on('click', function (event) {
        if (event.target === this) {
            closeMobileMenu();
        }
    });

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape' && $mobileMenu.hasClass('menu-open')) {
            closeMobileMenu();
            $menuButton.trigger('focus');
        }
    });

    $(document).on('click', 'a.smoth-animation', function (event) {
        const target = $(this).attr('href');

        if (!target || !target.startsWith('#')) {
            return;
        }

        event.preventDefault();
        closeMobileMenu();
        scrollToTarget(target);
    });

    $(window).on('scroll', updateHeader);

    $(window).on('resize', function () {
        if (window.innerWidth >= 1200 && $mobileMenu.hasClass('menu-open')) {
            closeMobileMenu();
        }

        updateNavigation();
    });

    $backToTop.on('click', function () {
        scrollToTarget('#home');
    });

    $('#current-year').text(new Date().getFullYear());
    initHeroTyping();
    initProjectEnquiry();
    initReviewCarousel();
    updateHeader();
})(jQuery);
