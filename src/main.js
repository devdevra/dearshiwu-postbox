import "./styles/theme.css";
import { DAILY_POEMS, SOS_LINES } from "./data/poems.js";
import {
  TOP_MOODS,
  QUESTIONS,
  EMOTION_GROUPS,
  COIN_DEFINITIONS,
  LEXICON_WORDS,
  DICTIONARY_ENTRIES
} from "./data/emotions.js";
import { renderArtworkCanvas, SCENE_CAPTIONS } from "./components/canvasArt.js";

const STORAGE_SAVED_KEY = "siu-postbox-saved";
const STORAGE_INTRO_KEY = "siu-postbox-intro-seen";
const STORAGE_SIZE_KEY = "siu-postbox-big";
const STORAGE_UNDERLINES_KEY = "siu-postbox-underlines";
const STORAGE_THEME_KEY = "siu-postbox-theme";

const WORKS = DAILY_POEMS.map((item, idx) => ({
  ...item,
  day: item.day || idx + 1,
  status: item.status || "ready",
  note: item.note || ""
}));

function loadUnderlines() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_UNDERLINES_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

let underlinedMap = loadUnderlines();

function saveUnderlinesToStorage() {
  try {
    localStorage.setItem(STORAGE_UNDERLINES_KEY, JSON.stringify(underlinedMap));
  } catch {
    // Ignore storage errors
  }
}

function getUnderlinedIndices(workId) {
  const arr = underlinedMap[workId];
  return Array.isArray(arr) ? arr : [];
}

function togglePoemLineUnderline(workId, lineIdx) {
  const current = new Set(getUnderlinedIndices(workId));
  if (current.has(lineIdx)) {
    current.delete(lineIdx);
  } else {
    current.add(lineIdx);
  }
  if (current.size === 0) {
    delete underlinedMap[workId];
  } else {
    underlinedMap[workId] = [...current].sort((a, b) => a - b);
  }
  saveUnderlinesToStorage();
  return current.has(lineIdx);
}

function getFirstUnderlinedLine(work) {
  if (!work || !Array.isArray(work.lines)) return "";
  const indices = getUnderlinedIndices(work.id);
  for (const idx of indices) {
    const line = work.lines[idx];
    if (line && line.trim()) return line.trim();
  }
  return "";
}

function loadSavedItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_SAVED_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let savedItems = loadSavedItems();

function saveItemsToStorage() {
  try {
    localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(savedItems));
  } catch {
    // Ignore storage errors
  }
}

function isPoemSaved(id) {
  return savedItems.some((entry) => entry.id === id);
}

const currentMoment = new Date();
const formatKoreanDate = (dateObj) => `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
const todayMidnight = new Date(
  currentMoment.getFullYear(),
  currentMoment.getMonth(),
  currentMoment.getDate()
);

let startTimestamp = todayMidnight.getTime();
try {
  const storedStart = Number(localStorage.getItem("siu-start"));
  if (storedStart && storedStart <= startTimestamp) {
    startTimestamp = storedStart;
  } else {
    localStorage.setItem("siu-start", String(startTimestamp));
  }
} catch {
  // Ignore storage errors
}

const BETA_START_DATE = new Date(startTimestamp);
const betaDayCount = Math.floor((todayMidnight - BETA_START_DATE) / 86400000) + 1;
const IS_BETA_MODE = location.hash !== "#preview";
const EXTERNAL_FORM_URL = "";

const unlockedDayIndex = Math.min(
  WORKS.length,
  Math.max(1, currentMoment.getHours() >= 15 ? betaDayCount : betaDayCount - 1)
);
const isPreviewWait = IS_BETA_MODE ? unlockedDayIndex < 1 : betaDayCount < 1;

let activeDayIndex = IS_BETA_MODE
  ? Math.max(1, unlockedDayIndex)
  : isPreviewWait
  ? 1
  : ((betaDayCount - 1) % WORKS.length) + 1;

if (IS_BETA_MODE) {
  const hashDayMatch = location.hash.match(/^#d(\d{1,2})$/);
  if (hashDayMatch && Number(hashDayMatch[1]) >= 1 && Number(hashDayMatch[1]) <= unlockedDayIndex) {
    activeDayIndex = Number(hashDayMatch[1]);
  }
}

const getPoemByDay = (dayNumber) => WORKS[dayNumber - 1] || WORKS[0];
const getDateForDay = (dayNumber) => new Date(BETA_START_DATE.getTime() + (dayNumber - 1) * 86400000);

document.getElementById("todayDate").textContent = formatKoreanDate(currentMoment);

function refreshArrivalStatus() {
  const now = new Date();
  const todayThreePm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0);
  const hasArrivedToday = now >= todayThreePm;

  document.getElementById("arrival").textContent = IS_BETA_MODE
    ? activeDayIndex === 1
      ? `${formatKoreanDate(getDateForDay(1))}, 첫 편지`
      : `${formatKoreanDate(getDateForDay(activeDayIndex))} 오후 3시에 도착한 편지`
    : isPreviewWait
    ? `베타 ${activeDayIndex}일째 편지 미리보기 · ${formatKoreanDate(getDateForDay(activeDayIndex))} 도착 예정`
    : hasArrivedToday
    ? `${formatKoreanDate(now)} 오후 3시에 도착한 편지`
    : `오늘 오후 3시 도착 예정 · 시연판이라 미리 열 수 있어요`;

  const nextThreePm = hasArrivedToday ? new Date(todayThreePm.getTime() + 86400000) : todayThreePm;
  const remainingMinutes = Math.max(0, Math.round((nextThreePm - now) / 60000));
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;

  document.getElementById("countdown").textContent = `다음 편지까지 ${hours}시간 ${mins}분`;
  document.getElementById("todayTitle").textContent = IS_BETA_MODE
    ? isPreviewWait
      ? "첫 편지가 오고 있어요"
      : activeDayIndex === 1 && betaDayCount === 1
      ? "첫 편지가 도착했어요"
      : activeDayIndex === unlockedDayIndex && hasArrivedToday
      ? "오늘의 편지가 도착했어요"
      : activeDayIndex === unlockedDayIndex
      ? "어제 도착한 편지예요"
      : `${activeDayIndex}일째 편지예요`
    : isPreviewWait
    ? "첫 편지를 미리 열어 볼까요"
    : hasArrivedToday
    ? "오늘의 편지가 도착했어요"
    : "오늘의 편지가 오고 있어요";
}

refreshArrivalStatus();
setInterval(refreshArrivalStatus, 30000);

function syncZenModeUI() {
  const isZen = document.body.classList.contains("zen-mode");
  document.querySelectorAll(".js-zen").forEach((btn) => {
    btn.textContent = isZen ? "원래대로 보기" : "시만 조용히 보기";
    btn.classList.toggle("zen-active", isZen);
    btn.setAttribute("aria-pressed", isZen ? "true" : "false");
  });
}

function exitZenMode() {
  if (document.body.classList.contains("zen-mode")) {
    document.body.classList.remove("zen-mode");
    syncZenModeUI();
  }
}

function createCardTemplate(work, options = {}) {
  return `<article class="card" data-id="${work.id}">
    ${
      work.photo
        ? `<img class="art art-photo" src="${work.photo}" alt="${work.artwork || "이시우 시인의 시엽서 그림"}">`
        : `<canvas class="art" role="img" aria-label="시에 어울리는 단순한 그림"></canvas>`
    }
    <p class="art-cap js-artcap"></p>
    <div class="card-body">
      <div class="day-tag js-day"></div>
      <h2 class="poem-title js-title"></h2>
      <div class="byline js-by"></div>
      <p class="poem"></p>
      <p class="poem-hint js-poem-hint"></p>
      <div class="note"><span class="js-note"></span><small>— 시인의 우체통이 덧붙인 한 줄</small></div>
      <div class="siwoo js-siwoo">
        <span class="siwoo-head">시인의 편지 한 조각</span>
        <p class="siwoo-line js-siwoo-text"></p>
        <small class="js-siwoo-from"></small>
      </div>
      <div class="rights js-rights"></div>
      <div class="actions">
        <button class="btn js-save" type="button"></button>
        <a class="btn" href="#mood">다른 마음으로 받기</a>
        <button class="btn js-zen" type="button" aria-pressed="false">시만 조용히 보기</button>
        ${options.allowRefold ? `<button class="btn js-refold" type="button">봉투 다시 덮기</button>` : ""}
      </div>
    </div>
  </article>`;
}

function renderPoemLines(poemParagraph, work) {
  poemParagraph.innerHTML = "";
  const underlinedSet = new Set(getUnderlinedIndices(work.id));
  work.lines.forEach((lineText, idx) => {
    if (lineText === "") {
      const gap = document.createElement("span");
      gap.className = "poem-stanza-gap";
      gap.setAttribute("aria-hidden", "true");
      poemParagraph.appendChild(gap);
    } else {
      const lineSpan = document.createElement("span");
      lineSpan.className = "poem-line";
      if (underlinedSet.has(idx)) lineSpan.classList.add("underlined");
      lineSpan.setAttribute("role", "button");
      lineSpan.setAttribute("tabindex", "0");
      lineSpan.setAttribute("aria-pressed", underlinedSet.has(idx) ? "true" : "false");
      lineSpan.style.setProperty("--line-idx", String(Math.min(idx, 20)));
      lineSpan.textContent = lineText;

      const handleToggle = () => {
        const nowUnderlined = togglePoemLineUnderline(work.id, idx);
        lineSpan.classList.toggle("underlined", nowUnderlined);
        lineSpan.setAttribute("aria-pressed", nowUnderlined ? "true" : "false");
        renderSavedArchive(false);
        renderPastLettersList();
      };

      lineSpan.addEventListener("click", handleToggle);
      lineSpan.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      });

      poemParagraph.appendChild(lineSpan);
    }
    if (idx < work.lines.length - 1) {
      poemParagraph.appendChild(document.createTextNode("\n"));
    }
  });
}

function mountLetterCard(container, work, options = {}) {
  if (!container || !work) return;
  container.innerHTML = createCardTemplate(work, options);
  const select = (sel) => container.querySelector(sel);

  select(".js-artcap").textContent = SCENE_CAPTIONS[work.art] || "";
  select(".js-day").textContent = `${work.day}일째 편지 · ${formatKoreanDate(getDateForDay(work.day))}`;
  select(".js-title").textContent = work.title;
  select(".js-by").textContent = work.mine ? "이시우" : `${work.author} · ${work.source}`;

  const poemParagraph = select(".poem");
  const hintEl = select(".js-poem-hint");
  if (work.status === "ready") {
    renderPoemLines(poemParagraph, work);
    hintEl.textContent = "마음에 머무는 구절을 눌러 밑줄을 그어 보세요";
    hintEl.hidden = false;
  } else {
    poemParagraph.classList.add("poem-pending");
    poemParagraph.textContent =
      work.status === "own"
        ? "대표 시인의 시가 들어갈 자리예요."
        : "원문은 출시 전에 위키문헌·공유마당의 원문으로 넣어요.";
    hintEl.hidden = true;
  }

  select(".js-note").textContent = work.note || "";
  select(".note").hidden = !work.note;

  const siwooBox = select(".js-siwoo");
  if (work.siwoo && work.siwoo.text) {
    select(".js-siwoo-text").textContent = work.siwoo.text;
    select(".js-siwoo-from").textContent = work.siwoo.from ? `— ${work.siwoo.from}` : "";
    siwooBox.hidden = false;
  } else {
    siwooBox.hidden = true;
  }

  select(".js-rights").hidden = true;

  const canvas = container.querySelector("canvas");
  if (canvas) {
    requestAnimationFrame(() => renderArtworkCanvas(canvas, work));
  }

  const saveBtn = container.querySelector(".js-save");
  const updateSaveButton = () => {
    const saved = isPoemSaved(work.id);
    saveBtn.textContent = saved ? "보관했어요" : "보관하기";
    saveBtn.classList.toggle("saved", saved);
    saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
  };

  saveBtn.addEventListener("click", () => {
    if (isPoemSaved(work.id)) {
      savedItems = savedItems.filter((item) => item.id !== work.id);
    } else {
      savedItems.unshift({ id: work.id, at: new Date().toISOString() });
    }
    saveItemsToStorage();
    updateSaveButton();
    renderSavedArchive(false);
  });

  updateSaveButton();

  const zenBtn = container.querySelector(".js-zen");
  if (zenBtn) {
    zenBtn.addEventListener("click", () => {
      document.body.classList.toggle("zen-mode");
      syncZenModeUI();
    });
    syncZenModeUI();
  }

  const refoldBtn = container.querySelector(".js-refold");
  if (refoldBtn) {
    refoldBtn.addEventListener("click", closeOpenLetter);
  }
}

const mailWrapper = document.getElementById("mail");
const dayLabelEl = document.getElementById("dayLabel");

function updateAfterReadBanner() {
  const afterBox = document.getElementById("afterRead");
  afterBox.hidden = !mailWrapper.classList.contains("open");
  const isEarlyMorning = new Date().getHours() < 15 && betaDayCount > 1 && activeDayIndex === unlockedDayIndex;
  document.getElementById("afterMain").textContent = isEarlyMorning
    ? "편지를 읽었어요.\n오늘 오후 3시에 새 편지가 와요."
    : "오늘의 편지를 읽었어요.\n내일 오후 3시에 또 올게요.";
}

function closeOpenLetter() {
  exitZenMode();
  mailWrapper.classList.remove("open");
  document.getElementById("todayCard").innerHTML = "";
  document.body.classList.remove("reading", "tabs-away");
  document.querySelector(".env-to").textContent = "다시 읽기";
  updateAfterReadBanner();
  window.scrollTo(0, 0);
}

document.querySelector('nav.tabs a[data-tab="today"]').addEventListener("click", () => {
  if (mailWrapper.classList.contains("open")) {
    closeOpenLetter();
  }
});

document.getElementById("envelope").addEventListener("click", () => {
  mailWrapper.classList.add("open");
  document.body.classList.add("reading");
  mountLetterCard(document.getElementById("todayCard"), getPoemByDay(activeDayIndex), { allowRefold: true });
  updateAfterReadBanner();
  window.scrollTo(0, 0);
});

let lastScrollY = 0;
window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY;
    if (document.body.classList.contains("reading")) {
      document.body.classList.toggle("tabs-away", y > lastScrollY && y > 80);
    }
    lastScrollY = y;
  },
  { passive: true }
);

const chipsContainer = document.getElementById("chips");
const moodCardContainer = document.getElementById("moodCard");
const moodNextBtn = document.getElementById("moodNext");
const finderContainer = document.getElementById("finder");
const finderRowContainer = document.getElementById("finderRow");

const FEELING_LIST = [];
EMOTION_GROUPS.forEach((group, groupIndex) => {
  group.words.forEach((word, wordIdx) => {
    const rotatedDays = group.w
      .slice(wordIdx % group.w.length)
      .concat(group.w.slice(0, wordIdx % group.w.length));
    FEELING_LIST.push({
      n: word,
      d: COIN_DEFINITIONS[word] || "",
      g: groupIndex,
      q1: group.q1,
      q2: group.q2,
      q3: group.q3,
      w: rotatedDays,
      coined: 0
    });
  });
});

const CRISIS_PATTERN = /(죽고\s*싶|죽을\s*것\s*같|죽어\s*버리|자살|자해|살기\s*싫|살고\s*싶지\s*않|사라지고\s*싶|없어지고\s*싶|끝내고\s*싶|뛰어내리|목숨)/;

let currentMoodSelection = null;
let moodNextState = null;
let questionAnswers = {};

function makeNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function makeActionBtn(label, className, handler) {
  const btn = makeNode("button", className, label);
  btn.type = "button";
  btn.addEventListener("click", handler);
  return btn;
}

const getMoodHeaderNodes = () => [
  chipsContainer,
  document.querySelector(".f-ask-small"),
  document.querySelector('section[data-view="mood"] > div:first-child')
];

function toggleMoodReadingMode(isReading) {
  getMoodHeaderNodes().forEach((el) => {
    if (el) el.hidden = isReading;
  });
  if (isReading) {
    finderContainer.hidden = true;
    finderRowContainer.hidden = true;
    questionChipBtn.setAttribute("aria-expanded", "false");
  }
}

function getPoolOfDaysForFeeling(feeling) {
  return feeling && Array.isArray(feeling.w) && feeling.w.length ? feeling.w.slice() : [1];
}

function showLetterForFeeling(feeling, positionIndex = 0) {
  const dayPool = getPoolOfDaysForFeeling(feeling);
  const idx = positionIndex % dayPool.length;
  const work = getPoemByDay(dayPool[idx]);

  moodCardContainer.innerHTML = "";
  toggleMoodReadingMode(true);

  const backRow = makeNode("div", "mood-back-row");
  backRow.append(makeActionBtn("← 다른 마음 고르기", "mood-back-btn", resetMoodSection));
  const chosenLabel = makeNode(
    "p",
    "f-chosen",
    feeling.lex ? `‘${feeling.n}’, 그 마음에게 보내는 편지예요.` : `‘${feeling.n}’에게 보내는 편지예요.`
  );
  backRow.append(chosenLabel);
  moodCardContainer.append(backRow);

  const holder = makeNode("div");
  moodCardContainer.append(holder);
  mountLetterCard(holder, work);

  const dayTag = holder.querySelector(".js-day");
  if (dayTag) dayTag.hidden = true;

  moodNextBtn.hidden = dayPool.length < 2;
  moodNextBtn.onclick = null;
  currentMoodSelection = null;
  moodNextState = { f: feeling, pos: idx + 1 };

  moodCardContainer.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start"
  });
}

TOP_MOODS.forEach((moodName) => {
  const chipBtn = document.createElement("button");
  chipBtn.type = "button";
  chipBtn.className = "chip";
  chipBtn.textContent = moodName;
  chipBtn.setAttribute("aria-pressed", "false");
  chipBtn.addEventListener("click", () => {
    [...chipsContainer.children].forEach((c) =>
      c.setAttribute("aria-pressed", c === chipBtn ? "true" : "false")
    );
    finderContainer.hidden = true;
    finderRowContainer.hidden = true;
    questionChipBtn.setAttribute("aria-expanded", "false");
    finderRowContainer.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    const targetFeeling = FEELING_LIST.find((f) => f.n === moodName);
    if (targetFeeling) showLetterForFeeling(targetFeeling);
  });
  chipsContainer.appendChild(chipBtn);
});

const questionChipBtn = document.createElement("button");
questionChipBtn.type = "button";
questionChipBtn.className = "chip chip-q";
questionChipBtn.textContent = "?";
questionChipBtn.setAttribute("aria-label", "원하는 감정이 없나요? 다른 방법으로 찾기");
questionChipBtn.setAttribute("aria-expanded", "false");

function closeFinderPanel() {
  finderContainer.hidden = true;
  finderRowContainer.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false"));
}

questionChipBtn.addEventListener("click", () => {
  const shouldOpen = finderRowContainer.hidden;
  finderRowContainer.hidden = !shouldOpen;
  questionChipBtn.setAttribute("aria-expanded", String(shouldOpen));
  if (!shouldOpen) closeFinderPanel();
});
chipsContainer.appendChild(questionChipBtn);

function launchFinderMode(renderFn) {
  [...chipsContainer.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
  moodCardContainer.innerHTML = "";
  moodNextBtn.hidden = true;
  currentMoodSelection = null;
  questionAnswers = {};
  finderContainer.hidden = false;
  finderContainer.innerHTML = "";
  renderFn();
  finderContainer.scrollIntoView({ block: "nearest" });
}

function renderQuestionStep(stepIdx) {
  const qItem = QUESTIONS[stepIdx];
  finderContainer.innerHTML = "";
  finderContainer.append(
    makeNode("div", "f-step", `${stepIdx + 1} / ${QUESTIONS.length}`),
    makeNode("p", "f-ask", qItem.ask)
  );
  const optRow = makeNode("div", "f-row");
  qItem.opts.forEach(([key, label]) => {
    optRow.append(
      makeActionBtn(label, "f-opt", () => {
        questionAnswers[qItem.key] = key;
        if (stepIdx < QUESTIONS.length - 1) renderQuestionStep(stepIdx + 1);
        else renderQuestionResults();
      })
    );
  });
  optRow.append(
    makeActionBtn("잘 모르겠어요", "f-opt quiet", () => {
      questionAnswers[qItem.key] = null;
      if (stepIdx < QUESTIONS.length - 1) renderQuestionStep(stepIdx + 1);
      else renderQuestionResults();
    })
  );
  finderContainer.append(optRow);
  if (stepIdx > 0) {
    finderContainer.append(
      makeActionBtn("← 이전 질문", "linkish f-back", () => renderQuestionStep(stepIdx - 1))
    );
  }
}

function computeFeelingScore(feeling) {
  let score = 0;
  if (questionAnswers.q1 && feeling.q1.includes(questionAnswers.q1)) score += 3;
  if (questionAnswers.q2 && feeling.q2.includes(questionAnswers.q2)) score += 2;
  if (questionAnswers.q3 && feeling.q3.includes(questionAnswers.q3)) score += 2;
  return score + (feeling.coined ? 0.3 : 0);
}

function createFeelingCard(feeling) {
  const card = makeNode("div", "f-card");
  const titleEl = makeNode("b", null, feeling.n);
  if (feeling.coined) {
    titleEl.append(makeNode("i", "f-badge", "시인이 지은 이름"));
  }
  card.append(titleEl, makeNode("span", null, feeling.d || EMOTION_GROUPS[feeling.g].label));
  if (feeling.sos) {
    card.append(makeActionBtn("숨 고르기 시작", "f-opt primary", () => breatheTriggerBtn.click()));
  } else {
    card.append(makeActionBtn("이 마음으로 편지 받기", "f-opt", () => showLetterForFeeling(feeling)));
  }
  return card;
}

function renderQuestionResults() {
  const ranked = FEELING_LIST.map((f) => ({ f, s: computeFeelingScore(f) }))
    .sort((a, b) => b.s - a.s)
    .filter((x) => !x.f.sos)
    .slice(0, 3)
    .map((x) => x.f);

  const needsBreathingFirst = questionAnswers.q1 === "burst" && questionAnswers.q2 === "shake";
  finderContainer.innerHTML = "";
  finderContainer.append(makeNode("p", "f-ask", "혹시 이런 이름에 가까운가요?"));

  if (needsBreathingFirst) {
    const sosCard = makeNode("div", "f-card f-sos");
    sosCard.append(
      makeNode("b", null, "지금 숨이 가쁘다면, 먼저 숨부터 골라요"),
      makeNode("span", null, "가슴이 조이고 떨리는 순간에는 이름보다 숨이 먼저예요."),
      makeActionBtn("숨 고르기 시작", "f-opt primary", () => breatheTriggerBtn.click())
    );
    finderContainer.append(sosCard);
  }

  ranked.forEach((f) => finderContainer.append(createFeelingCard(f)));

  const bottomRow = makeNode("div", "f-row");
  bottomRow.append(
    makeActionBtn("다른 이름이 더 맞아요 · 내 말로 적기", "f-opt", () => renderCustomWrite(ranked[0])),
    makeActionBtn("처음부터 다시", "f-opt quiet", () => renderQuestionStep(0))
  );
  finderContainer.append(bottomRow);
}

function buildAccordion(items) {
  const openPanels = [];
  items.forEach(({ title, fill }) => {
    const headerBtn = makeActionBtn("", "f-acc", () => toggleAccordion());
    headerBtn.append(makeNode("span", null, title.main), makeNode("small", "f-acc-sub", title.sub));
    headerBtn.setAttribute("aria-expanded", "false");

    const bodyEl = makeNode("div", "f-acc-body");
    bodyEl.hidden = true;
    fill(bodyEl);

    function toggleAccordion() {
      const willOpen = bodyEl.hidden;
      if (willOpen) {
        if (openPanels.length >= 2) {
          const oldest = openPanels.shift();
          oldest.bodyEl.hidden = true;
          oldest.headerBtn.setAttribute("aria-expanded", "false");
        }
        openPanels.push({ bodyEl, headerBtn });
      } else {
        const idx = openPanels.findIndex((o) => o.bodyEl === bodyEl);
        if (idx >= 0) openPanels.splice(idx, 1);
      }
      bodyEl.hidden = !willOpen;
      headerBtn.setAttribute("aria-expanded", String(willOpen));
    }

    finderContainer.append(headerBtn, bodyEl);
  });
}

function renderAllEmotionCards() {
  finderContainer.innerHTML = "";
  finderContainer.append(makeNode("p", "f-lead", "지금 마음과 가까운 문장을 눌러 보세요."));
  buildAccordion(
    EMOTION_GROUPS.map((group, groupIdx) => ({
      title: { main: group.label, sub: group.name },
      fill: (bodyEl) => {
        const chipRow = makeNode("div", "chips");
        FEELING_LIST.filter((f) => f.g === groupIdx).forEach((feeling) => {
          chipRow.append(
            makeActionBtn(feeling.n, "chip", () => {
              finderContainer.querySelectorAll(".f-card").forEach((n) => n.remove());
              bodyEl.append(createFeelingCard(feeling));
            })
          );
        });
        bodyEl.append(chipRow);
      }
    }))
  );
  finderContainer.append(makeActionBtn("감정 사전 둘러보기 · 434개", "f-opt f-more", renderEmotionLexicon));
}

function renderEmotionLexicon() {
  finderContainer.innerHTML = "";
  finderContainer.append(
    makeNode("p", "f-ask", "우울해, 힘들어, 화나."),
    makeNode(
      "p",
      "f-lead f-lex-lead",
      "이 말 말고도 마음에는 다양한 친구들이 있답니다. 이름을 불러 주는 것만으로도 조금 가벼워질 수 있어요."
    ),
    makeNode("p", "f-privacy", "단어를 누르면 뜻을 보고, 그 마음으로 편지를 받을 수 있어요.")
  );

  buildAccordion(
    EMOTION_GROUPS.map((group, groupIdx) => {
      const words = LEXICON_WORDS[group.name].split(" ");
      return {
        title: { main: group.label, sub: `${group.name} · ${words.length}` },
        fill: (bodyEl) => {
          const wordList = makeNode("div", "f-lex");
          words.forEach((word, wordIdx) => {
            wordList.append(
              makeActionBtn(word, "f-word", () => {
                finderContainer.querySelectorAll(".f-card").forEach((n) => n.remove());
                const rotatedDays = group.w
                  .slice(wordIdx % group.w.length)
                  .concat(group.w.slice(0, wordIdx % group.w.length));
                const feelingObj = { n: word, lex: 1, g: groupIdx, w: rotatedDays };
                const card = makeNode("div", "f-card");
                const dictDef = DICTIONARY_ENTRIES[word];
                card.append(makeNode("b", null, word));
                if (dictDef && dictDef[0]) card.append(makeNode("span", null, dictDef[0]));
                if (dictDef && dictDef[1]) card.append(makeNode("span", "f-ex", dictDef[1]));
                card.append(
                  makeActionBtn("이 마음으로 편지 받기", "f-opt", () => showLetterForFeeling(feelingObj))
                );
                bodyEl.append(card);
                card.scrollIntoView({ block: "nearest" });
              })
            );
          });
          bodyEl.append(wordList);
        }
      };
    })
  );

  finderContainer.append(
    makeNode(
      "p",
      "f-privacy",
      "감정 단어: 박인조·민경환(2005), 「한국어 감정단어의 목록 작성과 차원 탐색」. 뜻풀이와 예문: 국립국어원 표준국어대사전(CC BY-SA 2.0 KR), 일부 줄임. 여덟 묶음은 시인의 우체통이 나눴어요."
    ),
    makeActionBtn("← 감정 카드로", "linkish f-back", renderAllEmotionCards)
  );
  finderContainer.scrollIntoView({ block: "nearest" });
}

function renderCrisisSupportLetter() {
  finderContainer.hidden = true;
  moodCardContainer.innerHTML = "";
  toggleMoodReadingMode(true);
  window.scrollTo(0, 0);

  moodCardContainer.append(
    makeNode("p", "f-chosen", "지금 많이 무거운 마음에게 보내는 편지예요. 그런 마음이 들 수 있어요.")
  );
  const holder = makeNode("div");
  moodCardContainer.append(holder);
  mountLetterCard(holder, getPoemByDay(14));

  const supportCard = makeNode("div", "f-card f-soft");
  supportCard.append(
    makeNode("b", null, "누군가와 이야기하고 싶다면"),
    makeNode(
      "span",
      null,
      "마음이 불편하거나 혼자 견디기 버거울 때, 지금 바로 들어줄 사람이 있어요. 24시간, 이름을 말하지 않아도 돼요."
    )
  );
  [
    ["109", "자살예방 상담전화"],
    ["1577-0199", "정신건강 위기상담"]
  ].forEach(([num, label]) => {
    const link = makeNode("a", "f-call", `${num} · ${label}`);
    link.href = "tel:" + num.replace(/-/g, "");
    supportCard.append(link);
  });
  supportCard.append(makeActionBtn("숨 고르기", "f-opt", () => breatheTriggerBtn.click()));
  moodCardContainer.append(supportCard);
  moodNextBtn.hidden = true;
  moodCardContainer.scrollIntoView({ block: "start" });
}

function renderCustomWrite(fallbackFeeling) {
  finderContainer.innerHTML = "";
  finderContainer.append(
    makeNode("p", "f-ask", "지금 마음을 내 말로 적어 볼까요?"),
    makeNode("p", "f-lead", "단어가 아니어도 괜찮아요. ‘잠수 타고 싶다’처럼 떠오르는 대로요.")
  );
  const textarea = document.createElement("textarea");
  textarea.className = "f-text";
  textarea.rows = 3;
  textarea.maxLength = 200;
  textarea.setAttribute("aria-label", "내 마음 적기");
  finderContainer.append(textarea);

  const outputBox = makeNode("div");
  const submitBtn = makeActionBtn("이 마음으로 편지 받기", "f-opt primary", () => {
    const text = textarea.value.trim();
    outputBox.innerHTML = "";
    if (!text) {
      textarea.focus();
      return;
    }
    if (CRISIS_PATTERN.test(text)) {
      renderCrisisSupportLetter();
      return;
    }
    const matched =
      FEELING_LIST.find(
        (f) =>
          !f.sos &&
          (text.includes(f.n) || f.n.split(" ").some((w) => w.length > 1 && text.includes(w)))
      ) ||
      fallbackFeeling ||
      FEELING_LIST.find((f) => f.n === "애잔함");

    outputBox.append(
      makeNode("p", "f-chosen", `적어 주신 마음과 가까운 이름: ‘${matched.n}’ — ${matched.d}`),
      makeNode(
        "p",
        "f-privacy",
        IS_BETA_MODE
          ? "적어 주신 말은 이 화면에서만 보이고 어디에도 저장되지 않아요."
          : "시연판이라 저장되지 않아요. 실제 서비스에서는 동의한 분의 말만 익명으로 모아 '이달의 감정'으로 돌려드려요."
      ),
      makeActionBtn("이 마음으로 편지 받기", "f-opt", () => showLetterForFeeling(matched))
    );
  });

  const actionRow = makeNode("div", "f-row");
  actionRow.append(submitBtn, makeActionBtn("← 처음으로", "f-opt quiet", closeFinderPanel));
  finderContainer.append(actionRow, outputBox);
  textarea.focus();
}

[
  ["질문으로 찾아보기", () => launchFinderMode(() => renderQuestionStep(0))],
  ["감정 카드 고르기", () => launchFinderMode(renderAllEmotionCards)],
  ["내 말로 적어 보기", () => launchFinderMode(() => renderCustomWrite(null))]
].forEach(([label, handler]) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip chip-sub";
  btn.textContent = label;
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => {
    finderRowContainer
      .querySelectorAll("button")
      .forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
    handler();
  });
  finderRowContainer.appendChild(btn);
});

function resetMoodSection() {
  exitZenMode();
  moodCardContainer.innerHTML = "";
  moodNextBtn.hidden = true;
  moodNextState = null;
  currentMoodSelection = null;
  finderContainer.hidden = true;
  finderRowContainer.hidden = true;
  questionChipBtn.setAttribute("aria-expanded", "false");
  [...chipsContainer.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
  toggleMoodReadingMode(false);
  window.scrollTo(0, 0);
}

document.addEventListener("click", (e) => {
  const moodLink = e.target.closest('a[href="#mood"]');
  if (moodLink && location.hash === "#mood") {
    e.preventDefault();
    resetMoodSection();
  }
});

moodNextBtn.addEventListener("click", () => {
  if (!currentMoodSelection && moodNextState) {
    showLetterForFeeling(moodNextState.f, moodNextState.pos);
  }
});

const savedBoxListEl = document.getElementById("boxList");
const boxCardContainer = document.getElementById("boxCard");
const pastLettersListEl = document.getElementById("pastList");

function createArchiveListItem(work, badgeText) {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";

  const titleEl = makeNode("span", "t", work.title);
  const dateEl = makeNode("span", "d", badgeText);
  const authorEl = makeNode("span", "a", work.mine ? "이시우" : work.author);
  btn.append(titleEl, dateEl, authorEl);

  const firstLine = Array.isArray(work.lines)
    ? work.lines.find((line) => line && line.trim().length > 0)
    : "";
  if (firstLine) {
    btn.append(makeNode("span", "list-preview", firstLine));
  }

  const underlinedLine = getFirstUnderlinedLine(work);
  const moods = Array.isArray(work.moods) ? work.moods.slice(0, 2) : [];
  if (moods.length || underlinedLine) {
    const metaRow = makeNode("span", "list-meta-row");
    moods.forEach((m) => metaRow.append(makeNode("span", "mood-pill", m)));
    if (underlinedLine) {
      metaRow.append(makeNode("span", "saved-underline", `밑줄 · 「${underlinedLine}」`));
    }
    btn.append(metaRow);
  }

  btn.addEventListener("click", () => {
    mountLetterCard(boxCardContainer, work);
    boxCardContainer.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  });

  li.appendChild(btn);
  return li;
}

function renderSavedArchive(clearCard) {
  savedBoxListEl.innerHTML = "";
  if (clearCard) boxCardContainer.innerHTML = "";
  const validSaved = savedItems
    .map((s) => ({ s, w: WORKS.find((w) => w.id === s.id) }))
    .filter((entry) => entry.w);

  if (!validSaved.length) {
    savedBoxListEl.innerHTML = `<li class="empty">아직 보관한 편지가 없어요.<br>마음에 남는 편지가 오면 '보관하기'를 눌러 두세요. 여기에서 언제든 다시 읽을 수 있어요.</li>`;
    return;
  }

  validSaved.forEach(({ s, w }) => {
    const savedDate = new Date(s.at);
    savedBoxListEl.appendChild(createArchiveListItem(w, formatKoreanDate(savedDate)));
  });
}

function renderPastLettersList() {
  pastLettersListEl.innerHTML = "";
  const maxDay = IS_BETA_MODE ? unlockedDayIndex : activeDayIndex;
  for (let d = maxDay; d >= 1; d--) {
    const work = getPoemByDay(d);
    pastLettersListEl.appendChild(createArchiveListItem(work, `${d}일째`));
  }
}

function selectDayToView(dayNumber) {
  activeDayIndex = Math.min(WORKS.length, Math.max(1, dayNumber));
  dayLabelEl.textContent = `${activeDayIndex}일째 · ${formatKoreanDate(getDateForDay(activeDayIndex))}`;
  document.getElementById("dayPrev").disabled = activeDayIndex <= 1;
  document.getElementById("dayNext").disabled = activeDayIndex >= WORKS.length;
  if (mailWrapper.classList.contains("open")) {
    mountLetterCard(document.getElementById("todayCard"), getPoemByDay(activeDayIndex), { allowRefold: true });
  }
  refreshArrivalStatus();
  renderPastLettersList();
}

document.getElementById("dayPrev").addEventListener("click", () => selectDayToView(activeDayIndex - 1));
document.getElementById("dayNext").addEventListener("click", () => selectDayToView(activeDayIndex + 1));

renderSavedArchive(true);
selectDayToView(activeDayIndex);

const joinFormEl = document.getElementById("joinForm");
const contactInputEl = document.getElementById("contact");
const contactLabelEl = document.getElementById("contactLabel");

joinFormEl.addEventListener("change", (e) => {
  if (e.target.name !== "channel") return;
  const isEmail = e.target.value === "email";
  contactInputEl.type = isEmail ? "email" : "tel";
  contactInputEl.inputMode = isEmail ? "email" : "tel";
  contactInputEl.placeholder = isEmail ? "name@example.com" : "010-0000-0000";
  contactLabelEl.textContent = isEmail ? "이메일 주소" : "휴대폰 번호";
});

joinFormEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const errEl = document.getElementById("joinErr");
  const val = contactInputEl.value.trim();
  const channel = joinFormEl.channel.value;
  const isValid =
    channel === "email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      : /^01[0-9]-?\d{3,4}-?\d{4}$/.test(val);

  if (!isValid) {
    errEl.textContent =
      channel === "email"
        ? "이메일 주소를 다시 확인해 주세요."
        : "휴대폰 번호를 010-0000-0000 형식으로 적어 주세요.";
    contactInputEl.focus();
    return;
  }
  if (!document.getElementById("adult").checked) {
    errEl.textContent = "지금은 만 19세 이상만 신청할 수 있어요.";
    return;
  }
  if (!document.getElementById("agree").checked) {
    errEl.textContent = "편지를 보내려면 연락처 이용 동의가 필요해요.";
    return;
  }

  errEl.textContent = "";
  const nick = document.getElementById("nick").value.trim();
  const timeText = { "08:00": "아침 8시", "12:00": "낮 12시", "15:00": "오후 3시" }[
    joinFormEl.time.value
  ];
  const channelText = { kakao: "카카오톡", sms: "문자", email: "이메일" }[channel];
  const doneBox = document.getElementById("joinDone");
  doneBox.innerHTML = "";
  const p = document.createElement("p");
  p.style.margin = "0";
  p.textContent = `${nick ? nick + "님, " : ""}내일 ${timeText}부터 ${channelText}로 첫 편지를 보내 드릴게요.`;
  const sm = document.createElement("small");
  sm.textContent =
    "시연판이라 실제로 신청되지는 않았고, 입력한 내용은 어디에도 저장되지 않았어요. 베타가 열리면 이 화면에서 실제 신청을 받습니다.";
  doneBox.append(p, sm);
  doneBox.hidden = false;
  joinFormEl.hidden = true;
});

const sosDialog = document.getElementById("sos");
const sosBodyEl = document.getElementById("sosBody");
const sosStepEl = document.getElementById("sosStep");
const breatheTriggerBtn = document.getElementById("breatheBtn");
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeTimers = [];
let stillHardCount = 0;
let sosLineCursor = 0;

function clearAllSosTimers() {
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
}

function scheduleSosTimer(fn, delayMs) {
  activeTimers.push(setTimeout(fn, delayMs));
}

function createSosActions(actionList) {
  const container = makeNode("div", "sos-actions");
  actionList.forEach(([label, cls, fn]) => {
    const btn = makeNode("button", cls, label);
    btn.type = "button";
    btn.addEventListener("click", fn);
    container.appendChild(btn);
  });
  return container;
}

function createSosParagraphs(lines, extraClass) {
  const wrap = makeNode("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "6px";
  lines.forEach((text, idx) => {
    const p = makeNode("p", "sos-say" + (extraClass ? " " + extraClass : ""), text);
    if (idx === 0) p.id = "sosSay";
    wrap.appendChild(p);
  });
  return wrap;
}

function showSosScreen(stepTitle, childNodes) {
  clearAllSosTimers();
  sosStepEl.textContent = stepTitle;
  sosBodyEl.innerHTML = "";
  childNodes.forEach((n) => sosBodyEl.appendChild(n));
  const firstButton = sosBodyEl.querySelector("button");
  if (firstButton) firstButton.focus({ preventScroll: true });
}

const getHelpActionTuple = () => ["도움이 필요해요", "help", renderSosHelpScreen];

function renderSosCalmScreen() {
  showSosScreen("1 / 4 · 곁에 있어요", [
    createSosParagraphs([
      "여기 있어요. 지금 많이 힘들죠.",
      "이 느낌은 무섭지만, 보통 몇 분 안에 가장 높아졌다가 천천히 내려가요.",
      "아무것도 잘하지 않아도 돼요. 화면만 따라와 주세요."
    ]),
    createSosActions([["함께 숨쉬기", "primary", renderSosBreatheScreen], getHelpActionTuple()])
  ]);
}

function renderSosBreatheScreen() {
  const circle = makeNode("div", "circle");
  const wordSpan = makeNode("span", null, "준비");
  const countSmall = makeNode("small", null, "");
  const inner = makeNode("div");
  inner.append(wordSpan, countSmall);
  circle.appendChild(inner);

  const circleWrap = makeNode("div", "circle-wrap");
  circleWrap.appendChild(circle);

  const hint = createSosParagraphs(
    ["숨이 잘 안 쉬어져도 괜찮아요. 내쉬는 숨만 길게 해 봐요."],
    "small"
  );
  const nextActions = createSosActions([["다음으로", "", renderSosGroundScreen], getHelpActionTuple()]);
  showSosScreen("2 / 4 · 함께 숨쉬기", [circleWrap, hint, nextActions]);

  let currentRound = 0;
  const TOTAL_ROUNDS = 6;

  function runPhaseCountdown(label, totalSeconds, onComplete) {
    let sec = 1;
    wordSpan.textContent = label;
    countSmall.textContent = `${sec} · ${currentRound + 1}/${TOTAL_ROUNDS}`;
    const tick = () => {
      sec++;
      if (sec <= totalSeconds) {
        countSmall.textContent = `${sec} · ${currentRound + 1}/${TOTAL_ROUNDS}`;
        scheduleSosTimer(tick, 1000);
      } else {
        onComplete();
      }
    };
    scheduleSosTimer(tick, 1000);
  }

  function runBreathingCycle() {
    if (currentRound >= TOTAL_ROUNDS) {
      wordSpan.textContent = "잘했어요";
      countSmall.textContent = "";
      return;
    }
    circle.classList.remove("out");
    if (!prefersReducedMotion) circle.classList.add("in");
    runPhaseCountdown("들이쉬어요", 4, () => {
      circle.classList.remove("in");
      if (!prefersReducedMotion) circle.classList.add("out");
      runPhaseCountdown("내쉬어요", 6, () => {
        currentRound++;
        runBreathingCycle();
      });
    });
  }

  scheduleSosTimer(runBreathingCycle, 600);
}

function renderSosGroundScreen() {
  showSosScreen("3 / 4 · 지금 여기로", [
    createSosParagraphs([
      "주변에서 보이는 것 다섯 가지를 천천히 세어 봐요.",
      "손에 닿는 것 네 가지, 들리는 소리 세 가지.",
      "발바닥이 바닥에 닿아 있는 느낌도요."
    ]),
    createSosActions([["다음으로", "primary", renderSosPoemScreen], getHelpActionTuple()])
  ]);
}

function renderSosPoemScreen() {
  const chosenLine = SOS_LINES[sosLineCursor++ % SOS_LINES.length];
  const poemNode = makeNode("p", "sos-poem", chosenLine.line);
  poemNode.appendChild(makeNode("small", null, chosenLine.source));

  showSosScreen("4 / 4 · 시 한 줄", [
    poemNode,
    createSosParagraphs(["지금은 어떤가요?"], "small"),
    createSosActions([
      ["조금 나아졌어요", "primary", renderSosDoneScreen],
      [
        "아직 힘들어요",
        "",
        () => {
          stillHardCount++;
          if (stillHardCount >= 2) renderSosHelpScreen();
          else renderSosBreatheScreen();
        }
      ],
      getHelpActionTuple()
    ])
  ]);
}

function renderSosDoneScreen() {
  showSosScreen("끝", [
    createSosParagraphs(["잘 지나왔어요.", "이 버튼은 언제나 같은 자리에 있어요."]),
    createSosActions([["오늘의 편지로 돌아가기", "primary", closeSosDialog]])
  ]);
}

function renderSosHelpScreen() {
  const linesContainer = makeNode("div", "lines");
  [
    ["109", "자살예방 상담전화 · 24시간"],
    ["1577-0199", "정신건강 위기상담 · 24시간"],
    ["119", "숨이 계속 가쁘거나 가슴이 아플 때, 처음 겪는 증상일 때"]
  ].forEach(([number, desc]) => {
    const card = makeNode("div", "line-card");
    card.append(makeNode("b", null, number), makeNode("span", null, desc));
    linesContainer.appendChild(card);
  });

  showSosScreen("도움 연결", [
    createSosParagraphs(["혼자 견디지 않아도 돼요.", "지금 바로 이야기할 수 있는 곳이에요."]),
    linesContainer,
    createSosActions([
      ["숨쉬기로 돌아가기", "", renderSosBreatheScreen],
      ["닫기", "", closeSosDialog]
    ])
  ]);
}

function openSosDialog() {
  stillHardCount = 0;
  sosDialog.hidden = false;
  document.body.style.overflow = "hidden";
  renderSosCalmScreen();
}

function closeSosDialog() {
  clearAllSosTimers();
  sosDialog.hidden = true;
  document.body.style.overflow = "";
  breatheTriggerBtn.focus();
}

breatheTriggerBtn.addEventListener("click", openSosDialog);
document.getElementById("sosClose").addEventListener("click", closeSosDialog);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!sosDialog.hidden) {
      closeSosDialog();
    } else if (document.body.classList.contains("zen-mode")) {
      exitZenMode();
    }
  }
});

const INTRO_SLIDES = [
  ["시 한 번에 호흡 한 번", "매일 오후 3시, 시와 그림이 담긴 편지가 도착해요."],
  ["오늘 마음은 어때요?", "오늘 마음을 고르면, 꼭 맞는 시가 와요."],
  [
    "언제든 곁에 있을게요",
    "오른쪽 아래 '숨 고르기'를 누르면 함께 천천히 숨을 쉬어요. 혼자 견디기 어려울 땐 도움받을 곳도 알려 드릴게요."
  ]
];

const introDialog = document.getElementById("intro");
let introSlideIdx = 0;

function renderIntroSlide() {
  document.getElementById("introTitle").textContent = INTRO_SLIDES[introSlideIdx][0];
  document.getElementById("introText").textContent = INTRO_SLIDES[introSlideIdx][1];
  document.getElementById("introNext").textContent =
    introSlideIdx === INTRO_SLIDES.length - 1 ? "첫 편지 열기" : "다음";
  document.getElementById("introBeta").hidden = introSlideIdx !== 0;
  introDialog.querySelectorAll(".intro-dots i").forEach((dot, idx) => {
    dot.classList.toggle("on", idx === introSlideIdx);
  });
}

function openIntroDialog() {
  introSlideIdx = 0;
  renderIntroSlide();
  introDialog.hidden = false;
  document.getElementById("introNext").focus({ preventScroll: true });
}

function closeIntroDialog() {
  introDialog.hidden = true;
  try {
    localStorage.setItem(STORAGE_INTRO_KEY, "1");
  } catch {
    // Ignore storage errors
  }
}

document.getElementById("introNext").addEventListener("click", () => {
  if (introSlideIdx < INTRO_SLIDES.length - 1) {
    introSlideIdx++;
    renderIntroSlide();
  } else {
    closeIntroDialog();
    const envBtn = document.getElementById("envelope");
    if (envBtn && !envBtn.disabled && !mailWrapper.classList.contains("open")) {
      envBtn.click();
    }
  }
});

document.getElementById("introSkip").addEventListener("click", closeIntroDialog);
document.getElementById("introAgain").addEventListener("click", openIntroDialog);

let hasSeenIntro = false;
try {
  hasSeenIntro = localStorage.getItem(STORAGE_INTRO_KEY) === "1";
} catch {
  // Ignore
}
if (!hasSeenIntro) {
  openIntroDialog();
}

const sizeToggleBtn = document.getElementById("sizeBtn");

function applyLargeTextSetting(isLarge) {
  document.documentElement.classList.toggle("big", isLarge);
  sizeToggleBtn.setAttribute("aria-pressed", isLarge ? "true" : "false");
}

let isLargeText = false;
try {
  isLargeText = localStorage.getItem(STORAGE_SIZE_KEY) === "1";
} catch {
  // Ignore
}
applyLargeTextSetting(isLargeText);

sizeToggleBtn.addEventListener("click", () => {
  isLargeText = !isLargeText;
  applyLargeTextSetting(isLargeText);
  try {
    localStorage.setItem(STORAGE_SIZE_KEY, isLargeText ? "1" : "0");
  } catch {
    // Ignore
  }
});

const THEMES = [
  {
    key: "night",
    short: "밤",
    label: "밤의 고요",
    metaColor: "#0c1424",
    iconPath: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>'
  },
  {
    key: "dawn",
    short: "새벽",
    label: "새벽 안개",
    metaColor: "#121d2b",
    iconPath: '<path d="M17 18a5 5 0 0 0-10 0"></path><line x1="12" y1="9" x2="12" y2="2"></line><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line><line x1="1" y1="18" x2="3" y2="18"></line><line x1="21" y1="18" x2="23" y2="18"></line><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line><line x1="23" y1="22" x2="1" y2="22"></line>'
  },
  {
    key: "afternoon",
    short: "오후",
    label: "오후 세 시",
    metaColor: "#1f1b24",
    iconPath: '<circle cx="12" cy="12" r="4.5"></circle><line x1="12" y1="2" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.05" y2="7.05"></line><line x1="16.95" y1="16.95" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.05" y2="16.95"></line><line x1="16.95" y1="7.05" x2="19.07" y2="4.93"></line>'
  }
];

const themeBtn = document.getElementById("themeBtn");
let currentThemeIdx = 0;

function applyThemeSetting(idx) {
  const theme = THEMES[idx] || THEMES[0];
  if (theme.key === "night") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = theme.key;
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", theme.metaColor);
  if (themeBtn) {
    const labelSpan = themeBtn.querySelector(".ctrl-label");
    if (labelSpan) labelSpan.textContent = theme.short;
    const svg = themeBtn.querySelector("svg");
    if (svg) svg.innerHTML = theme.iconPath;
    themeBtn.setAttribute("aria-label", `배경 분위기 바꾸기: ${theme.label}`);
  }
}

try {
  const storedTheme = localStorage.getItem(STORAGE_THEME_KEY);
  const foundIdx = THEMES.findIndex((t) => t.key === storedTheme);
  if (foundIdx >= 0) currentThemeIdx = foundIdx;
} catch {
  // Ignore
}
applyThemeSetting(currentThemeIdx);

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
    applyThemeSetting(currentThemeIdx);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, THEMES[currentThemeIdx].key);
    } catch {
      // Ignore
    }
  });
}

const soundBtn = document.getElementById("soundBtn");
let ambientAudio = null;
let isSoundPlaying = false;

function initAmbientAudioGraph() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  const bufferSize = ctx.sampleRate * 3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);

  // Generate warm pink/brownish noise for calm rain & night breeze texture
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 520;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 1200;
  bandpass.Q.value = 0.7;

  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.0001;

  // Slow breathing modulation for gentle breeze swells
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 140;
  lfo.connect(lfoGain);
  lfoGain.connect(lowpass.frequency);

  noiseSource.connect(lowpass);
  lowpass.connect(masterGain);
  noiseSource.connect(bandpass);
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.12;
  bandpass.connect(shimmerGain);
  shimmerGain.connect(masterGain);

  masterGain.connect(ctx.destination);
  noiseSource.start();
  lfo.start();

  return { ctx, masterGain };
}

function updateSoundButtonUI() {
  if (!soundBtn) return;
  soundBtn.setAttribute("aria-pressed", isSoundPlaying ? "true" : "false");
  soundBtn.setAttribute("aria-label", isSoundPlaying ? "잔잔한 자연 소리 끄기" : "잔잔한 자연 소리 켜기");
  const labelSpan = soundBtn.querySelector(".ctrl-label");
  if (labelSpan) labelSpan.textContent = isSoundPlaying ? "켜짐" : "소리";
}

if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    try {
      if (!ambientAudio) {
        ambientAudio = initAmbientAudioGraph();
      }
      if (!ambientAudio) {
        isSoundPlaying = false;
        updateSoundButtonUI();
        return;
      }
      const { ctx, masterGain } = ambientAudio;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), now);
      if (!isSoundPlaying) {
        masterGain.gain.exponentialRampToValueAtTime(0.28, now + 0.85);
        isSoundPlaying = true;
      } else {
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        isSoundPlaying = false;
      }
    } catch {
      isSoundPlaying = false;
    }
    updateSoundButtonUI();
  });
}

if (IS_BETA_MODE) {
  document.querySelector(".daynav").hidden = true;
  document.querySelectorAll(".proto").forEach((el) => {
    el.hidden = true;
  });
  const sosNote = document.querySelector(".sos-note");
  if (sosNote) {
    sosNote.textContent = "시인의 우체통은 의료기기가 아니며 진단·치료를 대신하지 않습니다.";
  }
  if (isPreviewWait) {
    document.getElementById("envelope").disabled = true;
    document.querySelector(".env-to").textContent = `${formatKoreanDate(BETA_START_DATE)} 오후 3시에 열려요`;
  }
  const joinSection = document.querySelector('section[data-view="join"]');
  joinFormEl.hidden = true;
  const existingBetaDone = joinSection.querySelector(".js-beta-done");
  if (!existingBetaDone) {
    const betaNoticeBox = document.createElement("div");
    betaNoticeBox.className = "done js-beta-done";
    const p1 = document.createElement("p");
    p1.style.margin = "0";
    p1.textContent = "신청하면 매일 오후 3시에 편지 링크를 보내 드려요.";
    betaNoticeBox.append(p1);
    if (EXTERNAL_FORM_URL) {
      const link = document.createElement("a");
      link.className = "submit";
      link.href = EXTERNAL_FORM_URL;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "편지 받기 신청";
      link.style.cssText = "display:inline-block;margin-top:14px;text-decoration:none";
      betaNoticeBox.append(link);
    } else {
      const sm = document.createElement("small");
      sm.textContent = "신청 링크를 준비하고 있어요.";
      betaNoticeBox.append(sm);
    }
    joinSection.append(betaNoticeBox);
  }
}

const why3Box = document.getElementById("why3");
const why3Envelope = document.getElementById("why3Env");
if (why3Box && why3Envelope) {
  document.getElementById("why3Fold").addEventListener("click", () => {
    why3Box.hidden = true;
    why3Envelope.hidden = false;
    why3Envelope.classList.remove("why3-in");
    void why3Envelope.offsetWidth;
    why3Envelope.classList.add("why3-in");
    why3Envelope.focus();
  });
  why3Envelope.addEventListener("click", () => {
    why3Envelope.hidden = true;
    why3Box.hidden = false;
    why3Box.classList.remove("why3-in");
    void why3Box.offsetWidth;
    why3Box.classList.add("why3-in");
  });
}

const VALID_VIEWS = ["today", "mood", "box", "join"];

function handleRouteChange() {
  exitZenMode();
  const hashView = location.hash.slice(1);
  const currentView = VALID_VIEWS.includes(hashView) ? hashView : "today";
  document.querySelectorAll("section[data-view]").forEach((sec) => {
    sec.hidden = sec.dataset.view !== currentView;
  });
  document.querySelectorAll("nav.tabs a").forEach((tabLink) => {
    if (tabLink.dataset.tab === currentView) {
      tabLink.setAttribute("aria-current", "page");
    } else {
      tabLink.removeAttribute("aria-current");
    }
  });
  if (currentView === "box") {
    renderSavedArchive(false);
    renderPastLettersList();
  }
  if (currentView === "mood") resetMoodSection();
  document.body.classList.toggle(
    "reading",
    currentView === "today" && mailWrapper.classList.contains("open")
  );
  document.body.classList.remove("tabs-away");
  document.querySelectorAll("section[data-view]:not([hidden]) canvas.art").forEach((canvas) => {
    const cardId = canvas.closest(".card")?.dataset.id;
    const work = WORKS.find((x) => x.id === cardId);
    if (work) renderArtworkCanvas(canvas, work);
  });
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", handleRouteChange);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    document.querySelectorAll("section[data-view]:not([hidden]) canvas.art").forEach((canvas) => {
      const cardId = canvas.closest(".card")?.dataset.id;
      const work = WORKS.find((x) => x.id === cardId);
      if (work) renderArtworkCanvas(canvas, work);
    });
  }, 150);
});

handleRouteChange();
