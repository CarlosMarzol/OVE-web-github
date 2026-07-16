# OVE Launch Checklist

Tracking file for the public launch of the Observatorio Venezolano de Economia website.

Created: 2026-07-14
Owner: Carlos Marzol
Workspace: `/home/ubuntu/.openclaw/workspace/OVE-web-github`

## Launch Readiness

Current recommendation: do not launch as a public observatory until data governance, real public content, legal pages, contact flows, and visual/function QA are closed. A private or institutional beta can happen earlier.

## Workstream 1 - Content And Placeholders

- [ ] Remove or hide all "Ejemplo", "Plantilla", "Sin publicar", "0 informes reales", and other public-facing mock content. Started 2026-07-14: homepage/publications/report-detail pages no longer present sample reports as if they were a public repository; data/API/tool cards now point to real downloads or clearly state API pending.
- [ ] Decide whether the `Publicaciones` section launches with a real first publication or stays hidden.
- [ ] Replace the sample report detail page with a real report page or remove the route from navigation.
- [ ] Review all homepage copy so it reflects what OVE can publicly claim at launch.
- [ ] Replace hardcoded / sample metrics where the live JSON already has a better source.

## Workstream 2 - Institutional Identity

- [ ] Finalize the public `Nosotros` page: mission, vision, governance, independence, team, and institutional role.
- [ ] Replace provisional references to Carlos building the platform with a public institutional description. Started 2026-07-14: public `Nosotros` page now refers to an OVE institutional/promoter structure instead of an individual builder profile.
- [ ] Confirm official OVE logo variants and ensure only approved assets are used.
- [ ] Review all images for brand fit, quality, and rights.

## Workstream 3 - Contact, Forms, And Channels

- [ ] Decide whether contact forms will send email, enter a CRM, or be disabled for launch. Started 2026-07-14: forms now have real client-side handling and are controlled from `assets/forms/forms-config.json`; `enabled` remains `false` until the final channel is confirmed.
- [ ] Connect forms to a real backend or replace with direct mailto / contact instructions. Technical scaffolding exists for endpoint POST or mailto fallback; needs Carlos's final contact email or endpoint.
- [ ] Replace placeholder addresses, phones, people, press contact, and office details. Started 2026-07-14: fake addresses, phone numbers, emails, offices, and press contact were removed from footer/contact page and replaced with pending-channel language.
- [ ] Replace placeholder social media links with official OVE links or hide them. Started 2026-07-14: social links now route to contact with pending-confirmation labels instead of presenting unverified official channels.
- [ ] Confirm newsletter subscription flow and storage/consent rules.

## Workstream 4 - Legal, Privacy, And Licensing

- [ ] Add public pages for aviso legal, privacy policy, cookie policy, and terms of use. Started 2026-07-14: added provisional routes `#/legal`, `#/privacidad`, `#/cookies`, and `#/terminos`, all marked pending legal review.
- [ ] Add a clear data-use license for downloadable CSV/JSON/XLSX assets. Started 2026-07-14: added provisional `#/licencia-datos` route with attribution and reuse language.
- [ ] Add disclaimers on source limitations, revisions, and non-official transformations. Started 2026-07-14: legal/license/methodology pages now state source limitations, revisions, and no substantive value changes by OVE.
- [ ] Confirm copyright / attribution for images, logos, data, and generated content.

## Workstream 5 - Data Governance And Methodology

- [ ] Publish a methodology page explaining sources, transformations, update frequency, and limitations. Started 2026-07-14: added public `#/metodologia` page covering sources, no substantive transformations, pending update calendar, limitations, revisions, and citation format.
- [ ] Add visible "last updated" metadata to dashboard/data pages where possible. Started 2026-07-14: added reusable metadata cards to indicators, dashboard, exchange-rate, data, BCV, key-indicators, and World Bank pages.
- [ ] Audit BCV, Banco Mundial, and key-indicators values against source files before launch. Started 2026-07-14: latest visible values for six key indicators were checked against local JSON sources and documented in `docs/OVE_DATA_VALIDATION_20260714.md`.
- [ ] Run a forced data refresh on launch day.
- [ ] Confirm the public indicator set: key dashboard indicators, WDI catalog, BCV pages, and download packages.
- [ ] Confirm PostgreSQL export flow remains private and no credentials or private schema details leak to the browser.

## Workstream 6 - Publications

- [ ] Prepare the first real OVE publication or launch note. Started 2026-07-14: added `#/nota-lanzamiento` as first institutional pre-launch note with scope, sources, methodology, roadmap, and citation.
- [ ] Add final PDF/Word/Excel assets where appropriate.
- [ ] Add publication metadata: title, date, authorship, sources, citation text, tags, and downloads. Started 2026-07-14: launch note includes title, pending date, authorship as OVE, status, source scope, and citation text.
- [ ] Replace sample publication cards and sample report routes. Started 2026-07-14: home/publications now link the first publication card to `#/nota-lanzamiento`; the old report-detail route remains only as pending-publication placeholder.

## Workstream 7 - Technical QA

- [ ] Check all internal routes and navigation. Started 2026-07-14: local route audit found 28 registered routes and 106 internal hash links, with 0 missing internal routes.
- [ ] Check every download link. Started 2026-07-14: 18 local `assets/data` links referenced from `app.js` exist in the repository; deployed-environment validation still pending.
- [ ] Check all image and asset references. Started 2026-07-14: local quoted asset audit found 66 asset references, with 0 missing files.
- [ ] Test mobile, tablet, and desktop layouts. Started 2026-07-14: Playwright CLI screenshots reviewed for home desktop/mobile, launch note desktop, contact mobile, methodology desktop, and legal mobile; no blank pages or obvious first-viewport overlap found. Tablet and full-page QA still pending.
- [ ] Review accessibility basics: alt text, contrast, keyboard navigation, form labels. Started 2026-07-14: form status areas use `aria-live` and visible labels are present in reviewed forms; full keyboard/contrast audit still pending.
- [ ] Test dashboard behavior with slow/no data fetch.
- [ ] Check performance and page weight.
- [ ] Confirm browser compatibility for common browsers.

## Workstream 8 - Deployment, Domain, And Monitoring

- [x] Confirm final hosting route: GitHub Pages, custom domain, or another host. Completed 2026-07-16: final public domain set to `https://ove-venezuela.com/`, served from the Vercel deployment.
- [ ] Configure HTTPS and domain redirects. Started 2026-07-16: `https://ove-venezuela.com/` responds with the OVE site; confirm in Vercel that the custom domain is marked primary and that the Vercel preview domain redirects as desired.
- [x] Add `robots.txt` and `sitemap.xml`. Completed 2026-07-16: added robots policy and expanded sitemap with clean public routes for the custom domain.
- [x] Finalize Open Graph / social preview metadata. Completed 2026-07-16: added canonical URL, `og:url`, absolute `og:image`, and Twitter card metadata for `https://ove-venezuela.com/`.
- [ ] Configure analytics and Search Console. Started 2026-07-16: added Vercel Web Analytics script, hash-route tracking, download/outbound/dashboard/form events, and privacy/cookies disclosure. Vercel Analytics still needs to be enabled in the Vercel project dashboard; Search Console remains pending.
- [ ] Configure uptime/error monitoring if possible.
- [ ] Prepare rollback plan.
- [x] Publish latest launch-preparation changes to the deployed environment. Completed 2026-07-14: local launch-preparation work was committed, pushed to `main`, and Vercel redeployed. The deployed app now contains methodology, legal, launch note, forms config, and updated BCV value, and no longer contains removed public copy such as `API Playground` or `Contactar con Carlos`.

## Workstream 9 - Repository Hygiene

- [ ] Decide whether `source-assets/` should remain in the public repo.
- [ ] Remove any internal-only manuals, raw source images, drafts, or sensitive files from public deployment.
- [ ] Confirm `.gitignore` protects local/private files.
- [ ] Review GitHub Actions permissions and workflow behavior.
- [ ] Confirm there are no secrets in repository history or static assets.

## Initial Priority Order

1. Clean placeholders and mock content.
2. Fix or disable forms.
3. Validate data and publish methodology.
4. Prepare a first real publication or launch note.
5. Add legal/privacy/licensing pages.
6. Run visual, route, download, and dashboard QA.
7. Finalize domain, analytics, and deployment.
8. Launch beta/public version with monitoring.

## Progress Log

- 2026-07-14: Checklist created from launch-readiness review requested by Carlos. Starting point is content cleanup, especially placeholder publications and simulated forms.
- 2026-07-14: Started content cleanup in `app.js`: changed homepage publication block, publications page, and report detail route from sample-report language to "publications in preparation" language. Remaining placeholder/example cleanup still needed in data/API/tool sections and contact forms.
- 2026-07-14: Started form cleanup: added configurable form handling for contact, newsletter, and collaboration forms; removed fake-success behavior. Forms can submit to configured endpoints or open a configured mailto fallback, but remain visibly pending until a real channel is provided.
- 2026-07-14: Continued placeholder cleanup in data sections: removed public-facing API playground / fake endpoint / map-calculator mock cards and replaced them with real dashboard, BCV, Banco Mundial, and downloads language. API is now described as pending roadmap, not an active feature.
- 2026-07-14: Started institutional identity cleanup: revised `Nosotros` so it no longer presents Carlos as the public owner/builder, updates sources to BCV + Banco Mundial, and frames governance/financing as pending public documentation rather than settled claims.
- 2026-07-14: Removed fake contact details from footer and contact page: no provisional office addresses, phone numbers, emails, press person, or location remain in public copy. Contact remains pending until Carlos defines the official channel.
- 2026-07-14: Added methodology page at `#/metodologia`: explains BCV/Banco Mundial and future official/multilateral sources, states that OVE does not change original values, clarifies that update calendar is pending, lists limitations/revisions, and defines recommended citation text.
- 2026-07-14: Connected methodology to data pages with visible source/update/download metadata. Updated hardcoded USD/BCV references to the local JSON latest value: 13/07/2026, 721.3456 Bs/USD. Reworded remaining "normalizado" copy to "organizado" to avoid implying data transformations.
- 2026-07-14: Started data validation. Checked visible latest values for PIB real BCV, PIB corriente WDI, PIB per capita WDI, INPC BCV, desempleo WDI, and USD/BCV against local JSON sources. Also checked 18 local `assets/data` links referenced from `app.js`; no missing local files. Added validation report at `docs/OVE_DATA_VALIDATION_20260714.md`.
- 2026-07-14: Added provisional legal/privacy/licensing routes: `#/legal`, `#/privacidad`, `#/cookies`, `#/terminos`, and `#/licencia-datos`. Footer now links to these pages. Contact form privacy checkbox links to `#/privacidad`. All legal pages are explicitly marked as initial and pending legal review.
- 2026-07-14: Added first institutional launch note at `#/nota-lanzamiento`. Home and publications page now link to this note. The note explains OVE scope, current BCV/World Bank sources, methodology, available downloads, pending launch tasks, and suggested citation.
- 2026-07-14: Started basic technical QA. `node --check app.js` passes. Local audits found 28 routes / 106 internal hash links / 0 missing internal routes, 66 quoted asset references / 0 missing assets, and 4 configured form instances with `forms-config.json` still disabled as intended. Reviewed screenshots for desktop/mobile pages without obvious first-viewport breakage. Deployed URL, tablet, dashboard resilience, performance, browser compatibility, and deeper accessibility QA remain pending.
- 2026-07-14: Checked deployed Vercel URL `https://ove-web-github.vercel.app/`. The site, CSS, JS, logo, and key JSON assets respond with 200, but the deployment is behind local work: it has 21 routes instead of 28, lacks methodology/legal/launch-note/forms-config changes, still shows older public copy, and therefore is not ready for public launch until the current local changes are committed, pushed, and redeployed.
- 2026-07-14: Published corrected pre-launch version to GitHub/Vercel. Commit `1564464` is on `origin/main`. Post-push deployed QA confirmed 28 routes, 106 internal hash links, 0 missing internal routes, required metadata/legal/methodology/launch-note/form markers present, and removed public placeholder copy absent.
- 2026-07-16: Carlos confirmed the custom domain `https://ove-venezuela.com/`. Added canonical/social metadata, root sitemap, robots policy, and updated ingestion user-agent strings to use the public domain.
- 2026-07-16: Added technical SEO improvements without changing visible page copy: clean URL routing support, Vercel rewrites, expanded route sitemap, per-route canonical/OG metadata, robots index directive, alternate language tag, and JSON-LD for Organization, WebSite, DataCatalog and key datasets.
