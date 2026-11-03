// Hero diagram: inputs → agent core → outputs, with tasks travelling along the wires.
const NS = "http://www.w3.org/2000/svg";
const W = 560;
const H = 520;
const CORE = { x: 280, y: 260, size: 92 };
const INPUTS = ["Почта", "Telegram", "Таблицы", "CRM", "Звонки"];
const OUTPUTS = ["Отчёт", "Задачи", "Ответы", "Посты"];
const NODE_W = 104;
const NODE_H = 34;
const SPAWN_MS = 520;
const TRAVEL_MS = 1500;

function el(name, attrs = {}, text) {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  if (text) node.textContent = text;
  return node;
}

function column(labels, x) {
  const step = H / labels.length;
  return labels.map((label, i) => ({ label, x, y: step * i + step / 2 }));
}

function wire(from, to) {
  const mid = (from.x + to.x) / 2;
  return `M${from.x},${from.y} C${mid},${from.y} ${mid},${to.y} ${to.x},${to.y}`;
}

function drawNode(svg, { label, x, y }, kind) {
  const g = el("g", { class: `f-node f-node--${kind}` });
  g.append(el("rect", { x: x - NODE_W / 2, y: y - NODE_H / 2, width: NODE_W, height: NODE_H, rx: 2 }));
  g.append(el("text", { x: x - NODE_W / 2 + 12, y: y + 4.5 }, label));
  if (kind === "out") g.append(el("circle", { class: "f-check", cx: x + NODE_W / 2 - 13, cy: y, r: 4 }));
  svg.append(g);
  return g;
}

function drawCore(svg) {
  const half = CORE.size / 2;
  svg.append(el("rect", { class: "f-ring", x: CORE.x - half - 16, y: CORE.y - half - 16, width: CORE.size + 32, height: CORE.size + 32 }));
  const g = el("g", { class: "f-core" });
  g.append(el("rect", { x: CORE.x - half, y: CORE.y - half, width: CORE.size, height: CORE.size }));
  g.append(el("text", { x: CORE.x, y: CORE.y + 5, "text-anchor": "middle" }, "АГЕНТ"));
  svg.append(g);
}

function buildScene(figure) {
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" });
  const ins = column(INPUTS, 70);
  const outs = column(OUTPUTS, W - 70);
  const core = { x: CORE.x, y: CORE.y };
  const inPaths = ins.map((n) => svg.appendChild(el("path", { class: "f-path", d: wire({ x: n.x + NODE_W / 2, y: n.y }, core) })));
  const outPaths = outs.map((n) => svg.appendChild(el("path", { class: "f-path", d: wire(core, { x: n.x - NODE_W / 2, y: n.y }) })));
  ins.forEach((n) => drawNode(svg, n, "in"));
  const outNodes = outs.map((n) => drawNode(svg, n, "out"));
  drawCore(svg);
  figure.prepend(svg);
  return { svg, inPaths, outPaths, outNodes };
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function flash(node) {
  node.classList.add("is-hit");
  window.setTimeout(() => node.classList.remove("is-hit"), 700);
}

function animate(scene) {
  const dots = [];
  let lastSpawn = 0;
  let running = false;
  let frame = 0;

  function spawn(now) {
    const outIndex = Math.floor(Math.random() * scene.outPaths.length);
    const dot = el("rect", { class: "f-dot", width: 7, height: 7, x: -3.5, y: -3.5 });
    scene.svg.insertBefore(dot, scene.svg.querySelector(".f-node"));
    dots.push({ dot, start: now, legs: [pick(scene.inPaths), scene.outPaths[outIndex]], outIndex });
  }

  function tick(now) {
    if (!running) return;
    if (now - lastSpawn > SPAWN_MS) {
      spawn(now);
      lastSpawn = now;
    }
    for (let i = dots.length - 1; i >= 0; i -= 1) {
      const d = dots[i];
      const t = (now - d.start) / TRAVEL_MS;
      if (t >= 2) {
        flash(scene.outNodes[d.outIndex]);
        d.dot.remove();
        dots.splice(i, 1);
        continue;
      }
      const path = d.legs[t < 1 ? 0 : 1];
      const p = path.getPointAtLength(path.getTotalLength() * (t % 1));
      d.dot.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      if (t >= 1) d.dot.classList.add("f-dot--done");
    }
    frame = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
      // Drop in-flight dots so a resume doesn't flash every output at once.
      dots.splice(0).forEach((d) => d.dot.remove());
    },
  };
}

export function initFlow(figure, { reducedMotion }) {
  if (!figure) return;
  const scene = buildScene(figure);
  if (reducedMotion) return;
  const loop = animate(scene);
  let visible = false;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) loop.start();
    else loop.stop();
  });
  io.observe(figure);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) loop.stop();
    else if (visible) loop.start();
  });
}
