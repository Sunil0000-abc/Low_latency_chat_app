import express from "express";
import {
  generateDownloadUrl,
  generateUploadUrl,
  generateProfileUploadUrl
} from "../controllers/uploadcontroller.js";

import { auth } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/upload-url", generateUploadUrl);
router.get("/download-url", generateDownloadUrl);
router.post("/profile-upload-url", auth, generateProfileUploadUrl)

export default router;
