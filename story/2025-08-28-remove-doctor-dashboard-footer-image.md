# Remove footer image from Doctor Dashboard

- Date: 2025-08-28
- Status: deployed (Netlify production)

Intent

- Clean up the physician UI and remove non-clinical imagery at the bottom of the dashboard to reduce distraction and page weight.

User Story and Acceptance Criteria

- As a physician, I want a distraction-free dashboard so that clinical work is the focus.
- Acceptance:
  - The page /doctor-dashboard renders without any footer image.
  - No excessive whitespace remains where the image used to be.
  - No console errors or broken asset requests related to the removed image.

Scope

- In scope: removing the bottom <img> from the Doctor Dashboard page.
- Out of scope: other pages using different dashboards or layouts (e.g., PhysicianPortal component).

Affected Routes and Components

- Route: /doctor-dashboard
- Component: /Users/carlosfavielfont/Downloads/Instanthpi 6/client/src/pages/doctor-dashboard.tsx

Design Notes

- Professional, minimal UI. No decorative imagery on physician-facing screens.
- Maintain consistent vertical rhythm after removal.

Implementation Notes

- Removed the block:
  - Lines ~563–570:
    - <img src="/instanthpi-beach.jpg" alt="InstantHPI" ... />
- Verified code compiles and vite build completes.

Deployment / Rollback

- Build: npm run build
- Deploy: Deployed to Netlify production at instanthpi.ca (unique deploy URL recorded in Netlify)
- Rollback: restore the removed block in doctor-dashboard.tsx and redeploy.

Verification Steps

- Load https://instanthpi.ca/doctor-dashboard with cache disabled.
- Confirm the page renders without the footer image and no whitespace gap remains.
- Programmatic check (approximate for SPA): verified no reference to instanthpi-beach.jpg in HTML responses after deploy.

Open Questions / Follow-ups

- Confirm if any other physician dashboards (e.g., components/physician/PhysicianDashboard.tsx) are routed elsewhere and might include images or footers that need the same treatment.
