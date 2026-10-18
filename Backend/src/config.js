// All runtime configuration comes from environment variables, so the same
// image can run locally, in docker compose and in Kubernetes.

const required = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const storageDriver = (process.env.STORAGE_DRIVER || "s3").toLowerCase();

const config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    dbUrl: required("DB_URL"),
    jwtSecret: required("JWT_SECRET"),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    // Set by the Docker build / Kubernetes so the running version is visible.
    appVersion: process.env.APP_VERSION || "dev",
    gitSha: process.env.GIT_SHA || "unknown",
    storage: {
        driver: storageDriver,
        s3: {
            endpoint: process.env.S3_ENDPOINT, // e.g. http://seaweedfs:8333 (omit for AWS S3)
            region: process.env.S3_REGION || "us-east-1",
            bucket: process.env.S3_BUCKET || "cravestream-media",
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        imagekit: {
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        },
    },
};

if (!["s3", "imagekit"].includes(config.storage.driver)) {
    throw new Error(`STORAGE_DRIVER must be "s3" or "imagekit", got "${config.storage.driver}"`);
}

export default config;
