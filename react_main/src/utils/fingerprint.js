const FONT_LIST = ["Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", "Andale Mono", "Arial", "Arial Black", "Arial Hebrew", "Arial MT", "Arial Narrow", "Arial Rounded MT Bold", "Arial Unicode MS", "Bitstream Vera Sans Mono", "Book Antiqua", "Bookman Old Style", "Calibri", "Cambria", "Cambria Math", "Century", "Century Gothic", "Century Schoolbook", "Comic Sans", "Comic Sans MS", "Consolas", "Courier", "Courier New", "Geneva", "Georgia", "Helvetica", "Helvetica Neue", "Impact", "Lucida Bright", "Lucida Calligraphy", "Lucida Console", "Lucida Fax", "LUCIDA GRANDE", "Lucida Handwriting", "Lucida Sans", "Lucida Sans Typewriter", "Lucida Sans Unicode", "Microsoft Sans Serif", "Monaco", "Monotype Corsiva", "MS Gothic", "MS Outlook", "MS PGothic", "MS Reference Sans Serif", "MS Sans Serif", "MS Serif", "MYRIAD", "MYRIAD PRO", "Palatino", "Palatino Linotype", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Light", "Segoe UI Semibold", "Segoe UI Symbol", "Tahoma", "Times", "Times New Roman", "Times New Roman PS", "Trebuchet MS", "Verdana", "Wingdings", "Wingdings 2", "Wingdings 3"];

function fontExists(fontName) {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return false;
  const text = "mmmmmmmmmmlliWW@@##";
  ctx.font = "72px monospace";
  const baseline = ctx.measureText(text).width;
  ctx.font = `72px "${fontName}", monospace`;
  return ctx.measureText(text).width !== baseline;
}

function canvasFingerprint() {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const linear = ctx.createLinearGradient(0, 0, 300, 150);
  linear.addColorStop(0, "#f60"); linear.addColorStop(0.5, "#09c"); linear.addColorStop(1, "#c3f");
  ctx.fillStyle = linear; ctx.fillRect(0, 0, 300, 150);
  const radial = ctx.createRadialGradient(180, 75, 5, 180, 75, 70);
  radial.addColorStop(0, "rgba(255,255,255,0.9)"); radial.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = radial; ctx.fillRect(100, 0, 180, 150);
  ctx.globalAlpha = 0.65;
  for (const [x, color] of [[90, "#f00"], [130, "#0f0"], [170, "#00f"]]) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, 85, 40, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "#fc0"; ctx.fillRect(45.5, 60.5, 190, 30);
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.fillStyle = "#111"; ctx.textBaseline = "top";
  ctx.font = "20px Arial"; ctx.fillText("ABCD/;😹", 8.5, 8.5); ctx.font = "italic 17px serif"; ctx.fillText("Canvas Ω≈ç√∫˜µ≤≥÷", 8.5, 120.5);
  return canvas.toDataURL();
}

const te = new TextEncoder();
async function sha256(input) {
  const bytes = typeof input === "string" ? te.encode(input) : input;
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function webglFingerprint() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
  const gl = canvas.getContext("webgl", { antialias: false }) || canvas.getContext("experimental-webgl", { antialias: false });
  if (!gl) return null;
  const program = gl.createProgram(); const buffer = gl.createBuffer(); const shaders = [];
  try {
    if (!program || !buffer) return null;
    const sources = [[gl.VERTEX_SHADER, `attribute vec2 p; varying vec3 color; void main() { color = vec3(p * 0.5 + 0.5, 0.35); gl_Position = vec4(p, 0.0, 1.0); }`], [gl.FRAGMENT_SHADER, `precision mediump float; varying vec3 color; void main() { gl_FragColor = vec4(color, 1.0); }`]];
    for (const [type, source] of sources) { const shader = gl.createShader(type); if (!shader) return null; shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null; gl.attachShader(program, shader); }
    gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.85, -0.8, 0.9, -0.65, -0.15, 0.9]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, 64, 64); gl.clearColor(0.05, 0.1, 0.15, 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    const pixels = new Uint8Array(64 * 64 * 4); gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR) return null;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return { vendor: gl.getParameter(debugInfo ? debugInfo.UNMASKED_VENDOR_WEBGL : gl.VENDOR), renderer: gl.getParameter(debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER), pixels: await sha256(pixels) };
  } finally { for (const shader of shaders) gl.deleteShader(shader); if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program); gl.getExtension("WEBGL_lose_context")?.loseContext(); }
}

async function collectFingerprint() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof crypto === "undefined" || !crypto.subtle) return null;
  let timer;
  try {
    return await Promise.race([ (async () => {
      const webgl = await webglFingerprint();
      // A high-entropy stable print is required for stable-only matches to be meaningful. Physical dimensions can shift with zoom, scaling, or monitors and break continuity; drop or quantise them if needed.
      const stable = { platform: navigator.platform, hardwareConcurrency: navigator.hardwareConcurrency, fonts: FONT_LIST.filter(fontExists), canvas: canvasFingerprint(), webgl, physicalWidth: window.screen.width * window.devicePixelRatio, physicalHeight: window.screen.height * window.devicePixelRatio, navigatorKeyCount: Reflect.ownKeys(Object.getPrototypeOf(navigator)).length };
      const unstable = { userAgent: navigator.userAgent, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, timezoneOffset: new Date().getTimezoneOffset(), language: navigator.language, languages: navigator.languages };
      return { platform: "web", stable: "v2:" + await sha256(JSON.stringify(stable)), unstable: "v2:" + await sha256(JSON.stringify(unstable)) };
    })(), new Promise((resolve) => { timer = setTimeout(() => resolve(null), 3000); }) ]);
  } catch (e) { return null; } finally { clearTimeout(timer); }
}

export { collectFingerprint };
