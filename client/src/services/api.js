import { imageCompresser } from "../utils/compress";
const BASE = "/api";

export const getToken = () => localStorage.getItem("token");

export async function getChats(skip = 0, limit = 15) {
  const res = await fetch(`${BASE}/conversations/user?skip=${skip}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

export async function searchUsers(q) {
  const res = await fetch(`${BASE}/user/search?q=${q}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

export async function createConversation(userB) {
  const res = await fetch(`${BASE}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ userB }),
  });
  return res.json();
}

export async function deleteConversation(conversationId) {
  try {
    const res = await fetch(`${BASE}/conversations/${conversationId}`, {
      method: "DELETE",
      headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Delete API Error:", data); // 👈 SHOW BACKEND ERROR
      throw new Error(data.error || "Delete failed");
    }

    return data;
  } catch (err) {
    console.error("deleteConversation error:", err);
    return false;
  }
}

export async function deleteMessage(messageId) {
  try {
    const res = await fetch(`${BASE}/conversations/message/${messageId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");
    return data;
  } catch (err) {
    console.error("deleteMessage error:", err);
    return false;
  }
}

export async function getMessages(conversationId) {
  // Mock endpoint for now, or point to future endpoint
  const res = await fetch(`${BASE}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getUploadUrl(fileName, fileType) {
  const res = await fetch(`${BASE}/files/upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ fileName, fileType }),
  });
  return res.json();
}

export async function getDownloadUrl(fileKey) {
  const res = await fetch(`${BASE}/files/download-url?key=${encodeURIComponent(fileKey)}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

export async function uploadFileToS3(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });
  if (!res.ok) throw new Error("Failed to upload file to S3");
  return true;
}

export async function updateProfile(data) {
  const res = await fetch(`${BASE}/user/update-profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function uploadProfileImage(file) {
  // 1. get upload URL
  const compressedfile = await imageCompresser(file);
  const res = await fetch(`${BASE}/files/profile-upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ fileType: compressedfile.type }),
  });

  const { uploadUrl, fileUrl } = await res.json();

  // 2. upload to S3
  await uploadFileToS3(uploadUrl, compressedfile);

  // 3. update profile in DB (optional here, as we can call updateProfile from the component)
  return fileUrl;
}