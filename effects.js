/* ============================================================
   MAX GTI — visual effects (vanilla ports of React Bits)
   Antigravity · Shuffle · MagicBento
   Prop names and defaults match the original components.
   ============================================================ */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.innerWidth <= 768;
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];

  /* ==========================================================
     1. ANTIGRAVITY
     Particles drift in a field; when the pointer comes within
     magnetRadius they snap into a wavy ring around it, oriented
     radially and pulsing. Idles on a lissajous path when the
     mouse has been still for 2s (autoAnimate).
     ========================================================== */
  function Antigravity(canvas, opts = {}) {
    const o = Object.assign({
      count: 300, magnetRadius: 260, ringRadius: 150, waveSpeed: 0.4, waveAmplitude: 1,
      particleSize: 2, lerpSpeed: 0.08, color: '#C8FF4D', autoAnimate: true,
      particleVariance: 1, rotationSpeed: 0.12, pulseSpeed: 3, fieldStrength: 10
    }, opts);

    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [], raf = null, t0 = performance.now();
    const pointer = { x: -9999, y: -9999 };
    const virtual = { x: 0, y: 0 };
    let lastMove = 0, seeded = false;

    function resize() {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!seeded) { seed(); seeded = true; }
    }
    function seed() {
      particles = Array.from({ length: o.count }, () => {
        const x = Math.random() * w, y = Math.random() * h;
        return { t: Math.random() * 100, speed: 0.01 + Math.random() / 200,
          mx: x, my: y, cx: x, cy: y, off: (Math.random() - 0.5) * 2 };
      });
      virtual.x = w / 2; virtual.y = h / 2;
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!canvas.isConnected) { cancelAnimationFrame(raf); return; }  // page re-rendered, drop this instance
      if (!w || !h || canvas.offsetParent === null) return;   // paused while the login screen is hidden
      const time = (now - t0) / 1000;

      let destX = pointer.x, destY = pointer.y;
      if (o.autoAnimate && (now - lastMove > 2000 || pointer.x < 0)) {
        destX = w / 2 + Math.sin(time * 0.5) * (w / 4);
        destY = h / 2 + Math.cos(time) * (h / 4);
      }
      virtual.x += (destX - virtual.x) * 0.05;
      virtual.y += (destY - virtual.y) * 0.05;

      const rot = time * o.rotationSpeed;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = o.color;

      for (const p of particles) {
        p.t += p.speed / 2;
        const dx = p.mx - virtual.x, dy = p.my - virtual.y;
        const dist = Math.hypot(dx, dy);
        let tx = p.mx, ty = p.my;

        if (dist < o.magnetRadius) {
          const angle = Math.atan2(dy, dx) + rot;
          const wave = Math.sin(p.t * o.waveSpeed + angle) * (7.5 * o.waveAmplitude);
          const deviation = p.off * (75 / (o.fieldStrength + 0.1));
          const r = o.ringRadius + wave + deviation;
          tx = virtual.x + r * Math.cos(angle);
          ty = virtual.y + r * Math.sin(angle);
        }
        p.cx += (tx - p.cx) * o.lerpSpeed;
        p.cy += (ty - p.cy) * o.lerpSpeed;

        const ring = Math.abs(Math.hypot(p.cx - virtual.x, p.cy - virtual.y) - o.ringRadius);
        let s = 1 - ring / 150;
        s = Math.max(0, Math.min(1, s));
        const scale = s * (0.8 + Math.sin(p.t * o.pulseSpeed) * 0.2 * o.particleVariance) * o.particleSize;
        if (scale <= 0.02) continue;

        /* capsule pointing at the pointer, like the original's lookAt */
        const a = Math.atan2(virtual.y - p.cy, virtual.x - p.cx);
        const len = 5 * scale, rad = 1.15 * scale;
        ctx.globalAlpha = Math.min(1, s * 0.9 + 0.1);
        ctx.save();
        ctx.translate(p.cx, p.cy);
        ctx.rotate(a);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-len, -rad, len * 2, rad * 2, rad);
        else ctx.rect(-len, -rad, len * 2, rad * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      lastMove = performance.now();
    };
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    resize();
    raf = requestAnimationFrame(frame);
    return { stop: () => cancelAnimationFrame(raf) };
  }

  /* ==========================================================
     2. SHUFFLE
     Each letter becomes a strip of copies that rolls into place,
     staggered odd-then-even. Replays on hover.
     ========================================================== */
  function shuffle(el, opts = {}) {
    if (!el || reduced) return;
    const o = Object.assign({
      duration: 0.5, stagger: 0.028, shuffleTimes: 1, shuffleDirection: 'right',
      animationMode: 'evenodd', colorFrom: 'var(--lime)', triggerOnHover: true,
      ease: 'cubic-bezier(.22,1,.36,1)'
    }, opts);

    if (el.dataset.shPlaying === '1') return;
    if (el.dataset.shSrc === undefined) el.dataset.shSrc = el.innerHTML;
    else el.innerHTML = el.dataset.shSrc;
    el.dataset.shPlaying = '1';

    const rolls = Math.max(1, Math.floor(o.shuffleTimes));
    const set = o.scrambleCharset || '';
    const rand = () => set.charAt(Math.floor(Math.random() * set.length));
    const strips = [];

    /* wrap every character of every text node, leaving <br>/<em> intact */
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach(ch => {
            if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            const wrap = document.createElement('span'); wrap.className = 'sh-w';
            const strip = document.createElement('span'); strip.className = 'sh-s';
            for (let k = 0; k < rolls + 1; k++) {
              const cell = document.createElement('span');
              cell.className = 'sh-c';
              /* the last cell is the real character; earlier ones scramble when a charset is given */
              cell.textContent = (set && k < rolls) ? rand() : ch;
              strip.appendChild(cell);
            }
            wrap.appendChild(strip); frag.appendChild(wrap); strips.push(strip);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    if (!strips.length) { el.dataset.shPlaying = '0'; return; }

    /* measure, then set the start offset */
    strips.forEach(strip => {
      const cw = strip.lastElementChild.getBoundingClientRect().width;
      strip.parentElement.style.width = cw + 'px';
      [...strip.children].forEach(c => (c.style.width = cw + 'px'));
      strip.dataset.finalX = o.shuffleDirection === 'right' ? -(rolls * cw) : 0;
      strip.style.transform = `translateX(${o.shuffleDirection === 'right' ? 0 : -(rolls * cw)}px)`;
      if (o.colorFrom) strip.style.color = o.colorFrom;
    });

    /* odd strips lead, even strips follow at 70% of the odd run */
    const order = o.animationMode === 'evenodd'
      ? [...strips.filter((_, i) => i % 2), ...strips.filter((_, i) => !(i % 2))]
      : strips;
    const oddCount = Math.floor(strips.length / 2);
    const evenStart = (o.duration + Math.max(0, oddCount - 1) * o.stagger) * 0.7;

    requestAnimationFrame(() => {
      order.forEach((strip, i) => {
        const isEven = i >= oddCount;
        const delay = (isEven ? evenStart + (i - oddCount) * o.stagger : i * o.stagger);
        strip.style.transition = `transform ${o.duration}s ${o.ease} ${delay}s, color ${o.duration}s ease ${delay}s`;
        strip.style.transform = `translateX(${strip.dataset.finalX}px)`;
        strip.style.color = '';
      });
      const total = (evenStart + oddCount * o.stagger + o.duration) * 1000 + 60;
      setTimeout(() => {
        if (!el.isConnected) return;
        el.innerHTML = el.dataset.shSrc;          // settle back to clean markup
        el.dataset.shPlaying = '0';
        el.dataset.shDone = String(Date.now());
        if (o.triggerOnHover && !el.dataset.shHover) {
          el.dataset.shHover = '1';
          /* swapping the markup under the cursor can fire a synthetic mouseenter,
             so ignore replays for a beat after a run finishes */
          el.addEventListener('mouseenter', () => {
            if (Date.now() - Number(el.dataset.shDone || 0) < 700) return;
            shuffle(el, opts);
          });
        }
      }, total);
    });
  }

  /* ==========================================================
     3. MAGIC BENTO
     Global spotlight + per-card border glow by proximity, star
     particles on hover, tilt, magnetism and a click ripple.
     ========================================================== */
  const Bento = {
    spotlightRadius: 320, particleCount: 10, glowColor: '200, 255, 77',
    enableTilt: true, enableMagnetism: true, clickEffect: true, enableStars: true,
    spot: null, cards: [], pending: null,

    mount() {
      if (reduced) return;
      if (!this.spot) {
        this.spot = document.createElement('div');
        this.spot.id = 'mbSpotlight';
        document.body.appendChild(this.spot);
        document.addEventListener('mousemove', e => this.onMove(e));
        document.addEventListener('mouseleave', () => this.reset());
      }
      /* every card takes the proximity glow; the feature cards also tilt, spark and ripple */
      this.cards = qa('.view .card');
      this.cards.forEach(c => {
        c.classList.add('mb');
        const interactive = c.matches('.stat, .tcard, .ent');
        if (interactive) c.classList.add('mb-i');
        if (c.dataset.mb) return;
        c.dataset.mb = '1';
        if (!interactive) return;
        c.addEventListener('mouseenter', () => this.enter(c));
        c.addEventListener('mouseleave', () => this.leave(c));
        c.addEventListener('mousemove', e => this.tilt(e, c));
        c.addEventListener('click', e => this.ripple(e, c));
      });
    },

    onMove(e) {
      if (isMobile() || !this.cards.length) return;
      if (this.pending) return;
      this.pending = requestAnimationFrame(() => {
        this.pending = null;
        const proximity = this.spotlightRadius * 0.5, fade = this.spotlightRadius * 0.75;
        let min = Infinity;
        this.cards.forEach(card => {
          if (!card.isConnected) return;
          const r = card.getBoundingClientRect();
          const d = Math.max(0, Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
            - Math.max(r.width, r.height) / 2);
          min = Math.min(min, d);
          let g = 0;
          if (d <= proximity) g = 1;
          else if (d <= fade) g = (fade - d) / (fade - proximity);
          card.style.setProperty('--glow-x', ((e.clientX - r.left) / r.width * 100) + '%');
          card.style.setProperty('--glow-y', ((e.clientY - r.top) / r.height * 100) + '%');
          card.style.setProperty('--glow-intensity', g.toFixed(3));
          card.style.setProperty('--glow-radius', this.spotlightRadius + 'px');
          card.classList.toggle('lit', g > 0.35);
        });
        this.spot.style.left = e.clientX + 'px';
        this.spot.style.top = e.clientY + 'px';
        this.spot.style.opacity = min <= proximity ? 0.8
          : min <= fade ? ((fade - min) / (fade - proximity)) * 0.8 : 0;
      });
    },
    reset() {
      this.cards.forEach(c => { c.style.setProperty('--glow-intensity', '0'); c.classList.remove('lit'); });
      if (this.spot) this.spot.style.opacity = 0;
    },

    enter(card) {
      if (isMobile() || !this.enableStars) return;
      const { width, height } = card.getBoundingClientRect();
      card._stars = [];
      for (let i = 0; i < this.particleCount; i++) {
        const p = document.createElement('span');
        p.className = 'mb-particle';
        p.style.left = Math.random() * width + 'px';
        p.style.top = Math.random() * height + 'px';
        p.style.setProperty('--dx', (Math.random() - 0.5) * 70 + 'px');
        p.style.setProperty('--dy', (Math.random() - 0.5) * 70 + 'px');
        p.style.setProperty('--dur', (2 + Math.random() * 2).toFixed(2) + 's');
        p.style.animationDelay = `${i * 0.06}s, ${i * 0.06}s`;
        card.appendChild(p); card._stars.push(p);
      }
    },
    leave(card) {
      (card._stars || []).forEach(p => { p.style.transition = 'opacity .3s'; p.style.opacity = 0; setTimeout(() => p.remove(), 320); });
      card._stars = [];
      card.style.transform = '';
    },
    tilt(e, card) {
      if (isMobile() || (!this.enableTilt && !this.enableMagnetism)) return;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      const rx = this.enableTilt ? (y / (r.height / 2)) * -5 : 0;
      const ry = this.enableTilt ? (x / (r.width / 2)) * 5 : 0;
      const mx = this.enableMagnetism ? x * 0.04 : 0, my = this.enableMagnetism ? y * 0.04 : 0;
      card.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(${mx.toFixed(1)}px, ${my.toFixed(1)}px, 0)`;
    },
    ripple(e, card) {
      if (!this.clickEffect || isMobile()) return;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const max = Math.max(Math.hypot(x, y), Math.hypot(x - r.width, y),
        Math.hypot(x, y - r.height), Math.hypot(x - r.width, y - r.height));
      const el = document.createElement('span');
      el.className = 'mb-ripple';
      el.style.cssText += `width:${max * 2}px;height:${max * 2}px;left:${x - max}px;top:${y - max}px`;
      card.appendChild(el);
      setTimeout(() => el.remove(), 820);
    }
  };

  /* ==========================================================
     Wiring
     ========================================================== */
  window.Effects = {
    /* called by render() after each page paints */
    onRender() {
      Bento.mount();
      const title = q('.ph h1');
      if (title) shuffle(title, { shuffleTimes: 1, duration: 0.45, stagger: 0.022 });

      /* stat figures roll through digits before landing — the numerals are
         monospaced, so scrambling can't shift the layout */
      qa('.card.stat .val').forEach((el, i) => setTimeout(() => shuffle(el, {
        shuffleTimes: 2, duration: 0.42, stagger: 0.02,
        scrambleCharset: '0123456789', triggerOnHover: false, colorFrom: 'var(--lime)'
      }), 90 + i * 80));

      /* a quieter Antigravity field behind the dashboard header */
      const page = q('.view .page');
      if (page && q('.now-strip') && !reduced && !isMobile()) {
        const c = document.createElement('canvas');
        c.className = 'ag-dash';
        page.insertBefore(c, page.firstChild);
        Antigravity(c, { count: 150, magnetRadius: 260, ringRadius: 120, particleSize: 1.25,
          lerpSpeed: 0.055, color: '#C8FF4D', autoAnimate: true, rotationSpeed: 0.14, waveAmplitude: 1.2 });
      }
    },
    shuffle
  };

  document.addEventListener('DOMContentLoaded', () => {
    const art = q('.lg-art');
    if (art && !reduced && !isMobile()) {
      const c = document.createElement('canvas');
      c.id = 'agCanvas';
      art.insertBefore(c, art.firstChild);
      Antigravity(c, { count: 300, magnetRadius: 300, ringRadius: 170, waveAmplitude: 1,
        particleSize: 1.6, lerpSpeed: 0.05, color: '#C8FF4D', autoAnimate: true, rotationSpeed: 0.1 });
    }
    setTimeout(() => shuffle(q('.lg-title'), { duration: 0.55, stagger: 0.02, shuffleTimes: 2 }), 260);
  });
})();
