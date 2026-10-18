import multer from "multer";

const notFound = (req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
};

// Single place that turns thrown errors into JSON responses.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(status).json({ message: err.message });
    }
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON body" });
    }
    const status = err.status || err.statusCode || 500;
    console.error(`[Error] ${req.method} ${req.originalUrl} -> ${status}:`, err.message || err);
    res.status(status).json({ message: status >= 500 ? "Server error" : err.message });
};

export { notFound, errorHandler };
