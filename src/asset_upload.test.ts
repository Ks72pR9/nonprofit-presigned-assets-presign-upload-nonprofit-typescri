import assert from "node:assert/strict";
import { assetRequest, objectKey } from "./asset_upload.js";

const request = assetRequest.parse({ program: "donor-receipt", assetName: "receipt-1042.pdf", contentType: "application/pdf", sizeBytes: 1200 });
assert.equal(objectKey(request), "donor-receipt/receipt-1042.pdf");
assert.throws(() => assetRequest.parse({ program: "donor-receipt", assetName: "", contentType: "application/pdf", sizeBytes: 1200 }));
console.log("asset decision test passed");
