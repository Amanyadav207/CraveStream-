import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    CreateBucketCommand,
} from "@aws-sdk/client-s3";
import config from "../../config.js";

const { endpoint, region, bucket, accessKeyId, secretAccessKey } = config.storage.s3;

const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint), // self-hosted S3 stores use path-style URLs
    credentials: accessKeyId ? { accessKeyId, secretAccessKey } : undefined,
});

const init = async () => {
    try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (error) {
        if (error.$metadata?.httpStatusCode !== 404) throw error;
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
        console.log(`[Storage Service] created bucket "${bucket}"`);
    }
};

const upload = async (buffer, fileName, mimeType) => {
    await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        Body: buffer,
        ContentType: mimeType || "video/mp4",
    }));
    // The bucket stays private; the API streams objects through /api/media,
    // so the object store never has to be exposed outside the cluster.
    return { url: `/api/media/${fileName}` };
};

// Supports HTTP Range so browsers can seek inside videos.
const getObject = (key, range) =>
    client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: range }));

export { init, upload, getObject };
