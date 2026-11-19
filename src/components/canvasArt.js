function createSeededRandom(seedText) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return function nextRandom() {
    hash |= 0;
    hash = (hash + 0x6D2B79F5) | 0;
    let t = Math.imul(hash ^ (hash >>> 15), 1 | hash);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ART_BY_POEM_ID = {
  d01: "mountain",
  d02: "pond",
  d03: "feather",
  d04: "river",
  d05: "pond-forest",
  d06: "lamp",
  d07: "snow",
  d08: "sunpatch",
  d09: "river-moon",
  d10: "starry",
  d11: "river-moon",
  d12: "lamp",
  d13: "valley",
  d14: "dawn-horizon",
  d15: "dawn-horizon",
  d16: "feather",
  d17: "river",
  d18: "pond-forest",
  d19: "feather",
  d20: "river-moon",
  d21: "mountain",
  d22: "snow",
  d23: "pond",
  d24: "mountain",
  d25: "dawn-horizon",
  d26: "pond",
  d27: "valley",
  d28: "homelight",
  d29: "starry",
  d30: "starry"
};

const ART_FILE_CAPTIONS = {
  mountain: "안개 낀 능선과 언덕에 고요히 피어난 들꽃",
  pond: "고요한 연못 위로 천천히 번져 나가는 물결",
  "pond-forest": "솔숲 물안개와 이끼 낀 연못의 평온",
  feather: "황혼빛 하늘을 가볍게 건너는 깃털 한 점",
  "dawn-horizon": "밤의 경계를 넘어 고요히 밝아 오는 새벽빛",
  river: "별빛과 금모래가 어우러진 고요한 강변",
  "river-moon": "초승달과 강물이 마주 보며 쉬어 가는 밤",
  lamp: "고요한 밤 창가를 밝히는 작은 등불과 오동잎",
  homelight: "어둠 속에서도 꺼지지 않고 마음을 지키는 등불",
  snow: "발소리마저 포근히 덮어 주는 새벽 자작나무 설원",
  valley: "근심을 씻어 내리며 맑게 흐르는 산골짜기 물",
  sunpatch: "창살 너머 오후 햇살 안에서 잠든 고양이",
  starry: "가을밤 능선 위로 말없이 반짝이는 은하수와 별"
};

export const SCENE_CAPTIONS = {
  azalea: ART_FILE_CAPTIONS.mountain,
  mountain: ART_FILE_CAPTIONS.mountain,
  river: ART_FILE_CAPTIONS.river,
  maple: ART_FILE_CAPTIONS.feather,
  lamp: ART_FILE_CAPTIONS.lamp,
  field: ART_FILE_CAPTIONS["dawn-horizon"],
  pond: ART_FILE_CAPTIONS.pond,
  starry: ART_FILE_CAPTIONS.starry,
  snow: ART_FILE_CAPTIONS.snow,
  boat: ART_FILE_CAPTIONS["river-moon"],
  path: ART_FILE_CAPTIONS["pond-forest"],
  sunpatch: ART_FILE_CAPTIONS.sunpatch,
  valley: ART_FILE_CAPTIONS.valley,
  dawn: ART_FILE_CAPTIONS["dawn-horizon"],
  echo: ART_FILE_CAPTIONS.mountain,
  homelight: ART_FILE_CAPTIONS.homelight,
  feather: ART_FILE_CAPTIONS.feather
};

export function getArtworkKey(work) {
  if (!work) return "pond";
  if (work.id && ART_BY_POEM_ID[work.id]) return ART_BY_POEM_ID[work.id];
  if (work.art && ART_FILE_CAPTIONS[work.art]) return work.art;
  return "pond";
}

export function getArtworkUrl(work) {
  return `./art/${getArtworkKey(work)}.jpg`;
}

export function getArtworkCaption(work) {
  const key = getArtworkKey(work);
  return ART_FILE_CAPTIONS[key] || SCENE_CAPTIONS[work?.art] || "";
}

const imagePromiseCache = new Map();

export function loadArtworkImage(url) {
  if (!url) return Promise.resolve(null);
  if (imagePromiseCache.has(url)) return imagePromiseCache.get(url);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  imagePromiseCache.set(url, promise);
  return promise;
}

function drawSkyGradient(ctx, w, h, topColor, bottomColor) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawMountainRidge(ctx, w, h, baseHeight, amplitude, fillStyle, rand) {
  ctx.beginPath();
  ctx.moveTo(0, h);
  const steps = 8;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    points.push([
      (w * i) / steps,
      baseHeight - amplitude * (0.4 + rand() * 0.6)
    ]);
  }
  ctx.lineTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    ctx.quadraticCurveTo(
      x0 + (x1 - x0) / 2,
      Math.min(y0, y1) - amplitude * 0.2,
      x1,
      y1
    );
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawStarField(ctx, w, h, count, rand, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.35 + rand() * 0.6;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h * 0.6, rand() * 1.4 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function applyPoeticFinish(ctx, w, h, rand) {
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const rx = rand() * w;
    const ry = rand() * h;
    const rr = w * (0.14 + rand() * 0.22);
    const tint = rand() > 0.45 ? "247, 243, 235" : "45, 37, 27";
    const alpha = 0.025 + rand() * 0.02;
    const wash = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
    wash.addColorStop(0, `rgba(${tint}, ${alpha})`);
    wash.addColorStop(1, `rgba(${tint}, 0)`);
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  const vignette = ctx.createRadialGradient(
    w * 0.5,
    h * 0.48,
    w * 0.25,
    w * 0.5,
    h * 0.5,
    w * 0.72
  );
  vignette.addColorStop(0, "rgba(247, 243, 235, 0)");
  vignette.addColorStop(0.75, "rgba(24, 22, 20, 0.05)");
  vignette.addColorStop(1, "rgba(18, 17, 16, 0.18)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

const FALLBACK_SCENES = {
  mountain(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#d8dee6", "#f4efe4");
    drawMountainRidge(ctx, w, h, h * 0.55, h * 0.18, "#8fa1b4", r);
    drawMountainRidge(ctx, w, h, h * 0.72, h * 0.14, "#5d7384", r);
    drawMountainRidge(ctx, w, h, h * 0.86, h * 0.1, "#3f535a", r);
  },
  pond(ctx, w, h) {
    drawSkyGradient(ctx, w, h, "#65796e", "#95a79b");
    ctx.strokeStyle = "rgba(235,242,236,0.65)";
    ctx.lineWidth = 1.4;
    for (let i = 1; i <= 6; i++) {
      ctx.globalAlpha = Math.max(0.15, 1 - i * 0.13);
      ctx.beginPath();
      ctx.ellipse(w * 0.55, h * 0.58, i * w * 0.05, i * h * 0.03, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  river(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#19253f", "#4b6688");
    drawStarField(ctx, w, h, 40, r, "#f6e6c4");
    ctx.fillStyle = "#d9c297";
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
  },
  lamp(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#111622", "#1e273a");
    drawStarField(ctx, w, h, 28, r, "#cfd8ea");
    const glow = ctx.createRadialGradient(w * 0.65, h * 0.68, 2, w * 0.65, h * 0.68, h * 0.45);
    glow.addColorStop(0, "rgba(255, 204, 120, 0.55)");
    glow.addColorStop(1, "rgba(255, 204, 120, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  },
  starry(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#11182b", "#293b5e");
    drawStarField(ctx, w, h, 85, r, "#f1d48a");
    drawMountainRidge(ctx, w, h, h * 0.85, h * 0.08, "#141c2c", r);
  }
};

export function renderArtworkCanvas(canvas, work) {
  if (!canvas || !work) return;
  const width = Math.max(240, canvas.clientWidth || 440);
  const height = Math.round((width * 10) / 16);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rand = createSeededRandom(work.id || "d01");
  const key = getArtworkKey(work);
  const sceneFn = FALLBACK_SCENES[key] || FALLBACK_SCENES.mountain;
  sceneFn(ctx, width, height, rand);
  applyPoeticFinish(ctx, width, height, rand);
}

function wrapCanvasLines(ctx, textLines, maxWidth) {
  const out = [];
  textLines.forEach((line) => {
    const trimmed = (line || "").trim();
    if (!trimmed) return;
    if (ctx.measureText(trimmed).width <= maxWidth) {
      out.push(trimmed);
      return;
    }
    const words = trimmed.split(" ");
    let current = "";
    const pushLongToken = (token) => {
      let chunk = "";
      for (const ch of token) {
        if (ctx.measureText(chunk + ch).width <= maxWidth) {
          chunk += ch;
        } else {
          if (chunk) out.push(chunk);
          chunk = ch;
        }
      }
      return chunk;
    };
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) out.push(current);
        current = ctx.measureText(word).width > maxWidth ? pushLongToken(word) : word;
      }
    });
    if (current) out.push(current);
  });
  return out;
}

function traceRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCoverImage(ctx, img, x, y, w, h) {
  const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = sh * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = sw / boxRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

const POSTCARD_PALETTES = {
  hanji: {
    bgTop: "#fbf6ec",
    bgMid: "#f6eedf",
    bgBot: "#eddcc4",
    outerBorder: "rgba(176, 146, 108, 0.56)",
    innerBorder: "rgba(176, 146, 108, 0.28)",
    artFrame: "rgba(140, 118, 88, 0.34)",
    title: "#231a13",
    byline: "#6d5d4e",
    caption: "#7f6f5e",
    divider: "rgba(176, 146, 108, 0.56)",
    ornament: "#b58b57",
    quote: "#241b13",
    quoteBg: "rgba(230, 175, 102, 0.2)",
    footerLine: "rgba(214, 198, 174, 0.9)",
    footerText: "#6d5d4e",
    footerDate: "#8c7b68",
    ruleLine: "rgba(176, 146, 108, 0.26)",
    sealInk: "#a53324",
    sealFill: "rgba(184, 68, 53, 0.08)",
    fiberColor: "#85715a"
  },
  linen: {
    bgTop: "#faf6ec",
    bgMid: "#f2ebdc",
    bgBot: "#e8dcc6",
    outerBorder: "rgba(164, 126, 86, 0.54)",
    innerBorder: "rgba(164, 126, 86, 0.26)",
    artFrame: "rgba(144, 110, 74, 0.38)",
    title: "#271d14",
    byline: "#6f5d4b",
    caption: "#816d59",
    divider: "rgba(164, 126, 86, 0.5)",
    ornament: "#b5744a",
    quote: "#291e14",
    quoteBg: "rgba(196, 146, 98, 0.16)",
    footerLine: "rgba(205, 187, 160, 0.88)",
    footerText: "#6c5a48",
    footerDate: "#8b7864",
    ruleLine: "rgba(164, 126, 86, 0.26)",
    sealInk: "#a83c2a",
    sealFill: "rgba(168, 60, 42, 0.08)",
    fiberColor: "#7e6b56"
  },
  gallery: {
    bgTop: "#fdfbf6",
    bgMid: "#faf7ef",
    bgBot: "#f4eee2",
    outerBorder: "rgba(192, 182, 166, 0.68)",
    innerBorder: "rgba(208, 198, 184, 0.42)",
    artFrame: "rgba(160, 148, 132, 0.42)",
    title: "#211c17",
    byline: "#72685d",
    caption: "#857a6d",
    divider: "rgba(204, 194, 180, 0.72)",
    ornament: "#9d8d78",
    quote: "#26201a",
    quoteBg: "rgba(212, 178, 126, 0.16)",
    footerLine: "rgba(220, 212, 198, 0.9)",
    footerText: "#72685d",
    footerDate: "#928677",
    ruleLine: "rgba(182, 170, 152, 0.3)",
    sealInk: "#9c3326",
    sealFill: "rgba(156, 51, 38, 0.06)",
    fiberColor: "#8b8173"
  },
  ink: {
    bgTop: "#201a16",
    bgMid: "#261f1a",
    bgBot: "#181310",
    outerBorder: "rgba(232, 194, 134, 0.42)",
    innerBorder: "rgba(232, 194, 134, 0.2)",
    artFrame: "rgba(232, 194, 134, 0.3)",
    title: "#f6efe4",
    byline: "#bfb19f",
    caption: "#ad9f8d",
    divider: "rgba(232, 194, 134, 0.3)",
    ornament: "#e5be82",
    quote: "#faf3e8",
    quoteBg: "rgba(232, 194, 134, 0.14)",
    footerLine: "rgba(232, 194, 134, 0.22)",
    footerText: "#c4b6a4",
    footerDate: "#9d8f7d",
    ruleLine: "rgba(232, 194, 134, 0.18)",
    sealInk: "#e5816e",
    sealFill: "rgba(229, 129, 110, 0.12)",
    fiberColor: "#e5be82"
  }
};

function createHiResPostcardCanvas(canvas) {
  const W = 720;
  const H = 960;
  const dpr = 2;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W, H };
}

function drawPostcardPaperBase(ctx, W, H, pal, rand, styleKey) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, pal.bgTop);
  bg.addColorStop(0.55, pal.bgMid);
  bg.addColorStop(1, pal.bgBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle ambient warm sunlight gradient from upper left corner
  const sunWash = ctx.createRadialGradient(W * 0.18, H * 0.1, 20, W * 0.2, H * 0.15, W * 0.85);
  sunWash.addColorStop(0, styleKey === "ink" ? "rgba(232, 184, 120, 0.08)" : "rgba(255, 250, 236, 0.5)");
  sunWash.addColorStop(1, "rgba(255, 250, 236, 0)");
  ctx.fillStyle = sunWash;
  ctx.fillRect(0, 0, W, H);

  // Cotton / linen / hanji fiber texture
  ctx.save();
  if (styleKey === "linen") {
    ctx.strokeStyle = pal.fiberColor;
    ctx.lineWidth = 0.55;
    ctx.globalAlpha = 0.045;
    for (let x = 28; x < W - 24; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 26);
      ctx.lineTo(x, H - 26);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.036;
    for (let y = 28; y < H - 24; y += 14) {
      ctx.beginPath();
      ctx.moveTo(26, y);
      ctx.lineTo(W - 26, y);
      ctx.stroke();
    }
  }
  const fiberCount = styleKey === "hanji" ? 155 : 105;
  ctx.lineWidth = 0.65;
  for (let i = 0; i < fiberCount; i++) {
    ctx.globalAlpha = styleKey === "ink" ? 0.035 : styleKey === "hanji" ? 0.05 : 0.032;
    ctx.strokeStyle = pal.fiberColor;
    const x = rand() * W;
    const y = rand() * H;
    const len = 5 + rand() * 16;
    const ang = (rand() - 0.5) * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();

  // Double editorial bookplate border
  ctx.strokeStyle = pal.outerBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = pal.innerBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, W - 64, H - 64);

  // Corner stationery brackets on linen / hanji
  if (styleKey === "linen" || styleKey === "hanji") {
    ctx.save();
    ctx.strokeStyle = pal.ornament;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.1;
    const m = 42;
    const s = 12;
    const corners = [
      [m, m, 1, 1],
      [W - m, m, -1, 1],
      [m, H - m, 1, -1],
      [W - m, H - m, -1, -1]
    ];
    corners.forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * s);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * s, cy);
      ctx.stroke();
    });
    ctx.restore();
  }
}

function drawArtworkInRect(ctx, work, artX, artY, artW, artH, radius, rand, img) {
  ctx.save();
  traceRoundedRect(ctx, artX, artY, artW, artH, radius);
  ctx.clip();
  if (img && img.complete && img.naturalWidth > 0) {
    drawCoverImage(ctx, img, artX, artY, artW, artH);
  } else {
    ctx.translate(artX, artY);
    const key = getArtworkKey(work);
    const sceneFn = FALLBACK_SCENES[key] || FALLBACK_SCENES.mountain;
    sceneFn(ctx, artW, artH, rand);
    applyPoeticFinish(ctx, artW, artH, rand);
  }
  ctx.restore();
}

function drawWavyPostmark(ctx, startX, baseY, strokeColor) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.1;
  for (let wIdx = 0; wIdx < 3; wIdx++) {
    const wy = baseY + wIdx * 10;
    ctx.beginPath();
    ctx.moveTo(startX, wy);
    ctx.bezierCurveTo(startX + 22, wy - 5, startX + 44, wy + 5, startX + 68, wy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPoetSeal(ctx, sealX, sealY, pal, topText = "시인", bottomText = "우체통") {
  ctx.save();
  ctx.strokeStyle = pal.sealInk;
  ctx.lineWidth = 1.6;
  traceRoundedRect(ctx, sealX, sealY, 50, 48, 5);
  ctx.stroke();
  ctx.fillStyle = pal.sealFill;
  ctx.fill();
  ctx.fillStyle = pal.sealInk;
  ctx.font = '700 13px "Gowun Batang", Georgia, serif';
  ctx.textAlign = "center";
  ctx.fillText(topText, sealX + 25, sealY + 21);
  ctx.fillText(bottomText, sealX + 25, sealY + 38);
  ctx.restore();
}

export function renderPostcardCanvas(canvas, work, highlightQuote, dateLabel, options = {}) {
  if (!canvas || !work) return;
  const styleKey = POSTCARD_PALETTES[options.style] ? options.style : "hanji";
  const pal = POSTCARD_PALETTES[styleKey];
  const { ctx, W, H } = createHiResPostcardCanvas(canvas);
  const rand = createSeededRandom(`${work.id}-${styleKey}`);

  drawPostcardPaperBase(ctx, W, H, pal, rand, styleKey);

  // Top artwork frame (gallery uses generous museum mat + recessed plate-mark)
  const artPad = styleKey === "gallery" ? 68 : 52;
  const artW = W - artPad * 2;
  const artH = Math.round((artW * 10) / 16);
  const artX = artPad;
  const artY = styleKey === "gallery" ? 64 : 52;
  const artRadius = styleKey === "gallery" ? 4 : 8;

  if (styleKey === "gallery") {
    ctx.save();
    ctx.strokeStyle = "rgba(130, 110, 84, 0.22)";
    ctx.lineWidth = 1.2;
    traceRoundedRect(ctx, artX - 10, artY - 10, artW + 20, artH + 20, 6);
    ctx.stroke();
    ctx.restore();
  }

  drawArtworkInRect(ctx, work, artX, artY, artW, artH, artRadius, rand, options.image);

  ctx.strokeStyle = pal.artFrame;
  ctx.lineWidth = 1;
  traceRoundedRect(ctx, artX, artY, artW, artH, artRadius);
  ctx.stroke();

  const captionY = artY + artH + 26;
  const caption = getArtworkCaption(work);
  if (caption) {
    ctx.fillStyle = pal.caption;
    ctx.font = '13.5px "Gowun Batang", Georgia, serif';
    ctx.textAlign = "center";
    ctx.fillText(caption, W / 2, captionY);
  }

  // Ornamental divider
  const divY = captionY + 30;
  ctx.strokeStyle = pal.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(156, divY);
  ctx.lineTo(W / 2 - 20, divY);
  ctx.moveTo(W / 2 + 20, divY);
  ctx.lineTo(W - 156, divY);
  ctx.stroke();
  ctx.fillStyle = pal.ornament;
  ctx.font = '13px serif';
  ctx.textAlign = "center";
  ctx.fillText("✦", W / 2, divY + 4.5);

  // Poem title & poet
  const titleY = divY + 52;
  ctx.fillStyle = pal.title;
  ctx.font = '700 30px "Gowun Batang", Georgia, serif';
  ctx.textAlign = "center";
  ctx.fillText(work.title, W / 2, titleY);

  const bylineText = work.mine
    ? "이시우"
    : `${work.author}${work.life ? ` (${work.life})` : ""}`;
  ctx.fillStyle = pal.byline;
  ctx.font = '15px "IBM Plex Sans KR", sans-serif';
  ctx.fillText(bylineText, W / 2, titleY + 32);

  // Quote lines
  const rawLines = highlightQuote
    ? highlightQuote.split("\n")
    : (work.lines || []).filter((l) => l.trim()).slice(0, 4);
  ctx.font = '22.5px "Gowun Batang", Georgia, serif';
  const wrapped = wrapCanvasLines(ctx, rawLines, 530).slice(0, 6);
  const lineH = 40;
  const blockH = wrapped.length * lineH;
  const centerZoneMid = (titleY + 56 + 846) / 2;
  const quoteStartY = Math.max(titleY + 86, centerZoneMid - blockH / 2 + 24);

  if (highlightQuote && wrapped.length) {
    const boxPadY = 18;
    const boxTop = quoteStartY - 30 - boxPadY;
    const boxH = blockH + boxPadY * 2 - 8;
    ctx.fillStyle = pal.quoteBg;
    traceRoundedRect(ctx, 84, boxTop, W - 168, boxH, 10);
    ctx.fill();
  }

  ctx.fillStyle = pal.quote;
  ctx.textAlign = "center";
  wrapped.forEach((line, idx) => {
    ctx.fillText(line, W / 2, quoteStartY + idx * lineH);
  });

  // Footer & wavy postmark cancellation + red stamp seal
  ctx.strokeStyle = pal.footerLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 856);
  ctx.lineTo(W - 56, 856);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = pal.footerText;
  ctx.font = '14px "Gowun Batang", Georgia, serif';
  ctx.fillText("시인의 우체통 · 잠시 나를 만나는 시간", 56, 894);
  if (dateLabel) {
    ctx.fillStyle = pal.footerDate;
    ctx.font = '12.5px "IBM Plex Sans KR", sans-serif';
    ctx.fillText(dateLabel, 56, 916);
  }

  drawWavyPostmark(ctx, W - 190, 886, pal.innerBorder);
  drawPoetSeal(ctx, W - 108, 874, pal, "시인", "우체통");
}

export function renderPostcardBackCanvas(canvas, work, noteText, dateLabel, options = {}) {
  if (!canvas || !work) return;
  const styleKey = POSTCARD_PALETTES[options.style] ? options.style : "hanji";
  const pal = POSTCARD_PALETTES[styleKey];
  const { ctx, W, H } = createHiResPostcardCanvas(canvas);
  const rand = createSeededRandom(`${work.id}-${styleKey}-back`);

  drawPostcardPaperBase(ctx, W, H, pal, rand, styleKey);

  // Header caption
  ctx.fillStyle = pal.footerDate;
  ctx.font = '600 12px "IBM Plex Sans KR", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText("POST CARD  ·  시인의 우체통", 60, 84);

  ctx.fillStyle = pal.title;
  ctx.font = '700 23px "Gowun Batang", Georgia, serif';
  ctx.fillText(`「${work.title}」`, 60, 128);

  const bylineText = work.mine
    ? "이시우"
    : `${work.author}${work.life ? ` (${work.life})` : ""}`;
  ctx.fillStyle = pal.byline;
  ctx.font = '14px "IBM Plex Sans KR", sans-serif';
  ctx.fillText(bylineText, 60, 156);
  if (dateLabel) {
    ctx.fillStyle = pal.footerDate;
    ctx.font = '13px "IBM Plex Sans KR", sans-serif';
    ctx.fillText(`${dateLabel}의 기록`, 60, 180);
  }

  // Top-right postage stamp frame with miniature watercolor artwork
  const stampX = W - 182;
  const stampY = 64;
  const stampW = 122;
  const stampH = 148;
  ctx.save();
  ctx.fillStyle = styleKey === "ink" ? "#2d241d" : "#fffcf5";
  ctx.fillRect(stampX, stampY, stampW, stampH);
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = pal.outerBorder;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(stampX, stampY, stampW, stampH);
  ctx.restore();

  drawArtworkInRect(ctx, work, stampX + 10, stampY + 10, stampW - 20, 88, 3, rand, options.image);
  ctx.strokeStyle = pal.artFrame;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(stampX + 10, stampY + 10, stampW - 20, 88);

  ctx.fillStyle = pal.sealInk;
  ctx.font = '700 11.5px "Gowun Batang", Georgia, serif';
  ctx.textAlign = "center";
  ctx.fillText("詩 · PM 3:00", stampX + stampW / 2, stampY + 128);

  // Circular postmark cancellation near stamp
  ctx.save();
  ctx.translate(stampX - 18, stampY + 124);
  ctx.rotate(-0.18);
  ctx.strokeStyle = pal.innerBorder;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 27, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = pal.footerDate;
  ctx.font = '600 8px "IBM Plex Sans KR", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("DEAR SHIWU", 0, -4);
  ctx.fillText("PM 3:00", 0, 9);
  ctx.restore();
  drawWavyPostmark(ctx, stampX - 96, stampY + 114, pal.innerBorder);

  // Letter stationery divider and ruled note lines
  ctx.strokeStyle = pal.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 246);
  ctx.lineTo(W - 60, 246);
  ctx.stroke();

  ctx.fillStyle = pal.ornament;
  ctx.font = '13px "Gowun Batang", Georgia, serif';
  ctx.textAlign = "left";
  ctx.fillText("오늘 내 마음에 남긴 한 줄", 60, 286);

  const lineStartY = 344;
  const rowStep = 56;
  const totalRows = 7;
  ctx.strokeStyle = pal.ruleLine;
  ctx.lineWidth = 1;
  for (let i = 0; i < totalRows; i++) {
    const ry = lineStartY + i * rowStep;
    ctx.beginPath();
    ctx.moveTo(60, ry);
    ctx.lineTo(W - 60, ry);
    ctx.stroke();
  }

  const trimmedNote = (noteText || "").trim();
  const displayNote =
    trimmedNote ||
    "오늘 하루를 조용히 건너온 당신에게,\n이 시와 그림이 작은 쉼표로 남기를 바라요.";
  ctx.font = '21px "Gowun Batang", Georgia, serif';
  const noteLines = wrapCanvasLines(ctx, displayNote.split("\n"), W - 132).slice(0, totalRows);
  ctx.fillStyle = trimmedNote ? pal.title : pal.byline;
  ctx.textAlign = "left";
  noteLines.forEach((line, idx) => {
    ctx.fillText(line, 64, lineStartY + idx * rowStep - 12);
  });

  // Vintage postcard address & footer
  ctx.strokeStyle = pal.footerLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 814);
  ctx.lineTo(W - 60, 814);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = pal.footerText;
  ctx.font = '15px "Gowun Batang", Georgia, serif';
  ctx.fillText("To. 오늘 하루를 조용히 건너온 나에게", 60, 858);
  ctx.fillStyle = pal.footerDate;
  ctx.font = '13.5px "Gowun Batang", Georgia, serif';
  ctx.fillText("From. 오후 세 시, 시인의 우체통", 60, 892);

  drawPoetSeal(ctx, W - 110, 852, pal, "詩", "세시");
}
