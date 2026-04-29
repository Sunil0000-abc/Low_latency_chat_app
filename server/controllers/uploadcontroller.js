import { getDownloadUrl, getUploadUrl } from "../services/tokengeneration.js";

export const generateUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const data = await getUploadUrl(fileName, fileType);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

export const generateDownloadUrl = async (req, res) => {
  try {
    const { key } = req.query;

    const url = await getDownloadUrl(key);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate download URL" });
  }
};
