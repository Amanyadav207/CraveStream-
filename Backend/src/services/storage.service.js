import ImageKit from "imagekit";

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT

})


const uploadFile = async (file, fileName) => {
    console.log(`[Storage Service] Starting upload for ${fileName}...`);
    const startTime = Date.now();
    try {
        const result = await imagekit.upload({
            file: file,
            fileName: fileName
        });
        console.log(`[Storage Service] Upload successful for ${fileName}. Time taken: ${Date.now() - startTime}ms`);
        return result;
    } catch (error) {
        console.error(`[Storage Service] Upload failed for ${fileName}. Time taken: ${Date.now() - startTime}ms`, error);
        throw error;
    }
}

export { uploadFile };