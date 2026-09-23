const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

interface SignatureResponse {
  success: boolean;
  message?: string;

  cloudName: string;
  apiKey: string;

  timestamp: number;

  folder: string;
  publicId: string;

  signature: string;

  maxFileSize: number;
  allowedFormats: string[];
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

async function getUploadSignature(): Promise<SignatureResponse> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Authentication required"
    );
  }

  const response = await fetch(
    `${API_URL}/api/uploads/avatar/signature`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to prepare image upload"
    );
  }

  return data;
}

export async function uploadAvatar(
  file: File
): Promise<{
  url: string;
  publicId: string;
}> {
  const signature =
    await getUploadSignature();

  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "api_key",
    signature.apiKey
  );

  formData.append(
    "timestamp",
    String(signature.timestamp)
  );

  formData.append(
    "folder",
    signature.folder
  );

  formData.append(
    "public_id",
    signature.publicId
  );

  formData.append(
    "signature",
    signature.signature
  );

  const uploadUrl =
    `https://api.cloudinary.com/v1_1/` +
    `${signature.cloudName}/image/upload`;

  const response = await fetch(
    uploadUrl,
    {
      method: "POST",
      body: formData,
    }
  );

  const data =
    (await response.json()) as
      | CloudinaryUploadResponse
      | {
          error?: {
            message?: string;
          };
        };

  if (!response.ok) {
    const errorMessage =
      "error" in data
        ? data.error?.message
        : undefined;

    throw new Error(
      errorMessage ||
        "Cloudinary upload failed"
    );
  }

  const uploadData =
    data as CloudinaryUploadResponse;

  return {
    url: uploadData.secure_url,
    publicId: uploadData.public_id,
  };
}

export async function uploadListingImage(
  file: File
): Promise<string> {
  const signature = await getUploadSignature();

  const formData = new FormData();

  formData.append("file", file);

  formData.append(
    "api_key",
    signature.apiKey
  );

  formData.append(
    "timestamp",
    String(signature.timestamp)
  );

  formData.append(
    "folder",
    signature.folder
  );

  formData.append(
    "public_id",
    signature.publicId
  );

  formData.append(
    "signature",
    signature.signature
  );

  const uploadUrl =
    `https://api.cloudinary.com/v1_1/` +
    `${signature.cloudName}/image/upload`;

  const response = await fetch(
    uploadUrl,
    {
      method: "POST",
      body: formData,
    }
  );

  const data =
    (await response.json()) as
      | CloudinaryUploadResponse
      | {
          error?: {
            message?: string;
          };
        };

  if (!response.ok) {
    const errorMessage =
      "error" in data
        ? data.error?.message
        : undefined;

    throw new Error(
      errorMessage ||
        "Cloudinary upload failed"
    );
  }

  const uploadData =
    data as CloudinaryUploadResponse;

  return uploadData.secure_url;
}