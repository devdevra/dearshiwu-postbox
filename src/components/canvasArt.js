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

export const SCENE_CAPTIONS = {
  azalea: "봄밤 산등성이에 흩어지는 분홍 꽃잎",
  mountain: "멀리 물러선 산 능선과 고요히 피어난 들꽃",
  river: "별빛을 띄워 보내는 잔잔한 밤강",
  maple: "바람에 천천히 내려앉는 가을 단풍",
  lamp: "어둠을 조용히 밝히는 작은 등불 하나",
  field: "오후의 금빛이 머무는 너른 들판",
  pond: "돌 하나에 번져 나가는 오래된 연못의 파문",
  starry: "말없이 반짝이며 밤을 지키는 별무리",
  snow: "발자국 소리마저 덮어 주는 고요한 설원",
  boat: "물안개 너머로 천천히 건너가는 나룻배",
  path: "숲과 마을을 잇는 익숙하고도 새로운 오솔길",
  sunpatch: "창가 양지바른 자리에 누운 오후의 고양이",
  valley: "근심을 씻어 내리며 흐르는 깊은 골짜기 물",
  dawn: "밤을 건너와 마침내 닿은 첫 새벽빛",
  echo: "산울림처럼 되돌아오는 다정한 이름",
  homelight: "멀리서도 길을 잃지 않게 켜 둔 창가의 불빛",
  feather: "바람을 타고 가볍게 내려앉는 깃털 하나"
};

function drawSkyGradient(ctx, w, h, topColor, bottomColor) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawAtmosphericMist(ctx, w, h, yRatio, heightRatio, color) {
  const top = h * yRatio;
  const bottom = h * (yRatio + heightRatio);
  const mist = ctx.createLinearGradient(0, top, 0, bottom);
  mist.addColorStop(0, "rgba(247, 243, 235, 0)");
  mist.addColorStop(0.5, color);
  mist.addColorStop(1, "rgba(247, 243, 235, 0)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, top, w, bottom - top);
}

function drawMoonHalo(ctx, x, y, radius, innerColor, glowColor) {
  const halo = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius * 3.8);
  halo.addColorStop(0, glowColor);
  halo.addColorStop(1, "rgba(255, 244, 214, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, radius * 3.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
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

  // Soft diffused watercolor washes (radial gradients with zero hard edges)
  for (let i = 0; i < 10; i++) {
    const rx = rand() * w;
    const ry = rand() * h;
    const rr = w * (0.14 + rand() * 0.22);
    const tint = rand() > 0.45 ? "247, 243, 235" : "45, 37, 27";
    const alpha = 0.025 + rand() * 0.025;
    const wash = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
    wash.addColorStop(0, `rgba(${tint}, ${alpha})`);
    wash.addColorStop(1, `rgba(${tint}, 0)`);
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle hanji paper fiber hairlines
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 65; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const len = 6 + rand() * 14;
    const angle = (rand() - 0.5) * 0.5;
    ctx.globalAlpha = 0.024 + rand() * 0.02;
    ctx.strokeStyle = rand() > 0.5 ? "#f7f3eb" : "#3a3126";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Gentle vignette around edges for calm framing
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
  vignette.addColorStop(1, "rgba(18, 17, 16, 0.2)");
  ctx.globalAlpha = 1;
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Soft bottom fade blending gently toward the warm hanji card
  const bottomBlend = ctx.createLinearGradient(0, h * 0.84, 0, h);
  bottomBlend.addColorStop(0, "rgba(247, 243, 235, 0)");
  bottomBlend.addColorStop(1, "rgba(247, 243, 235, 0.34)");
  ctx.fillStyle = bottomBlend;
  ctx.fillRect(0, h * 0.84, w, h * 0.16);
  ctx.restore();
}

const SCENES = {
  azalea(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#2a2244", "#c9768f");
    drawStarField(ctx, w, h, 28, r, "#fff3e6");
    drawMoonHalo(ctx, w * 0.78, h * 0.24, h * 0.042, "#fff3e2", "rgba(255, 224, 204, 0.28)");
    drawMountainRidge(ctx, w, h, h * 0.78, h * 0.12, "#3a2a40", r);
    drawAtmosphericMist(ctx, w, h, 0.54, 0.22, "rgba(245, 202, 210, 0.14)");
    for (let i = 0; i < 72; i++) {
      const x = w * (0.1 + 0.8 * (i / 72)) + (r() - 0.5) * w * 0.12;
      const y = h * (0.62 + 0.3 * r());
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r() * Math.PI * 2);
      ctx.fillStyle = r() > 0.4 ? "#e58aa8" : "#f3b4c6";
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.012 + r() * 4, w * 0.006 + r() * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
  mountain(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#c9d5e3", "#ece4d6");
    drawMoonHalo(ctx, w * 0.22, h * 0.22, h * 0.05, "#fff8e8", "rgba(255, 245, 218, 0.35)");
    drawMountainRidge(ctx, w, h, h * 0.5, h * 0.2, "#9fb2c4", r);
    drawAtmosphericMist(ctx, w, h, 0.42, 0.18, "rgba(247, 243, 235, 0.34)");
    drawMountainRidge(ctx, w, h, h * 0.66, h * 0.16, "#6f8a95", r);
    drawAtmosphericMist(ctx, w, h, 0.58, 0.16, "rgba(247, 243, 235, 0.24)");
    drawMountainRidge(ctx, w, h, h * 0.82, h * 0.12, "#3f5a5c", r);
    const fx = w * 0.72;
    const fy = h * 0.86;
    ctx.strokeStyle = "#2c4040";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy - h * 0.07);
    ctx.stroke();
    ctx.fillStyle = "#e9a7a0";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(
        fx + Math.cos(i * 1.256) * 5,
        fy - h * 0.07 + Math.sin(i * 1.256) * 5,
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.fillStyle = "#f6d57a";
    ctx.beginPath();
    ctx.arc(fx, fy - h * 0.07, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#384a55";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const bx = w * 0.3;
    const by = h * 0.28;
    ctx.moveTo(bx - 9, by);
    ctx.quadraticCurveTo(bx - 4, by - 6, bx, by);
    ctx.quadraticCurveTo(bx + 4, by - 6, bx + 9, by);
    ctx.stroke();
  },
  river(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#1d2d4b", "#6b86ad");
    drawStarField(ctx, w, h, 42, r, "#ffffff");
    drawMoonHalo(ctx, w * 0.76, h * 0.24, h * 0.045, "#fff5db", "rgba(241, 212, 138, 0.26)");
    ctx.fillStyle = "#26344a";
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = "#4b6688";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.bezierCurveTo(w * 0.3, h * 0.66, w * 0.6, h * 0.86, w, h * 0.74);
    ctx.lineTo(w, h * 0.86);
    ctx.bezierCurveTo(w * 0.6, h * 0.98, w * 0.3, h * 0.78, 0, h * 0.84);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 245, 219, 0.25)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      const rx = w * (0.64 + (r() - 0.5) * 0.14);
      const ry = h * (0.74 + i * 0.025);
      ctx.beginPath();
      ctx.moveTo(rx - 10, ry);
      ctx.lineTo(rx + 12 + r() * 14, ry);
      ctx.stroke();
    }
    ctx.fillStyle = "#f1d48a";
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = r();
      ctx.fillRect(r() * w, h * (0.86 + r() * 0.12), 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#a9b88a";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 26; i++) {
      const x = w * 0.04 + r() * w * 0.25;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.66);
      ctx.quadraticCurveTo(
        x + 6,
        h * (0.55 - r() * 0.08),
        x + 10 * r(),
        h * (0.48 - r() * 0.1)
      );
      ctx.stroke();
    }
  },
  maple(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#24362f", "#5a6b4c");
    drawAtmosphericMist(ctx, w, h, 0.35, 0.35, "rgba(243, 228, 198, 0.14)");
    ctx.strokeStyle = "#cbb88f";
    ctx.lineWidth = w * 0.03;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 1.05);
    ctx.bezierCurveTo(w * 0.35, h * 0.75, w * 0.68, h * 0.55, w * 0.55, h * 0.3);
    ctx.stroke();
    const palette = ["#c8462c", "#e0793a", "#a83325", "#f0a14a"];
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = palette[Math.floor(r() * 4)];
      ctx.globalAlpha = 0.88;
      ctx.save();
      ctx.translate(r() * w, r() * h);
      ctx.rotate(r() * Math.PI * 2);
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = k * 1.256;
        ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
        ctx.lineTo(Math.cos(a + 0.63) * 2.5, Math.sin(a + 0.63) * 2.5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
  lamp(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#0d1424", "#1b2238");
    drawStarField(ctx, w, h, 34, r, "#cfd8ea");
    const cx = w * 0.5;
    const cy = h * 0.66;
    const glow = ctx.createRadialGradient(cx, cy - 4, 2, cx, cy - 4, h * 0.56);
    glow.addColorStop(0, "rgba(255,204,120,0.62)");
    glow.addColorStop(0.45, "rgba(255,186,100,0.2)");
    glow.addColorStop(1, "rgba(255,196,110,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffd58a";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 22);
    ctx.quadraticCurveTo(cx + 9, cy - 4, cx, cy + 4);
    ctx.quadraticCurveTo(cx - 9, cy - 4, cx, cy - 22);
    ctx.fill();
    ctx.fillStyle = "#3a2c22";
    ctx.fillRect(cx - 14, cy + 4, 28, 8);
    ctx.fillStyle = "#6e7b4c";
    ctx.save();
    ctx.translate(w * 0.28, h * 0.3);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
  field(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#e9c98d", "#f6e2b8");
    drawMoonHalo(ctx, w * 0.78, h * 0.42, h * 0.08, "#fff5d8", "rgba(255, 240, 198, 0.38)");
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? "#c79a3e" : "#b3862f";
      ctx.fillRect(0, h * (0.55 + i * 0.065), w, h * 0.07);
    }
    drawAtmosphericMist(ctx, w, h, 0.48, 0.16, "rgba(255, 243, 214, 0.28)");
    ctx.strokeStyle = "#6f8fa6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h);
    ctx.bezierCurveTo(w * 0.3, h * 0.8, w * 0.2, h * 0.65, w * 0.45, h * 0.56);
    ctx.stroke();
    ctx.fillStyle = "#5a3b22";
    ctx.beginPath();
    ctx.ellipse(w * 0.6, h * 0.6, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.6 + 12, h * 0.6 - 9, 7, 7);
    for (let i = 0; i < 12; i++) {
      const gx = w * (0.06 + r() * 0.88);
      const gy = h * (0.62 + r() * 0.34);
      ctx.strokeStyle = "rgba(90, 68, 28, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 3, gy - 8);
      ctx.stroke();
    }
  },
  pond(ctx, w, h) {
    drawSkyGradient(ctx, w, h, "#5f7369", "#8fa095");
    drawAtmosphericMist(ctx, w, h, 0.18, 0.28, "rgba(235, 242, 236, 0.16)");
    ctx.strokeStyle = "rgba(235,242,236,0.75)";
    ctx.lineWidth = 1.4;
    for (let i = 1; i <= 7; i++) {
      ctx.globalAlpha = Math.max(0.12, 1 - i * 0.12);
      ctx.beginPath();
      ctx.ellipse(w * 0.55, h * 0.55, i * w * 0.048, i * h * 0.029, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#3f5a47";
    [[0.2, 0.3], [0.8, 0.8], [0.25, 0.78]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(w * x, h * y, w * 0.045, 0.3, 6.0);
      ctx.lineTo(w * x, h * y);
      ctx.fill();
    });
  },
  starry(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#0b1326", "#22325a");
    drawStarField(ctx, w, h, 96, r, "#f3e6c4");
    for (let i = 0; i < 5; i++) {
      const x = w * (0.15 + r() * 0.7);
      const y = h * (0.1 + r() * 0.35);
      const s = 2 + r() * 2;
      ctx.fillStyle = "#fff4d6";
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(x, y - s * 2.4);
      ctx.lineTo(x + s * 0.5, y);
      ctx.lineTo(x, y + s * 2.4);
      ctx.lineTo(x - s * 0.5, y);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - s * 2.4, y);
      ctx.lineTo(x, y + s * 0.5);
      ctx.lineTo(x + s * 2.4, y);
      ctx.lineTo(x, y - s * 0.5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawMountainRidge(ctx, w, h, h * 0.86, h * 0.08, "#121a2e", r);
    ctx.strokeStyle = "rgba(200,214,240,0.35)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.62);
    ctx.bezierCurveTo(w * 0.35, h * 0.55, w * 0.6, h * 0.68, w * 0.95, h * 0.58);
    ctx.stroke();
  },
  snow(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#b9c4d2", "#e8ecf1");
    drawMountainRidge(ctx, w, h, h * 0.55, h * 0.18, "#9aa8b8", r);
    drawAtmosphericMist(ctx, w, h, 0.5, 0.2, "rgba(255, 255, 255, 0.34)");
    drawMountainRidge(ctx, w, h, h * 0.72, h * 0.12, "#c9d2dd", r);
    ctx.fillStyle = "#f4f6f9";
    ctx.fillRect(0, h * 0.8, w, h * 0.2);
    for (let i = 0; i < 9; i++) {
      const x = w * (0.08 + i * 0.11) + (r() - 0.5) * 10;
      const y = h * 0.8;
      ctx.strokeStyle = "#5d6a78";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - h * (0.06 + r() * 0.06));
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 76; i++) {
      ctx.globalAlpha = 0.5 + r() * 0.5;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h * 0.85, r() * 1.8 + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  boat(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#c8d3dc", "#eadfcd");
    drawMoonHalo(ctx, w * 0.25, h * 0.26, h * 0.045, "#fff8e8", "rgba(255, 245, 222, 0.3)");
    drawMountainRidge(ctx, w, h, h * 0.58, h * 0.1, "#8fa0a6", r);
    drawAtmosphericMist(ctx, w, h, 0.52, 0.14, "rgba(247, 243, 235, 0.38)");
    const sea = ctx.createLinearGradient(0, h * 0.6, 0, h);
    sea.addColorStop(0, "#7f98a6");
    sea.addColorStop(1, "#4f6b7a");
    ctx.fillStyle = sea;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
    ctx.strokeStyle = "rgba(240,244,246,0.52)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const y = h * (0.65 + r() * 0.3);
      const x = r() * w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 20 + r() * 30, y);
      ctx.stroke();
    }
    const bx = w * 0.48;
    const by = h * 0.74;
    ctx.fillStyle = "#3b3128";
    ctx.beginPath();
    ctx.moveTo(bx - 34, by);
    ctx.lineTo(bx + 34, by);
    ctx.lineTo(bx + 24, by + 9);
    ctx.lineTo(bx - 24, by + 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#3b3128";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx + 18, by);
    ctx.lineTo(bx + 30, by - 28);
    ctx.stroke();
  },
  path(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#d7e2d3", "#f1eadb");
    drawMountainRidge(ctx, w, h, h * 0.5, h * 0.14, "#a9b99a", r);
    drawAtmosphericMist(ctx, w, h, 0.44, 0.14, "rgba(247, 243, 235, 0.3)");
    drawMountainRidge(ctx, w, h, h * 0.68, h * 0.1, "#7f9a72", r);
    ctx.fillStyle = "#5f7d56";
    for (let i = 0; i < 14; i++) {
      const x = w * (0.55 + r() * 0.4);
      const y = h * (0.62 + r() * 0.1);
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x - 7, y);
      ctx.fill();
    }
    ctx.fillStyle = "#e9dcc0";
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h);
    ctx.bezierCurveTo(w * 0.42, h * 0.85, w * 0.36, h * 0.76, w * 0.52, h * 0.66);
    ctx.lineTo(w * 0.55, h * 0.66);
    ctx.bezierCurveTo(w * 0.42, h * 0.78, w * 0.52, h * 0.88, w * 0.5, h);
    ctx.fill();
    ctx.strokeStyle = "#7aa0b8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.86);
    ctx.bezierCurveTo(w * 0.2, h * 0.82, w * 0.3, h * 0.9, w * 0.42, h * 0.86);
    ctx.stroke();
    ctx.fillStyle = "#b8744f";
    [[0.2, 0.64], [0.26, 0.65]].forEach(([x, y]) => {
      ctx.fillRect(w * x, h * y, 12, 9);
      ctx.beginPath();
      ctx.moveTo(w * x - 2, h * y);
      ctx.lineTo(w * x + 6, h * y - 7);
      ctx.lineTo(w * x + 14, h * y);
      ctx.fill();
    });
  },
  sunpatch(ctx, w, h) {
    drawSkyGradient(ctx, w, h, "#d9c7ae", "#c4ad8f");
    ctx.fillStyle = "rgba(255,238,195,0.82)";
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h * 0.98);
    ctx.lineTo(w * 0.78, h * 0.98);
    ctx.lineTo(w * 0.68, h * 0.55);
    ctx.lineTo(w * 0.4, h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(196,173,143,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.54, h * 0.55);
    ctx.lineTo(w * 0.555, h * 0.98);
    ctx.moveTo(w * 0.36, h * 0.76);
    ctx.lineTo(w * 0.73, h * 0.76);
    ctx.stroke();
    ctx.fillStyle = "#a98e6d";
    ctx.fillRect(w * 0.12, h * 0.12, w * 0.2, h * 0.3);
    ctx.fillStyle = "#f6e7c4";
    ctx.fillRect(w * 0.135, h * 0.14, w * 0.17, h * 0.26);
    ctx.fillStyle = "#4d3c2e";
    const cx = w * 0.56;
    const cy = h * 0.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 22, cy - 8, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 16, cy - 14);
    ctx.lineTo(cx + 18, cy - 22);
    ctx.lineTo(cx + 22, cy - 15);
    ctx.moveTo(cx + 24, cy - 15);
    ctx.lineTo(cx + 28, cy - 22);
    ctx.lineTo(cx + 30, cy - 13);
    ctx.fill();
    ctx.strokeStyle = "#4d3c2e";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 2);
    ctx.quadraticCurveTo(cx - 40, cy + 2, cx - 34, cy - 10);
    ctx.stroke();
  },
  valley(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#cfd9dd", "#eef1ec");
    drawMountainRidge(ctx, w, h, h * 0.42, h * 0.16, "#9db0ad", r);
    drawAtmosphericMist(ctx, w, h, 0.36, 0.16, "rgba(247, 243, 235, 0.36)");
    ctx.fillStyle = "#6f8c7f";
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.5);
    ctx.quadraticCurveTo(w * 0.25, h * 0.45, w * 0.42, h * 0.62);
    ctx.lineTo(w * 0.42, h);
    ctx.fill();
    ctx.fillStyle = "#58756a";
    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(w, h * 0.46);
    ctx.quadraticCurveTo(w * 0.75, h * 0.44, w * 0.58, h * 0.64);
    ctx.lineTo(w * 0.58, h);
    ctx.fill();
    const stream = ctx.createLinearGradient(0, h * 0.6, 0, h);
    stream.addColorStop(0, "#dfeaec");
    stream.addColorStop(1, "#a9c4cc");
    ctx.fillStyle = stream;
    ctx.beginPath();
    ctx.moveTo(w * 0.47, h * 0.58);
    ctx.bezierCurveTo(w * 0.5, h * 0.72, w * 0.4, h * 0.82, w * 0.36, h);
    ctx.lineTo(w * 0.66, h);
    ctx.bezierCurveTo(w * 0.6, h * 0.82, w * 0.55, h * 0.72, w * 0.53, h * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const y = h * (0.66 + i * 0.035);
      const x = w * (0.46 + (r() - 0.5) * 0.06);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8 + r() * 10, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#7b6a58";
    [[0.5, 0.9], [0.56, 0.95]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.ellipse(w * x, h * y, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  },
  dawn(ctx, w, h, r) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#141c33");
    grad.addColorStop(0.55, "#3e4a6e");
    grad.addColorStop(0.85, "#d9a57f");
    grad.addColorStop(1, "#f2cf9f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = (1 - r() * 0.6) * 0.8;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h * 0.45, r() * 1.2 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const sx = w * 0.62;
    const sy = h * 0.86;
    const sun = ctx.createRadialGradient(sx, sy, 2, sx, sy, h * 0.4);
    sun.addColorStop(0, "rgba(255,230,185,0.88)");
    sun.addColorStop(1, "rgba(255,226,180,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
    drawMountainRidge(ctx, w, h, h * 0.9, h * 0.06, "#1f2438", r);
  },
  echo(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#f3e3d6", "#e8eef3");
    drawMountainRidge(ctx, w, h, h * 0.62, h * 0.24, "#c9b4ae", r);
    drawAtmosphericMist(ctx, w, h, 0.58, 0.16, "rgba(247, 243, 235, 0.3)");
    drawMountainRidge(ctx, w, h, h * 0.82, h * 0.14, "#8f9fa8", r);
    const px = w * 0.28;
    const py = h * 0.7;
    ctx.fillStyle = "#3c4650";
    ctx.beginPath();
    ctx.arc(px, py - 14, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - 2, py - 11, 4, 11);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.4;
    for (let i = 1; i <= 4; i++) {
      ctx.globalAlpha = 1 - i * 0.2;
      ctx.beginPath();
      ctx.arc(px + 6, py - 14, i * w * 0.07, -0.9, 0.2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  homelight(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#121a2c", "#2a3550");
    drawStarField(ctx, w, h, 28, r, "#e6ebf3");
    drawMoonHalo(ctx, w * 0.2, h * 0.25, h * 0.036, "#f5ecd8", "rgba(241, 212, 138, 0.22)");
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(0, h * 0.8, w, h * 0.2);
    const hx = w * 0.5;
    const hy = h * 0.8;
    const hw = w * 0.2;
    const hh = h * 0.24;
    ctx.fillStyle = "#454b60";
    ctx.fillRect(hx - hw / 2, hy - hh, hw, hh);
    ctx.beginPath();
    ctx.moveTo(hx - hw / 2 - 8, hy - hh);
    ctx.lineTo(hx, hy - hh - h * 0.12);
    ctx.lineTo(hx + hw / 2 + 8, hy - hh);
    ctx.closePath();
    ctx.fill();
    const wg = ctx.createRadialGradient(hx, hy - hh * 0.55, 2, hx, hy - hh * 0.55, h * 0.36);
    wg.addColorStop(0, "rgba(255,206,130,0.62)");
    wg.addColorStop(1, "rgba(255,206,130,0)");
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffd58a";
    ctx.fillRect(hx - hw * 0.2, hy - hh * 0.72, hw * 0.4, hh * 0.34);
    ctx.strokeStyle = "#454b60";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy - hh * 0.72);
    ctx.lineTo(hx, hy - hh * 0.38);
    ctx.moveTo(hx - hw * 0.2, hy - hh * 0.55);
    ctx.lineTo(hx + hw * 0.2, hy - hh * 0.55);
    ctx.stroke();
  },
  feather(ctx, w, h, r) {
    drawSkyGradient(ctx, w, h, "#26344f", "#e6b48a");
    drawStarField(ctx, w, h, 24, r, "#ffffff");
    ctx.save();
    ctx.translate(w * 0.5, h * 0.58);
    ctx.rotate(-0.5);
    ctx.strokeStyle = "#f7efe4";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.28);
    ctx.quadraticCurveTo(4, 0, 0, -h * 0.3);
    ctx.stroke();
    ctx.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      const y = -h * 0.26 + i * h * 0.019;
      const len = Math.sin((i / 26) * Math.PI) * w * 0.07 + 6;
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.moveTo(1, y);
      ctx.quadraticCurveTo(len * 0.6, y - 4, len, y - 10);
      ctx.moveTo(-1, y);
      ctx.quadraticCurveTo(-len * 0.6, y - 4, -len, y - 10);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
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
  const rand = createSeededRandom(work.id);
  const sceneFn = SCENES[work.art] || SCENES.pond;
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
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) out.push(current);
        current = word;
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

export function renderPostcardCanvas(canvas, work, highlightQuote, dateLabel) {
  if (!canvas || !work) return;
  const W = 720;
  const H = 960;
  const dpr = 2;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Warm hanji paper backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#faf7f0");
  bg.addColorStop(0.55, "#f7f3eb");
  bg.addColorStop(1, "#f0e8d8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Double editorial bookplate border
  ctx.strokeStyle = "rgba(185, 166, 136, 0.48)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = "rgba(185, 166, 136, 0.24)";
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, W - 64, H - 64);

  // Top artwork plate (616 x 385, 16:10 ratio)
  const artX = 52;
  const artY = 52;
  const artW = 616;
  const artH = 385;
  ctx.save();
  traceRoundedRect(ctx, artX, artY, artW, artH, 10);
  ctx.clip();
  ctx.translate(artX, artY);
  const rand = createSeededRandom(work.id);
  const sceneFn = SCENES[work.art] || SCENES.pond;
  sceneFn(ctx, artW, artH, rand);
  applyPoeticFinish(ctx, artW, artH, rand);
  ctx.restore();

  ctx.strokeStyle = "rgba(140, 126, 102, 0.28)";
  ctx.lineWidth = 1;
  traceRoundedRect(ctx, artX, artY, artW, artH, 10);
  ctx.stroke();

  // Artwork caption
  const caption = SCENE_CAPTIONS[work.art] || "";
  if (caption) {
    ctx.fillStyle = "#7a7267";
    ctx.font = '14px "Gowun Batang", Georgia, serif';
    ctx.textAlign = "center";
    ctx.fillText(caption, W / 2, 464);
  }

  // Ornamental divider
  ctx.strokeStyle = "rgba(185, 166, 136, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, 494);
  ctx.lineTo(W / 2 - 20, 494);
  ctx.moveTo(W / 2 + 20, 494);
  ctx.lineTo(W - 150, 494);
  ctx.stroke();
  ctx.fillStyle = "#b09975";
  ctx.font = '14px serif';
  ctx.textAlign = "center";
  ctx.fillText("✦", W / 2, 499);

  // Poem title & poet
  ctx.fillStyle = "#161a22";
  ctx.font = '700 30px "Gowun Batang", Georgia, serif';
  ctx.textAlign = "center";
  ctx.fillText(work.title, W / 2, 548);

  const bylineText = work.mine
    ? "이시우"
    : `${work.author}${work.life ? ` (${work.life})` : ""}`;
  ctx.fillStyle = "#666159";
  ctx.font = '15px "IBM Plex Sans KR", sans-serif';
  ctx.fillText(bylineText, W / 2, 580);

  // Quote lines (either underlined verse or first stanza up to 5 lines)
  const rawLines = highlightQuote
    ? highlightQuote.split("\n")
    : (work.lines || []).filter((l) => l.trim()).slice(0, 4);
  ctx.font = '23px "Gowun Batang", Georgia, serif';
  const wrapped = wrapCanvasLines(ctx, rawLines, 530).slice(0, 6);
  const lineH = 42;
  const blockH = wrapped.length * lineH;
  const quoteStartY = Math.max(638, 725 - blockH / 2 + 24);

  if (highlightQuote) {
    // Subtle warm paper highlight behind user's underlined verse
    const boxPadY = 20;
    const boxTop = quoteStartY - 30 - boxPadY;
    const boxH = blockH + boxPadY * 2 - 6;
    ctx.fillStyle = "rgba(229, 178, 99, 0.14)";
    traceRoundedRect(ctx, 84, boxTop, W - 168, boxH, 10);
    ctx.fill();
  }

  ctx.fillStyle = "#161a22";
  ctx.textAlign = "center";
  wrapped.forEach((line, idx) => {
    ctx.fillText(line, W / 2, quoteStartY + idx * lineH);
  });

  // Bottom editorial footer & red seal stamp
  ctx.strokeStyle = "rgba(223, 214, 197, 0.9)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 856);
  ctx.lineTo(W - 56, 856);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#666159";
  ctx.font = '14px "Gowun Batang", Georgia, serif';
  ctx.fillText("시인의 우체통 · 잠시 나를 만나는 시간", 56, 896);
  if (dateLabel) {
    ctx.fillStyle = "#8a8174";
    ctx.font = '13px "IBM Plex Sans KR", sans-serif';
    ctx.fillText(dateLabel, 56, 918);
  }

  // Vermilion poet seal
  const sealX = W - 108;
  const sealY = 876;
  ctx.save();
  ctx.strokeStyle = "#b53829";
  ctx.lineWidth = 1.6;
  traceRoundedRect(ctx, sealX, sealY, 50, 46, 5);
  ctx.stroke();
  ctx.fillStyle = "rgba(201, 70, 53, 0.08)";
  ctx.fill();
  ctx.fillStyle = "#a32f21";
  ctx.font = '700 13px "Gowun Batang", Georgia, serif';
  ctx.textAlign = "center";
  ctx.fillText("시인", sealX + 25, sealY + 20);
  ctx.fillText("우체통", sealX + 25, sealY + 37);
  ctx.restore();
}
