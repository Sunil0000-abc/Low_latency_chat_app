import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3client } from "../config/s3.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getUploadUrl = async (fileName, fileType) => {
  const key = `chat/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3client, command, { expiresIn: 60 });

  return {
    uploadUrl,
    fileUrl: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    key,
  };
};

export const getDownloadUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3client, command, { expiresIn: 60 });

  return url;
};
