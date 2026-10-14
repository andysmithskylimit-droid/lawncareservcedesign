# JCP Lawn Service

A responsive, self-contained static site with an original Three.js garden, GSAP scroll animation, Lenis smooth scrolling, and a prepared-email quote flow.

## Run locally

Use Node.js and run `node preview.mjs`, then open the printed local address. No package installation or build step is needed. Serve `dist/` through any static web server for deployment.

## Included experience

- Interactive garden: drag or use left/right arrow keys; Home resets the camera. Scrolling orbits the garden, subtly changes framing, and shortens the grass. Desktop uses a pinned story; mobile keeps natural scrolling.
- Daylight / golden-hour lighting and an optional animation pause control.
- Mobile navigation, six expandable service descriptions, yard-planning guidance, FAQ accordions, scrolling service ribbon, and a reading progress bar.
- Service selection carried into the quote request.
- A two-step request form with native validation, yard area, preferred timing, contact details, an optional phone number, and email draft creation with copy fallback.
- Google Maps embed, direct call, and email links.
- Reduced-motion, WebGL fallback, and contact fallback without JavaScript.

The quote form opens the visitor's email app. It does not send automatically, store leads, or claim delivery. Visitors must send their prepared message themselves. No business inbox credentials are embedded.

All photography is illustrative stock, not presented as completed JCP projects. See ASSETS.md for sources. The 3D garden is original procedural artwork. Verify service offerings with the business before broad public marketing; no testimonials, ratings, years of experience, pricing, or scheduling guarantees were invented.

The business name, address, phone, email, and Maps embed came from the brief.

## Files

- `dist/index.html`: content and metadata
- `dist/styles.css`: responsive visual system
- `dist/app.js`: navigation, form, and motion
- `dist/scene.js`: original garden scene
- `dist/vendor/`: locally hosted Three.js 0.170.0, GSAP 3.13.0, ScrollTrigger, Lenis 1.3.11
- `dist/assets/`: photography, font files, favicon, font license

The hosting manifest binds this checkout to its private Sites project. No credentials are stored in the project.
