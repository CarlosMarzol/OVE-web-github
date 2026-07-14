# OVE Basic QA - 2026-07-14

Scope: local basic quality review before public launch. This is not a full production QA pass.

## Summary

- JavaScript syntax check: passed with `node --check app.js`.
- Internal route audit: 28 registered routes, 106 internal hash links, 0 missing internal routes.
- Asset audit: 66 quoted local asset references, 0 missing files.
- Form configuration audit: 4 form instances covered by `assets/forms/forms-config.json`.
- Form delivery status: `enabled: false`, `mode: pending`, no recipient email, no endpoint configured.
- Visual smoke review: desktop/mobile screenshots loaded without blank pages or obvious first-viewport overlap.

## Pages Visually Reviewed

- Home, desktop.
- Home, mobile.
- Launch note, desktop.
- Contact, mobile.
- Methodology, desktop.
- Legal notice, mobile.

## Notes

- The legal mobile page loads correctly; the hero image is large on the first screen but does not block navigation or text.
- The forms remain deliberately pending. They validate on the client side but do not send or store data until a final channel is configured.
- The local Playwright CLI was available for screenshots. The Playwright test runner module was not available as a project dependency, so this pass used CLI screenshots and custom Node scripts instead of a formal automated test suite.

## Still Pending

- Validate the deployed environment, not only local files.
- Review every chart and dashboard interaction under slow/no data fetch.
- Full tablet QA.
- Full mobile page-by-page QA beyond the first viewport.
- Keyboard navigation and focus-state audit.
- Contrast audit.
- Browser compatibility checks.
- Performance/page-weight review.
- Final download validation after deployment.

## Deployed Environment Check

Checked URL: `https://ove-web-github.vercel.app/`

Initial result before publishing local work: the deployed site responded, but it was serving an older version than the current local launch-preparation work.

- Root page status: 200.
- `styles.css` status: 200.
- `app.js` status: 200.
- OVE logo asset status: 200.
- BCV JSON status: 200.
- Key indicators JSON status: 200.
- Deployed route audit: 21 registered routes, 87 internal hash links, 0 missing internal routes.

Version mismatch detected:

- Deployed app does not contain `#/metodologia`.
- Deployed app does not contain `#/nota-lanzamiento`.
- Deployed app does not contain `#/legal`, `#/privacidad`, or `#/licencia-datos`.
- Deployed app does not contain `assets/forms/forms-config.json` handling.
- Deployed app still contains `API Playground`.
- Deployed app still contains `Contactar con Carlos`.
- Deployed app does not contain the updated visible USD/BCV value `721,3456`.

Visual deployed screenshots reviewed:

- Home desktop loads without blank page or first-viewport overlap.
- Contact mobile loads without blank page or first-viewport overlap, but it still shows older contact actions such as "Envíanos un mensaje", "Llámanos" and "Visítanos".

Resolution: local launch-preparation work was committed and pushed to `main`; Vercel redeployed successfully.

Post-push deployed verification:

- Deployed `app.js` contains `#/metodologia`.
- Deployed `app.js` contains `#/nota-lanzamiento`.
- Deployed `app.js` contains `#/legal`, `#/privacidad`, and `#/licencia-datos`.
- Deployed `app.js` contains `assets/forms/forms-config.json` handling.
- Deployed `app.js` contains the updated visible USD/BCV value `721,3456`.
- Deployed `app.js` no longer contains `API Playground`.
- Deployed `app.js` no longer contains `Contactar con Carlos`.
- Deployed route audit after push: 28 registered routes, 106 internal hash links, 0 missing internal routes.
- Home, CSS, app JS, OVE logo, forms config JSON, BCV JSON, and key indicators JSON respond with status 200.
- Post-push screenshots reviewed for methodology desktop and contact mobile; both load the corrected version without blank page or first-viewport overlap.

Conclusion: the deployed Vercel site is now serving the corrected pre-launch version. Remaining work is deeper QA, final contact/legal details, domain/analytics, and final public-launch review.
