# Add hero image to physician dashboard

- Date: 2025-08-28
- Status: deployed with rotation

Intent

- Ensure the physician dashboard prominently displays the InstantHPI main photo at the top to reinforce brand and context.

User Story

- As a physician, when I open the dashboard, I see the branded hero image at the top before the clinical tools.

Implementation

- Inserted a hero image container at the top of /Users/carlosfavielfont/Downloads/Instanthpi 6/client/src/pages/doctor-dashboard.tsx just inside <main>.
- Fixed top hero: Butler image (file name containing "butler" searched in manifest; fallback to /images/butler.jpg, then /instanthpi-hero.jpg, then /instanthpi-beach.jpg).
- Footer rotator: rotates through other images (excludes screenshots and butler); index persisted in localStorage (doctor_footer_idx).
- Graceful fallback: if no images found, falls back to /instanthpi-hero.jpg then /instanthpi-beach.jpg for the footer.
- Build tooling: scripts/generate-assets-manifest.mjs now includes both /assets and /images into /assets/images.json, which the client fetches via /api/assets/images.

Follow-up

- Place desired hero images in client/public/images or in the root folder named "images for the website instanthpi"; both are deployed and included.

Verification

- Open https://instanthpi.ca/doctor-dashboard and ensure a hero image renders at the top.
- Ensure images rotate across reloads and that any files named like "Screenshot\*.png" are excluded.
- Supports folder with spaces: client/public/images for the website instanthpi (served at /images%20for%20the%20website%20instanthpi/...).
