import { z } from "zod";
import { infrai } from "./infrai_client.js";

export const assetRequest = z.object({
  program: z.enum(["donor-receipt", "volunteer-reminder", "campaign-report"]),
  assetName: z.string().min(1).max(120),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(25_000_000),
});
export type AssetRequest = z.infer<typeof assetRequest>;

const bucket = "nonprofit-assets";

export function objectKey(input: AssetRequest): string {
  return `${input.program}/${input.assetName}`;
}

export async function createUpload(input: unknown): Promise<{ bucket: string; key: string; uploadUrl: string; method: "PUT" }> {
  const request = assetRequest.parse(input);
  await infrai.storage.bucket.create({ name: bucket });
  const key = objectKey(request);
  const signed = await infrai.storage.object.presign(bucket, key, {
    op: "put",
    expires_seconds: 900,
    content_type: request.contentType,
    max_bytes: request.sizeBytes,
    idempotency_key: `asset:${key}`,
  });
  return { bucket, key, uploadUrl: signed.url, method: "PUT" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [program, assetName, contentType, size] = process.argv.slice(2);
  createUpload({ program, assetName, contentType, sizeBytes: Number(size) })
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
