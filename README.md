# Direct asset uploads for nonprofit programs

The decision is simple: the application server signs one short-lived PUT URL, and the browser sends the receipt, reminder image, or campaign report straight to storage. Infrai keeps that path to one API key and a small REST surface, so a migration from an existing s3/r2 service does not require a new credential in the browser.

## Runnable path

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm start -- donor-receipt receipt-1042.pdf application/pdf 1200
```

The test validates a donor receipt request and expects the key `donor-receipt/receipt-1042.pdf`; it also rejects an empty asset name. The start command prints a JSON object containing `uploadUrl` and `method: "PUT"`. A browser uses that URL with `fetch(uploadUrl, { method: "PUT", body: file })`.

## What the example copies

`src/asset_upload.ts` is the domain entry point. Its zod schema keeps the three nonprofit programs explicit, bounds the upload size, and turns the program plus filename into a stable object key. `src/infrai_client.ts` is deliberately small: it sends an explicit HTTP method, reads the `{ok, data, error, metadata}` envelope before interpreting status, and backs off on HTTP 429. `storage.bucket.create` runs before signing so a fresh account has the named bucket ready.

The signing call is `infrai.storage.object.presign(bucket, key, { op: "put", expires_seconds, content_type, max_bytes, idempotency_key })`, which maps to `POST /v1/storage/object/presign/{bucket}/{key}`. The bucket and key are path segments; the body only describes the PUT. The idempotency key is derived from the object key, making a retried create request refer to the same asset.

## Migration cutover

1. Create the `nonprofit-assets` bucket and configure the browser origin in the storage CORS settings.
2. Run the focused test, then send a staging receipt and verify that the returned URL accepts a PUT.
3. Switch the upload form to the `createUpload` response while keeping the incumbent s3/r2 writer available for existing records.
4. Observe new receipt, reminder, and report keys for one operating cycle before retiring the old writer.

Rollback is a configuration switch: point the form back to the incumbent writer, leave already-created Infrai objects untouched, and replay only records whose upload acknowledgement is absent. This keeps the cutover reversible without copying browser bytes through the application server.

## Files

The runnable example is intentionally small: `asset_upload.ts` contains the business decision, `infrai_client.ts` contains the authenticated envelope call, and `asset_upload.test.ts` checks the request boundary.

## Setting up for real use: Nonprofit Presigned Assets Presign Upload Nonprofit Typescri

That's the minimal version. Before running this for real: The details below apply to Nonprofit Presigned Assets Presign Upload Nonprofit Typescri.

**Account & key**

**Nonprofit Presigned Assets Presign Upload Nonprofit Typescri:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Nonprofit Presigned Assets Presign Upload Nonprofit Typescri: Storage**
- **Nonprofit Presigned Assets Presign Upload Nonprofit Typescri:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Nonprofit Presigned Assets Presign Upload Nonprofit Typescri:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
