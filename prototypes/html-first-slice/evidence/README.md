# Verification evidence

`build-metrics.json` records the integrated 71-page local Windows build on
Node 24.15: homepage, pricing, disabled contact, services, case studies and
42 locations. Older `external-assets.json` and
`prototype-first-load.json` describe an earlier build, not this final output.
Runtime `quality-browser/` reports and screenshots are generated locally.

`managed-it-support.html`, `services-index.html` and `worker-runtime.txt` retain
the earlier 13-page integrated service/consent PC run. The runtime file records
that run's exact archive identity; it does not describe the current 29-page build.
Browser screenshots remain ignored review artefacts.

The latest combined local gate passed 271 service, 71 pricing, 41 homepage and
216 case-study browser assertions. It includes phone, desktop, no-JavaScript,
200% homepage text, process-number contrast and 44px footer contact targets.
The separate contact test build passed two mocked submission journeys with
Chromium sandboxing enabled; the default preview output contains no active form.
All 48 data/helper and 37 enhancement tests passed, plus four CSS parser checks.
Static contracts total 2,031 assertions plus the disabled contact output contract.
Earlier unchanged font and actual-page consent gates passed 16 and 10 checks.
These are local checks, not new Google scores or deployment performance.

`react-live-baseline.json` is the earlier dated production comparator. It was
not refreshed during the integrated worker gate.
