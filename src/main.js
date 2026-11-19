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
import {
  renderArtworkCanvas,
  renderPostcardCanvas,
  renderPostcardBackCanvas,
  getArtworkUrl,
  getArtworkCaption,
  loadArtworkImage
} from "./components/canvasArt.js";

const STORAGE_SAVED_KEY = "siu-postbox-saved";
const STORAGE_INTRO_KEY = "siu-postbox-intro-seen";
const STORAGE_SIZE_KEY = "siu-postbox-big";
const STORAGE_UNDERLINES_KEY = "siu-postbox-underlines";
const STORAGE_REFLECTIONS_KEY = "siu-postbox-reflections";
const STORAGE_ALIGN_KEY = "siu-postbox-align";
const STORAGE_THEME_KEY = "siu-postbox-theme-v2";

const WORKS = DAILY_POEMS.map((item, idx) => ({
  ...item,
  day: item.day || idx + 1,
  status: item.status || "ready",
  note: item.note || ""
}));

function loadJsonObject(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveJsonObject(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

let underlinedMap = loadJsonObject(STORAGE_UNDERLINES_KEY);
let reflectionMap = loadJsonObject(STORAGE_REFLECTIONS_KEY);
let alignPrefMap = loadJsonObject(STORAGE_ALIGN_KEY);

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
  saveJsonObject(STORAGE_UNDERLINES_KEY, underlinedMap);
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

function getReflection(workId) {
  return typeof reflectionMap[workId] === "string" ? reflectionMap[workId] : "";
}

function setReflection(workId, text) {
  const cleaned = text.trim();
  if (!cleaned) {
    delete reflectionMap[workId];
  } else {
    reflectionMap[workId] = text;
  }
  saveJsonObject(STORAGE_REFLECTIONS_KEY, reflectionMap);
}

function isPoemCentered(work) {
  if (alignPrefMap[work.id] === "center") return true;
  if (alignPrefMap[work.id] === "left") return false;
  const nonEmptyCount = Array.isArray(work.lines)
    ? work.lines.filter((l) => l && l.trim().length > 0).length
    : 0;
  return nonEmptyCount > 0 && nonEmptyCount <= 6;
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
const IS_BETA_MODE = false;
const EXTERNAL_FORM_URL = "";

const unlockedDayIndex = WORKS.length;
const isPreviewWait = false;

let activeDayIndex = 1;
const hashDayMatch = location.hash.match(/^#d(\d{1,2})$/);
if (hashDayMatch && Number(hashDayMatch[1]) >= 1 && Number(hashDayMatch[1]) <= WORKS.length) {
  activeDayIndex = Number(hashDayMatch[1]);
}

const getPoemByDay = (dayNumber) => WORKS[dayNumber - 1] || WORKS[0];
const getDateForDay = (dayNumber) => new Date(BETA_START_DATE.getTime() + (dayNumber - 1) * 86400000);

document.getElementById("todayDate").textContent = formatKoreanDate(currentMoment);

function refreshArrivalStatus() {
  const now = new Date();
  const todayThreePm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0);
  const hasArrivedToday = now >= todayThreePm;

  document.getElementById("arrival").textContent =
    activeDayIndex === 1
      ? `${formatKoreanDate(getDateForDay(1))}, 첫 편지`
      : `${formatKoreanDate(getDateForDay(activeDayIndex))} · ${activeDayIndex}일째 편지`;

  const nextThreePm = hasArrivedToday ? new Date(todayThreePm.getTime() + 86400000) : todayThreePm;
  const remainingMinutes = Math.max(0, Math.round((nextThreePm - now) / 60000));
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;

  document.getElementById("countdown").textContent = `다음 편지까지 ${hours}시간 ${mins}분`;
  document.getElementById("todayTitle").textContent =
    activeDayIndex === 1
      ? hasArrivedToday
        ? "오늘의 편지가 도착했어요"
        : "첫 편지가 도착했어요"
      : `${activeDayIndex}일째 편지예요`;
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
  const artSrc = work.photo || getArtworkUrl(work);
  const artAlt = work.artwork || getArtworkCaption(work) || `${work.title} 시화`;
  return `<article class="card" data-id="${work.id}">
    <div class="book-spine" aria-hidden="true"></div>
    <button class="book-ribbon js-ribbon" type="button" aria-label="책갈피로 보관하기" aria-pressed="false" title="책갈피로 보관하기"></button>
    <div class="art-mount">
      <div class="art-frame">
        <img class="art-img ${work.photo ? "art-photo" : ""}" src="${artSrc}" alt="${artAlt}">
        <canvas class="art" role="img" aria-label="시에 어울리는 그림" hidden=""></canvas>
      </div>
      <p class="art-cap js-artcap"></p>
    </div>
    <div class="card-body">
      <div class="card-inner-frame">
        <div class="book-vertical-mark" aria-hidden="true">시인의 우체통 · 詩</div>
        <div class="card-top-row">
          <div class="day-tag js-day"></div>
          <button class="align-btn js-align" type="button" aria-pressed="false">가운데 조판</button>
        </div>
        <h2 class="poem-title js-title"></h2>
        <div class="byline js-by"></div>
        <div class="poem-divider" aria-hidden="true"><span>✦</span></div>
        <p class="poem"></p>
        <p class="poem-hint js-poem-hint"></p>
        <div class="note"><span class="js-note"></span><small>— 시인의 우체통이 덧붙인 한 줄</small></div>
        <div class="siwoo js-siwoo">
          <span class="siwoo-head">시인의 편지 한 조각</span>
          <p class="siwoo-line js-siwoo-text"></p>
          <small class="js-siwoo-from"></small>
        </div>
        <div class="reflection-box">
          <label class="reflection-label">
            <span>오늘 내 마음의 한 줄</span>
            <span class="reflection-status js-ref-status">저장되었어요</span>
          </label>
          <textarea class="reflection-input js-reflection-input" rows="2" maxlength="200" placeholder="시를 읽고 떠오른 생각이나 다짐을 가만히 적어 두세요..."></textarea>
        </div>
        <div class="rights js-rights"></div>
        <div class="actions">
          <button class="btn js-save" type="button"></button>
          <button class="btn js-postcard" type="button">시 엽서 간직하기</button>
          <a class="btn" href="#mood">다른 마음으로 받기</a>
          <button class="btn js-zen" type="button" aria-pressed="false">시만 조용히 보기</button>
          ${options.allowRefold ? `<button class="btn js-refold" type="button">봉투 다시 덮기</button>` : ""}
        </div>
        <div class="book-folio js-folio" aria-hidden="true"></div>
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
        renderUnderlinedBookmarks();
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

function formatBylineText(work) {
  if (work.mine) {
    return work.source ? `이시우 · ${work.source}` : "이시우";
  }
  const lifePart = work.life ? ` (${work.life})` : "";
  const translatorPart = work.translator ? ` · ${work.translator} 옮김` : "";
  return `${work.author}${lifePart} · ${work.source}${translatorPart}`;
}

function mountLetterCard(container, work, options = {}) {
  if (!container || !work) return;
  container.innerHTML = createCardTemplate(work, options);
  const select = (sel) => container.querySelector(sel);

  select(".js-artcap").textContent = getArtworkCaption(work);
  select(".js-day").textContent = `${work.day}일째 편지 · ${formatKoreanDate(getDateForDay(work.day))}`;
  select(".js-title").textContent = work.title;
  select(".js-by").textContent = formatBylineText(work);
  const folioEl = select(".js-folio");
  if (folioEl) folioEl.textContent = `— ${String(work.day).padStart(2, "0")} —`;

  const artImg = select(".art-img");
  const fallbackCanvas = select("canvas.art");
  if (artImg && fallbackCanvas) {
    artImg.addEventListener("error", () => {
      artImg.hidden = true;
      fallbackCanvas.hidden = false;
      requestAnimationFrame(() => renderArtworkCanvas(fallbackCanvas, work));
    });
  }

  const poemParagraph = select(".poem");
  const hintEl = select(".js-poem-hint");
  const alignBtn = select(".js-align");

  const applyAlignUI = (centered) => {
    poemParagraph.classList.toggle("centered", centered);
    if (alignBtn) {
      alignBtn.textContent = centered ? "기본 조판" : "가운데 조판";
      alignBtn.setAttribute("aria-pressed", centered ? "true" : "false");
    }
  };

  if (work.status === "ready") {
    renderPoemLines(poemParagraph, work);
    applyAlignUI(isPoemCentered(work));
    if (alignBtn) {
      alignBtn.hidden = false;
      alignBtn.addEventListener("click", () => {
        const nextCentered = !poemParagraph.classList.contains("centered");
        alignPrefMap[work.id] = nextCentered ? "center" : "left";
        saveJsonObject(STORAGE_ALIGN_KEY, alignPrefMap);
        applyAlignUI(nextCentered);
      });
    }
    hintEl.textContent = "마음에 머무는 구절을 눌러 밑줄을 그어 보세요";
    hintEl.hidden = false;
  } else {
    if (alignBtn) alignBtn.hidden = true;
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

  const refInput = select(".js-reflection-input");
  const refStatus = select(".js-ref-status");
  if (refInput) {
    refInput.value = getReflection(work.id);
    let refTimer = null;
    refInput.addEventListener("input", () => {
      setReflection(work.id, refInput.value);
      if (refStatus) {
        refStatus.classList.add("show");
        clearTimeout(refTimer);
        refTimer = setTimeout(() => refStatus.classList.remove("show"), 1600);
      }
      renderSavedArchive(false);
      renderPastLettersList();
    });
  }

  const saveBtn = container.querySelector(".js-save");
  const ribbonBtn = container.querySelector(".js-ribbon");
  const updateSaveButton = () => {
    const saved = isPoemSaved(work.id);
    if (saveBtn) {
      saveBtn.textContent = saved ? "보관했어요" : "보관하기";
      saveBtn.classList.toggle("saved", saved);
      saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
    }
    if (ribbonBtn) {
      ribbonBtn.classList.toggle("saved", saved);
      ribbonBtn.setAttribute("aria-pressed", saved ? "true" : "false");
      ribbonBtn.setAttribute("aria-label", saved ? "책갈피 보관 해제하기" : "책갈피로 보관하기");
    }
  };

  const toggleSaveHandler = () => {
    if (isPoemSaved(work.id)) {
      savedItems = savedItems.filter((item) => item.id !== work.id);
    } else {
      savedItems.unshift({ id: work.id, at: new Date().toISOString() });
    }
    saveItemsToStorage();
    updateSaveButton();
    renderSavedArchive(false);
  };

  if (saveBtn) saveBtn.addEventListener("click", toggleSaveHandler);
  if (ribbonBtn) ribbonBtn.addEventListener("click", toggleSaveHandler);

  updateSaveButton();

  const postcardBtn = container.querySelector(".js-postcard");
  if (postcardBtn) {
    postcardBtn.addEventListener("click", () => openPostcardModal(work));
  }

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
let isEnvelopeAnimating = false;

function updateAfterReadBanner() {
  const afterBox = document.getElementById("afterRead");
  afterBox.hidden = !mailWrapper.classList.contains("open");
  const isEarlyMorning = new Date().getHours() < 15 && activeDayIndex === 1;
  document.getElementById("afterMain").textContent = isEarlyMorning
    ? "오늘의 편지를 읽었어요.\n내일 오후 3시에 또 올게요."
    : "편지를 천천히 읽었어요.\n다른 날 편지도 아래에서 꺼내 보실 수 있어요.";
}

function closeOpenLetter() {
  exitZenMode();
  isEnvelopeAnimating = false;
  mailWrapper.classList.remove("open", "opening");
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
  if (isEnvelopeAnimating || mailWrapper.classList.contains("open")) return;
  const finishOpen = () => {
    isEnvelopeAnimating = false;
    mailWrapper.classList.remove("opening");
    mailWrapper.classList.add("open");
    document.body.classList.add("reading");
    mountLetterCard(document.getElementById("todayCard"), getPoemByDay(activeDayIndex), { allowRefold: true });
    updateAfterReadBanner();
    window.scrollTo(0, 0);
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishOpen();
    return;
  }
  isEnvelopeAnimating = true;
  mailWrapper.classList.add("opening");
  setTimeout(finishOpen, 520);
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
        "적어 주신 말은 이 화면에서만 보이고 서버에 저장되지 않아요."
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
const underlineSectionEl = document.getElementById("underlineSection");
const underlineListEl = document.getElementById("underlineList");

function renderUnderlinedBookmarks() {
  if (!underlineSectionEl || !underlineListEl) return;
  underlineListEl.innerHTML = "";
  const entries = [];
  WORKS.forEach((work) => {
    const indices = getUnderlinedIndices(work.id);
    indices.forEach((idx) => {
      const line = work.lines && work.lines[idx];
      if (line && line.trim()) {
        entries.push({ work, line: line.trim() });
      }
    });
  });

  if (!entries.length) {
    underlineSectionEl.hidden = true;
    return;
  }

  underlineSectionEl.hidden = false;
  entries.forEach(({ work, line }) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "underline-bookmark";
    btn.append(
      makeNode("span", "underline-quote", `「${line}」`),
      makeNode("span", "underline-source", `${work.title} · ${work.mine ? "이시우" : work.author}`)
    );
    btn.addEventListener("click", () => {
      mountLetterCard(boxCardContainer, work);
      boxCardContainer.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    });
    li.appendChild(btn);
    underlineListEl.appendChild(li);
  });
}

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

  const reflection = getReflection(work.id).trim();
  if (reflection) {
    btn.append(makeNode("span", "saved-reflection", `내 기록 · ${reflection}`));
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
  for (let d = WORKS.length; d >= 1; d--) {
    const work = getPoemByDay(d);
    pastLettersListEl.appendChild(createArchiveListItem(work, `${d}일째`));
  }
}

function selectDayToView(dayNumber) {
  activeDayIndex = Math.min(WORKS.length, Math.max(1, dayNumber));
  const currentWork = getPoemByDay(activeDayIndex);
  dayLabelEl.textContent = `${activeDayIndex}일째 · ${formatKoreanDate(getDateForDay(activeDayIndex))}`;
  document.getElementById("dayPrev").disabled = activeDayIndex <= 1;
  document.getElementById("dayNext").disabled = activeDayIndex >= WORKS.length;
  const artUrl = getArtworkUrl(currentWork);
  const stampArtEl = document.getElementById("envStampArt");
  if (stampArtEl) {
    stampArtEl.style.backgroundImage = `url('${artUrl}')`;
  }
  const peekArtEl = document.getElementById("envPeekArt");
  if (peekArtEl) {
    peekArtEl.style.backgroundImage = `url('${artUrl}')`;
  }
  const peekTitleEl = document.getElementById("envPeekTitle");
  if (peekTitleEl) {
    peekTitleEl.textContent = currentWork.title;
  }
  if (mailWrapper.classList.contains("open")) {
    mountLetterCard(document.getElementById("todayCard"), currentWork, { allowRefold: true });
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  }
  refreshArrivalStatus();
  renderPastLettersList();
}

document.getElementById("dayPrev").addEventListener("click", () => selectDayToView(activeDayIndex - 1));
document.getElementById("dayNext").addEventListener("click", () => selectDayToView(activeDayIndex + 1));

renderUnderlinedBookmarks();
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
    "현재 정식 편지 발송을 준비하고 있어요. 입력하신 정보는 어디에도 저장되지 않았으며, 오늘의 편지 탭에서 30일치 시를 바로 감상하실 수 있어요.";
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

const postcardModal = document.getElementById("postcardModal");
const postcardCanvasEl = document.getElementById("postcardCanvas");
const postcardBackCanvasEl = document.getElementById("postcardBackCanvas");
const postcardCloseBtn = document.getElementById("postcardClose");
const postcardFlipBtn = document.getElementById("postcardFlip");
const postcardStageEl = document.getElementById("postcardStage");
const postcardTiltEl = document.getElementById("postcardTilt");
const postcardFlipperEl = document.getElementById("postcardFlipper");
const postcardDownloadBtn = document.getElementById("postcardDownload");
const postcardCopyBtn = document.getElementById("postcardCopy");
const postcardStyleBtns = document.querySelectorAll(".pc-style-btn");
let activePostcardWork = null;
let activePostcardQuote = "";
let activePostcardNote = "";
let activePostcardStyle = "hanji";
let activePostcardDateLabel = "";
let isPostcardFlipped = false;
let tiltRafId = 0;
let swapTimerId = 0;
let targetTiltX = 0;
let targetTiltY = 0;
let curTiltX = 0;
let curTiltY = 0;
let targetSheenX = 30;
let targetSheenY = 25;
let curSheenX = 30;
let curSheenY = 25;

function resetPostcardTilt(immediate = false) {
  targetTiltX = 0;
  targetTiltY = 0;
  targetSheenX = 30;
  targetSheenY = 25;
  if (immediate && postcardTiltEl) {
    if (tiltRafId) {
      cancelAnimationFrame(tiltRafId);
      tiltRafId = 0;
    }
    curTiltX = 0;
    curTiltY = 0;
    curSheenX = 30;
    curSheenY = 25;
    postcardTiltEl.style.setProperty("--tilt-x", "0deg");
    postcardTiltEl.style.setProperty("--tilt-y", "0deg");
    postcardTiltEl.style.setProperty("--shadow-x", "0px");
    postcardTiltEl.style.setProperty("--shadow-y", "24px");
    postcardTiltEl.style.setProperty("--sheen-x", "30%");
    postcardTiltEl.style.setProperty("--sheen-y", "25%");
  } else if (!tiltRafId && postcardTiltEl) {
    tiltRafId = requestAnimationFrame(stepPostcardTilt);
  }
}

function stepPostcardTilt() {
  if (!postcardTiltEl) {
    tiltRafId = 0;
    return;
  }
  curTiltX += (targetTiltX - curTiltX) * 0.16;
  curTiltY += (targetTiltY - curTiltY) * 0.16;
  curSheenX += (targetSheenX - curSheenX) * 0.16;
  curSheenY += (targetSheenY - curSheenY) * 0.16;

  postcardTiltEl.style.setProperty("--tilt-x", `${curTiltX.toFixed(2)}deg`);
  postcardTiltEl.style.setProperty("--tilt-y", `${curTiltY.toFixed(2)}deg`);
  postcardTiltEl.style.setProperty("--shadow-x", `${(-curTiltY * 1.6).toFixed(1)}px`);
  postcardTiltEl.style.setProperty("--shadow-y", `${(24 + curTiltX * 1.4).toFixed(1)}px`);
  postcardTiltEl.style.setProperty("--sheen-x", `${curSheenX.toFixed(1)}%`);
  postcardTiltEl.style.setProperty("--sheen-y", `${curSheenY.toFixed(1)}%`);

  const stillMoving =
    Math.abs(targetTiltX - curTiltX) > 0.04 ||
    Math.abs(targetTiltY - curTiltY) > 0.04 ||
    Math.abs(targetSheenX - curSheenX) > 0.1 ||
    Math.abs(targetSheenY - curSheenY) > 0.1;
  if (stillMoving) {
    tiltRafId = requestAnimationFrame(stepPostcardTilt);
  } else {
    tiltRafId = 0;
  }
}

if (postcardStageEl && postcardTiltEl) {
  postcardStageEl.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = postcardStageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const normX = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const normY = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    targetTiltY = normX * 9.5;
    targetTiltX = -normY * 7.5;
    targetSheenX = 50 + normX * 36;
    targetSheenY = 50 + normY * 36;
    if (!tiltRafId) tiltRafId = requestAnimationFrame(stepPostcardTilt);
  });
  postcardStageEl.addEventListener("pointerleave", () => resetPostcardTilt(false));
}

function drawActivePostcard() {
  if (!postcardCanvasEl || !activePostcardWork) return;
  const workSnapshot = activePostcardWork;
  const artSrc = workSnapshot.photo || getArtworkUrl(workSnapshot);
  const drawBothFaces = (img) => {
    renderPostcardCanvas(postcardCanvasEl, workSnapshot, activePostcardQuote, activePostcardDateLabel, {
      style: activePostcardStyle,
      image: img
    });
    if (postcardBackCanvasEl) {
      renderPostcardBackCanvas(postcardBackCanvasEl, workSnapshot, activePostcardNote, activePostcardDateLabel, {
        style: activePostcardStyle,
        image: img
      });
    }
  };
  drawBothFaces(null);
  loadArtworkImage(artSrc).then((img) => {
    if (img && activePostcardWork === workSnapshot && postcardModal && !postcardModal.hidden) {
      drawBothFaces(img);
    }
  });
}

function syncPostcardStyleButtons() {
  postcardStyleBtns.forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.pcStyle === activePostcardStyle ? "true" : "false");
  });
}

function syncPostcardFlipUI() {
  if (postcardFlipperEl) postcardFlipperEl.classList.toggle("is-flipped", isPostcardFlipped);
  if (postcardFlipBtn) {
    postcardFlipBtn.setAttribute("aria-pressed", isPostcardFlipped ? "true" : "false");
    postcardFlipBtn.textContent = isPostcardFlipped ? "앞면 보기" : "뒷면 보기";
  }
  if (postcardDownloadBtn) {
    postcardDownloadBtn.textContent = isPostcardFlipped ? "뒷면 간직하기 (PNG)" : "앞면 간직하기 (PNG)";
  }
}

function togglePostcardFlip() {
  isPostcardFlipped = !isPostcardFlipped;
  syncPostcardFlipUI();
}

if (postcardFlipBtn) postcardFlipBtn.addEventListener("click", togglePostcardFlip);
if (postcardFlipperEl) {
  postcardFlipperEl.addEventListener("click", togglePostcardFlip);
  postcardFlipperEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      togglePostcardFlip();
    }
  });
}

postcardStyleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    activePostcardStyle = btn.dataset.pcStyle || "hanji";
    syncPostcardStyleButtons();
    if (postcardTiltEl && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      postcardTiltEl.classList.remove("is-swapping");
      void postcardTiltEl.offsetWidth;
      postcardTiltEl.classList.add("is-swapping");
      clearTimeout(swapTimerId);
      swapTimerId = setTimeout(() => postcardTiltEl.classList.remove("is-swapping"), 400);
    }
    drawActivePostcard();
  });
});

function openPostcardModal(work) {
  if (!postcardModal || !postcardCanvasEl || !work) return;
  activePostcardWork = work;
  const indices = getUnderlinedIndices(work.id);
  const selectedLines = indices
    .map((idx) => (work.lines && work.lines[idx] ? work.lines[idx].trim() : ""))
    .filter(Boolean);
  activePostcardQuote = selectedLines.slice(0, 4).join("\n");
  activePostcardNote =
    getReflection(work.id) ||
    work.note ||
    (work.siwoo && work.siwoo.text ? work.siwoo.text : "");
  activePostcardDateLabel = `${work.day}일째 · ${formatKoreanDate(getDateForDay(work.day))}`;
  isPostcardFlipped = false;

  resetPostcardTilt(true);
  syncPostcardStyleButtons();
  syncPostcardFlipUI();
  if (postcardCopyBtn) postcardCopyBtn.textContent = "시 구절 복사하기";
  postcardModal.hidden = false;
  document.body.style.overflow = "hidden";
  drawActivePostcard();
  if (postcardCloseBtn) postcardCloseBtn.focus({ preventScroll: true });
}

function closePostcardModal() {
  if (!postcardModal || postcardModal.hidden) return;
  resetPostcardTilt(true);
  postcardModal.hidden = true;
  document.body.style.overflow = "";
}

if (postcardCloseBtn) postcardCloseBtn.addEventListener("click", closePostcardModal);
if (postcardModal) {
  postcardModal.addEventListener("click", (e) => {
    if (e.target === postcardModal) closePostcardModal();
  });
}

if (postcardDownloadBtn) {
  postcardDownloadBtn.addEventListener("click", () => {
    if (!activePostcardWork) return;
    const targetCanvas = isPostcardFlipped && postcardBackCanvasEl ? postcardBackCanvasEl : postcardCanvasEl;
    if (!targetCanvas) return;
    const sideSuffix = isPostcardFlipped ? "back" : "front";
    const link = document.createElement("a");
    link.download = `dearshiwu-${activePostcardWork.id}-${activePostcardStyle}-${sideSuffix}.png`;
    link.href = targetCanvas.toDataURL("image/png");
    link.click();
  });
}

if (postcardCopyBtn) {
  postcardCopyBtn.addEventListener("click", async () => {
    if (!activePostcardWork) return;
    const snippet =
      activePostcardQuote ||
      (activePostcardWork.lines || []).filter((l) => l.trim()).slice(0, 4).join("\n");
    const copyText = `「${activePostcardWork.title}」 — ${activePostcardWork.author}\n\n${snippet}`;
    let copied = false;
    try {
      await navigator.clipboard.writeText(copyText);
      copied = true;
    } catch {
      try {
        const tempArea = document.createElement("textarea");
        tempArea.value = copyText;
        tempArea.style.position = "fixed";
        tempArea.style.opacity = "0";
        document.body.appendChild(tempArea);
        tempArea.select();
        copied = document.execCommand("copy");
        tempArea.remove();
      } catch {
        copied = false;
      }
    }
    postcardCopyBtn.textContent = copied ? "복사되었어요 ✓" : "복사를 지원하지 않아요";
    setTimeout(() => {
      postcardCopyBtn.textContent = "시 구절 복사하기";
    }, 2200);
  });
}

breatheTriggerBtn.addEventListener("click", openSosDialog);
document.getElementById("sosClose").addEventListener("click", closeSosDialog);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (postcardModal && !postcardModal.hidden) {
      closePostcardModal();
    } else if (!sosDialog.hidden) {
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
    key: "sunlit",
    short: "햇살",
    label: "오후 세 시의 햇살",
    metaColor: "#f5ede0",
    iconPath: '<circle cx="12" cy="12" r="4.5"></circle><line x1="12" y1="2" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.05" y2="7.05"></line><line x1="16.95" y1="16.95" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.05" y2="16.95"></line><line x1="16.95" y1="7.05" x2="19.07" y2="4.93"></line>'
  },
  {
    key: "sunset",
    short: "노을",
    label: "살구빛 노을",
    metaColor: "#2a1d1f",
    iconPath: '<path d="M17 18a5 5 0 0 0-10 0"></path><line x1="12" y1="9" x2="12" y2="2"></line><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line><line x1="1" y1="18" x2="3" y2="18"></line><line x1="21" y1="18" x2="23" y2="18"></line><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line><line x1="23" y1="22" x2="1" y2="22"></line>'
  },
  {
    key: "forest",
    short: "숲",
    label: "이슬 머금은 숲",
    metaColor: "#17231d",
    iconPath: '<path d="M12 2L6.5 11h11L12 2z"></path><path d="M12 8.5L5 18h14L12 8.5z"></path><line x1="12" y1="18" x2="12" y2="22"></line>'
  },
  {
    key: "candle",
    short: "밤",
    label: "촛불 켠 서재",
    metaColor: "#1b1613",
    iconPath: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>'
  }
];

const themeBtn = document.getElementById("themeBtn");
let currentThemeIdx = 0;

function applyThemeSetting(idx) {
  const theme = THEMES[idx] || THEMES[0];
  document.documentElement.classList.add("theme-switching");
  if (theme.key === "sunlit") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = theme.key;
  }
  void document.documentElement.offsetHeight;
  document.documentElement.classList.remove("theme-switching");
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

const SOUND_MODES = [
  { key: "off", label: "소리", aria: "잔잔한 자연 소리 켜기" },
  { key: "rain", label: "빗소리", aria: "빗소리 재생 중 · 눌러서 파도결로 바꾸기" },
  { key: "wave", label: "파도결", aria: "파도결 재생 중 · 눌러서 밤명상으로 바꾸기" },
  { key: "meditation", label: "밤명상", aria: "밤명상 재생 중 · 눌러서 끄기" }
];

const soundBtn = document.getElementById("soundBtn");
let ambientAudio = null;
let soundModeIdx = 0;

function initAmbientAudioGraph() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  const bufferSize = ctx.sampleRate * 3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);

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

  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.9;
  masterGain.connect(ctx.destination);

  // Bus 1: Gentle rain
  const rainSource = ctx.createBufferSource();
  rainSource.buffer = noiseBuffer;
  rainSource.loop = true;
  const rainLowpass = ctx.createBiquadFilter();
  rainLowpass.type = "lowpass";
  rainLowpass.frequency.value = 680;
  const rainBand = ctx.createBiquadFilter();
  rainBand.type = "bandpass";
  rainBand.frequency.value = 1450;
  rainBand.Q.value = 0.8;
  const rainBandGain = ctx.createGain();
  rainBandGain.gain.value = 0.16;
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.0001;
  rainSource.connect(rainLowpass);
  rainLowpass.connect(rainGain);
  rainSource.connect(rainBand);
  rainBand.connect(rainBandGain);
  rainBandGain.connect(rainGain);
  rainGain.connect(masterGain);

  // Bus 2: Slow breathing ocean waves
  const waveSource = ctx.createBufferSource();
  waveSource.buffer = noiseBuffer;
  waveSource.loop = true;
  const waveFilter = ctx.createBiquadFilter();
  waveFilter.type = "lowpass";
  waveFilter.frequency.value = 340;
  const waveLfo = ctx.createOscillator();
  waveLfo.frequency.value = 0.085;
  const waveLfoGain = ctx.createGain();
  waveLfoGain.gain.value = 180;
  waveLfo.connect(waveLfoGain);
  waveLfoGain.connect(waveFilter.frequency);
  const waveGain = ctx.createGain();
  waveGain.gain.value = 0.0001;
  waveSource.connect(waveFilter);
  waveFilter.connect(waveGain);
  waveGain.connect(masterGain);

  // Bus 3: Night meditation harmonic drone (216Hz + 324Hz + soft air)
  const droneOsc1 = ctx.createOscillator();
  droneOsc1.type = "sine";
  droneOsc1.frequency.value = 216;
  const droneOsc2 = ctx.createOscillator();
  droneOsc2.type = "sine";
  droneOsc2.frequency.value = 324;
  const droneOsc1Gain = ctx.createGain();
  droneOsc1Gain.gain.value = 0.045;
  const droneOsc2Gain = ctx.createGain();
  droneOsc2Gain.gain.value = 0.025;
  const medAirSource = ctx.createBufferSource();
  medAirSource.buffer = noiseBuffer;
  medAirSource.loop = true;
  const medAirFilter = ctx.createBiquadFilter();
  medAirFilter.type = "lowpass";
  medAirFilter.frequency.value = 260;
  const medAirGain = ctx.createGain();
  medAirGain.gain.value = 0.14;
  const medGain = ctx.createGain();
  medGain.gain.value = 0.0001;

  droneOsc1.connect(droneOsc1Gain);
  droneOsc1Gain.connect(medGain);
  droneOsc2.connect(droneOsc2Gain);
  droneOsc2Gain.connect(medGain);
  medAirSource.connect(medAirFilter);
  medAirFilter.connect(medAirGain);
  medAirGain.connect(medGain);
  medGain.connect(masterGain);

  rainSource.start();
  waveSource.start();
  waveLfo.start();
  droneOsc1.start();
  droneOsc2.start();
  medAirSource.start();

  return {
    ctx,
    buses: { rain: rainGain, wave: waveGain, meditation: medGain }
  };
}

function updateSoundButtonUI() {
  if (!soundBtn) return;
  const mode = SOUND_MODES[soundModeIdx] || SOUND_MODES[0];
  const isPlaying = mode.key !== "off";
  soundBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
  soundBtn.setAttribute("aria-label", mode.aria);
  const labelSpan = soundBtn.querySelector(".ctrl-label");
  if (labelSpan) labelSpan.textContent = mode.label;
}

if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    soundModeIdx = (soundModeIdx + 1) % SOUND_MODES.length;
    const mode = SOUND_MODES[soundModeIdx];
    try {
      if (!ambientAudio && mode.key !== "off") {
        ambientAudio = initAmbientAudioGraph();
      }
      if (ambientAudio) {
        const { ctx, buses } = ambientAudio;
        if (ctx.state === "suspended" && mode.key !== "off") {
          ctx.resume();
        }
        const now = ctx.currentTime;
        const targets = {
          rain: mode.key === "rain" ? 0.28 : 0.0001,
          wave: mode.key === "wave" ? 0.34 : 0.0001,
          meditation: mode.key === "meditation" ? 0.65 : 0.0001
        };
        Object.entries(buses).forEach(([key, gainNode]) => {
          gainNode.gain.cancelScheduledValues(now);
          gainNode.gain.setValueAtTime(Math.max(0.0001, gainNode.gain.value), now);
          gainNode.gain.exponentialRampToValueAtTime(targets[key], now + 0.65);
        });
      }
    } catch {
      soundModeIdx = 0;
    }
    updateSoundButtonUI();
  });
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
    renderUnderlinedBookmarks();
    renderSavedArchive(false);
    renderPastLettersList();
  }
  if (currentView === "mood") resetMoodSection();
  document.body.classList.toggle(
    "reading",
    currentView === "today" && mailWrapper.classList.contains("open")
  );
  document.body.classList.remove("tabs-away");
  document.querySelectorAll("section[data-view]:not([hidden]) canvas.art:not([hidden])").forEach((canvas) => {
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
    document.querySelectorAll("section[data-view]:not([hidden]) canvas.art:not([hidden])").forEach((canvas) => {
      const cardId = canvas.closest(".card")?.dataset.id;
      const work = WORKS.find((x) => x.id === cardId);
      if (work) renderArtworkCanvas(canvas, work);
    });
  }, 150);
});

handleRouteChange();
