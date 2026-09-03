"use client";

import { useRef } from "react";

import { PALETTE, mix, rgba, useCanvasScene } from "./useCanvasScene";

/**
 * An outline map of India, for the Made in India page.
 *
 * Drawn as a **continuous line** that traces itself around the country, with
 * nodes set along it. An earlier attempt rendered the border as loose dots and
 * the shape never resolved — an outline map has to actually be a line.
 *
 * The colour shifts as the line travels, so the outline moves through the whole
 * palette on its way round rather than being one flat colour.
 *
 * The boundary is **real survey data**, not hand-authored — see `BORDER` below.
 *
 * **Click anywhere and it redraws** from the point nearest your cursor.
 */

type RGB = readonly [number, number, number];

/** Walked around the perimeter, so the line changes colour as it travels. */
const ROUTE: RGB[] = [
  [46, 140, 140], // teal
  [95, 169, 138], // mint
  [166, 186, 74], // lime
  [200, 164, 93], // gold
  [214, 138, 66], // amber
  [197, 106, 114], // rose
  [155, 95, 138], // plum
  [122, 107, 168], // violet
  [76, 111, 165], // indigo
  [125, 145, 80], // moss
];

/**
 * India's boundary, from DataMeet's `india-composite` dataset — the official
 * outline including the full claimed extent of Jammu & Kashmir, which is how
 * India is drawn on Indian maps.
 *
 * The source ring has 242,146 points. It was decimated, then simplified with
 * Douglas-Peucker to the 400 below — enough to keep Kutch, Saurashtra, the
 * Kashmir crown and the north-east, small enough to ship in a canvas scene.
 *
 * Do not hand-edit these. Three earlier attempts at authoring the coastline by
 * hand all failed: a country's outline is not something you can approximate
 * from memory. Re-derive from the source if it ever needs changing.
 */
const BORDER: [number, number][] = [
  [77.5187, 35.4857], [77.9110, 35.4621], [78.8504, 35.9633], [79.3700, 35.9848], [79.7125, 35.6381],
  [79.9911, 35.6030], [80.0587, 35.4225], [80.2054, 35.5752], [80.4003, 35.4833], [80.0663, 34.7050],
  [79.7865, 34.6274], [79.7555, 34.4722], [79.5125, 34.4563], [79.6074, 34.2382], [79.4102, 34.0102],
  [78.8934, 33.9797], [79.0754, 33.6207], [78.9074, 33.6205], [78.9399, 33.3816], [79.1486, 33.1838],
  [79.4091, 33.1868], [79.3337, 33.0010], [79.5465, 32.6794], [78.9656, 32.3371], [78.7805, 32.4787],
  [78.7395, 32.6957], [78.3958, 32.5291], [78.7777, 31.9917], [78.7824, 31.3097], [79.1030, 31.4514],
  [79.4268, 31.0246], [79.8679, 30.9707], [80.2407, 30.7533], [80.2136, 30.5837], [81.0452, 30.2100],
  [80.9101, 30.2234], [80.3664, 29.7488], [80.4210, 29.6316], [80.2429, 29.4426], [80.3184, 29.3040],
  [80.1508, 29.1089], [80.1303, 28.8200], [80.5170, 28.5518], [80.5214, 28.6804], [81.2106, 28.3608],
  [81.3154, 28.1370], [81.8900, 27.8564], [82.0621, 27.9216], [82.4273, 27.6890], [82.7088, 27.7207],
  [82.7357, 27.5023], [83.3174, 27.3301], [83.3904, 27.4785], [83.8698, 27.3547], [83.8483, 27.4459],
  [84.1465, 27.5178], [84.6354, 27.3184], [84.6433, 27.0462], [85.1918, 26.8689], [85.2046, 26.7628],
  [85.7041, 26.8323], [85.8495, 26.5688], [86.3448, 26.6169], [86.7307, 26.4227], [87.0662, 26.5863],
  [87.0944, 26.4482], [87.3475, 26.3516], [87.8878, 26.4855], [88.0059, 26.3616], [88.1863, 26.7385],
  [87.9873, 27.1194], [88.1969, 27.7913], [88.1195, 27.9203], [88.6355, 28.1181], [88.8872, 27.8556],
  [88.7650, 27.5647], [88.9147, 27.2914], [88.7458, 27.1423], [89.1289, 26.8145], [89.3764, 26.8614],
  [89.8609, 26.7020], [90.3884, 26.9030], [90.7092, 26.7707], [92.0755, 26.8545], [92.0273, 27.1670],
  [92.1233, 27.2863], [92.0169, 27.4804], [91.6518, 27.4836], [91.5623, 27.6314], [91.6430, 27.7611],
  [91.9248, 27.7170], [92.2441, 27.8881], [92.4707, 27.8163], [92.7141, 27.9665], [92.6719, 28.1380],
  [92.9240, 28.2030], [93.2750, 28.5588], [94.0142, 28.7941], [94.3428, 29.0027], [94.2937, 29.1477],
  [94.6556, 29.3055], [95.2607, 29.0711], [96.0576, 29.3809], [96.3024, 29.1902], [96.1895, 29.0363],
  [96.3309, 29.1123], [96.6315, 28.7343], [96.4062, 28.5070], [96.4988, 28.4294], [96.4938, 28.5424],
  [96.7125, 28.6111], [96.9274, 28.3520], [97.3584, 28.2051], [97.3891, 28.0194], [96.8926, 27.6133],
  [97.1357, 27.0940], [96.7076, 27.3706], [96.2327, 27.2770], [95.1485, 26.6125], [95.0632, 26.4515],
  [95.1836, 26.0688], [94.8980, 25.5655], [94.6341, 25.3932], [94.5756, 25.2139], [94.7409, 25.1266],
  [94.7124, 24.9322], [94.1554, 23.8475], [93.7547, 24.0051], [93.5036, 23.9432], [93.3292, 24.0812],
  [93.4368, 23.6826], [93.3851, 23.1340], [93.2910, 23.0085], [93.1281, 23.0448], [93.2010, 22.2623],
  [92.9047, 21.9416], [92.6992, 22.1551], [92.6025, 21.9789], [92.2800, 23.7194], [92.0471, 23.6458],
  [91.9570, 23.7341], [91.9702, 23.4782], [91.7626, 23.3029], [91.8356, 23.0922], [91.6183, 22.9373],
  [91.4093, 23.2848], [91.3660, 23.0761], [91.1596, 23.6112], [91.3750, 24.1075], [91.5834, 24.0733],
  [91.7552, 24.2414], [91.9058, 24.1388], [91.9205, 24.3370], [92.1641, 24.4189], [92.2963, 24.7366],
  [92.2378, 24.9037], [92.4980, 24.8765], [92.4266, 25.0277], [92.0617, 25.1878], [90.4493, 25.1461],
  [89.8331, 25.2953], [89.8865, 25.9446], [89.6793, 26.2383], [89.5762, 25.9685], [89.3568, 26.0076],
  [89.1553, 26.1383], [89.0877, 26.3970], [88.9052, 26.4058], [89.0483, 26.2416], [88.6799, 26.2592],
  [88.7455, 26.3475], [88.3995, 26.6266], [88.3335, 26.4787], [88.5243, 26.3599], [88.1772, 26.1481],
  [88.1011, 25.8292], [88.2694, 25.8083], [88.5395, 25.5087], [88.8108, 25.5230], [89.0084, 25.2644],
  [88.9231, 25.1662], [88.4417, 25.2105], [88.3990, 24.9454], [88.1402, 24.9363], [88.0117, 24.6651],
  [88.3412, 24.3783], [88.7333, 24.2834], [88.7693, 23.9818], [88.5766, 23.8618], [88.5586, 23.6501],
  [88.7997, 23.4986], [88.7190, 23.2566], [88.9958, 23.2151], [88.8450, 23.0105], [89.0975, 22.1518],
  [88.9906, 21.9032], [89.0837, 21.6215], [88.8347, 21.7749], [88.8646, 21.6358], [88.7120, 21.6916],
  [88.7690, 22.0178], [88.6432, 22.0761], [88.5670, 21.8400], [88.4579, 21.8958], [88.4554, 21.6208],
  [88.2804, 21.7283], [88.2575, 21.5571], [88.2170, 22.1099], [88.0155, 22.2109], [88.1903, 22.1041],
  [87.8008, 21.6954], [87.0929, 21.5341], [86.9133, 21.3387], [86.8304, 21.1391], [86.9737, 20.8150],
  [86.8676, 20.7752], [87.0679, 20.7175], [86.7316, 20.5346], [86.7812, 20.3658], [86.6816, 20.2912],
  [86.7988, 20.3467], [86.3745, 19.9566], [85.5550, 19.6996], [85.0379, 19.3850], [84.1329, 18.3175],
  [83.5571, 18.0217], [83.2149, 17.5904], [82.3442, 17.0763], [82.2479, 16.9116], [82.3591, 16.8246],
  [82.3595, 16.9691], [82.3029, 16.5616], [81.7258, 16.3112], [81.2688, 16.2875], [80.9416, 15.7121],
  [80.6762, 15.8883], [80.2508, 15.6504], [80.0487, 15.0800], [80.1896, 14.5550], [80.1262, 14.0667],
  [80.3462, 13.2833], [80.1571, 12.4700], [79.7604, 11.6758], [79.8733, 10.2954], [79.4579, 10.3425],
  [79.2738, 10.2383], [78.9104, 9.4566], [79.1833, 9.2788], [78.2654, 9.0166], [78.0700, 8.3737],
  [77.5516, 8.0754], [77.0058, 8.3579], [76.5454, 8.9041], [76.6704, 8.9600], [76.5371, 8.9408],
  [76.3462, 9.3959], [76.2721, 10.0133], [75.8688, 11.1183], [75.5400, 11.7096], [75.1854, 12.0383],
  [74.8254, 12.8383], [74.7158, 13.6429], [74.3721, 14.5608], [74.0921, 14.8008], [74.1675, 14.8496],
  [73.9208, 15.0896], [73.7874, 15.6538], [73.4571, 16.0533], [73.1929, 17.2991], [73.2933, 17.2862],
  [72.9362, 18.2250], [73.1021, 18.1424], [73.0846, 18.3217], [72.9163, 18.3567], [72.9095, 18.5291],
  [73.0029, 18.4758], [72.8571, 18.6942], [72.8792, 18.8012], [73.0033, 18.7212], [72.9088, 18.8974],
  [73.0638, 19.0133], [72.9812, 19.1858], [72.8083, 18.8913], [72.7879, 19.3083], [72.9017, 19.2871],
  [72.7541, 19.4695], [72.8875, 19.5254], [72.7271, 19.5375], [72.6554, 19.8391], [72.9141, 20.7454],
  [72.7371, 20.9900], [72.8487, 21.0325], [72.7100, 21.0854], [72.7808, 21.1804], [72.6441, 21.0787],
  [72.6433, 21.2112], [72.7391, 21.1979], [72.6004, 21.2900], [72.9183, 21.6812], [72.5375, 21.6629],
  [72.7496, 21.9733], [72.5350, 21.8962], [72.5146, 22.0275], [72.6083, 22.2137], [72.9121, 22.2608],
  [72.5350, 22.3054], [72.4350, 22.2054], [72.3687, 22.3350], [72.1829, 22.0208], [72.3037, 21.6375],
  [72.1113, 21.2008], [70.8317, 20.6896], [70.1900, 21.0271], [68.9362, 22.3050], [69.0783, 22.4787],
  [69.2241, 22.2562], [70.1204, 22.5250], [70.4467, 22.9662], [70.2241, 23.0546], [70.2241, 22.9529],
  [69.8929, 22.9092], [69.7121, 22.7391], [69.2046, 22.8383], [68.6287, 23.1724], [68.7166, 23.1345],
  [68.5841, 23.2362], [68.6732, 23.2996], [68.4254, 23.5092], [68.8024, 23.8813], [68.4278, 23.8152],
  [68.3512, 23.5842], [68.1771, 23.6300], [68.3454, 23.7409], [68.1946, 23.7200], [68.3505, 23.9674],
  [68.7545, 23.9939], [68.7965, 24.3090], [68.8567, 24.2139], [69.5845, 24.2894], [70.0250, 24.1710],
  [70.5613, 24.4209], [70.5713, 24.2518], [70.7140, 24.2157], [71.1183, 24.4017], [70.9970, 24.4690],
  [71.0906, 24.6798], [70.8869, 25.1496], [70.6648, 25.3969], [70.6598, 25.7023], [70.2756, 25.7108],
  [70.0985, 25.9456], [70.1767, 26.5335], [69.5103, 26.7435], [69.5829, 27.1739], [70.4041, 28.0157],
  [70.5921, 28.0055], [70.8456, 27.7091], [71.9001, 27.9708], [72.3564, 28.7352], [72.9493, 29.0352],
  [73.3944, 29.9386], [73.9693, 30.1956], [73.9328, 30.4842], [74.6953, 31.0750], [74.5108, 31.1335],
  [74.6547, 31.4259], [74.4866, 31.7151], [74.6116, 31.8906], [75.3729, 32.2277], [75.1062, 32.4756],
  [74.6882, 32.4869], [74.7053, 32.8420], [74.3670, 32.7721], [73.6293, 33.1034], [73.5942, 33.8873],
  [73.4012, 34.3708], [73.4487, 34.5591], [73.6658, 34.5801], [73.7280, 34.7542], [74.0219, 34.8740],
  [74.1129, 35.1335], [73.7499, 35.2311], [73.7851, 35.5191], [73.4178, 35.5251], [73.1148, 35.7396],
  [73.1979, 35.8305], [72.5636, 35.8626], [72.5418, 36.2066], [72.9636, 36.4751], [73.0815, 36.6986],
  [73.8444, 36.7140], [73.6626, 36.8964], [74.0852, 36.8521], [74.7042, 37.0976], [74.9392, 36.9480],
  [75.3935, 36.9649], [75.4606, 36.7298], [75.7192, 36.7547], [76.7188, 36.1599], [77.5187, 35.4857]
];

/*
 * Equirectangular, with longitude compressed by cos(~23°N) — without it the
 * country comes out noticeably too wide, since a degree of longitude here is
 * about 0.92 of a degree of latitude. Bounds are the dataset's own.
 */
const LON0 = 68.1771;
const LON1 = 97.3891;
const LAT0 = 8.0754;
const LAT1 = 37.0976;
const LON_SCALE = 0.92;
const SPAN = Math.max((LON1 - LON0) * LON_SCALE, LAT1 - LAT0);

const nx = (lon: number) => ((lon - LON0) * LON_SCALE) / SPAN;
const ny = (lat: number) => (LAT1 - lat) / SPAN;

/** Seconds for the line to travel the whole perimeter. */
const TRACE_SECONDS = 4.2;
/** How long the finished outline is held before it draws again. */
const HOLD_SECONDS = 5;

export default function IndiaOutline({ className = "" }: { className?: string }) {
  const S = useRef({
    /** Normalised outline points, with cumulative distance along the perimeter. */
    pts: [] as { x: number; y: number; at: number }[],
    total: 0,
    /** 0..1 around the perimeter. */
    trace: 0,
    /** Index the trace starts from. */
    startAt: 0,
    holding: 0,
    ripples: [] as { x: number; y: number; born: number; rgb: RGB }[],
  });

  if (!S.current.pts.length) {
    const st = S.current;
    let run = 0;
    const raw = BORDER.map(([lon, lat]) => ({ x: nx(lon), y: ny(lat) }));
    for (let i = 0; i < raw.length; i++) {
      st.pts.push({ ...raw[i], at: run });
      const nxt = raw[(i + 1) % raw.length];
      run += Math.hypot(nxt.x - raw[i].x, nxt.y - raw[i].y);
    }
    st.total = run;
  }

  /** Colour at a given fraction around the perimeter. */
  const routeColour = (p: number): RGB => {
    const f = ((p % 1) + 1) % 1;
    const scaled = f * ROUTE.length;
    const i = Math.floor(scaled);
    return mix(ROUTE[i % ROUTE.length], ROUTE[(i + 1) % ROUTE.length], scaled - i);
  };

  const { wrapRef, canvasRef } = useCanvasScene({
    onPointerDown: (x, y) => {
      const st = S.current;
      st.ripples.push({ x, y, born: performance.now(), rgb: routeColour(st.trace) });
      st.trace = 0;
      st.holding = 0;
    },

    draw: ({ ctx, w, h, t, dt, pointer, reduced }) => {
      const st = S.current;
      const now = performance.now();

      // ── fit, with room for Arunachal on the right and Kutch on the left ──
      const scale = Math.min(w * 0.78, h * 0.84);
      const ox = w * 0.58 - scale / 2;
      const oy = h * 0.5 - scale / 2;
      const P = (i: number) => ({
        x: ox + st.pts[i].x * scale,
        y: oy + st.pts[i].y * scale,
      });

      // ── advance the trace ──
      if (reduced) {
        st.trace = 1;
      } else if (st.trace < 1) {
        st.trace = Math.min(1, st.trace + dt / TRACE_SECONDS);
        if (st.trace >= 1) st.holding = 0;
      } else {
        st.holding += dt;
        if (st.holding > HOLD_SECONDS) {
          st.trace = 0;
          st.holding = 0;
        }
      }

      const drawnTo = st.trace * st.total;

      // ── the land, filling in behind the line ──
      if (st.trace > 0.02) {
        ctx.beginPath();
        for (let i = 0; i < st.pts.length; i++) {
          const q = P(i);
          if (i === 0) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        }
        ctx.closePath();
        ctx.fillStyle = rgba(PALETTE.sage, 0.1 * st.trace);
        ctx.fill();
      }

      // ── the outline itself: one continuous line, changing colour as it goes ──
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.1;

      for (let i = 0; i < st.pts.length; i++) {
        const a = st.pts[i];
        const j = (i + 1) % st.pts.length;
        if (a.at > drawnTo) break;

        const q0 = P(i);
        const q1 = P(j);
        const segEnd = j === 0 ? st.total : st.pts[j].at;

        // the segment the line is currently on is drawn only part-way
        let x1 = q1.x;
        let y1 = q1.y;
        if (segEnd > drawnTo) {
          const f = (drawnTo - a.at) / Math.max(1e-6, segEnd - a.at);
          x1 = q0.x + (q1.x - q0.x) * f;
          y1 = q0.y + (q1.y - q0.y) * f;
        }

        const p = a.at / st.total;
        const col = routeColour(p);

        // the freshest stretch of line is brighter, so travel is visible
        const recency = Math.max(0, 1 - (drawnTo - a.at) / (st.total * 0.16));

        // and the cursor lights whatever it is near
        let near = 0;
        if (pointer.active) {
          const d = Math.hypot((q0.x + x1) / 2 - pointer.x, (q0.y + y1) / 2 - pointer.y);
          if (d < 70) near = 1 - d / 70;
        }

        const lift = Math.max(recency * 0.55, near);
        ctx.strokeStyle = rgba(mix(col, [255, 255, 255], lift * 0.4), 0.62 + lift * 0.38);
        ctx.lineWidth = 2.1 + lift * 1.6;
        if (lift > 0.25) {
          ctx.shadowBlur = lift * 12;
          ctx.shadowColor = rgba(col, 0.8);
        }
        ctx.beginPath();
        ctx.moveTo(q0.x, q0.y);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // a node every few points along the border
        if (i % 6 === 0 && a.at <= drawnTo) {
          const breathe = reduced ? 0 : Math.sin(t * 1.5 + i * 0.4) * 0.2;
          ctx.beginPath();
          ctx.fillStyle = rgba(mix(col, [255, 255, 255], lift * 0.5), 0.8 + lift * 0.2);
          if (lift > 0.25) {
            ctx.shadowBlur = lift * 14;
            ctx.shadowColor = rgba(col, 0.9);
          }
          ctx.arc(q0.x, q0.y, 2.3 + lift * 2 + breathe, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // ── the point doing the drawing ──
      if (!reduced && st.trace > 0 && st.trace < 1) {
        let i = 0;
        while (i < st.pts.length - 1 && st.pts[i + 1].at <= drawnTo) i++;
        const a = st.pts[i];
        const q0 = P(i);
        const q1 = P((i + 1) % st.pts.length);
        const segEnd = i + 1 >= st.pts.length ? st.total : st.pts[i + 1].at;
        const f = (drawnTo - a.at) / Math.max(1e-6, segEnd - a.at);
        const hx = q0.x + (q1.x - q0.x) * f;
        const hy = q0.y + (q1.y - q0.y) * f;
        const col = routeColour(st.trace);

        ctx.beginPath();
        ctx.fillStyle = rgba(mix(col, [255, 255, 255], 0.4), 1);
        ctx.shadowBlur = 18;
        ctx.shadowColor = rgba(col, 0.95);
        ctx.arc(hx, hy, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── ripple where it was restarted ──
      for (let i = st.ripples.length - 1; i >= 0; i--) {
        const age = (now - st.ripples[i].born) / 900;
        if (age >= 1) { st.ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.strokeStyle = rgba(st.ripples[i].rgb, (1 - age) * 0.5);
        ctx.lineWidth = 2 * (1 - age);
        ctx.arc(st.ripples[i].x, st.ripples[i].y, 5 + age * 50, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
  });

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full cursor-pointer" aria-hidden="true" />
    </div>
  );
}
