/* =========================================================
   XV TEMPORADA DE SOCIEDAD — lógica de la invitación (invitavale.com)
   ========================================================= */

// ---------- DATOS QUE SE EDITAN POR CLIENTE ----------
const CONFIG = {
    fechaEvento: '2026-12-22T18:00:00',          // fecha y hora de la fiesta (cuenta regresiva)
    fechaFin:    '2026-12-23T02:00:00',          // para "Agendar" en el calendario
    titulo:      'XV Años de Nathali Yasmil',
    lugar:       'Salón Privilege, San Vicente de Paúl #111, Santo Domingo',
    mapa:        'https://www.google.com/maps/search/?api=1&query=Sal%C3%B3n%20Privilege%20San%20Vicente%20de%20Pa%C3%BAl%20111%20Santo%20Domingo',
    fotos:       'https://photos.app.goo.gl/461mycF7JJRDyNDn6',
    regalos:     'regalos.html',
    confirmar:   'https://docs.google.com/forms/d/e/1FAIpQLSdIYoM33yAkMmS4DZCRVmO9_IE0gZT4eEw8cV0r2PgWlYE0Ag/viewform?usp=header',
    autoGaleria: 3500                            // ms entre fotos (0 = sin avance automático)
};

let isPlaying = false;
let userPausedMusic = false;

document.addEventListener('DOMContentLoaded', () => {
    setupGuest();
    setupLinks();
    initializeCountdown();
    initializeStack();
    initializeIntro();
    addGlitter();
    addPetals();
    placeButterflies();
    setupScrollReveal();
    const audio = document.getElementById('bgMusic');
    document.getElementById('musicToggle').addEventListener('click', toggleMusic);
    audio.addEventListener('playing', () => { isPlaying = true; updateMusicIcon(); });
    audio.addEventListener('pause', () => { isPlaying = false; updateMusicIcon(); });
    updateMusicIcon();
});

// ---------- Pase de invitado por enlace ----------
// Ejemplo: index.html?n=Familia%20Pérez&p=2   (n = nombre, p = cantidad de pases)
// Sin parámetros, la tarjeta del pase se oculta.
function setupGuest() {
    const q = new URLSearchParams(location.search);
    const name = q.get('n') || q.get('invitado');
    const seats = parseInt(q.get('p') || q.get('pases'), 10);
    const pase = document.getElementById('pase');
    if (!name && document.documentElement.dataset.demo) return;   // vista previa: muestra el ejemplo
    if (!name) {
        pase.style.display = 'none';
        return;
    }
    document.getElementById('guestName').textContent = name;
    if (seats > 0) {
        document.getElementById('guestSeats').textContent = seats;
        document.getElementById('guestSeatsTxt').textContent = seats === 1 ? 'persona' : 'personas';
    } else {
        document.getElementById('guestStub').style.display = 'none';
        document.querySelector('#pase .pass').style.gridTemplateColumns = '1fr';
    }
}

// ---------- Intro: sobre que se abre y pluma que escribe ----------
// 1) toque en el sobre: arranca la música (iPhone/Android lo exigen en el toque)
// 2) se rompe el sello, se abre la solapa y sale la carta
// 3) la pluma escribe línea por línea y aparece "Entrar a la invitación"
function initializeIntro() {
    const intro = document.getElementById('intro');
    const audio = document.getElementById('bgMusic');
    const root = document.documentElement;
    if (!intro) { root.classList.remove('intro-lock'); return; }
    const env = document.getElementById('ieEnv');
    const letter = document.getElementById('ieLetter');
    const pluma = document.getElementById('iePluma');
    const entrar = document.getElementById('ieEntrar');
    const lines = [...intro.querySelectorAll('.ie-l span')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let started = false, finished = false, writingDone = false;
    const wait = (ms) => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 60) : ms));

    const finish = () => {
        if (finished) return;
        finished = true;
        window.scrollTo(0, 0);
        intro.classList.add('is-leaving');
        root.classList.remove('intro-lock');
        root.classList.add('intro-done');
        setTimeout(() => intro.remove(), 1900);
        subirMusica(audio);
    };

    // coloca la carta en el centro de la pantalla, del tamaño que quepa
    const centerLetter = () => {
        const pr = document.getElementById('iePocket').getBoundingClientRect();
        const w = letter.offsetWidth, h = letter.offsetHeight;
        const cx = pr.left + letter.offsetLeft + w / 2;
        const cy = pr.top + letter.offsetTop + h / 2 - h * 0.62;
        const s = Math.min((innerWidth * 0.94) / w, (innerHeight * 0.88) / h, 1.6);
        letter.style.transform = `translate(${innerWidth / 2 - cx}px, ${innerHeight / 2 - cy}px) translateY(-62%) scale(${s})`;
    };

    const write = (span) => new Promise(resolve => {
        const dur = reduce ? 1 : Math.max(600, span.textContent.length * 46);
        const t0 = performance.now();
        span.parentElement.classList.add('on');
        const step = (now) => {
            const p = Math.min(1, (now - t0) / dur);
            span.style.clipPath = `inset(-20% ${((1 - p) * 100).toFixed(2)}% -30% 0)`;
            const r = span.getBoundingClientRect();
            const x = r.left + r.width * p;
            const y = r.top + r.height * 0.72 + Math.sin(now / 55) * 2.5;
            pluma.style.transform = `translate(${x}px, ${y - pluma.offsetHeight}px) rotate(${Math.sin(now / 90) * 4}deg)`;
            if (p < 1) requestAnimationFrame(step); else resolve();
        };
        requestAnimationFrame(step);
    });

    const start = async () => {
        if (started) return;
        started = true;
        intro.classList.add('is-open');
        document.getElementById('musicPlayer').style.display = 'block';
        if (audio) {
            try { audio.currentTime = 0; audio.volume = 0.5; } catch (e) {}
            audio.muted = false;
            const pa = audio.play();
            if (pa && pa.catch) pa.catch(() => {});
        }
        await wait(500);                       // sello se rompe
        env.classList.add('flap-open');
        await wait(850);                       // solapa abierta
        env.classList.add('letter-up');
        await wait(1100);                      // la carta sale del sobre
        env.classList.add('letter-free');
        intro.classList.add('carta');
        centerLetter();
        await wait(1200);                      // la carta llega al centro
        intro.classList.add('writing');
        await wait(350);
        for (const span of lines) { await write(span); await wait(120); }
        intro.classList.add('written');
        writingDone = true;
        await wait(5200);
        finish();                              // si no toca el botón, entra solo
    };

    lines.forEach(sp => { sp.style.clipPath = 'inset(-20% 100% -30% 0)'; });
    intro.addEventListener('click', (e) => {
        if (e.target === entrar || writingDone) { finish(); return; }
        start();
    });
    intro.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); writingDone ? finish() : start(); }
    });
    addEventListener('resize', () => { if (env.classList.contains('letter-free') && !finished) centerLetter(); });

    // si el teléfono no dejó sonar la música, el próximo toque la arranca
    const retry = () => {
        if (!audio || !audio.paused || userPausedMusic) {
            ['click', 'touchend'].forEach(ev => document.removeEventListener(ev, retry, true));
            return;
        }
        audio.play().catch(() => {});
    };
    ['click', 'touchend'].forEach(ev => document.addEventListener(ev, retry, true));
}

function subirMusica(audio) {
    if (!audio || userPausedMusic) return;
    if (audio.paused) audio.play().catch(() => {});
    let v = audio.volume;
    const fade = setInterval(() => {
        v = Math.min(1, v + 0.05);
        try { audio.volume = v; } catch (e) {}
        if (v >= 1) clearInterval(fade);
    }, 80);
}

// ---------- Música ----------
function toggleMusic() {
    const audio = document.getElementById('bgMusic');
    if (audio.paused) { userPausedMusic = false; audio.play().catch(() => {}); }
    else { userPausedMusic = true; audio.pause(); }
}

function updateMusicIcon() {
    const icon = document.getElementById('volumeIcon');
    if (!icon) return;
    icon.innerHTML = isPlaying
        ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#5A0A16"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08" stroke="#5A0A16" stroke-width="2" stroke-linecap="round"/>'
        : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#5A0A16"/><line x1="16" y1="9" x2="22" y2="15" stroke="#5A0A16" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="9" x2="16" y2="15" stroke="#5A0A16" stroke-width="2" stroke-linecap="round"/>';
}

// ---------- Cuenta regresiva ----------
function initializeCountdown() {
    const target = new Date(CONFIG.fechaEvento).getTime();
    const ids = ['days', 'hours', 'minutes', 'seconds'];
    function tick() {
        let d = Math.max(0, target - Date.now());
        const vals = [
            Math.floor(d / 86400000),
            Math.floor(d % 86400000 / 3600000),
            Math.floor(d % 3600000 / 60000),
            Math.floor(d % 60000 / 1000)
        ];
        ids.forEach((id, i) => { document.getElementById(id).textContent = String(vals[i]).padStart(2, '0'); });
    }
    tick();
    setInterval(tick, 1000);
}

// ---------- Galería: polaroids apiladas ----------
function initializeStack() {
    const stack = document.getElementById('stack');
    if (!stack) return;
    const cards = Array.from(stack.querySelectorAll('.pola'));
    const dotsBox = document.getElementById('dots');
    const n = cards.length;
    let current = 0, busy = false, timer = null;

    cards.forEach((_, i) => {
        const d = document.createElement('i');
        d.addEventListener('click', () => goTo(i));
        dotsBox.appendChild(d);
    });

    function layout() {
        cards.forEach((c, i) => {
            const pos = (i - current + n) % n;
            c.classList.remove('pos0', 'pos1', 'pos2', 'pos3', 'posx', 'out-l', 'out-r');
            c.classList.add(pos <= 3 ? 'pos' + pos : 'posx');
        });
        Array.from(dotsBox.children).forEach((d, i) => d.classList.toggle('on', i === current));
    }

    function advance(dir) {
        if (busy) return;
        busy = true;
        if (dir > 0) {
            // la foto de arriba sale volando y queda la siguiente
            const top = cards[current];
            top.classList.remove('pos0');
            top.classList.add('out-l');
            current = (current + 1) % n;
            setTimeout(() => { layout(); busy = false; }, 450);
            cards.forEach((c, i) => { if (i !== (current - 1 + n) % n) { const pos = (i - current + n) % n; c.classList.remove('pos0','pos1','pos2','pos3','posx'); c.classList.add(pos <= 3 ? 'pos' + pos : 'posx'); } });
            Array.from(dotsBox.children).forEach((d, i) => d.classList.toggle('on', i === current));
        } else {
            // la foto anterior regresa desde el lado
            current = (current - 1 + n) % n;
            const c = cards[current];
            c.style.transition = 'none';
            c.classList.remove('pos0','pos1','pos2','pos3','posx');
            c.classList.add('out-r');
            void c.offsetWidth;
            c.style.transition = '';
            layout();
            setTimeout(() => { busy = false; }, 500);
        }
    }

    function goTo(i) {
        if (i === current) return;
        current = i; layout(); restart();
    }

    function restart() {
        if (!CONFIG.autoGaleria) return;
        clearInterval(timer);
        timer = setInterval(() => advance(1), CONFIG.autoGaleria);
    }

    document.getElementById('nextBtn').addEventListener('click', () => { advance(1); restart(); });
    document.getElementById('prevBtn').addEventListener('click', () => { advance(-1); restart(); });

    // deslizar con el dedo
    let x0 = null;
    stack.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    stack.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) { advance(dx < 0 ? 1 : -1); restart(); }
        x0 = null;
    });
    // y con el mouse en computadora
    stack.addEventListener('mousedown', e => { x0 = e.clientX; });
    stack.addEventListener('mouseup', e => {
        if (x0 === null) return;
        const dx = e.clientX - x0;
        if (Math.abs(dx) > 40) { advance(dx < 0 ? 1 : -1); restart(); }
        x0 = null;
    });

    layout();
    restart();
}

// ---------- Brillo dorado: solo en las partes rojas ----------
function addGlitter() {
    document.querySelectorAll('[data-glitter]').forEach(sec => {
        const count = parseInt(sec.getAttribute('data-glitter'), 10) || 50;
        const layer = document.createElement('div');
        layer.className = 'glit';
        layer.setAttribute('aria-hidden', 'true');
        const r = (a, b) => Math.random() * (b - a) + a;
        let html = '';
        for (let i = 0; i < count; i++) {
            const s = [1.5, 2, 2, 2.5, 3][Math.floor(Math.random() * 5)];
            html += `<i class="g" style="left:${r(1, 99).toFixed(1)}%;top:${r(1, 99).toFixed(1)}%;width:${s}px;height:${s}px;--o:${r(.4, .95).toFixed(2)};--d:${r(2, 4.5).toFixed(1)}s;--dl:-${r(0, 4).toFixed(1)}s"></i>`;
        }
        for (let i = 0; i < Math.round(count / 8); i++) {
            const s = Math.round(r(9, 18));
            html += `<b class="st" style="left:${r(3, 95).toFixed(1)}%;top:${r(3, 95).toFixed(1)}%;width:${s}px;height:${s}px;--d:${r(3, 6).toFixed(1)}s;--dl:-${r(0, 5).toFixed(1)}s"></b>`;
        }
        layer.innerHTML = html;
        sec.insertBefore(layer, sec.firstChild.nextSibling);
    });
}

// ---------- Pétalos de rosa cayendo en la portada ----------
function addPetals() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const layer = document.createElement('div');
    layer.className = 'petalos';
    layer.setAttribute('aria-hidden', 'true');
    const r = (a, b) => Math.random() * (b - a) + a;
    let html = '';
    for (let i = 0; i < 10; i++) {
        html += `<i style="left:${r(4, 94).toFixed(1)}%;--s:${r(9, 16).toFixed(0)}px;--d:${r(10, 17).toFixed(1)}s;--dl:-${r(0, 16).toFixed(1)}s"></i>`;
    }
    layer.innerHTML = html;
    hero.appendChild(layer);
}

// ---------- Abejas doradas que vuelan: solo en las partes rojas ----------
// Cada una da vueltas suaves alrededor de su punto (a los lados), sin salir
// de su sección, y solo se anima cuando la sección está a la vista.
const BUTTERFLY_SPOTS = {
    hero: [[12, 70], [88, 80]],
    2: [[12, 18], [88, 70]],
    3: [[12, 14], [88, 46], [12, 84]]
};

function placeButterflies() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rand = (a, b) => Math.random() * (b - a) + a;
    const groups = [];

    document.querySelectorAll('[data-butterflies]').forEach(section => {
        const count = Math.min(3, parseInt(section.getAttribute('data-butterflies'), 10) || 0);
        if (!count) return;
        const spots = section.classList.contains('hero') ? BUTTERFLY_SPOTS.hero : BUTTERFLY_SPOTS[count];
        const layer = document.createElement('div');
        layer.className = 'butterfly-layer';
        layer.setAttribute('aria-hidden', 'true');
        section.appendChild(layer);

        const flies = spots.map(([px, py], k) => {
            const el = document.createElement('img');
            el.src = 'elementos/abeja.svg';
            el.alt = '';
            el.className = 'butterfly';
            const size = rand(28, 38);
            el.style.width = size.toFixed(0) + 'px';
            el.style.transitionDelay = (k * 0.35) + 's';
            layer.appendChild(el);
            return { el, size, px, py, rx: rand(18, 28), ry: rand(10, 18), period: rand(7, 11),
                     spin: Math.random() < 0.5 ? 1 : -1, phase: rand(0, 6.28), bob: rand(2.5, 4), dir: 1, lastX: null };
        });
        groups.push({ section, layer, flies, visible: false });
    });

    function revisarVisibles() {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        groups.forEach(g => {
            const r = g.section.getBoundingClientRect();
            const visiblePx = Math.min(r.bottom, vh) - Math.max(r.top, 0);
            g.visible = visiblePx > Math.min(Math.max(1, r.height), vh) * 0.15;
            if (g.visible) g.layer.classList.add('is-on');
        });
    }

    const t0 = performance.now();
    function frame(now) {
        revisarVisibles();
        const t = (now - t0) / 1000;
        for (const g of groups) {
            if (!g.visible) continue;
            const W = g.layer.clientWidth, H = g.layer.clientHeight;
            for (const f of g.flies) {
                const hImg = f.el.offsetHeight || f.size * 0.85;
                const cx = Math.min(Math.max(W * f.px / 100, f.rx + f.size / 2), W - f.rx - f.size / 2);
                const cy = Math.min(Math.max(H * f.py / 100, f.ry + hImg / 2), H - f.ry - hImg / 2);
                const a = f.spin * (t / f.period) * 6.28 + f.phase;
                const x = cx + f.rx * Math.cos(a) + f.rx * 0.18 * Math.cos(2 * a) - f.size / 2;
                const y = cy + f.ry * Math.sin(a) + Math.sin(t * f.bob * 6.28) * 2.5 - hImg / 2;
                const vx = f.lastX === null ? 0 : x - f.lastX;
                f.lastX = x;
                const target = vx < -0.02 ? -1 : (vx > 0.02 ? 1 : (f.dir >= 0 ? 1 : -1));
                f.dir += (target - f.dir) * 0.08;
                const tilt = Math.max(-14, Math.min(14, vx * 12));
                f.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg) scaleX(${f.dir.toFixed(3)})`;
            }
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

// ---------- Aparición al hacer scroll + efectos al deslizar ----------
// - la foto de portada se queda fija mientras la invitación sube por encima
// - cada sección entra en cascada (los elementos aparecen uno tras otro)
// - los filetes dorados se dibujan al llegar a cada sección
// - adornos con un leve parallax y una línea dorada de progreso arriba
function setupScrollReveal() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heroBg = document.querySelector('.hero-bg');
    const hero = document.querySelector('.hero');
    const tl = document.getElementById('timeline');
    const lugar = document.getElementById('lugarImg');
    const barra = document.getElementById('scrollOro');
    const paralaje = [...document.querySelectorAll('[data-speed]')];

    // cascada: dentro de cada sección, cada elemento espera un poquito más
    document.querySelectorAll('main > section, main > footer').forEach(sec => {
        sec.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 0.11}s`));
    });

    // con IntersectionObserver la aparición funciona aunque la invitación
    // se vea dentro de otra página (vista previa, WhatsApp, Instagram)
    let pendientes = Array.from(document.querySelectorAll('.reveal'));
    let secciones = Array.from(document.querySelectorAll('main > section, main > footer'));
    if ('IntersectionObserver' in window) {
        const ioReveal = new IntersectionObserver((entradas) => {
            entradas.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); ioReveal.unobserve(e.target); } });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        pendientes.forEach(el => ioReveal.observe(el));
        const ioSec = new IntersectionObserver((entradas) => {
            entradas.forEach(e => { if (e.isIntersecting) { e.target.classList.add('en-vista'); ioSec.unobserve(e.target); } });
        }, { threshold: 0.08 });
        secciones.forEach(el => ioSec.observe(el));
        pendientes = []; secciones = [];
    }

    function revisar() {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (pendientes.length) {
            pendientes = pendientes.filter(el => {
                if (el.getBoundingClientRect().top < vh * 0.88) { el.classList.add('is-visible'); return false; }
                return true;
            });
        }
        secciones.forEach(sec => {
            if (!sec.classList.contains('en-vista') && sec.getBoundingClientRect().top < vh * 0.8) sec.classList.add('en-vista');
        });
        const y = window.scrollY || window.pageYOffset;
        const total = document.documentElement.scrollHeight - vh;
        if (barra) barra.style.transform = `scaleX(${total > 0 ? Math.min(1, y / total).toFixed(4) : 0})`;
        if (reduce) return;
        // portada fija: la foto compensa el desplazamiento y no se mueve
        if (hero && y < hero.offsetHeight + 40) {
            const fijo = `translate3d(0, ${y.toFixed(1)}px, 0)`;
            hero.querySelectorAll('.hero-bg, .hero-tint, .hero-frame, .hero-text, .petalos, .glit, .butterfly-layer')
                .forEach(el => { el.style.transform = fijo; });
        }
        if (tl) {
            const r = tl.getBoundingClientRect();
            const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / r.height));
            tl.style.setProperty('--p', p.toFixed(3));
        }
        if (lugar) {
            const r = lugar.getBoundingClientRect();
            const c = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
            lugar.style.transform = `scale(${(1.03 - Math.abs(c) * 0.05).toFixed(3)})`;
        }
        paralaje.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.bottom < -200 || r.top > vh + 200) return;
            const c = (r.top + r.height / 2 - vh / 2);
            el.style.translate = `0 ${(c * parseFloat(el.dataset.speed)).toFixed(1)}px`;
        });
    }
    let pedido = false;
    const alDeslizar = () => { if (!pedido) { pedido = true; requestAnimationFrame(() => { pedido = false; revisar(); }); } };
    window.addEventListener('scroll', alDeslizar, { passive: true });
    window.addEventListener('resize', alDeslizar);
    (function bucle() { revisar(); if (pendientes.length) requestAnimationFrame(bucle); })();
}

// ---------- Botones ----------
// Los enlaces se llenan desde CONFIG (son <a href>, funcionan en todos los teléfonos)
function setupLinks() {
    const urls = { mapa: CONFIG.mapa, fotos: CONFIG.fotos, regalos: CONFIG.regalos, confirmar: CONFIG.confirmar, calendario: calendarUrl() };
    document.querySelectorAll('[data-link]').forEach(a => { a.href = urls[a.dataset.link] || '#'; });
}
function calendarUrl() {
    const f = s => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent(CONFIG.titulo) +
        '&dates=' + f(CONFIG.fechaEvento) + '/' + f(CONFIG.fechaFin) +
        '&location=' + encodeURIComponent(CONFIG.lugar);
}
function openLocation(e) { if (e) e.preventDefault(); window.open(CONFIG.mapa, '_blank'); }
function sharePhotos() { window.open(CONFIG.fotos, '_blank'); }
function showGifts() { window.open(CONFIG.regalos, '_blank'); }
function confirmAttendance() { window.open(CONFIG.confirmar, '_blank'); }

function addToCalendar(e) {
    if (e) e.preventDefault();
    const f = s => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent(CONFIG.titulo) +
        '&dates=' + f(CONFIG.fechaEvento) + '/' + f(CONFIG.fechaFin) +
        '&location=' + encodeURIComponent(CONFIG.lugar);
    window.open(url, '_blank');
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(e, id) { document.getElementById(id).classList.remove('open'); }

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove('show'), 2500);
}
