# OVE Data Validation - 2026-07-14

Control file for launch-readiness validation of figures shown in the OVE website.

## Scope

Validated visible figures in:

- Home metric cards.
- `#/indicadores` metric cards and latest-values table.
- `#/indicadores/dashboard` initial dashboard values.
- `#/datos/tipo-cambio` USD/BCV reference.
- Metadata cards added to data pages.

## Source Files Checked

- `assets/data/bcv/json/ove_bcv_pib_real_anual.json`
- `assets/data/bcv/json/ove_bcv_inpc_nacional_mensual.json`
- `assets/data/bcv/json/ove_bcv_tipo_cambio_usd.json`
- `assets/data/world-bank/catalog/world-bank-latest-summary.json`
- `assets/data/indicadores-clave/ove_indicadores_clave_venezuela.json`

## Validated Figures

| Indicator | Source value | Website display | Source file | Status |
| --- | ---: | ---: | --- | --- |
| PIB real BCV, 2025 | 8.944487326024571 | 8,94% | BCV PIB real JSON | OK |
| PIB corriente WDI, 2025 | 99.6612441556306 billion USD | US$ 99,7 mil millones | World Bank latest summary | OK |
| PIB per capita WDI, 2025 | 3494.8138870244 USD | 3.494,8 US$ | World Bank latest summary | OK |
| INPC mensual BCV, May 2026 | 6.3% | 6,3% | BCV INPC JSON | OK |
| Desempleo WDI, 2025 | 5.307% | 5,31% | World Bank latest summary | OK |
| USD/BCV, 2026-07-13 | 721.3456 Bs/USD | 721,3456 Bs/USD | BCV USD JSON | OK |

## Corrections Made

- Updated hardcoded USD/BCV visible values from 08/07/2026, 685.9427 to 13/07/2026, 721.3456.
- Updated metadata cards to show source, last capture, latest available data, records, and download formats.
- Replaced public wording of "normalizado" with "organizado" where it could imply value transformation.

## Download Link Check

- Checked `assets/data` links referenced from `app.js`: 18 local data links found.
- Missing local files: 0.

## Remaining Validation Work

- Validate every download link resolves in the deployed environment after deployment.
- Validate all chart points against the full source series, not only latest values.
- Validate generated Excel files manually if they are part of the public launch package.
- Define a public update calendar and then validate dates against that calendar.
