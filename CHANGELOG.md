# Changelog

## 2026-09-18 — Use @vklive/jira 1.1.0 API directly in server/jira.js (expand=changelog, paginated search with all/pageSize, extractErrorMessage)
## 2026-09-18 — Migrate Jira integration in server/jira.js to @vklive/jira client (createJiraClient/normalize), drop node-fetch
## 2026-09-11 — Add ❌ button after date inputs in Header: clears dates, disables date filter, resets timeline to db range
## 2026-09-11 — Implement Header filters (status, type, start date, group) and date range wired to Table filters
## 2026-09-11 — Add name search field in Header filtering issues by base.summary (searchNameFilter in Table)
## 2026-08-12 — Update page title in index.html