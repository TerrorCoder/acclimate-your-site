# Google Search Console submission

Production property: `acclimate.kairosgroup.co.zw`

## Deploy first

1. Commit and push the current changes.
2. Confirm the Cloudflare Pages build command is `npm run build`.
3. Confirm the Cloudflare Pages output directory is `dist`.
4. Wait for the production deployment to finish.

## Verify ownership

1. Open Google Search Console and add a **Domain** property.
2. Enter `acclimate.kairosgroup.co.zw` without `https://` or a trailing slash.
3. Copy the TXT value Google provides, beginning with `google-site-verification=`.
4. In Cloudflare DNS, add a TXT record:
   - Name: `acclimate`
   - Content: the exact value supplied by Google
   - TTL: Auto
5. Return to Search Console and select **Verify**. Keep the DNS record permanently.

## Validate production

Open each URL and confirm it returns successfully:

- `https://acclimate.kairosgroup.co.zw/`
- `https://acclimate.kairosgroup.co.zw/robots.txt`
- `https://acclimate.kairosgroup.co.zw/sitemap.xml`
- `https://acclimate.kairosgroup.co.zw/site.webmanifest`

The sitemap must display XML rather than the application homepage. The manifest must display JSON.

## Submit for indexing

1. Open **Sitemaps** in Search Console.
2. Submit `sitemap.xml`.
3. Open **URL Inspection** and inspect `https://acclimate.kairosgroup.co.zw/`.
4. Run **Test live URL**, confirm the page is available to Google, then select **Request indexing**.
5. Repeat URL Inspection for the important pages listed in the sitemap if desired.

Indexing is controlled by Google and is not guaranteed immediately. Review the Page indexing and HTTPS reports after Google begins crawling.
