---
## Closing summary (TOP)

- **What happened:** Ordering menu product photos used `object-fit: cover` and cropped offer-poster artwork (title/price bands cut off).
- **What was done:** Menu grid, featured, and detail images switched to `object-fit: contain` with letterbox background; hover image zoom/scale removed. Public-menu thumbs left unchanged.
- **What was tested:** Puppeteer checks on desktop (≥4-col), mobile (~390px), hover, featured, detail, public-menu out-of-scope, front build, and landing smoke — **Overall PASS**.
- **Why closed:** All acceptance criteria passed; tester handed off as CLOSED.
- **Closed at (UTC):** 2026-10-10 17:54
---

# Menu photos are cropped and cut off the offer artwork

## GitHub Issues
- **Issue:** https://github.com/satisfecho/pos/issues/429
- **429**

## Status
- **Implemented:** 2026-10-10T17:48:00Z (UTC)
- Grid / featured / detail images use `object-fit: contain`; hover image zoom removed; featured container letterbox background set.

## Problem / goal
On the ordering menu (`/menu/{uuid}`), product card photos use a fixed aspect-ratio frame with `object-fit: cover`, so offer-poster artwork is cropped: poster title sliced at the top and large poster price at the bottom. Card name/price under the photo (from product fields) are fine.

Same crop pattern appears on featured cards and in product detail. Goal: show the full poster without cutting off top/bottom text (`object-fit: contain` on the existing container background); remove hover zoom if it re-crops. Do not change uploaded files or product name/price rendering.

## High-level instructions for coder
- Inspect `front/src/app/menu/menu.component.scss`: `.product-image-container` / `.product-image` (`aspect-ratio: 16 / 10`, `object-fit: cover`), featured (`.featured-image`, `4 / 3` + `cover`), and product detail (`16 / 9` + `cover`). Align with issue #429 acceptance.
- Switch image fitting so the full poster fits inside the frame without cropping top/bottom text; keep container background as intended for letterboxing.
- Remove or adjust hover `transform: scale(…)` if zoom crops the image again.
- Out of scope: public-menu 72×72 thumbnails (`front/src/app/public-menu/`); product data, prices, or create/upload flows.
- Verify in browser on desktop (incl. 4-column grid) and mobile: full poster visible on grid, featured, and detail; card name/price unchanged.
- Confirm front build clean via `docker logs --since 10m pos-front` after SCSS changes.

## What changed
- `front/src/app/menu/menu.component.scss`: `.product-image`, `.featured-image`, `.detail-image` → `object-fit: contain`; removed hover `scale` on product/featured images; added `background: var(--color-bg)` on `.featured-image-container` for letterboxing.

## Testing instructions
1. App up (HAProxy, e.g. `http://127.0.0.1:14202` or `4202`). Use an **active** table token (`is_active=true`), e.g. Take Away, or activate a floor table from staff UI.
2. Open `/menu/{token}` on a wide desktop viewport (≥4 product columns). Confirm product card photos show the full poster (title at top and price band at bottom not cropped). Letterboxing on the container background is OK.
3. Hover a product card: image must not zoom/crop again (card lift/shadow may still move).
4. If featured products exist, confirm featured images also show the full poster (`contain`).
5. Open a product detail: detail hero image uses `contain` (full poster visible).
6. Repeat on a mobile viewport (~390px): same full-poster behaviour; name/price under cards unchanged.
7. Out of scope check: `/public-menu/…` 72×72 thumbs still use their existing crop (unchanged).
8. Front build: `docker logs --since 10m pos-front` — no TypeScript/Angular compile errors after the SCSS change.
9. Optional smoke: `BASE_URL=http://127.0.0.1:14202 LANDING_VERSION_ONLY=1` landing version test (host Chromium + container `node_modules` via `NODE_PATH` if needed).

## Test report

1. **Date/time (UTC):** 2026-10-10T17:49:53Z start → 2026-10-10T17:53:34Z end. Log window: `pos-front` since ~17:45Z (post-SCSS rebuild).
2. **Environment:** `docker-compose.yml` + `docker-compose.dev.yml`; HAProxy `http://127.0.0.1:14202`; branch `development`. Puppeteer headless Chromium (`/snap/bin/chromium`). Active Take Away table token from DB. Demo products had no `image_filename`; temporarily assigned existing upload files for visual checks, then cleared after the run.
3. **What was tested:** Ordering menu grid / featured / detail `object-fit: contain`, no image hover scale, mobile 390px, public-menu 72×72 still `cover`, front build clean, optional landing smoke.
4. **Results:**
   - Desktop ≥4-column grid + product `object-fit: contain` — **PASS** (`gridCols=4`, computed `object-fit: contain`, letterboxing on `--color-bg` container).
   - Hover does not scale/crop product image — **PASS** (`transform: none` before/after hover on `img.product-image`).
   - Featured images `contain` — **PASS** (`img.featured-image` → `object-fit: contain`).
   - Detail hero `contain` — **PASS** (`img.detail-image` → `object-fit: contain`, 600×338 frame).
   - Mobile (~390px) full-poster `contain` — **PASS**.
   - Card name/price under photo present — **PASS** (e.g. name + `€…` under cards).
   - Public-menu 72×72 thumbs still `cover` — **PASS** (`img.public-menu-product-image` 72×72 `cover`).
   - Front build clean — **PASS** (bundle complete; no TS/NG compile errors in window).
   - Optional landing smoke — **PASS** (`LANDING_VERSION_ONLY=1` → version + Restaurant Demo card).
5. **Overall:** **PASS**
6. **Product owner feedback:** Offer artwork on the order menu now letterboxes instead of cropping, so poster title/price bands stay visible on grid, featured, and detail. Hover no longer zooms the photo. Public-menu thumbs correctly left alone.
7. **URLs tested:**
   1. `http://127.0.0.1:14202/menu/6a90d7b9-961d-4ba0-807d-fb308c5ff0a3` (desktop 1400×900)
   2. `http://127.0.0.1:14202/menu/6a90d7b9-961d-4ba0-807d-fb308c5ff0a3` (viewport 390×844)
   3. `http://127.0.0.1:14202/public-menu/1`
   4. `http://127.0.0.1:14202/` (landing smoke)
8. **Relevant log excerpts:**
   ```
   Application bundle generation complete. [0.967 seconds] - 2026-10-10T17:46:04.573Z
   Component update sent to client(s).
   ```
   No `Application bundle generation failed` / TS errors in `pos-front` for the test window. Puppeteer: `Overall: PASS (0 failed)`.
