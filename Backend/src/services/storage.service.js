import { randomUUID } from "node:crypto";
import config from "../config.js";
import { logger } from "../observability/logger.js";
import * as s3 from "./storage/s3.driver.js";
import * as imagekit from "./storage/imagekit.driver.js";

// Video storage is pluggable so the app does not depend on one vendor:
//   STORAGE_DRIVER=s3       -> any S3-compatible store (SeaweedFS in the cluster, AWS S3, MinIO)
//   STORAGE_DRIVER=imagekit -> ImageKit CDN (needs a real ImageKit account)
const drivers = { s3, imagekit };
const driver = drivers[config.storage.driver];

const uploadFile = async (buffer, mimeType) => {
    const fileName = `${randomUUID()}.mp4`;
    const startTime = Date.now();
    try {
        const result = await driver.upload(buffer, fileName, mimeType);
        logger.info({ driver: config.storage.driver, fileName, ms: Date.now() - startTime }, "video uploaded");
        return result; // { url }
    } catch (error) {
        logger.error({ driver: config.storage.driver, fileName, ms: Date.now() - startTime, err: error.message }, "video upload failed");
        throw error;
    }
};

// Called once at startup (e.g. to create the bucket). Failure is logged, not
// fatal: browsing and login still work while storage is unavailable.
const initStorage = async () => {
    try {
        await driver.init?.();
        logger.info({ driver: config.storage.driver }, "storage ready");
    } catch (error) {
        logger.error({ driver: config.storage.driver, err: error.message }, "storage init failed");
    }
};

export { uploadFile, initStorage, driver as storageDriver };
