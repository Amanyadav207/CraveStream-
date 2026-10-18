import ImageKit, { toFile } from "@imagekit/nodejs";
import config from "../../config.js";

let client;

const init = async () => {
    if (!config.storage.imagekit.privateKey) {
        throw new Error("IMAGEKIT_PRIVATE_KEY is not set");
    }
    client = new ImageKit({ privateKey: config.storage.imagekit.privateKey });
};

const upload = async (buffer, fileName) => {
    if (!client) await init();
    const result = await client.files.upload({
        file: await toFile(buffer, fileName),
        fileName,
    });
    return { url: result.url };
};

export { init, upload };
