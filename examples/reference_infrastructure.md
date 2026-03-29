---
name: reference_infrastructure
description: Where to find things in external systems — dashboards, issue trackers, docs
type: reference
---

- Bug tracking: Linear project "BACKEND" — all API and DB issues
- Deploy logs: Render dashboard → backend service → logs
- Error monitoring: Sentry project "api-prod" — check before investigating any reported bug
- API docs: internal Notion at /Engineering/API Reference (requires SSO)
- Oncall dashboard: Grafana /d/api-latency — if touching request-path code, this is what pages someone
