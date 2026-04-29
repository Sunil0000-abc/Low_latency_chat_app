const BASE = "http://localhost:5001/api";

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

    if (!res.ok) throw new Error("Delete failed");

    return true;
  } catch (err) {
    console.error("deleteConversation error:", err);
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