import { randomUUID } from "node:crypto";
import config from "../config.js";
import * as s3 from "./storage/s3.driver.js";
import * as imagekit from "./storage/imagekit.driver.js";

// Video storage is pluggable so the app does not depend on one vendor:
//   STORAGE_DRIVER=s3       -> any S3-compatible store (SeaweedFS in the cluster, AWS S3, MinIO)
//   STORAGE_DRIVER=imagekit -> ImageKit CDN (needs a real ImageKit account)
const drivers = { s3, imagekit };
const driver = drivers[config.storage.driver];

const uploadFile = async (buffer, mimeType) => {
    const fileName = `${randomUUID()}.mp4`;
    console.log(`[Storage Service] (${config.storage.driver}) starting upload for ${fileName}`);
    const startTime = Date.now();
    try {
        const result = await driver.upload(buffer, fileName, mimeType);
        console.log(`[Storage Service] upload ok for ${fileName} in ${Date.now() - startTime}ms`);
        return result; // { url }
    } catch (error) {
        console.error(`[Storage Service] upload failed for ${fileName} in ${Date.now() - startTime}ms:`, error.message);
        throw error;
    }
};

// Called once at startup (e.g. to create the bucket). Failure is logged, not
// fatal: browsing and login still work while storage is unavailable.
const initStorage = async () => {
    try {
        await driver.init?.();
        console.log(`[Storage Service] driver "${config.storage.driver}" ready`);
    } catch (error) {
        console.error(`[Storage Service] driver "${config.storage.driver}" init failed:`, error.message);
    }
};

export { uploadFile, initStorage, driver as storageDriver };
