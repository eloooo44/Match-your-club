import multer from "multer";

import path from "path";

const videoStorage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads/videos");
  },

  filename: (_, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const imageStorage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads/logos");
  },

  filename: (_, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const uploadVideo = multer({
  storage: videoStorage,

  fileFilter: (_, file, cb) => {
    const allowedTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/mpeg",
      "application/octet-stream",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid video format"));
    }
  },
});

export const uploadImage = multer({
  storage: imageStorage,

  fileFilter: (_, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid image format"));
    }
  },
});
