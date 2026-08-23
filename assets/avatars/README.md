# Avatar source sheets

Watercolor, faceless portrait sheets used to generate the testimonial portraits in
`public/reviews/`. These are **source art only** — they are intentionally kept out of
`public/` so they are not served or bundled into the build.

## Files

- `individuals.png` — 1536×1024, a clean **8 columns × 4 rows** grid of 32 solo portraits.
  Every cell is exactly **192×256** (`col*192, row*256`).
- `couples.png` — 1536×1024, **4 rows** of couple portraits. The layout is **irregular**
  (rows mix 2-person couples with a larger group), so cells are not uniform — crop by eye.

## How the current testimonial portraits were made

Each portrait in `public/reviews/*.png` is cut from a cell using a **uniform crop window**
so every solo avatar ends up the same size with the head in the same position:

- Solo crop window (cell-relative): `x 6..186, y 12..250` → head + shoulders/chest, hard
  bottom edge (no fade — the bust simply ends at the crop line).
- Background keyed to transparent by flooding from the **top/left/right borders only**
  (`step_tol=15`) — deliberately *not* the bottom, so clothing that runs off the bottom
  edge stays solid instead of tearing. Then keep-largest-connected-component (drops stray
  wisps from neighbouring cells), fill enclosed holes, morphological close, light 0.8px
  feather, and scale to **560px tall** RGBA.

Result: all five solo portraits are **424×560**; the couple is wider (`692×560`) because it
holds two people. Each figure sits on the sage section background as a solid bust.

Note: this keying can only keep clothing that differs in colour from the warm background, so
**pick source cells with solid, coloured tops** — near-white/cream tops (e.g. cells `2,0`
and `0,2`) key away and leave a ghostly torso.

### Reviewer → source cell mapping (`individuals.png`, `row,col` 0-indexed)

| Reviewer      | File                        | Cell    | Notes                          |
| ------------- | --------------------------- | ------- | ------------------------------ |
| Priya         | `reviews/priya.png`         | `0,0`   | wavy brown hair, green top     |
| Ishita        | `reviews/ishita.png`        | `2,2`   | brown bob, blue top            |
| Aditya        | `reviews/aditya.png`        | `1,1`   | dark hair, denim jacket        |
| Fatima        | `reviews/fatima.png`        | `3,3`   | brown bob, terracotta top      |
| Karthik       | `reviews/karthik.png`       | `2,4`   | dark curly hair, yellow tee    |

### Couple (`couples.png`)

| Reviewer      | File                        | Region (x0,y0,x1,y1) | Notes                     |
| ------------- | --------------------------- | -------------------- | ------------------------- |
| Rahul & Sneha | `reviews/rahul-sneha.png`   | `6,12,300,250`       | denim man + olive-top woman (top-left) |

27 more individuals and several more couples remain unused if you want to reuse these
elsewhere (e.g. expert or user-profile avatars).
</content>
</invoke>
