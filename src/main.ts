import AttributionTests from "./StageModule/testers/AttributionTests.js";
import SObjectTests from "./StageModule/testers/SObjectTests.js";

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

    // centered text
    const text = "Hello,nope";
    const fontSize = Math.max(16, Math.floor(Math.min(cssW, cssH) * 0.08)); // responsive
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // subtle backdrop
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    const x = cssW / 2;
    const y = cssH / 2;

    ctx.fill();

    // main text with soft shadow
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = Math.max(4, fontSize * 0.2);
    ctx.fillStyle = "#eaeef2";
    ctx.fillText(text, x, y);

    // optional: animation loop if you want effects
    // requestAnimationFrame(draw);
}

window.addEventListener("resize", draw);
document.fonts?.addEventListener?.("loadingdone", draw);
draw();

AttributionTests.test1();
SObjectTests.test2();
SObjectTests.test3();
