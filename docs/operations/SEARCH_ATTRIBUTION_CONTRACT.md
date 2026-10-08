# Search and AI Attribution Contract

Status: local attribution boundary approved. External workflow, CRM mapping and `contact_v2` are deferred and are not deployment gates for this iteration.

## Measurement boundary

Brunova separates three measurement concerns:

1. Search performance belongs in Google Search Console and, secondarily, Bing Webmaster Tools.
2. Commercial attribution currently preserves first-touch UTM values through the existing contact contract. Deeper CRM attribution is deferred.
3. General product analytics is deferred. The website continues to use its no-operation analytics adapter.

The website does not fingerprint visitors, create cross-device identifiers, set analytics cookies or retain arbitrary external query parameters.

## In-memory first-touch record

During one uninterrupted page visit, the client keeps one first-touch record in module memory:

- `firstReferrerHost`: hostname only; no full referrer URL, path or query;
- `firstLandingPath`: Brunova pathname only; no query or fragment;
- `firstLandingLocale`: `en` or `es`;
- `sourceCategory`: `campaign`, `organic_search`, `ai_referral`, `referral`, `direct` or `unknown`;
- `sourceName`: `google`, `bing`, `chatgpt`, `other` or `null`;
- first UTM source, medium, campaign, term and content values when supplied;
- capture timestamp, retained only in page memory and not forwarded downstream.

The record is not written to cookies, `localStorage` or `sessionStorage`. It survives client-side route changes but is lost on a full reload, tab close or new tab. This deliberate loss of persistence reduces tracking and avoids using terminal storage for commercial attribution.

Classification is intentionally small and deterministic. A UTM-tagged landing is `campaign`; supported Google hostnames are Google organic search; `bing.com` is Bing organic search; `chatgpt.com` is a ChatGPT AI referral; other valid external hosts are referrals. Unknown remains a valid classification.

## Existing contact envelope

The deployable server contract remains `contact_v1`. It forwards the accepted contact fields and the existing bounded UTM object:

```json
{
  "form": "contact_v1",
  "utm": {
    "source": null,
    "medium": null,
    "campaign": null,
    "term": null,
    "content": null
  }
}
```

The remaining contact, request-correlation, authentication and idempotency behavior retains the existing contract. The additional hostname, landing path, locale and classified-source fields remain only in page memory and are not forwarded to the external workflow.

## Deferred external integration

`contact_v2`, CRM property design, workflow changes, external record tests and migrations are outside this iteration. They require a separate authorization and must not be inferred from this local attribution implementation. No external-system readiness or test is a production gate for the current candidate.
