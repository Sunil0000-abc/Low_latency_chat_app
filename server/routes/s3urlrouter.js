import express from "express";
import {
  generateDownloadUrl,
  generateUploadUrl,
} from "../controllers/uploadcontroller.js";

const router = express.Router();

router.post("/upload-url", generateUploadUrl);
router.get("/download-url", generateDownloadUrl);

export default router;
