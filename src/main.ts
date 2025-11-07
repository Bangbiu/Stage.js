const canvas = document.getElementById("scene") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

/** Resize canvas to CSS size * devicePixelRatio for crisp rendering */
function resizeCanvasToDisplaySize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = Math.floor(rect.width * dpr);
  const h = Math.floor(rect.height * dpr);

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
}

function draw() {
  resizeCanvasToDisplaySize();

  const { width, height } = canvas; // in device pixels
  // after setTransform, 1 unit == 1 CSS pixel
  const cssW = width / (window.devicePixelRatio || 1);
  const cssH = height / (window.devicePixelRatio || 1);

  // background
  ctx.clearRect(0, 0, cssW, cssH);
  const g = ctx.createLinearGradient(0, 0, cssW, cssH);
  g.addColorStop(0, "#161a22");
  g.addColorStop(1, "#0b0d12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cssW, cssH);

  // centered text
  const text = "Hello,nope";
  const fontSize = Math.max(16, Math.floor(Math.min(cssW, cssH) * 0.08)); // responsive
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // subtle backdrop
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  const padding = fontSize * 0.9;
  const metrics = ctx.measureText(text);
  const textW = metrics.width;
  const x = cssW / 2;
  const y = cssH / 2;

  // rounded rect behind text
  const rectW = textW + padding * 1.6;
  const rectH = fontSize * 1.6;
  const rx = rectW * 0.08;
  roundRect(ctx, x - rectW / 2, y - rectH / 2, rectW, rectH, rx);
  ctx.fill();

  // main text with soft shadow
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = Math.max(4, fontSize * 0.2);
  ctx.fillStyle = "#eaeef2";
  ctx.fillText(text, x, y);

  // optional: animation loop if you want effects
  // requestAnimationFrame(draw);
}

function roundRect(
  c: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

window.addEventListener("resize", draw);
document.fonts?.addEventListener?.("loadingdone", draw);
draw();
