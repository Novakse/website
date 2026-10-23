# Motion Guidelines

Scope: how to use GSAP + ScrollTrigger on this site. This is a tighter spec of the existing CLAUDE.md rule ("gebruik subtiele beweging met transform en opacity, vermijd transition-all en zware parallax-effecten"), not a replacement for it.

## Libraries

- `website/js/vendor/gsap.min.js` — GSAP core, v3.15.0
- `website/js/vendor/ScrollTrigger.min.js` — GSAP ScrollTrigger plugin, v3.15.0
- Both downloaded from the official npm package (verified against two independent npm-backed CDNs, byte-identical, header-confirmed GreenSock release). No Lenis, no scroll-hijacking library.
- Load only on the page(s) that actually use motion, via local `<script defer>` tags — never sitewide:

```html
<script defer src="js/vendor/gsap.min.js"></script>
<script defer src="js/vendor/ScrollTrigger.min.js"></script>
<script defer src="js/<page>-motion.js"></script>
```

- Register the plugin once per page script: `gsap.registerPlugin(ScrollTrigger);`

## Tokens

Keep this list short on purpose — pick from it, don't invent new values per section.

**Durations**
- `--motion-fast: 0.25s` — hover states, small UI feedback
- `--motion-base: 0.6s` — reveal-on-scroll elements
- `--motion-slow: 1.1s` — one signature/hero moment per page

**Eases** (GSAP ease names)
- `power2.out` — default for anything entering (reveal, fade-up)
- `power1.inOut` — default for anything scrubbed/tied to scroll position
- `none` — only inside a scrubbed ScrollTrigger timeline where linear tracking is wanted

Don't use bouncy/elastic eases on real content — fits the existing brand tone (persoonlijk, avontuurlijk, professioneel, ordelijk), not playful/bouncy.

## Scroll choreography rules

1. **One signature moment per page, maximum.** A single pinned or scrubbed ScrollTrigger sequence (e.g. the hero or one key section). Everything else is a simple reveal.
2. **Reveals use `transform` + `opacity` only** (e.g. `y: 24, opacity: 0` → `y: 0, opacity: 1`). No animating `width`, `height`, `top/left`, box-shadow spread, or filter blur on scroll — matches the existing "no transition-all" rule and keeps it on the compositor thread.
3. **No scroll-hijacking.** Native scroll stays native. ScrollTrigger reads scroll position, it doesn't take over the scrollbar.
4. **No parallax layering across more than one element per section.** A single background image allowed to drift slightly (`yPercent: -10` to `10` range) is fine; stacking multiple parallax layers is the "zware parallax" CLAUDE.md already rules out.
5. **Pin sparingly.** Pinning locks scroll to a section — only use it where it earns its place (one hero/product moment), never on repeated content blocks (cards, testimonials, FAQ).
6. Kill/refresh ScrollTrigger instances on page/section teardown if the page has dynamic content that changes layout height (e.g. filtered trip lists) — call `ScrollTrigger.refresh()` after content reflows, not before.

## Accessibility — required, not optional

```js
gsap.registerPlugin(ScrollTrigger);

const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (motionOK) {
  // real GSAP/ScrollTrigger animations here
} else {
  // set end-state styles directly (opacity:1, transform:none), no animation at all
}
```

- Every animated element must be fully readable/usable with zero JS and zero motion (CLAUDE.md: "laat alle belangrijke informatie ook zonder hover begrijpelijk zijn" extends to "zonder animatie").
- Never animate focus states or remove focus outlines as part of a motion sequence.
- Pinned sections must not trap keyboard or screen-reader navigation — test with Tab after implementing any pin.

## Performance

- `defer` on every vendor/motion script tag.
- Animate only `transform`/`opacity` (GPU-composited, no layout/paint cost).
- No animation library loaded on a page that doesn't use it.
- Test on a throttled mobile profile before shipping a page with a pinned/scrubbed section — this is the one motion pattern most likely to jank on low-end phones.
