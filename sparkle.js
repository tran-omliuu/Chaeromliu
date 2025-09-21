// Sparkle effect following mouse movement
(function () {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let w, h;

    function resizeCanvas() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999';
        document.body.appendChild(canvas);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];

    function createParticle(x, y) {
        const size = Math.random() * 3 + 1;
        const speed = Math.random() * 2 + 1;
        const angle = Math.random() * Math.PI * 2;
        const color = `rgba(${255}, ${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 0.8 + 0.2})`;
        particles.push({ x, y, size, speed, angle, color });
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.size *= 0.95;
            if (p.size < 0.5) particles.splice(i, 1);
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });
    }

    function animate() {
        updateParticles();
        drawParticles();
        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('mousemove', (e) => {
        for (let i = 0; i < 5; i++) {
            createParticle(e.clientX, e.clientY);
        }
    });
})();