# OVE Web Analytics Setup

Date: 2026-07-16

## Implementation

The OVE website now includes Vercel Web Analytics instrumentation for the static hash-routed site.

Files changed:

- `index.html`: adds the Vercel Analytics queue and `/_vercel/insights/script.js`.
- `app.js`: adds local analytics helpers, hash-route tracking, download tracking, outbound-source tracking, dashboard events, form events, and copy-citation events.
- `app.js`: updates provisional privacy and cookies copy to disclose aggregate analytics.

## Events

Custom events are intentionally limited to two properties per event:

- `OVE Route View`: `{ route, section }`
- `OVE Download`: `{ source, format }`
- `OVE Outbound Link`: `{ source, format }`
- `OVE Dashboard`: `{ action, detail }`
- `OVE Form`: `{ form, state }`
- `OVE Copy`: `{ source, format }`

## Measured Interactions

- Hash routes such as `#/datos/bcv`, `#/metodologia`, `#/datos/fmi`.
- Dataset downloads in CSV, CSV.GZ, JSON, Excel and PDF where present.
- External source links, including BCV.
- Key-indicator dashboard series selections.
- Native dashboard primary/secondary/mode/window changes and swaps.
- Exchange-rate dashboard currency selections.
- Contact/newsletter/collaboration form states while forms remain disabled or later enabled.
- Citation copy interactions.

## Vercel Dashboard Step

The code is present in the site, but Vercel Web Analytics must also be enabled in the Vercel project dashboard:

1. Open the Vercel project for `OVE-web-github`.
2. Go to Analytics.
3. Enable Web Analytics for the project.
4. Deploy the updated site.
5. Visit the deployed site in a normal/incognito browser and confirm page views appear.

Custom events may require a paid Vercel plan depending on the current Vercel account configuration. Basic Web Analytics page views are still useful even without custom-event reporting.

## Privacy Note

The implementation is designed for aggregate measurement. It does not set site cookies, does not use `localStorage`, does not identify individual users, and does not add advertising pixels.

Privacy and cookies pages are still marked provisional and should be reviewed before public launch.
