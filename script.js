// Script hồ sơ Bích Trân
// Chức năng: Toggle theme, nav mobile, năm footer, animation scroll, nền canvas hình học nhẹ

(function () {
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
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

        const points = Array.from({ length: 42 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: 1 + Math.random() * 2.1,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            tone: Math.random()
        }));

        function loop() {
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
    }

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
            chapter: 'Chapter 1: Vì sao lại là Arttech',
            text: 'Cơ duyên của mình đến với Arttech thật sự rất bất ngờ. Vào năm lớp 12, khi đứng trước lựa chọn ngành đại học, mình cảm thấy bối rối vì không tìm thấy ngành nào phù hợp với sở thích và ước mơ của bản thân.',
            img: 'p1.jpg'
        },
        {
            chapter: 'Chapter 1: Vì sao lại là Arttech',
            text: 'Nhưng rồi khi biết đến Arttech, mình ngay lập tức nhận ra đây chính là con đường mình muốn theo đuổi. Từ đó, mình đã dành khoảng thời gian cuối cùng của năm học để tập trung hết sức cho mục tiêu này.',
            img: 'p2.jpg'
        },
        {
            chapter: 'Chapter 2: Mình nỗ lực để đạt được gì',
            text: 'Từ nhỏ mình đã yêu thích những hiệu ứng và kỹ xảo 3D trong phim ảnh, và luôn mơ một ngày nào đó có thể tự tay tạo ra hoặc tham gia vào một dự án phim sử dụng chúng. Art & Tech cho mình cơ hội biến ước mơ ấy thành hiện thực.',
            img: 'p3.jpg'
        },
        {
            chapter: 'Chapter 2: Mình nỗ lực để đạt được gì',
            text: 'Điều mình trân trọng nhất ở ngành này chính là sự kết hợp hài hòa giữa nghệ thuật và công nghệ. Nó cho phép mình vừa phát triển khả năng sáng tạo thiết kế, minh họa, vừa học cách lập trình và xây dựng sản phẩm. Mình tin rằng sự kết hợp này sẽ giúp mình trở thành một người đa di năng trong lĩnh vực thiết kế, có khả năng làm chủ cả phần hình ảnh lẫn phần vận hành công nghệ, để tạo ra những sản phẩm mang dấu ấn cá nhân.',
            img: 'p4.jpg'
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
            b.setAttribute('aria-label', 'Giai đoạn ' + (i + 1));
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
