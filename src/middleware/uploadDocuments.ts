import multer from "multer";

// Stockage en mémoire — on upload vers Cloudinary manuellement dans le service
export const uploadDocuments = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    cb(null, allowed.includes(file.mimetype) ? true : false);
  },
});