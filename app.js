(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const hasIO = 'IntersectionObserver' in window;
  const phone = matchMedia('(max-width: 760px)');

  /* ---------- small setup ---------- */
  $$('.hero__first span, .hero__last span').forEach((s, i) => s.style.setProperty('--i', i % 6));
  $$('img').forEach(i => i.decoding = 'async');

  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map((w, i) => `<span class="wd" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  });

  /* ---------- doodles: drifting background shapes ---------- */
  const seed = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => (h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296; };
  const P = {
    cream: ['#FF5436', '#FFC21F', '#2E5E3E', '#A9D6FF', '#FFB3C7'],
    marigold: ['#1A1410', '#FF5436', '#FFF3DA', '#2E5E3E'],
    brown: ['#FFC21F', '#FF5436', '#FFF3DA'],
    sand: ['#2E5E3E', '#FF5436', '#FFC21F'],
    sky: ['#FFF3DA', '#FF5436', '#1A1410'],
    ink: ['#FFC21F', '#FF5436', '#A9D6FF'],
    leaf: ['#FFC21F', '#FFF3DA', '#FFB3C7'],
    paper: ['#FF5436', '#FFC21F', '#2E5E3E'],
    reader: ['#FFF3DA', '#1A1410', '#FF5436']
  };
  const SETS = { hero: 'cream', intro: 'cream', hk: 'marigold', cent: 'brown', essence: 'sand', safe: 'sky', range: 'ink', corner: 'leaf', creds: 'cream', writing: 'paper', close: 'marigold', reader: 'reader' };
  const SYMS = ['d-spark', 'd-ring', 'd-squig', 'd-flower', 'd-leaf', 'd-dots', 'd-cross', 'd-spark'];
  const makeDoodles = (box, n = 8) => {
    const name = box.dataset.doodles, rnd = seed(name), pal = P[SETS[name]] || P.cream;
    let html = '';
    for (let i = 0; i < n; i++) {
      const sym = SYMS[Math.floor(rnd() * SYMS.length)];
      const s = 26 + Math.floor(rnd() * 48);
      const wide = sym === 'd-squig';
      html += `<span class="dd${sym === 'd-ring' && rnd() > .5 ? ' spin' : ''}" data-sp="${((rnd() - .5) * .32).toFixed(3)}" style="--x:${(3 + rnd() * 92).toFixed(1)}%;--y:${(4 + rnd() * 88).toFixed(1)}%;--s:${wide ? s * 1.8 : s}px;--c:${pal[Math.floor(rnd() * pal.length)]};--o:${(.35 + rnd() * .4).toFixed(2)};--dur:${(9 + rnd() * 12).toFixed(1)}s;--dly:-${(rnd() * 10).toFixed(1)}s;--dx:${((rnd() - .5) * 60).toFixed(0)}px;--dy:${((rnd() - .5) * 60).toFixed(0)}px;--rot:${((rnd() - .5) * 90).toFixed(0)}deg"><svg viewBox="0 0 ${wide ? '80 24' : '40 40'}" aria-hidden="true"><use href="#${sym}"/></svg></span>`;
    }
    box.innerHTML = html;
    return $$('.dd', box);
  };
  const doodled = $$('[data-doodles]').filter(b => b.dataset.doodles !== 'reader').map(box => ({ box, host: box.parentElement, items: makeDoodles(box), top: 0, h: 0, vis: false }));
  // animate drifting shapes only while their section is on screen
  if (hasIO) {
    const dio = new IntersectionObserver(es => es.forEach(e => {
      e.target.classList.toggle('live', e.isIntersecting);
      const d = doodled.find(x => x.box === e.target); if (d) d.vis = e.isIntersecting;
    }), { rootMargin: '150px 0px' });
    doodled.forEach(d => dio.observe(d.box));
  } else doodled.forEach(d => { d.box.classList.add('live'); d.vis = true; });

  /* ---------- reveals ---------- */
  const revealEls = $$('.rv, .range__grid, [data-split]');
  if (reduce || !hasIO) {
    revealEls.forEach(e => { e.classList.add('in'); $$('.wipe', e).forEach(w => w.classList.add('in')); });
  } else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('.wipe', e.target).forEach(w => w.classList.add('in'));
      io.unobserve(e.target);
    }), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(e => io.observe(e));
  }
  // illustrations on the shelf only move while on screen
  const wcards = $$('.wcard');
  if (hasIO && !reduce) {
    const cio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.isIntersecting)), { rootMargin: '80px 0px' });
    wcards.forEach(c => cio.observe(c));
  } else wcards.forEach(c => c.classList.add('live'));

  /* ---------- elements the scroll loop drives ---------- */
  const heroSec = $('#hero'), heroCopy = $('.hero__copy');
  const depthEls = $$('[data-depth]', heroSec);
  const pans = $$('[data-pan]').map(sec => ({ sec, track: $('.pan__track', sec), dist: 0, top: 0, h: 0 }));
  const fans = $$('[data-fan]').map(sec => ({ sec, items: $$('.fanned', sec), top: 0, h: 0 }));
  const paperSec = $('[data-paper]'), paper = $('.paper', paperSec);
  const ticker = $('#ticker');
  const essRow = $('.essence__row'), essFig = $('.essence__row figure:nth-child(2)');
  const nav = $('#nav'), links = $$('#navlinks a'), blob = $('#navblob'), progress = $('#navprogress');
  const navSecs = $$('[data-nav-bg]').map(el => ({ el, top: 0, bottom: 0 }));
  const anchors = ['work', 'corner', 'credentials', 'writing', 'hello'].map(id => ({ id, el: document.getElementById(id), top: 0 }));
  const G = { hero: { top: 0, h: 0 }, paper: { top: 0 }, ess: { top: 0 }, doc: 1, vw: innerWidth, vh: innerHeight };

  /* geometry is measured once (and when the layout changes), never inside the scroll frame */
  const measure = () => {
    const sy = scrollY;
    const top = el => el.getBoundingClientRect().top + sy;
    G.vw = innerWidth; G.vh = innerHeight;
    pans.forEach(p => {
      if (phone.matches) { p.dist = 0; p.sec.style.height = ''; p.track.style.transform = ''; return; }
      p.dist = Math.max(0, p.track.scrollWidth - G.vw); p.sec.style.height = (p.dist + G.vh * 1.15) + 'px';
    });
    const r = heroSec.getBoundingClientRect(); G.hero = { top: r.top + sy, h: r.height };
    pans.forEach(p => { const b = p.sec.getBoundingClientRect(); p.top = b.top + sy; p.h = b.height; });
    fans.forEach(f => { const b = f.sec.getBoundingClientRect(); f.top = b.top + sy; f.h = b.height; });
    G.paper = { top: top(paperSec) };
    G.ess = { top: essRow ? top(essRow) : 0 };
    doodled.forEach(d => { const b = d.host.getBoundingClientRect(); d.top = b.top + sy; d.h = b.height; });
    navSecs.forEach(s => { const b = s.el.getBoundingClientRect(); s.top = b.top + sy; s.bottom = b.bottom + sy; });
    anchors.forEach(a => { if (a.el) a.top = top(a.el); });
    G.doc = document.documentElement.scrollHeight;
  };
  let mt = 0;
  const remeasure = () => { cancelAnimationFrame(mt); mt = requestAnimationFrame(() => { measure(); request(); }); };
  let lastW = innerWidth;
  addEventListener('resize', () => { if (phone.matches && innerWidth === lastW) return; lastW = innerWidth; remeasure(); });
  if (phone.addEventListener) phone.addEventListener('change', remeasure);
  addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);

  /* ---------- loader: waits for the page, plays at least one full beat, then exits ---------- */
  const loader = $('#loader');
  if (loader) {
    const root = document.documentElement;
    if (!root.classList.contains('is-loading')) loader.remove();
    else {
      const MIN = 2300, t0 = performance.now();
      const loaded = new Promise(res => document.readyState === 'complete' ? res() : addEventListener('load', res, { once: true }));
      const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      const cap = new Promise(res => setTimeout(res, 5000));
      Promise.race([Promise.all([loaded, fonts]), cap]).then(() => {
        setTimeout(() => {
          loader.classList.add('is-out');
          setTimeout(() => { loader.remove(); root.classList.remove('is-loading'); remeasure(); }, 1250);
        }, Math.max(0, MIN - (performance.now() - t0)));
      });
    }
  }
  /* ---------- pointer in hero ---------- */
  let mx = 0, my = 0, tx = 0, ty = 0;
  if (!reduce && fine) {
    heroSec.addEventListener('pointermove', e => { tx = e.clientX / G.vw - .5; ty = e.clientY / G.vh - .5; });
    heroSec.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  }

  /* ---------- nav ---------- */
  let lastY = scrollY, activeId = null, navLock = false, navBg = '', navInk = '', topState = null;
  const placeBlob = id => {
    const a = links.find(l => l.dataset.sec === id);
    if (!a) { blob.style.opacity = 0; return; }
    blob.style.opacity = 1;
    blob.style.width = a.offsetWidth + 'px';
    blob.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  const updateNav = (y, paperP) => {
    const probe = y + 46;
    let cur = navSecs[0];
    for (const s of navSecs) if (s.top <= probe && s.bottom > probe) { cur = s; break; }
    let bg = cur.el.dataset.navBg;
    const ink = cur.el.dataset.navInk;
    if (cur.el === paperSec && paperP < .45) bg = '#FF5436';
    if (bg !== navBg) { navBg = bg; nav.style.setProperty('--nav-bg', bg); }
    if (ink !== navInk) { navInk = ink; nav.style.setProperty('--nav-ink', ink); }
    const isTop = y < 30;
    if (isTop !== topState) { topState = isTop; nav.classList.toggle('is-top', isTop); }
    const dy = y - lastY;
    if (Math.abs(dy) > 5) {
      if (dy > 0 && y > G.vh * .6 && !navLock) nav.classList.add('is-hidden');
      else if (dy < 0) nav.classList.remove('is-hidden');
      lastY = y;
    }
    let id = null;
    for (const a of anchors) if (a.top - y <= G.vh * .45) id = a.id;
    if (id !== activeId) {
      activeId = id;
      links.forEach(l => l.classList.toggle('is-active', l.dataset.sec === id));
      placeBlob(id);
    }
    progress.style.transform = `scaleX(${clamp(y / (G.doc - G.vh)).toFixed(4)})`;
  };
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
  addEventListener('resize', () => placeBlob(activeId));
  links.forEach(l => l.addEventListener('click', () => { navLock = true; nav.classList.remove('is-hidden'); setTimeout(() => navLock = false, 900); }));

  /* ---------- the frame loop: no layout reads in here ---------- */
  let ticking = false, vel = 0, prevY = scrollY;
  const frame = () => {
    ticking = false;
    const y = scrollY, h = G.vh, w = G.vw;
    vel += ((y - prevY) - vel) * .2; prevY = y;

    const pp = clamp((h * .95 - (G.paper.top - y)) / (h * .9));
    if (!reduce) {
      mx += (tx - mx) * .08; my += (ty - my) * .08;
      const hp = clamp((y - G.hero.top) / (G.hero.h - h));
      if (hp < 1 || y - G.hero.top < G.hero.h + h) {
        const out = hp * hp;
        for (const el of depthEls) {
          const d = +el.dataset.depth, ox = +el.dataset.ox || 0, oy = +el.dataset.oy || 0;
          el.style.setProperty('--px', (-mx * d * 120 + ox * out * w * .55).toFixed(1) + 'px');
          el.style.setProperty('--py', (-hp * h * d * .35 - my * d * 120 + oy * out * h * .7).toFixed(1) + 'px');
          el.style.setProperty('--sr', (ox * out * 28).toFixed(1) + 'deg');
        }
        heroCopy.style.setProperty('--cy', (-hp * h * .1).toFixed(1) + 'px');
        heroCopy.style.setProperty('--cs', (1 - hp * .16).toFixed(3));
        heroCopy.style.setProperty('--lo', clamp(1 - hp * 2.4).toFixed(2));
      }
      ticker.style.setProperty('--sk', clamp(vel * .03, -2.5, 2.5).toFixed(2) + 'deg');

      for (const p of pans) {
        if (phone.matches) break;
        const rel = y - p.top;
        if (rel < -h || rel > p.h) continue;
        const prog = clamp(rel / (p.h - h));
        p.track.style.transform = `translate3d(${(-prog * p.dist).toFixed(1)}px,0,0)`;
      }
      for (const f of fans) {
        const top = f.top - y;
        if (top > h * 1.2 || top < -f.h) continue;
        const e = 1 - Math.pow(1 - clamp((h - top) / (h * 1.1)), 3);
        const spread = Math.min(w * .17, 200);
        for (const it of f.items) {
          const i = +it.dataset.fanned;
          it.style.setProperty('--fx', (i * spread * e).toFixed(1) + 'px');
          it.style.setProperty('--fy', ((1 - e) * (260 + (i + 1) * 90) + Math.abs(i) * 24 * e).toFixed(1) + 'px');
          it.style.setProperty('--fr', (i * 9 * e).toFixed(2) + 'deg');
        }
      }
      if (essFig) { const t = G.ess.top - y; if (t > -h && t < h * 1.2) essFig.style.setProperty('--ey', ((t / h - .4) * 14).toFixed(1) + '%'); }
      for (const d of doodled) {
        if (!d.vis || phone.matches) continue;
        const base = d.top + d.h / 2 - y - h / 2;
        for (const it of d.items) it.style.setProperty('--py', (base * -it.dataset.sp * 2).toFixed(1) + 'px');
      }
      if (phone.matches) paper.style.setProperty('--po', pp.toFixed(2));
      else if (pp > 0 && pp <= 1.0001) paper.style.setProperty('--pr', (pp * 170).toFixed(1) + '%');
      else if (pp <= 0) paper.style.setProperty('--pr', '0%');
    } else {
      for (const f of fans) for (const it of f.items) {
        const i = +it.dataset.fanned;
        it.style.setProperty('--fx', (i * 140) + 'px'); it.style.setProperty('--fy', (Math.abs(i) * 24) + 'px'); it.style.setProperty('--fr', (i * 9) + 'deg');
      }
    }
    updateNav(y, reduce ? 1 : pp);
    if (!reduce && (Math.abs(tx - mx) > .001 || Math.abs(ty - my) > .001 || Math.abs(vel) > .05)) request();
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  measure(); request();

  /* ---------- cursor: a paper sparkle that leans into the motion ---------- */
  const cur = $('#cursor');
  if (fine && !reduce) {
    const pos = $('.cursor__pos', cur), star = $('.cursor__star', cur), tag = $('.cursor__tag', cur);
    const COLORS = ['#FF5436', '#FFC21F', '#2E5E3E', '#A9D6FF', '#FFB3C7'];
    let cx = 0, cy = 0, px = 0, py = 0, rot = 0, on = false, raf = 0;
    const tick = () => {
      px += (cx - px) * .35; py += (cy - py) * .35;
      const vx = cx - px;
      rot += (clamp(vx * 2.2, -35, 35) - rot) * .2;
      pos.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0)`;
      star.style.setProperty('--cr', rot.toFixed(1) + 'deg');
      raf = (Math.abs(cx - px) > .1 || Math.abs(cy - py) > .1 || Math.abs(rot) > .1) ? requestAnimationFrame(tick) : 0;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      cx = e.clientX; cy = e.clientY;
      if (!on) { on = true; px = cx; py = cy; cur.classList.add('is-on'); document.body.classList.add('has-cursor'); }
      if (!raf) raf = requestAnimationFrame(tick);
      const t = e.target.closest('[data-cursor]');
      if (t) { if (tag.textContent !== t.dataset.cursor) tag.textContent = t.dataset.cursor; }
      cur.classList.toggle('is-tag', !!t);
      cur.classList.toggle('is-link', !t && !!e.target.closest('a,button'));
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    document.documentElement.addEventListener('pointerenter', () => on && cur.classList.add('is-on'));
    addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      cur.classList.add('is-down');
      for (let i = 0; i < 12; i++) {
        const d = document.createElement('span');
        d.className = 'gulal';
        d.style.background = COLORS[i % COLORS.length];
        document.body.appendChild(d);
        const a = Math.random() * Math.PI * 2, r = 26 + Math.random() * 46, s = .6 + Math.random() * .9;
        const anim = d.animate([
          { transform: `translate(${e.clientX}px,${e.clientY}px) scale(.4)`, opacity: 1 },
          { transform: `translate(${e.clientX + Math.cos(a) * r}px,${e.clientY + Math.sin(a) * r}px) scale(${s})`, opacity: 1, offset: .55 },
          { transform: `translate(${e.clientX + Math.cos(a) * r * 1.15}px,${e.clientY + Math.sin(a) * r * 1.15 + 14}px) scale(0)`, opacity: 0 }
        ], { duration: 620 + Math.random() * 200, easing: 'cubic-bezier(.2,.7,.2,1)' });
        anim.onfinish = () => d.remove();
      }
    });
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
  }

  /* ---------- tilt + magnet ---------- */
  if (fine && !reduce) {
    $$('.card, .wcard > button').forEach(el => {
      let box = null, raf = 0, ex = 0, ey = 0;
      el.addEventListener('pointerenter', () => { box = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', e => {
        if (!box) box = el.getBoundingClientRect();
        ex = e.clientX; ey = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.setProperty('--ty', (((ex - box.left) / box.width - .5) * 9).toFixed(2) + 'deg');
          el.style.setProperty('--tx', ((.5 - (ey - box.top) / box.height) * 9).toFixed(2) + 'deg');
        });
      });
      el.addEventListener('pointerleave', () => { box = null; el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg'); });
    });
    $$('[data-magnet]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - (r.left + r.width / 2)) * .3).toFixed(1) + 'px');
        el.style.setProperty('--my', ((e.clientY - (r.top + r.height / 2)) * .3).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
    });
  }

  /* ---------- the pile: drag (mouse only) ---------- */
  let topZ = 10;
  $$('.drag').forEach(card => {
    let sx = 0, sy = 0, ox = 0, oy = 0, on = false;
    card.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      on = true; sx = e.clientX; sy = e.clientY;
      ox = parseFloat(card.style.getPropertyValue('--dx')) || 0;
      oy = parseFloat(card.style.getPropertyValue('--dy')) || 0;
      card.classList.add('is-dragging'); card.style.zIndex = ++topZ; card.setPointerCapture(e.pointerId);
    });
    card.addEventListener('pointermove', e => {
      if (!on) return;
      card.style.setProperty('--dx', (ox + e.clientX - sx) + 'px');
      card.style.setProperty('--dy', (oy + e.clientY - sy) + 'px');
    });
    const end = () => { on = false; card.classList.remove('is-dragging'); };
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  });

  /* ---------- strategy corner tabs ---------- */
  const tabs = $$('#tabs [role="tab"]');
  tabs.forEach(t => t.style.setProperty('--tone', t.dataset.tone));
  const pick = t => {
    tabs.forEach(b => {
      const on = b === t;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
      const p = document.getElementById(b.getAttribute('aria-controls'));
      p.hidden = !on;
      if (on) $$('.note', p).forEach((n, i) => n.style.setProperty('--k', i));
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', e => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      const n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); pick(n);
    });
  });
  pick(tabs[0]);

  /* ---------- reading room ---------- */
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c); });
    const f = c.dataset.filter;
    wcards.forEach(card => card.classList.toggle('is-out', f !== 'all' && card.dataset.cat !== f));
    remeasure();
  }));

  const reader = $('#reader'), rScroll = $('#readerscroll'), rBody = $('#readerbody'), rArt = $('#readerart'), rClose = $('#readerclose'), rProg = $('#readerprog');
  let opener = null, rio = null;
  const openReader = (id, from) => {
    const t = document.getElementById('t-' + id);
    if (!t) return;
    const card = from ? from.closest('.wcard') : $(`[data-open="${id}"]`).closest('.wcard');
    opener = from || card.querySelector('button');
    $('#reader-title').textContent = t.dataset.title;
    $('#readerkind').textContent = t.dataset.kind;
    rBody.innerHTML = t.innerHTML;
    rBody.classList.toggle('is-poem', !!t.dataset.poem);
    rArt.style.setProperty('--tone', getComputedStyle(card).getPropertyValue('--tone'));
    rArt.innerHTML = '<div class="doodles live" data-doodles="reader" aria-hidden="true"></div>' + card.querySelector('.wcard__art').innerHTML;
    makeDoodles($('.doodles', rArt), 6);
    reader.hidden = false;
    rScroll.scrollTop = 0;
    document.body.classList.add('is-reading');
    requestAnimationFrame(() => requestAnimationFrame(() => { reader.classList.add('is-open'); rClose.focus({ preventScroll: true }); }));
    history.replaceState(null, '', '#read-' + id);
    rio && rio.disconnect();
    const items = $$('.reader__body > *', reader);
    if (reduce || !hasIO) items.forEach(i => i.classList.add('in'));
    else {
      rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { root: rScroll, threshold: .12 });
      items.forEach(i => rio.observe(i));
    }
    updateProg();
  };
  const closeReader = () => {
    if (reader.hidden) return;
    reader.classList.remove('is-open');
    document.body.classList.remove('is-reading');
    history.replaceState(null, '', location.pathname + location.search);
    const done = () => { reader.hidden = true; rBody.innerHTML = ''; rArt.innerHTML = ''; };
    reduce ? done() : setTimeout(done, 720);
    opener && opener.focus({ preventScroll: true });
  };
  let pr = 0;
  const updateProg = () => { pr = 0; const m = rScroll.scrollHeight - rScroll.clientHeight; rProg.style.setProperty('--p', m > 0 ? clamp(rScroll.scrollTop / m).toFixed(3) : 0); };
  rScroll.addEventListener('scroll', () => { if (!pr) pr = requestAnimationFrame(updateProg); }, { passive: true });
  rClose.addEventListener('click', closeReader);
  addEventListener('keydown', e => {
    if (reader.hidden) return;
    if (e.key === 'Escape') closeReader();
    if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === rClose ? rScroll : rClose).focus(); }
  });
  rScroll.tabIndex = 0;
  $$('[data-open]').forEach(b => b.addEventListener('click', () => openReader(b.dataset.open, b)));
  if (location.hash.startsWith('#read-')) addEventListener('load', () => openReader(location.hash.slice(6)));
})();
