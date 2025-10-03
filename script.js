// Script hồ sơ Bích Trân
// Chức năng: Toggle theme, nav mobile, năm footer, animation scroll, nền canvas hình học nhẹ

(function () {
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const perfToggle = document.getElementById('perfToggle');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const yearEl = document.getElementById('year');

    // Year
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Theme persistence
    const THEME_KEY = 'bt-theme';
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme) {
        document.documentElement.setAttribute('data-theme', storedTheme);
    }
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
    }
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Performance mode (stored in localStorage)
    const PERF_KEY = 'bt-perf';
    let perfMode = localStorage.getItem(PERF_KEY) === '1';
    if (perfMode) document.body.classList.add('performance-mode');
    function togglePerf() {
        perfMode = !perfMode;
        perfToggle?.setAttribute('aria-pressed', String(perfMode));
        if (perfMode) {
            document.body.classList.add('performance-mode');
            localStorage.setItem(PERF_KEY, '1');
            // dispatch custom event so subsystems can adapt
            document.dispatchEvent(new CustomEvent('perfmodechange', { detail: { enabled: true } }));
        } else {
            document.body.classList.remove('performance-mode');
            localStorage.removeItem(PERF_KEY);
            document.dispatchEvent(new CustomEvent('perfmodechange', { detail: { enabled: false } }));
        }
    }
    perfToggle?.addEventListener('click', togglePerf);

    // Sound toggle placeholder - wired later
    const soundToggleBtn = document.getElementById('soundToggle');

    // Mobile nav
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
    navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('show')));

    // Intersection Observer for fade-in
    const animateEls = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18 });
    animateEls.forEach(el => observer.observe(el));

    // Canvas geometric background
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h, rafId;

        function resize() {
            w = canvas.width = window.innerWidth * window.devicePixelRatio;
            h = canvas.height = window.innerHeight * window.devicePixelRatio;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        resize();
        window.addEventListener('resize', () => { cancelAnimationFrame(rafId); resize(); loop(); });

        let baseCount = 42;
        const points = Array.from({ length: baseCount }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: 1 + Math.random() * 2.1,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            tone: Math.random()
        }));

        let pauseScroll = false;
        let scrollTimer = null;
        function loop() {
            if (document.body.classList.contains('performance-mode') || pauseScroll) {
                // In perf mode or active scroll, just schedule a light retry later
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => loop());
                return;
            }
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            const theme = document.documentElement.getAttribute('data-theme');
            const styles = getComputedStyle(document.documentElement);
            const pink = styles.getPropertyValue('--color-accent').trim();
            const green = styles.getPropertyValue('--color-accent-alt')?.trim() || pink;

            // Draw lines
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const a = points[i];
                    const b = points[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 140) {
                        const t = (1 - dist / 140);
                        ctx.globalAlpha = t * 0.55;
                        // Interpolate stroke color between pink and green
                        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                        grad.addColorStop(0, pink);
                        grad.addColorStop(1, green);
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw points
            points.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
                if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
                ctx.globalAlpha = 0.9;
                // Choose particle color leaning pink or green
                ctx.fillStyle = p.tone > 0.5 ? pink : green;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;
            rafId = requestAnimationFrame(loop);
        }
        loop();

        window.addEventListener('scroll', () => {
            pauseScroll = true;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => { pauseScroll = false; }, 120); // resume shortly after scroll stops
        }, { passive: true });

        // React to performance mode changes
        document.addEventListener('perfmodechange', e => {
            if (e.detail.enabled) {
                // ensure canvas is cleared
                ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            } else {
                // resume animation
                cancelAnimationFrame(rafId);
                loop();
            }
        });
    }

    /* ================= Lightbox Viewer ================= */
    (function () {
        const lb = document.getElementById('lightbox');
        if (!lb) return;
        const imgEl = document.getElementById('lightbox-img');
        const capEl = document.getElementById('lightbox-cap');
        const closeBtn = lb.querySelector('.lightbox-close');
        const prevBtn = lb.querySelector('.lightbox-nav.prev');
        const nextBtn = lb.querySelector('.lightbox-nav.next');
        let currentList = []; // array of {src, cap, el}
        let idx = 0;
        let lastFocus = null;

        function buildList(scope) {
            const figs = Array.from(scope.querySelectorAll('.carousel-track .slide'));
            return figs.map(f => {
                const img = f.querySelector('img');
                const cap = f.querySelector('figcaption');
                return { src: img?.src, cap: cap?.textContent || '', fig: f };
            });
        }

        function show(i) {
            if (!currentList.length) return;
            idx = (i + currentList.length) % currentList.length;
            const item = currentList[idx];
            // If GIF, restart by adding timestamp (do not mutate original fig)
            let src = item.src;
            if (/\.gif(\?|$)/i.test(src)) src = src.split('?')[0] + '?t=' + Date.now();
            imgEl.src = src;
            imgEl.alt = item.cap || 'Image';
            capEl.textContent = item.cap;
            // Toggle transparent background removal for specific assets
            const baseName = src.split('/').pop().toLowerCase();
            if (baseName.includes('asset 1.png') || baseName.includes('mock up.png') || baseName.includes('dangoo.png')) {
                imgEl.classList.add('no-bg');
            } else {
                imgEl.classList.remove('no-bg');
            }
        }

        function openFromFigure(fig) {
            const carousel = fig.closest('[data-carousel]');
            if (!carousel) return;
            currentList = buildList(carousel);
            idx = currentList.findIndex(it => it.fig === fig);
            if (idx < 0) idx = 0;
            lastFocus = document.activeElement;
            lb.hidden = false;
            document.body.style.overflow = 'hidden';
            show(idx);
            closeBtn.focus();
        }

        function close() {
            lb.hidden = true;
            document.body.style.overflow = '';
            currentList = []; idx = 0;
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        // Event delegation: click on carousel images
        document.addEventListener('click', e => {
            const fig = e.target.closest && e.target.closest('.carousel-track .slide');
            if (!fig) return;
            const img = fig.querySelector('img');
            if (!img) return;
            // only left click
            if (e.button && e.button !== 0) return;
            openFromFigure(fig);
        });

        closeBtn.addEventListener('click', close);
        prevBtn.addEventListener('click', () => show(idx - 1));
        nextBtn.addEventListener('click', () => show(idx + 1));

        lb.addEventListener('click', e => { if (e.target === lb) close(); });

        document.addEventListener('keydown', e => {
            if (lb.hidden) return;
            if (e.key === 'Escape') { e.preventDefault(); close(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
        });
    })();
    /* -------------------- UI click sound (Web Audio) -------------------- */
    (function setupUIAudio() {
        const AUDIO_KEY = 'bt-audio-enabled';
        let audioEnabled = localStorage.getItem(AUDIO_KEY) === '1';
        let ctx = null;

        function createContext() {
            if (ctx) return ctx;
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                ctx = null;
            }
            return ctx;
        }

        function playClick() {
            if (!audioEnabled) return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // respect users
            const actx = createContext();
            if (!actx) return;

            function playOsc() {
                // bubble-like sound: sine oscillator pitch sweep + short filtered noise
                const now = actx.currentTime;

                // main oscillator (pluck/bubble) with descending pitch
                const osc = actx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(700, now);
                osc.frequency.exponentialRampToValueAtTime(260, now + 0.14);

                const oscGain = actx.createGain();
                oscGain.gain.setValueAtTime(0.0001, now);
                try {
                    oscGain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                } catch (e) {
                    oscGain.gain.linearRampToValueAtTime(0.06, now + 0.02);
                    oscGain.gain.linearRampToValueAtTime(0.001, now + 0.22);
                }

                osc.connect(oscGain);

                // short filtered noise to add 'bubbly' texture
                const bufferSize = 0.2 * actx.sampleRate; // 0.2s
                const noiseBuffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
                const data = noiseBuffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
                const noiseSrc = actx.createBufferSource();
                noiseSrc.buffer = noiseBuffer;

                const noiseFilter = actx.createBiquadFilter();
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.setValueAtTime(500, now);

                const noiseGain = actx.createGain();
                noiseGain.gain.setValueAtTime(0.02, now);
                try {
                    noiseGain.gain.exponentialRampToValueAtTime(0.002, now + 0.14);
                } catch (e) {
                    noiseGain.gain.linearRampToValueAtTime(0.002, now + 0.14);
                }

                noiseSrc.connect(noiseFilter);
                noiseFilter.connect(noiseGain);

                // master gain
                const master = actx.createGain();
                master.gain.setValueAtTime(1, now);

                oscGain.connect(master);
                noiseGain.connect(master);
                master.connect(actx.destination);

                // start/stop
                osc.start(now);
                noiseSrc.start(now);
                osc.stop(now + 0.22);
                noiseSrc.stop(now + 0.22);
            }

            if (actx.state === 'suspended') {
                // resume on-demand and then play
                actx.resume().then(playOsc).catch(() => {/* ignore */ });
            } else {
                playOsc();
            }
        }

        function setAudioEnabled(v) {
            audioEnabled = !!v;
            localStorage.setItem(AUDIO_KEY, audioEnabled ? '1' : '0');
            if (soundToggleBtn) {
                soundToggleBtn.setAttribute('aria-pressed', audioEnabled ? 'true' : 'false');
                soundToggleBtn.textContent = audioEnabled ? '🔔' : '🔕';
            }
        }

        // toggle from button
        if (soundToggleBtn) {
            // initialize UI state
            setAudioEnabled(audioEnabled);
            soundToggleBtn.addEventListener('click', (e) => {
                // resume audio context on user gesture
                const actx = createContext();
                if (actx && actx.state === 'suspended') actx.resume();
                setAudioEnabled(!audioEnabled);
                // give a tiny feedback sound when enabling
                if (!audioEnabled) {
                    // slight timeout so aria state updates visually
                    setTimeout(() => playClick(), 60);
                }
            });
        }

        // Attach sound to most interactive elements (buttons, links)
        function attachGlobalClicks() {
            document.addEventListener('click', (e) => {
                // play only for primary clicks
                if (e.defaultPrevented) return;
                if (e.button && e.button !== 0) return; // not left click
                const target = e.target;
                if (!target) return;
                // find nearest actionable element (button, a)
                const actionable = target.closest && target.closest('button, a, [role="button"]');
                if (!actionable) return;
                // don't play for form inputs or content editable
                const tag = actionable.tagName && actionable.tagName.toLowerCase();
                if (tag === 'input' || tag === 'textarea' || actionable.isContentEditable) return;
                // small guard: if element has data-nosound attribute skip
                if (actionable.hasAttribute && actionable.hasAttribute('data-nosound')) return;
                playClick();
            }, { capture: true });
        }

        attachGlobalClicks();
    })();

    /* Curtain reveal effect */
    (function initCurtain() {
        const curtain = document.getElementById('curtain');
        if (!curtain) return;
        const ONLY_ONCE = false; // false = luôn hiển thị màn rèm chờ click
        const KEY = 'bt-curtain-shown';
        // Nếu đã mở trước đó và chỉ chạy một lần -> bỏ luôn
        if (ONLY_ONCE && localStorage.getItem(KEY)) { curtain.remove(); return; }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { curtain.remove(); return; }

        function startReveal() {
            if (curtain.classList.contains('play')) return; // tránh double
            curtain.classList.remove('ready');
            curtain.classList.add('play');
            let panelsFinished = 0;
            curtain.addEventListener('animationend', (e) => {
                if (e.target.classList.contains('curtain-panel')) {
                    panelsFinished++;
                    if (panelsFinished === 2) {
                        curtain.classList.add('done');
                        setTimeout(() => {
                            curtain.remove();
                            if (ONLY_ONCE) localStorage.setItem(KEY, '1');
                        }, 450);
                    }
                }
            });
        }

        // Trigger bằng click hoặc Enter/Space khi focus
        curtain.addEventListener('click', startReveal);
        curtain.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startReveal();
            }
        });
        // Auto focus hint để user biết có thể click
        curtain.focus();
    })();

    // (Đã gỡ tính năng đổi nhiều combo font để giữ cố định Quicksand + Pacifico)
})();

/* ArtTech story controller: phases + image syncing */
(function () {
    const phases = [
        {
            chapter: 'Chapter 1: Why ArtTech',
            text: 'My path to ArtTech was quite unexpected. In my final year of high school, when I faced the choice of a university major, I felt lost because nothing seemed to align with my interests and dreams.',
            img: 'Ảnh/p1.jpg'
        },
        {
            chapter: 'Chapter 1: Why ArtTech',
            text: 'When I discovered ArtTech, I immediately realized this was the direction I wanted. I spent the last stretch of the school year fully focused on that goal.',
            img: 'Ảnh/p2.jpg'
        },
        {
            chapter: 'Chapter 2: What I strive for',
            text: 'Since I was small, I have loved visual effects and 3D techniques in films, dreaming of creating or contributing to a project using them. Art & Tech gives me the opportunity to make that dream real.',
            img: 'Ảnh/p3.jpg'
        },
        {
            chapter: 'Chapter 2: What I strive for',
            text: 'What I value most is the harmony between art and technology. It lets me develop creativity in design and illustration while learning to program and build products. This combination can make me versatile—able to handle visuals and the underlying tech—to create work with personal identity.',
            img: 'Ảnh/p4.jpg'
        }
    ];

    let idx = 0;
    const imgEl = document.getElementById('arttech-img');
    const textEl = document.getElementById('arttech-text');
    const prevBtn = document.getElementById('art-prev');
    const nextBtn = document.getElementById('art-next');
    const dotsContainer = document.querySelector('.arttech-dots');
    const progressFill = document.querySelector('.arttech-progress-fill');
    const phaseCounter = document.getElementById('arttech-phase-counter');

    // Generate dots
    const dots = [];
    if (dotsContainer) {
        phases.forEach((_, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-selected', 'false');
            b.setAttribute('aria-label', 'Phase ' + (i + 1));
            b.addEventListener('click', () => {
                idx = i;
                renderPhase(idx, true);
            });
            dotsContainer.appendChild(b);
            dots.push(b);
        });
    }

    function updateMeta(i) {
        // Update dots
        dots.forEach((d, di) => d.setAttribute('aria-selected', di === i ? 'true' : 'false'));
        // Update progress
        if (progressFill) {
            const pct = ((i + 1) / phases.length) * 100;
            progressFill.style.width = pct + '%';
        }
        // Update counter text
        if (phaseCounter) {
            phaseCounter.textContent = `Phase ${i + 1} / ${phases.length}`;
        }
    }

    function renderPhase(i, skipFocus) {
        const p = phases[i];
        // fade out image
        imgEl.classList.remove('opacity-100');
        imgEl.classList.add('opacity-0');
        // replace text
        textEl.innerHTML = `
            <h3>${p.chapter}</h3>
            <p style="margin-top:1rem;">${p.text}</p>
        `;
        // after fade out swap src then fade in
        setTimeout(() => {
            imgEl.src = p.img;
            imgEl.onload = () => {
                imgEl.classList.remove('opacity-0');
                imgEl.classList.add('opacity-100');
            };
        }, 220);
        updateMeta(i);
        if (!skipFocus && textEl) {
            // Move focus for accessibility so SR users know content changed
            textEl.setAttribute('tabindex', '-1');
            textEl.focus({ preventScroll: true });
        }
    }

    prevBtn.addEventListener('click', () => {
        idx = (idx - 1 + phases.length) % phases.length;
        renderPhase(idx);
    });
    nextBtn.addEventListener('click', () => {
        idx = (idx + 1) % phases.length;
        renderPhase(idx);
    });

    // Keyboard navigation (left/right arrows) when focusing inside the story card
    document.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        const withinStory = active && active.closest && active.closest('#arttech-story');
        if (!withinStory) return;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            idx = (idx + 1) % phases.length;
            renderPhase(idx);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            idx = (idx - 1 + phases.length) % phases.length;
            renderPhase(idx);
        }
    });

    // init
    if (imgEl && textEl) renderPhase(0);
})();

/* ============= Modern tilt interaction for ArtTech image ============= */
(function () {
    const wrap = document.querySelector('#arttech-story .tilt-wrap');
    const target = document.querySelector('#arttech-story .tilt-target');
    if (!wrap || !target) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let rect; let rafId = null; let rotateX = 0, rotateY = 0; let currentX = 0, currentY = 0;
    function measure() { rect = wrap.getBoundingClientRect(); }
    window.addEventListener('resize', measure, { passive: true });
    measure();
    function animate() {
        const ease = .12;
        rotateX += (currentY - rotateX) * ease;
        rotateY += (currentX - rotateY) * ease;
        target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        rafId = requestAnimationFrame(animate);
    }
    function onMove(e) {
        // recalc rect each move since wrapper floats vertically
        rect = wrap.getBoundingClientRect();
        const isTouch = e.type.startsWith('touch');
        const point = isTouch ? e.touches[0] : e;
        const x = (point.clientX - rect.left) / rect.width; // 0..1
        const y = (point.clientY - rect.top) / rect.height; // 0..1
        const maxRy = 9;  // smaller rotateY to avoid flip artifacts
        const maxRx = 7;  // smaller rotateX
        currentY = (0.5 - y) * maxRx; // rotateX (invert)
        currentX = (x - 0.5) * maxRy; // rotateY
        if (!rafId) animate();
    }
    function reset() {
        cancelAnimationFrame(rafId); rafId = null;
        target.style.transform = 'translateZ(0)';
        rotateX = rotateY = currentX = currentY = 0;
    }
    function enableTilt(enable) {
        if (enable) {
            wrap.addEventListener('pointermove', onMove);
            wrap.addEventListener('pointerleave', reset);
            wrap.addEventListener('touchmove', onMove, { passive: true });
            wrap.addEventListener('touchend', reset);
        } else {
            wrap.removeEventListener('pointermove', onMove);
            wrap.removeEventListener('pointerleave', reset);
            wrap.removeEventListener('touchmove', onMove);
            wrap.removeEventListener('touchend', reset);
            reset();
        }
    }
    enableTilt(!document.body.classList.contains('performance-mode'));
    document.addEventListener('perfmodechange', e => enableTilt(!e.detail.enabled));
})();

/* ================= Generic Carousel Initializer (Projects) ================= */
(function () {
    const carousels = document.querySelectorAll('[data-carousel]');
    if (!carousels.length) return;

    carousels.forEach(setupCarousel);

    function setupCarousel(root) {
        const track = root.querySelector('.carousel-track');
        if (!track) return;
        const slides = Array.from(track.querySelectorAll('.slide'));
        const prev = root.querySelector('.carousel-nav.prev');
        const next = root.querySelector('.carousel-nav.next');
        const dotsWrap = root.querySelector('.carousel-dots');
        let index = slides.findIndex(s => s.classList.contains('active'));
        if (index < 0) index = 0;
        let imagesLoaded = false;

        function loadImages() {
            if (imagesLoaded) return;
            slides.forEach(sl => {
                // Load deferred images
                const img = sl.querySelector('img[data-src]');
                if (img) {
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('data-src');
                }
                // Load video sources
                const video = sl.querySelector('video.carousel-video');
                if (video) {
                    const sources = video.querySelectorAll('source[data-src]');
                    sources.forEach(src => {
                        src.src = src.getAttribute('data-src');
                        src.removeAttribute('data-src');
                    });
                    video.load();
                }
            });
            imagesLoaded = true;
        }

        // Build dots
        const dots = [];
        slides.forEach((_, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-selected', 'false');
            b.setAttribute('aria-label', `Slide ${i + 1}`);
            b.addEventListener('click', () => goTo(i, true));
            dotsWrap.appendChild(b); dots.push(b);
        });

        function update() {
            slides.forEach((s, i) => {
                if (i === index) { s.classList.add('active'); s.removeAttribute('aria-hidden'); }
                else { s.classList.remove('active'); s.setAttribute('aria-hidden', 'true'); }
            });
            dots.forEach((d, i) => d.setAttribute('aria-selected', i === index ? 'true' : 'false'));
            // Move track so the current slide is in view (slides laid out horizontally)
            track.style.transform = `translateX(-${index * 100}%)`;
        }

        function goTo(i, user) {
            loadImages();
            index = (i + slides.length) % slides.length;
            update();

            // Handle video playback (pause all, play active)
            slides.forEach((sl, idx) => {
                const video = sl.querySelector('video.carousel-video');
                if (video) {
                    if (idx === index) {
                        video.play().catch(() => { }); // play active video
                    } else {
                        video.pause();
                        video.currentTime = 0; // reset to start
                    }
                }
            });

            // restart GIF animation for newly active slide (clone technique) - only for non-video slides
            const activeSlide = slides[index];
            const img = activeSlide.querySelector('img:not(video img)');
            if (img && /\.gif(\?|$)/i.test(img.src)) {
                const src = img.src;
                // Force restart by replacing with a fresh element
                const clone = img.cloneNode(true);
                clone.removeAttribute('tabindex');
                // Remove any previous cache-busting query then add timestamp
                const base = src.split('?')[0];
                clone.src = base + '?t=' + Date.now();
                img.replaceWith(clone);
            }
            if (user) {
                const focusTarget = activeSlide.querySelector('video, img');
                if (focusTarget) { focusTarget.setAttribute('tabindex', '-1'); focusTarget.focus({ preventScroll: true }); }
            }
        }

        prev?.addEventListener('click', () => goTo(index - 1, true));
        next?.addEventListener('click', () => goTo(index + 1, true));

        // Keyboard support when focus inside carousel
        root.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1, true); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1, true); }
        });

        // Swipe (basic)
        let startX = null; let deltaX = 0;
        track.addEventListener('pointerdown', e => { startX = e.clientX; deltaX = 0; track.setPointerCapture(e.pointerId); });
        track.addEventListener('pointermove', e => { if (startX !== null) { deltaX = e.clientX - startX; } });
        track.addEventListener('pointerup', e => { if (startX !== null) { if (Math.abs(deltaX) > 60) { if (deltaX < 0) goTo(index + 1, true); else goTo(index - 1, true); } startX = null; } });

        // Lazy load images only when carousel enters viewport or first nav
        const io = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    loadImages();
                    io.disconnect();
                }
            });
        }, { threshold: 0.2 });
        io.observe(root);

        update();
    }
})();

/* ================= Project Card Stack: Expand + Tabs ================= */
(function () {
    const cards = document.querySelectorAll('.project-card');
    if (!cards.length) return;

    let openCard = null;

    function collapse(card) {
        if (!card) return;
        card.classList.remove('expanded');
        const toggle = card.querySelector('.project-toggle');
        const body = card.querySelector('.project-body');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        if (body) body.hidden = true;
        if (openCard === card) openCard = null;
    }

    function expand(card, focusBody) {
        if (openCard && openCard !== card) collapse(openCard);
        const toggle = card.querySelector('.project-toggle');
        const body = card.querySelector('.project-body');
        card.classList.add('expanded', 'expanding');
        requestAnimationFrame(() => card.classList.remove('expanding'));
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
        if (body) body.hidden = false;
        openCard = card;
        if (focusBody && body) {
            body.setAttribute('tabindex', '-1');
            body.focus({ preventScroll: true });
        }
        // Lazy init carousels that might have been hidden initially
        const notInit = body?.querySelectorAll('[data-carousel] .carousel-track:not([data-init])');
        notInit?.forEach(track => { track.setAttribute('data-init', '1'); /* existing carousel IIFE already set up earlier */ });
    }

    cards.forEach(card => {
        const toggle = card.querySelector('.project-toggle');
        if (!toggle) return;
        toggle.addEventListener('click', (e) => {
            const expanded = card.classList.contains('expanded');
            if (expanded) { collapse(card); }
            else { expand(card, true); }
        });
        // Keyboard toggle with Enter/Space when focused on button handled by default (button element)
    });

    // Auto open first card for initial impression
    if (cards[0]) expand(cards[0], false);

    // Anchor hash navigation: auto expand targeted project card
    function handleHash() {
        const id = location.hash.slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (target && target.classList.contains('project-card')) {
            expand(target, false);
            target.classList.add('anchor-focus');
            setTimeout(() => target.classList.remove('anchor-focus'), 1400);
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    window.addEventListener('hashchange', handleHash);
    handleHash();

    /* Tabs (mobile) */
    function setupTabs(scope) {
        const tabButtons = scope.querySelectorAll('.proj-tab');
        const panels = scope.querySelectorAll('.tab-panel');
        if (!tabButtons.length) return;
        function activate(id) {
            tabButtons.forEach(btn => {
                const is = btn.dataset.tab === id;
                btn.setAttribute('aria-selected', is ? 'true' : 'false');
            });
            panels.forEach(p => {
                const is = p.id === id;
                if (window.matchMedia('(max-width:859px)').matches) {
                    p.hidden = !is;
                } else {
                    p.hidden = false; // desktop shows both
                }
            });
        }
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => activate(btn.dataset.tab));
            btn.addEventListener('keydown', (e) => {
                if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
                e.preventDefault();
                const arr = Array.from(tabButtons);
                let idx = arr.indexOf(btn);
                idx = e.key === 'ArrowRight' ? (idx + 1) % arr.length : (idx - 1 + arr.length) % arr.length;
                arr[idx].focus();
                activate(arr[idx].dataset.tab);
            });
        });
        // initial
        activate(tabButtons[0].dataset.tab);
        // respond to resize (switching between desktop+mobile)
        window.addEventListener('resize', () => activate(Array.from(tabButtons).find(b => b.getAttribute('aria-selected') === 'true')?.dataset.tab || tabButtons[0].dataset.tab));
    }

    cards.forEach(c => setupTabs(c));
})();
