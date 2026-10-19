---
name: Emoraa
description: Your emotions matter. Online therapy for India, in your language.
colors:
  forest-950: "#06211C"
  forest-900: "#0A2E28"
  forest-800: "#0E3B33"
  forest-700: "#13483E"
  forest-600: "#1A5A4D"
  forest-500: "#247261"
  forest-100: "#E3EDE8"
  ivory: "#F7F4EE"
  ivory-light: "#FCFAF6"
  ivory-dark: "#EFEAE0"
  sage: "#A8C3B5"
  sage-light: "#D9E6DE"
  sage-dark: "#86A593"
  gold: "#C8A45D"
  gold-light: "#DCC28C"
  gold-dark: "#A98943"
  ink: "#1F2D28"
  region-indigo: "#4C6FA5"
  region-violet: "#7A6BA8"
  region-teal: "#2E8C8C"
  region-rose: "#C56A72"
  region-plum: "#9B5F8A"
  region-moss: "#7D9150"
  region-mint: "#5FA98A"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.6rem, 6vw, 5.5rem)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.25
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.75
  body-article:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.075rem"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.22em"
  field-label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    letterSpacing: "0.14em"
  deva:
    fontFamily: "Tiro Devanagari Hindi, serif"
    fontWeight: 400
rounded:
  pill: "9999px"
  panel: "24px"
  card: "16px"
  control: "12px"
spacing:
  gutter: "20px"
  gutter-sm: "32px"
  section: "56px"
  section-md: "96px"
  page-top: "96px"
  page-top-md: "128px"
  measure: "68ch"
components:
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.forest-950}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-gold-hover:
    backgroundColor: "{colors.gold-dark}"
    textColor: "{colors.forest-950}"
  button-forest:
    backgroundColor: "{colors.forest-800}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-forest-hover:
    backgroundColor: "{colors.forest-700}"
  button-outline:
    textColor: "{colors.forest-800}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-outline-hover:
    backgroundColor: "{colors.forest-800}"
    textColor: "{colors.ivory}"
  input:
    backgroundColor: "{colors.ivory-light}"
    textColor: "{colors.forest-900}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.ivory-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  chip:
    backgroundColor: "{colors.sage-light}"
    textColor: "{colors.forest-800}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-choice:
    textColor: "{colors.forest-800}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  chip-choice-selected:
    backgroundColor: "{colors.forest-800}"
    textColor: "{colors.ivory}"
  nav-scrolled:
    backgroundColor: "{colors.ivory}"
    textColor: "{colors.forest-900}"
    padding: "12px 0"
  nav-open:
    backgroundColor: "{colors.forest-900}"
    textColor: "{colors.ivory}"
---

# Design System: Emoraa

## Overview

**Creative North Star: "The Living Mind"**

A mind is many regions with different feelings, all connected, and calm until something stirs it. Emoraa's surface works the same way. At rest it is quiet: warm ivory paper with a faint film grain, deep forest type set in Fraunces, and a single thread of gold. Colour is something you earn by interacting. The home-page brain shows its eight region colours only when touched, and those same eight colours then reappear across the site as a language: each service, each lane in `/services` and each canvas scene borrows the region whose feeling it shares. That makes the services read as parts of one mind, not items in a product list.

The system is unhurried and editorial. There is plenty of room to breathe, a serif display face carries the emotional voice, and the sans body text is set large (17px, line-height 1.75) because people read here when they are tired or anxious. Every page hero has a live canvas scene built on the shared `useCanvasScene` machinery. Each scene uses a *different mechanic* (wave, weave, ink, steam, ripple, lanes), not a different silhouette, and each one encodes real data from the page it sits on.

Visual anti-references: never clinical (white and blue, medical portal), never cute wellness-app (pastel blobs, mascots, streaks, cartoons), never startup SaaS (purple gradients, glassy feature grids, stock-photo teams).

**Key Characteristics:**
- Ivory paper ground with fixed film grain (4.5% opacity), forest ink, gold as the single warm accent.
- Eight brain-region colours, used only where they carry meaning (which format, which feeling), never as decoration.
- Fraunces display at weight 500, tight tracking, line-height 1.04, with Devanagari accents in Tiro.
- Pill buttons, softly rounded cards, hairline forest borders at 10% opacity.
- Softly layered: cards rest on a quiet forest-tinted lift shadow, and bloom with a 4px rise on hover.
- Motion uses one easing curve (silk) and always respects `prefers-reduced-motion`, which freezes position, not just progress.

## Colors

A warm, low-saturation forest-and-paper base, with one gold accent and a reserve of eight emotional hues that appear only when they mean something.

### Primary
- **Deep Forest** (forest-800): brand ink. Primary buttons, display headings (forest-900), links, focus borders on inputs. forest-900/950 provide the dark grounds: the open mobile menu, dark CTA bands and the footer.
- **Forest Mist** (forest-100): tinted surface for icon wells and the safety-notice launcher.

### Secondary
- **Temple Gold** (gold): the one warm accent. Main call to action (gold button with forest-950 text), the 48px gold rule, the focus outline on every element, blockquote rules and text selection (30% gold). It also serves as the amber region of the brain palette, so gold and the brain colours belong to the same family.

### Tertiary
- **Region hues** (region-indigo, violet, teal, rose, plum, moss, mint; amber = gold): defined once in `lib/palette.ts` and mapped to services by `SERVICE_REGION`. Each region carries a feeling (indigo = focus, rose = joy, fear and love, mint = breath and safety). Used for canvas scenes, service markers and lanes, and always tied to the meaning of the region.

### Neutral
- **Ivory Paper** (ivory): the page background everywhere.
- **Ivory Light** (ivory-light): cards, inputs, dropdowns, sheets. One step brighter than the page, so a surface reads as raised without needing a shadow.
- **Ivory Dark** (ivory-dark): rare recessed bands.
- **Sage** (sage, sage-light, sage-dark): soft hover washes (sage-light at 40%) and muted secondary text on dark grounds.
- **Ink** (ink): body text. Use ink/85 for article copy, ink/70 for hints, ink/35 for placeholders.

### Named Rules
**The Earned Colour Rule.** At rest, the screen is ivory, forest and gold. Region hues appear when the user interacts with something, or when a colour encodes meaning (which service, which feeling). Never use them as decoration or as a gradient fill.

**The One Gold Rule.** Gold marks the single most important action or accent in a view: one gold button, one gold rule. Two gold calls to action competing in one viewport break the hierarchy.

**The Single Source Rule.** Region colours are read from `lib/palette.ts` (`REGIONS`), and canvases use `PALETTE` from `useCanvasScene`. Never retype a hex value in a component.

## Typography

**Display Font:** Fraunces (fallback Georgia, serif), normal and italic
**Body Font:** Plus Jakarta Sans (fallback system-ui, sans-serif)
**Devanagari Font:** Tiro Devanagari Hindi (fallback serif), weight 400

**Character:** A warm, slightly literary variable serif paired with a clear, friendly geometric sans. The serif speaks; the sans explains. Tiro brings a calligraphic Devanagari that sits beside Fraunces as an equal, not as a translation.

### Hierarchy
- **Display** (500, clamp(2.6rem, 6vw, 5.5rem), 1.04): page heroes only. One per page.
- **Headline** (500, 2.25rem rising to 3rem at md, 1.04): section headings, via `.h-display` plus `text-4xl md:text-5xl`.
- **Title** (500, about 1.35–1.5rem): card headings and mobile menu groups, in Fraunces.
- **Body** (400, 17px, 1.75): all interface prose. Article copy in `.prose-mm` is 1.075rem / 1.9 at ink/85, with a 68ch measure, a Fraunces drop cap on the first paragraph, and italic Fraunces blockquotes behind a gold rule.
- **Label** (600, 0.72rem, 0.22em tracking, uppercase, forest-600): the `.eyebrow` above section headings. Field labels use 0.78rem with 0.14em tracking at ink/70.
- **Small UI text** (0.8–0.95rem): hints, metadata and button text (0.95rem, 600, tracking-wide).

### Named Rules
**The Serif Speaks Rule.** Feeling and invitation go in Fraunces; instructions, data and controls go in Jakarta. Don't set form labels, prices or error messages in the display face.

**The Equal Script Rule.** Devanagari (`font-deva`) is typeset with the same care as Latin. It is never a smaller, fainter decoration.

## Layout

- **Containers:** `.wrap` (max-width 72rem) for content, `.wrap-wide` (80rem) for the header and wide grids. Side gutters are 20px on phones and 32px from sm up.
- **Vertical rhythm:** `.section` gives 56px of padding on phones and 96px from md up. Every page starts with `.page-top` (96 / 112 / 128px), which clears the fixed 84px header with deliberate breathing room. Don't invent ad-hoc `pt-36`-style offsets.
- **Measure:** long text is capped at 68ch.
- **Header:** fixed, transparent over the hero. Once scrolled it becomes ivory at 95% with a hairline border, frosted on desktop and solid on phones. The open mobile menu is a full forest-900 sheet with Fraunces group titles.
- **Heroes:** a live canvas scene sits behind or beside the headline, following the placement contract in `CODEBASE_CONTEXT.md`: pointer events reach the canvas, and decorative washes never swallow clicks.
- **Mobile first:** inputs are 16px on phones to prevent zoom. The safety notice becomes a bottom sheet on phones, and the support launcher steps aside while it is showing.
- **Print:** receipts, safety plans and sleep diaries print on A4 with the site chrome removed.

## Elevation & Depth

Softly layered. Cards and panels sit just above the paper: one step brighter in tone (ivory-light on ivory), edged with a hairline border (forest-800 at 10%) and carrying the quiet lift shadow at rest. Interaction deepens the layer: on hover a card rises 4px and its shadow blooms (`.card-lift`). Floating layers such as dropdowns, dialogs and the safety notice use bloom at all times. All shadows are tinted forest, never neutral grey, and stay soft enough that the page still reads as paper.

### Shadow Vocabulary
- **Lift** (`0 1px 2px rgba(14,59,51,0.05), 0 8px 24px rgba(14,59,51,0.07)`): the resting shadow for cards, panels, forms and sheets.
- **Bloom** (`0 2px 6px rgba(14,59,51,0.06), 0 24px 48px -12px rgba(14,59,51,0.18)`): hover state for cards, plus dropdowns, dialogs and floating notices.

### Named Rules
**The Two-Layer Rule.** There are exactly two heights: lift for anything resting on the page, bloom for anything hovered or floating. Never add a third shadow, a heavier one, or a neutral grey one.

## Shapes

The form language is soft and round. Every button, chip, toggle and launcher is a full pill. Containers use gentle radii: 24px for large panels and feature cards, 16px for standard cards and menus, 12px for inputs and list rows inside menus. Lines are hairlines: 1px borders in forest at 10–25%, a 48px gold rule as a section mark, and a 2px gold left rule on quotes. Hard corners and square buttons are not part of this system.

## Components

### Buttons
Calm and confident. A small spring lift under the cursor and a press on tap; no magnetic pull.
- **Shape:** full pill, 14px by 28px padding, 0.95rem semibold Jakarta with wide tracking.
- **Gold (default):** gold background with forest-950 text; gold-dark on hover. The primary call to action.
- **Forest:** forest-800 background with ivory text; forest-700 on hover. A strong secondary, or the primary on gold or dark grounds.
- **Outline / Outline-light:** a hairline border at 25–30% that fills solid on hover (forest on light grounds, ivory on dark grounds).
- **Motion:** spring (stiffness 420, damping 30): lift -2px on hover, scale 0.97 on tap. Both are disabled under reduced motion and when the button is disabled. Disabled buttons drop to 50% opacity.
- **Focus:** 2px gold outline, 3px offset (global).

### Chips
- **Tag:** pill with a sage-light background at 70%, forest-800 text, 4px by 10px padding and 0.7–0.82rem medium text. Used for languages, specialities and status. Small uppercase status tags add 0.1em tracking.
- **Choice:** a selectable pill with a 1px forest border at 15–20%, 8px by 16px padding and 0.85–0.9rem medium text. It fills solid forest-800 with ivory text on hover or when selected.

### Cards / Containers
- **Corner style:** 16px (standard) or 24px (feature panels).
- **Background:** ivory-light on the ivory page.
- **Border:** 1px forest-800 at 10%.
- **Shadow strategy:** lift at rest; bloom plus a 4px rise on hover through `.card-lift`. Under reduced motion only the shadow changes.
- **Internal padding:** 20–24px; 16px on dense admin rows.

### Inputs / Fields
- **Style:** `Field`, `TextArea` and `Select` from `components/ui/Field.tsx`, with 12px radius, ivory-light fill, a forest border at 15%, 12px by 16px padding and 0.95rem text.
- **Label:** above the control, uppercase 0.78rem with 0.14em tracking at ink/70. "optional" appears in lowercase at ink/35.
- **Focus:** the border shifts to solid forest-800; there is no glow.
- **Error:** red-300 border (red-500 on focus), an inline icon with a red-700 message announced through `aria-describedby` and `aria-invalid`.

### Navigation
- **Desktop:** a wordmark at left, Jakarta links with the `.link-draw` underline that draws in from the left, and dropdowns in a 16px ivory-light panel with bloom and an uppercase micro-label header.
- **Mobile:** a full-screen forest-900 sheet with Fraunces 1.35–1.5rem group titles in ivory, accordion groups and sage-light items that turn gold on hover.

### Safety Notice (signature)
Always present and never hidden. On desktop it is a forest-100 pill launcher; on phones it is a frosted ivory bottom sheet with a forest icon well and a Fraunces headline. It sits above the other floating controls and always routes to Tele-MANAS 14416 and 112.

### Canvas Scenes (signature)
Hero scenes built on `useCanvasScene` (high-DPI sizing, a rAF loop, pointer handling, reduced motion): NeuralBrain, NodeBuilding, Weave, InkLines, ChaiSteam, IndiaOutline, Ripples and WayThrough. Each one encodes real page data (lane length = session duration, colour = format), invites a single click, is `aria-hidden` with keyboard-reachable equivalents, and freezes its position under reduced motion.

## Do's and Don'ts

### Do:
- **Do** use the shared classes (`.wrap`, `.section`, `.page-top`, `.eyebrow`, `.h-display`, `.prose-mm`, `.card-lift`, `.press`, `.link-draw`, `.gold-rule`) before writing new spacing or type.
- **Do** keep the screen ivory, forest and gold at rest, and let region hues appear through interaction or meaning.
- **Do** tint every shadow and translucent line with forest (rgba 14,59,51), never black.
- **Do** use the silk curve (`cubic-bezier(0.22, 1, 0.36, 1)`) for transitions, and animate only transform, opacity and shadow.
- **Do** make reduced motion freeze position. Colour and shadow may still respond.
- **Do** give every canvas scene a keyboard and screen-reader equivalent.

### Don't:
- **Don't** make it look clinical: no white-and-blue, medical iconography or hospital-portal layouts.
- **Don't** make it wellness-app cute: no pastel blobs, mascots, streaks or cartoon illustration.
- **Don't** make it startup SaaS: no purple gradients, glassy feature grids or stock-photo teams.
- **Don't** use region hues as decorative fills or rainbow gradients, or retype their hex values outside `lib/palette.ts`.
- **Don't** put two gold calls to action in one viewport.
- **Don't** use `transition-all`. It makes hovers feel gummy.
- **Don't** hide, shrink or visually bury the Safety Notice or crisis links.
- **Don't** use a magnetic or cursor-following effect on controls. It does nothing on a phone and feels restless on a calm page.
