// Interactive sections: the week before/after, the terminal demo and the ROI calculator.
import { calcRoi, formatNum, formatRub } from "./roi-math.js";

const AGENT_SHARE = 0.7;
const TYPE_MS = 14;
const LINE_PAUSE_MS = 260;

const WEEK = [
  ["Пн", [["Разбор почты", 2, true], ["Планёрка", 1.5, false], ["Отчёт по продажам", 2, true], ["Звонки клиентам", 2.5, false]]],
  ["Вт", [["Сверка таблиц", 2, true], ["Встреча с командой", 2, false], ["Ответы в Telegram", 1.5, true], ["Стратегия", 2.5, false]]],
  ["Ср", [["Заявки → CRM", 2.5, true], ["Переговоры", 3, false], ["Протоколы встреч", 1.5, true], ["Найм", 1, false]]],
  ["Чт", [["Посты в соцсети", 2, true], ["Партнёры", 3, false], ["Разбор почты", 1.5, true], ["Финансы", 1.5, false]]],
  ["Пт", [["Недельный отчёт", 2.5, true], ["Ревью проектов", 2.5, false], ["Счета и акты", 1.5, true], ["Планирование", 1.5, false]]],
];

const TERMINAL = [
  ["cmd", "offload run morning-brief"],
  ["", "→ подключаюсь: почта, Telegram, CRM, Google Sheets…"],
  ["ok", "✓ 47 новых писем разобрано"],
  ["", "   · 3 ждут вашего решения"],
  ["", "   · 12 ответов подготовлено черновиками"],
  ["", "   · 32 в архив: рассылки и уведомления"],
  ["ok", "✓ 6 заявок перенесено в CRM, менеджеры назначены"],
  ["warn", "! Счёт №214 просрочен на 5 дней → клиенту ушло напоминание"],
  ["ok", "✓ Сводка за вчера: выручка +12% к среднему вторнику"],
  ["cmd", "offload send brief --to telegram"],
  ["ok", "✓ Утренний бриф отправлен · 07:58 · заняло 41 сек"],
];

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderTask([label, hours, auto], index) {
  const task = make("div", `task ${auto ? "task--auto" : "task--human"}`);
  task.style.flexGrow = String(hours);
  task.style.setProperty("--i", String(index));
  task.append(make("span", "task__label", label), make("span", "task__hours", `${hours} ч`));
  if (auto) task.append(make("span", "task__agent", "агент"));
  return task;
}

export function initWeek(root) {
  if (!root) return;
  const list = root.querySelector(".week__days");
  const toggle = root.querySelector(".switch");
  const counter = root.querySelector("[data-freed]");
  let index = 0;
  WEEK.forEach(([day, tasks]) => {
    const row = make("li", "day");
    const track = make("div", "day__track");
    tasks.forEach((t) => track.append(renderTask(t, (index += 1))));
    row.append(make("span", "day__name", day), track);
    list.append(row);
  });
  const autoHours = WEEK.flatMap(([, tasks]) => tasks).filter((t) => t[2]).reduce((sum, t) => sum + t[1], 0);
  const freed = Math.round(autoHours * AGENT_SHARE);

  toggle.addEventListener("click", () => {
    const on = toggle.getAttribute("aria-pressed") !== "true";
    toggle.setAttribute("aria-pressed", String(on));
    root.classList.toggle("is-on", on);
    counter.textContent = on ? `${freed} ч` : "0 ч";
  });
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function typeLines(body, caret, run, isCurrent) {
  body.replaceChildren();
  for (const [kind, text] of TERMINAL) {
    if (!isCurrent(run)) return;
    const line = make("span", kind ? `t-${kind}` : "");
    body.append(line, caret);
    for (let i = 1; i <= text.length; i += 1) {
      if (!isCurrent(run)) return;
      line.textContent = text.slice(0, i);
      await sleep(TYPE_MS);
    }
    if (!isCurrent(run)) return;
    body.insertBefore(document.createTextNode("\n"), caret);
    await sleep(LINE_PAUSE_MS);
  }
}

export function initTerminal(root, { reducedMotion }) {
  if (!root) return;
  const body = root.querySelector(".term__body");
  const replay = root.querySelector(".term__replay");
  const caret = make("span", "term__caret");
  let currentRun = 0;
  const isCurrent = (run) => run === currentRun;

  const showAll = () => {
    body.replaceChildren(...TERMINAL.flatMap(([kind, text]) => [make("span", kind ? `t-${kind}` : "", text), document.createTextNode("\n")]));
  };
  const play = () => {
    currentRun += 1;
    if (reducedMotion) showAll();
    else typeLines(body, caret, currentRun, isCurrent);
  };

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    play();
  }, { threshold: 0.35 });
  io.observe(root);
  replay.addEventListener("click", play);
}

export function initRoi(root) {
  if (!root) return;
  const read = (id) => Number(root.querySelector(`#${id}`).value);
  const write = (selector, text) => {
    root.querySelector(selector).textContent = text;
  };

  const update = () => {
    const hoursPerWeek = read("roi-hours");
    const hourlyRate = read("roi-rate");
    const sharePct = read("roi-share");
    const r = calcRoi({ hoursPerWeek, hourlyRate, automationShare: sharePct / 100 });
    write("[data-out='roi-hours']", `${hoursPerWeek} ч/нед`);
    write("[data-out='roi-rate']", formatRub(hourlyRate));
    write("[data-out='roi-share']", `${sharePct}%`);
    write("[data-roi='money']", formatRub(r.moneyPerMonth));
    write("[data-roi='hours']", `${formatNum(r.hoursPerMonth)} ч`);
    write("[data-roi='days']", `${formatNum(r.workdaysPerYear)} дн.`);
  };

  root.addEventListener("input", update);
  update();
}
