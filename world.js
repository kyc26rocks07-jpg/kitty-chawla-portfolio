/* Palette Planet loader: a paint-palette globe turns in space, then the camera dives into it.
   Plain WebGL, no libraries. Only runs when the loader variant is "d". */
(() => {
  const root = document.documentElement;
  if (root.getAttribute('data-lv') !== 'd') return;
  const cv = document.getElementById('world');
  if (!cv) return;
  const gl = cv.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { root.setAttribute('data-lv', 'a'); return; } // no WebGL: fall back to the splash loader

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeIn = x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)); // exponential: a slow start, then falling in
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  /* ---------- the palette, painted once onto a flat map ---------- */
  const TW = 2048, TH = 1024;
  const PAL = ['#FF5436', '#FFC21F', '#2E5E3E', '#A9D6FF', '#FFB3C7', '#34190D', '#FFF3DA', '#D93A1E'];
  let seed = 20261119;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    return 'rgb(' + c.map(v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)).join(',') + ')';
  };

  function paint() {
    const col = document.createElement('canvas'); col.width = TW; col.height = TH;
    const gls = document.createElement('canvas'); gls.width = TW / 2; gls.height = TH / 2;
    const g = col.getContext('2d'), m = gls.getContext('2d');
    // the board: warm paper with broad, soft tonal patches
    g.fillStyle = '#EADBC2'; g.fillRect(0, 0, TW, TH);
    for (let i = 0; i < 16; i++) {
      g.fillStyle = rnd() > .5 ? 'rgba(160,120,70,.10)' : 'rgba(255,248,230,.28)';
      g.beginPath(); g.ellipse(rnd() * TW, rnd() * TH, 120 + rnd() * 260, 60 + rnd() * 140, rnd() * 3, 0, 7); g.fill();
    }
    m.fillStyle = '#000'; m.fillRect(0, 0, TW / 2, TH / 2);
    // long brush strokes where the colours were mixed
    for (let i = 0; i < 20; i++) {
      const y = (.16 + rnd() * .68) * TH, x = rnd() * TW, len = 260 + rnd() * 380;
      g.strokeStyle = PAL[Math.floor(rnd() * 6)]; g.globalAlpha = .82; g.lineWidth = 9 + rnd() * 22; g.lineCap = 'round';
      for (const ox of [-TW, 0, TW]) {
        g.beginPath(); g.moveTo(x + ox, y); g.bezierCurveTo(x + ox + len * .3, y - 50 + rnd() * 100, x + ox + len * .7, y - 50 + rnd() * 100, x + ox + len, y + (rnd() - .5) * 60); g.stroke();
      }
    }
    g.globalAlpha = 1;
    // thick dabs of paint, like continents
    for (let i = 0; i < 48; i++) {
      const lat = Math.asin((rnd() * 2 - 1) * .92) * .86;
      const x = rnd() * TW, y = (.5 - lat / Math.PI) * TH;
      const r = 36 + rnd() * 100, kx = 1 / Math.max(Math.cos(lat), .4);
      const colr = PAL[Math.floor(rnd() * PAL.length)];
      const parts = [];
      for (let k = 0; k < 7; k++) { const a = rnd() * 6.283, d = rnd() * r * .55, rr = r * (.55 + .45 * rnd()); parts.push([Math.cos(a) * d * kx, Math.sin(a) * d, rr * kx, rr]); }
      for (const ox of [-TW, 0, TW]) {
        const blob = (dx, dy, fill, s = 1, alpha = 1) => { g.fillStyle = fill; g.globalAlpha = alpha; for (const [px, py, rx, ry] of parts) { g.beginPath(); g.ellipse(x + ox + px * s + dx, y + py * s + dy, rx * s, ry * s, 0, 0, 7); g.fill(); } };
        blob(4, 7, shade(colr, -.45), 1, .55);         // soft shadow under the dab
        blob(0, 0, colr);                              // the paint
        blob(-r * .12, -r * .14, shade(colr, .26), .62, .7); // raised, lighter middle
        g.globalAlpha = 1;
        const sx = (x + ox) / 2, sy = y / 2;           // gloss map (half size)
        m.fillStyle = 'rgba(255,255,255,.95)'; m.beginPath(); m.ellipse(sx - r * .2 * kx * .5, sy - r * .24 * .5, r * .2 * kx * .5, r * .13 * .5, -.5, 0, 7); m.fill();
        m.fillStyle = 'rgba(255,255,255,.34)'; for (const [px, py, rx, ry] of parts) { m.beginPath(); m.ellipse(sx + px / 2, sy + py / 2, rx * .5, ry * .5, 0, 0, 7); m.fill(); }
      }
    }
    // the thumb hole every palette has
    const hx = TW * .5, hy = TH * .47;
    g.fillStyle = '#1A1410'; g.beginPath(); g.ellipse(hx, hy, 96, 96, 0, 0, 7); g.fill();
    g.strokeStyle = '#FFF3DA'; g.lineWidth = 11; g.beginPath(); g.ellipse(hx, hy, 106, 106, 0, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(26,20,16,.35)'; g.lineWidth = 6; g.beginPath(); g.ellipse(hx, hy, 117, 117, 0, 0, 7); g.stroke();
    m.fillStyle = '#000'; m.beginPath(); m.ellipse(hx / 2, hy / 2, 62, 62, 0, 0, 7); m.fill();
    return [col, gls];
  }

  /* ---------- shader: ray-cast sphere, stars, thin rim, fade to cream ---------- */
  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `precision highp float;
uniform vec2 uRes, uCenter; uniform float uTime, uRot, uTilt, uScale, uFade, uStar, uStarZ;
uniform sampler2D uTex, uGloss;
const float PI = 3.14159265;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float stars(vec2 q){
  float s = 0.;
  for (int i = 0; i < 2; i++) {
    float sc = i == 0 ? 34. : 66.;
    vec2 g = q * sc, id = floor(g), f = fract(g) - .5;
    float h = hash(id + float(i) * 17.);
    if (h > .945) {
      vec2 o = (vec2(hash(id + 3.1), hash(id + 7.7)) - .5) * .6;
      s += smoothstep(.10, .0, length(f - o)) * (.65 + .35 * sin(uTime * (1.4 + h * 3.) + h * 40.)) * (i == 0 ? 1. : .6);
    }
  }
  return s;
}
void main(){
  float m = .5 * min(uRes.x, uRes.y);
  vec2 sp = (gl_FragCoord.xy - .5 * uRes) / m;
  vec2 p = (gl_FragCoord.xy - .5 * uRes - uCenter) / m;
  vec3 col = vec3(.043, .035, .031) + vec3(1., .95, .85) * stars(sp * uStarZ) * uStar * 1.2;
  float r = uScale, d = length(p) / r, px = 1. / (m * r);
  if (d < 1. + px * 1.5) {
    float z = sqrt(max(1. - d * d, 0.));
    vec3 n = vec3(p / r, z), q = n;
    float cs = cos(uRot), sn = sin(uRot);
    q = vec3(cs * q.x + sn * q.z, q.y, -sn * q.x + cs * q.z);
    float ct = cos(uTilt), st = sin(uTilt);
    q = vec3(q.x, ct * q.y - st * q.z, st * q.y + ct * q.z);
    vec2 uv = vec2(atan(q.x, q.z) / (2. * PI) + .5, asin(clamp(q.y, -1., 1.)) / PI + .5);
    vec3 base = texture2D(uTex, uv).rgb;
    float gloss = texture2D(uGloss, uv).r;
    vec3 L = normalize(vec3(-.5, .55, .7));
    float lam = max(dot(n, L), 0.);
    vec3 H = normalize(L + vec3(0., 0., 1.));
    float spec = pow(max(dot(n, H), 0.), 90.) * gloss * .3;
    float rim = pow(1. - z, 2.6);
    vec3 planet = base * (.30 + .78 * lam) * (1. - .30 * rim) + vec3(spec) + vec3(1., .92, .8) * rim * .10 * lam;
    col = mix(col, planet, clamp((1. - d) / (px * 1.5) + .5, 0., 1.));
  } else {
    float ring = smoothstep(1.03, 1., d) * .55;
    float lit = .35 + .65 * smoothstep(-.6, .8, dot(normalize(p), normalize(vec2(-.5, .55))));
    col = mix(col, vec3(1., .93, .82), ring * lit);
  }
  col = mix(col, vec3(1., .953, .855), uFade);
  gl_FragColor = vec4(col, 1.);
}`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { root.setAttribute('data-lv', 'a'); return; }
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { root.setAttribute('data-lv', 'a'); return; }
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const u = { res: U('uRes'), center: U('uCenter'), time: U('uTime'), rot: U('uRot'), tilt: U('uTilt'), scale: U('uScale'), fade: U('uFade'), star: U('uStar'), starZ: U('uStarZ') };
  gl.uniform1i(U('uTex'), 0); gl.uniform1i(U('uGloss'), 1);

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
  };
  size(); addEventListener('resize', size);

  /* ---------- timeline ---------- */
  const DIVE_MS = 1900;
  const loader = document.getElementById('loader');
  let tex = false, t0 = performance.now(), diveAt = -1, onDone = null, doneFired = false, raf = 0, alive = true;

  function upload(unit, canvas) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function frame(now) {
    if (!alive) return;
    const t = (now - t0) / 1000;
    const intro = tex ? easeOut(clamp((t - .15) / 1.7)) : 0;
    let scale = lerp(.32, .66, intro) * (tex ? 1 : 0);
    const restY = .06;
    let cy = lerp(-.08, restY, intro), rot = .9 + t * .5, fade = 0, star = clamp(t / 1.1), starZ = 1;
    if (diveAt >= 0) {
      const td = clamp((now - diveAt) / DIVE_MS), e = easeIn(td);
      scale = .66 * Math.exp(Math.log(60) * e);
      cy = lerp(restY, 0, easeOut(clamp(td * 1.6)));
      rot += 3.4 * td * td;
      starZ = 1 + 8 * e;
      fade = smooth(.74, .98, td);
      if (td >= 1 && !doneFired) { doneFired = true; onDone && onDone(); }
    }
    const m = .5 * Math.min(cv.width, cv.height);
    gl.uniform2f(u.res, cv.width, cv.height); gl.uniform2f(u.center, 0, cy * m);
    gl.uniform1f(u.time, t); gl.uniform1f(u.rot, rot); gl.uniform1f(u.tilt, .41);
    gl.uniform1f(u.scale, Math.max(scale, .0001)); gl.uniform1f(u.fade, fade); gl.uniform1f(u.star, star); gl.uniform1f(u.starZ, starZ);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // paint the palette just after the first frame, so the stars appear straight away
  setTimeout(() => {
    const [a, b] = paint(); upload(0, a); upload(1, b); tex = true; t0 = performance.now();
    setTimeout(() => loader && loader.classList.add('is-live'), 900);
  }, 40);

  window.KCWorld = {
    dive(cb) { onDone = cb; diveAt = performance.now(); },
    destroy() { alive = false; cancelAnimationFrame(raf); const x = gl.getExtension('WEBGL_lose_context'); x && x.loseContext(); }
  };
})();
