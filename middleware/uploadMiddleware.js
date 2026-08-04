const multer = require("multer");
const path = require("path");

// Use memory storage to stream directly to Cloudinary
const storage = multer.memoryStorage();

// Validate Profile Images
const imageFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const allowedExtensions = [".jpeg", ".jpg", ".png", ".webp"];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed for images."), false);
    }
};

// Validate Resumes
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf" && path.extname(file.originalname).toLowerCase() === ".pdf") {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only PDF is allowed for resumes."), false);
    }
};

const uploadImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: imageFilter
});

const uploadResume = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: pdfFilter
});

module.exports = {
    uploadImage,
    uploadResume
};
