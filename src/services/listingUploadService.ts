const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

interface UploadSignatureResponse {
  success: boolean;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
}

export interface UploadedListingImage {
  url: string;
  publicId: string;
}

export async function uploadListingImage(
  file: File
): Promise<UploadedListingImage> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required");
  }

  // Get signed upload parameters from our backend
  const signatureResponse = await fetch(
    `${API_URL}/api/uploads/listing/signature`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const signatureData: UploadSignatureResponse =
    await signatureResponse.json();

  if (!signatureResponse.ok || !signatureData.success) {
    throw new Error(
      "Failed to prepare image upload"
    );
  }

  // Upload directly to Cloudinary
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "api_key",
    signatureData.apiKey
  );
  formData.append(
    "timestamp",
    String(signatureData.timestamp)
  );
  formData.append(
    "folder",
    signatureData.folder
  );
  formData.append(
    "public_id",
    signatureData.publicId
  );
  formData.append(
    "signature",
    signatureData.signature
  );

  const cloudinaryResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const cloudinaryData =
    await cloudinaryResponse.json();

  if (!cloudinaryResponse.ok) {
    throw new Error(
      cloudinaryData.error?.message ||
        "Image upload failed"
    );
  }

  return {
    url: cloudinaryData.secure_url,
    publicId: cloudinaryData.public_id,
  };
}