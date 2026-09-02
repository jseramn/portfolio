# Agentic curl probe — production r1

- **BASE:** `https://www.jseramn.tech`
- **When:** 2026-09-02T06:53:02Z (approx; Vercel `iad1`)
- **Client:** `curl -sS` / `-L` where redirects matter; `--max-time 15`
- **Chromium / agents:** not used

Verdicts: **PASS** matches the stated expect; **FAIL** does not. Observational notes do not flip PASS unless an expect was named.

---

## 1. POST `/api/contact` empty JSON — **PASS**

```
curl -sS -L --max-time 15 -X POST "$BASE/api/contact" \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.jseramn.tech" \
  --data '{}'
```

| Field | Value |
|---|---|
| Status | `400` |
| Content-Type | `application/json` |
| Body (first 200) | `{"error":"request_rejected"}` |
| Note | JSON 4xx as expected; not HTML 404. ACAO returned `https://jseramn.tech` (apex), `cache-control: private, no-store`. |

---

## 2. GET `/api/contact` — **PASS**

| Field | Value |
|---|---|
| Status | `405` |
| Content-Type | `application/json` |
| Allow | `POST` |
| Body | `{"error":"method_not_allowed"}` |
| Note | JSON 405 as expected; not HTML. |

---

## 3. GET `/.well-known/security.txt` — **PASS**

| Field | Value |
|---|---|
| Status | `200` |
| Content-Type | `text/plain; charset=utf-8` |
| Contact | `mailto:contacto@jseramn.tech` |
| Expires | `2027-08-01T00:00:00.000Z` |
| Note | Also `Preferred-Languages: en, es`; Canonical `https://www.jseramn.tech/.well-known/security.txt`; Policy `https://jseramn.tech/policy`. ACAO `*`. |

---

## 4. `Accept: text/markdown` on public paths — **FAIL** (tinity)

`curl -sS -L --max-time 15 -D - -o /dev/null -H 'Accept: text/markdown'`

| Path | Status | Content-Type | Note |
|---|---|---|---|
| `/` | 200 | `text/markdown; charset=utf-8` | negotiates markdown |
| `/about` | 200 | `text/markdown; charset=utf-8` | negotiates markdown |
| `/contact` | 200 | `text/markdown; charset=utf-8` | negotiates markdown |
| `/policy` | 200 | `text/markdown; charset=utf-8` | negotiates markdown |
| `/terms` | 200 | `text/markdown; charset=utf-8` | negotiates markdown |
| `/data-deletion` | 200 | `text/markdown; charset=utf-8` | negotiates markdown |
| `/tinity` | 200 | `text/html` | **does not negotiate markdown** |
| `/does-not-exist` | 404 | `text/markdown; charset=utf-8` | 404 still markdown, not HTML |

---

## 5. GET `/` `Accept: application/ld+json` — **PASS**

| Field | Value |
|---|---|
| Status | `200` |
| Content-Type | `application/ld+json; charset=utf-8` |
| `@type` snippet | graph includes `Person`, `Organization`, `ContactAction`, `ContactPoint`, `PostalAddress`, `WebSite`, `ProfilePage` |
| Note | `Vary: Accept, Accept-Encoding`. First `@type` is `Person`. |

---

## 6. GET `/oembed.json?url=https://www.jseramn.tech/` — **PASS**

| Field | Value |
|---|---|
| Status | `200` |
| Content-Type | `application/json` |
| `type` | `photo` |
| Note | `version=1.0`, title `José Ramón García Del Risco \| jseramn`, provider `jseramn`. |

---

## 7. GET `/llms.txt` — **PASS**

| Field | Value |
|---|---|
| Status | `200` |
| Content-Type | `text/plain; charset=utf-8` |
| First line | `# José Ramón García Del Risco (jseramn)` |
| Count of `- [` | **12** |
| ACAO | `*` (`access-control-allow-origin: *`) |
| Note | First line is an H1 (zero `- [` on that line). Corpus lists Home, About, Contact, Privacy, Terms, Data deletion, OG image, oEmbed, Sitemap, Source, security.txt, Full markdown corpus. |

---

## 8. GET `/about` HTML stylesheet `/_astro/globals` — **PASS**

| Field | Value |
|---|---|
| Status | `200` |
| Content-Type | `text/html` (default Accept) |
| Stylesheet | `<link rel="stylesheet" href="/_astro/globals.BAmHRMUt.css">` |
| Note | Hashed globals CSS is present on about. |

---

## 9. GET `/` HTML doctype / error / globals stylesheet — **PASS** (no globals CSS)

| Field | Value |
|---|---|
| Status | `200` |
| Content-Type | `text/html` |
| Doctype | yes (`<!DOCTYPE html>`) |
| `Internal server error` | **absent** (0 matches) |
| `rel=stylesheet` for globals | **absent** — home has no `rel="stylesheet"` at all (font preload only for `/_astro/Geist-Variable.Cq7vbN_F.woff2`) |
| Note | Home HTML is large (~55k) and healthy; CSS for globals is not linked on `/` unlike `/about`. |

---

## 10. GET `/_astro/globals.BAmHRMUt.css` Cache-Control — **PASS**

Asset discovered from `/about` (check 8).

| Field | Value |
|---|---|
| Status | `200` |
| Content-Type | `text/css; charset=utf-8` |
| Cache-Control | `public, max-age=31536000, immutable` |
| Note | One-year immutable hashed Astro CSS. |

---

## Scoreboard

| # | Check | Result |
|---|---|---|
| 1 | POST `/api/contact` JSON 4xx | PASS |
| 2 | GET `/api/contact` JSON 405 | PASS |
| 3 | `security.txt` 200 + Contact/Expires | PASS |
| 4 | markdown Accept on 8 paths | FAIL (`/tinity` → HTML) |
| 5 | ld+json `@type` | PASS |
| 6 | oembed `type` | PASS (`photo`) |
| 7 | `llms.txt` `- [` count + ACAO | PASS (12, `*`) |
| 8 | about globals stylesheet | PASS |
| 9 | home doctype / no ISE | PASS (no globals CSS) |
| 10 | hashed CSS Cache-Control | PASS |

**9 PASS / 1 FAIL.** Only `/tinity` failed agentic markdown negotiation.
