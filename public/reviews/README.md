# Review portraits

Drop the watercolor portrait images here. The testimonial slider
(`components/sections/Testimonials.tsx`) loads them automatically; if a file is
missing it shows a forest monogram fallback, so the site never breaks.

## Required files (exact names)

| File              | Person                                              |
| ----------------- | --------------------------------------------------- |
| `priya.png`       | woman, 27, product designer, Bengaluru              |
| `karthik.png`     | man, 31, software engineer, Chennai                 |
| `ishita.png`      | woman, 22, student, Delhi                           |
| `rahul-sneha.png` | couple (man + woman), Pune                          |
| `fatima.png`      | woman, 29, chartered accountant, Hyderabad          |
| `aditya.png`      | man, 34, founder, Gurugram                          |

## Specs

- **Format:** PNG, transparent background (or solid ivory `#F7F4EE`).
- **Ratio / size:** 4:5 portrait, ~640×800px (head-and-shoulders, centered).
- **Style:** soft watercolor, palette of forest green / sage / gold / ivory.
- **No** text, logos, watermarks, or hard borders.

To change a filename or add/remove people, edit `image:` in
`lib/testimonials.ts`.
