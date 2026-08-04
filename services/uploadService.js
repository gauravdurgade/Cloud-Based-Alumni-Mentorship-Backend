const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Streams an image buffer to Cloudinary with automatic resizing and optimization.
 */
const uploadImageToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                transformation: [
                    { width: 500, height: 500, crop: "fill" },
                    { quality: "auto", fetch_format: "auto" }
                ]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

/**
 * Streams a PDF buffer to Cloudinary securely.
 */
const uploadPdfToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "raw" // Required for PDFs and non-images
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

/**
 * Destroys an existing asset on Cloudinary.
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return;
        
        // PDFs use "raw", images use "image". We'll try both to be safe or determine from the ID.
        // If it's a PDF, we might need resource_type: raw.
        const isPdf = publicId.includes("resumes");
        await cloudinary.uploader.destroy(publicId, { resource_type: isPdf ? "raw" : "image" });
    } catch (error) {
        console.error("Failed to delete Cloudinary asset:", error.message);
    }
};

module.exports = {
    uploadImageToCloudinary,
    uploadPdfToCloudinary,
    deleteFromCloudinary
};
