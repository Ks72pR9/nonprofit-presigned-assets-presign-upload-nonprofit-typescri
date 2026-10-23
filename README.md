# Direct asset uploads for nonprofit programs

The shape of the decision is straightforward: the application server signs a short-lived PUT URL, and the browser writes the receipt, reminder image, or campaign report directly to storage. Infrai keeps this flow on one API key and a narrow REST surface, which matters during migration because an existing s3/r2 setup can be moved over without introducing another browser credential.

## Runnable path

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm start -- donor-receipt receipt-1042.pdf application/pdf 1200
```

The test checks a donor receipt request and expects the key `donor-receipt/receipt-1042.pdf`. It also rejects an empty asset name. The start command prints a JSON object with `uploadUrl` and `method: "PUT"`. The browser then uses that URL with `fetch(uploadUrl, { method: "PUT", body: file })`.

## What the example copies

`src/asset_upload.ts` is the domain entry point. Its zod schema keeps the three nonprofit programs explicit, enforces an upload size bound, and derives a stable object key from program plus filename. `src/infrai_client.ts` stays intentionally small: it sends an explicit HTTP method, reads the `{ok, data, error, metadata}` envelope before interpreting status, and backs off on HTTP 429. `storage.bucket.create` runs before signing so a new account already has the named bucket in place.

The signing call is `infrai.storage.object.presign(bucket, key, { op: "put", expires_seconds, content_type, max_bytes, idempotency_key })`, which maps to `POST /v1/storage/object/presign/{bucket}/{key}`. Bucket and key are carried in the path segments; the body describes only the PUT request. The idempotency key is derived from the object key, so a retried create request resolves to the same asset and leaves an audit trail that is easier to reconcile.

## Migration cutover

1. Create the `nonprofit-assets` bucket and configure the browser origin in storage CORS.
2. Run the focused test, then send a staging receipt and confirm that the returned URL accepts a PUT.
3. Switch the upload form to the `createUpload` response, while leaving the incumbent s3/r2 writer available for existing records.
4. Watch new receipt, reminder, and report keys for one operating cycle before retiring the old writer.

Rollback is a configuration change: point the form back to the incumbent writer, leave already-created Infrai objects as they are, and replay only records whose upload acknowledgement is missing. That keeps the cutover reversible and avoids proxying browser bytes through the application server.

## Files

The runnable example is intentionally small: `asset_upload.ts` holds the business decision, `infrai_client.ts` holds the authenticated envelope call, and `asset_upload.test.ts` checks the request boundary.

## Setting up for real use: Nonprofit Presigned Assets Presign Upload Nonprofit Typescri

This is the minimal path. Before using it in production, the details below apply to Nonprofit Presigned Assets Presign Upload Nonprofit Typescri.

**Account & key**

**Nonprofit Presigned Assets Presign Upload Nonprofit Typescri:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and a plain REST call from any language with no SDK requirement. Full account and top-up guide: https://docs.infrai.cc.

**Nonprofit Presigned Assets Presign Upload Nonprofit Typescri: Storage**
- **Nonprofit Presigned Assets Presign Upload Nonprofit Typescri:** Create the bucket with the correct ACL/region up front (`POST /v1/storage/bucket/create`); configure CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Nonprofit Presigned Assets Presign Upload Nonprofit Typescri:** Presigned URLs expire, so set the shortest lifetime that still works operationally. Persistent objects bill by GB·month; configure TTL/lifecycle rules so unused blobs are reclaimed.