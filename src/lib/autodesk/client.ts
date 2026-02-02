// Autodesk APS (Platform Services) API Client
// ==============================

import {
  AutodeskTokens,
  AutodeskUserProfile,
  Hub,
  Project,
  Folder,
  Item,
  Version,
  JsonApiResponse,
  PKCEChallenge,
  SignedS3Upload,
} from "@/types/autodesk";

// ==============================
// CONSTANTS
// ==============================

const APS_AUTH_BASE = "https://developer.api.autodesk.com/authentication/v2";
const APS_DATA_BASE = "https://developer.api.autodesk.com/data/v1";
const APS_PROJECT_BASE = "https://developer.api.autodesk.com/project/v1";
const APS_OSS_BASE = "https://developer.api.autodesk.com/oss/v2";

// Required scopes for Fusion Team Hub access
const OAUTH_SCOPES = "data:read data:write data:create";

// Fusion Team Hub extension type
const FUSION_HUB_TYPE = "hubs:autodesk.core:Hub";

// ==============================
// PKCE UTILITIES
// ==============================

function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer).slice(0, length);
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
}

export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  // code_verifier: 43-128 characters
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64URLEncode(hashed);

  return {
    codeVerifier,
    codeChallenge,
  };
}

// ==============================
// OAUTH METHODS
// ==============================

export function getClientCredentials(): { clientId: string; clientSecret: string; callbackUrl: string } {
  const clientId = process.env.AUTODESK_CLIENT_ID;
  const clientSecret = process.env.AUTODESK_CLIENT_SECRET;
  const callbackUrl = process.env.AUTODESK_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error("Missing Autodesk APS credentials in environment variables");
  }

  return { clientId, clientSecret, callbackUrl };
}

export function generateAuthUrl(state: string, codeChallenge: string): string {
  const { clientId, callbackUrl } = getClientCredentials();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: OAUTH_SCOPES,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${APS_AUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  authorizationCode: string,
  codeVerifier: string
): Promise<AutodeskTokens> {
  const { clientId, clientSecret, callbackUrl } = getClientCredentials();

  const response = await fetch(`${APS_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange authorization code: ${error}`);
  }

  return await response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<AutodeskTokens> {
  const { clientId, clientSecret } = getClientCredentials();

  const response = await fetch(`${APS_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: OAUTH_SCOPES,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh access token: ${error}`);
  }

  return await response.json();
}

// ==============================
// USER PROFILE
// ==============================

export async function getUserProfile(accessToken: string): Promise<AutodeskUserProfile> {
  const response = await fetch("https://api.userprofile.autodesk.com/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user profile: ${error}`);
  }

  return await response.json();
}

// ==============================
// DATA MANAGEMENT API
// ==============================

async function makeDataRequest<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Data Management API error (${response.status}): ${error}`);
  }

  return await response.json();
}

export async function listHubs(accessToken: string): Promise<Hub[]> {
  const response = await makeDataRequest<JsonApiResponse<Hub[]>>(
    accessToken,
    `${APS_PROJECT_BASE}/hubs`
  );

  // Filter to only Fusion Team hubs
  return response.data.filter((hub) => {
    const hubType = hub.attributes?.extension?.type;
    // Include Fusion Team hubs (autodesk.core:Hub) and BIM 360 hubs that support Fusion
    return hubType === FUSION_HUB_TYPE || hubType === "hubs:autodesk.bim360:Account";
  });
}

export async function listProjects(accessToken: string, hubId: string): Promise<Project[]> {
  const response = await makeDataRequest<JsonApiResponse<Project[]>>(
    accessToken,
    `${APS_PROJECT_BASE}/hubs/${hubId}/projects`
  );

  return response.data;
}

export async function getTopFolders(
  accessToken: string,
  hubId: string,
  projectId: string
): Promise<Folder[]> {
  const response = await makeDataRequest<JsonApiResponse<Folder[]>>(
    accessToken,
    `${APS_PROJECT_BASE}/hubs/${hubId}/projects/${projectId}/topFolders`
  );

  return response.data;
}

export async function listFolderContents(
  accessToken: string,
  projectId: string,
  folderId: string
): Promise<(Folder | Item)[]> {
  const response = await makeDataRequest<JsonApiResponse<(Folder | Item)[]>>(
    accessToken,
    `${APS_DATA_BASE}/projects/${projectId}/folders/${folderId}/contents`
  );

  return response.data;
}

export async function getFolder(
  accessToken: string,
  projectId: string,
  folderId: string
): Promise<Folder> {
  const response = await makeDataRequest<JsonApiResponse<Folder>>(
    accessToken,
    `${APS_DATA_BASE}/projects/${projectId}/folders/${folderId}`
  );

  return response.data;
}

export async function createFolder(
  accessToken: string,
  projectId: string,
  parentFolderId: string,
  folderName: string
): Promise<Folder> {
  const response = await makeDataRequest<JsonApiResponse<Folder>>(
    accessToken,
    `${APS_DATA_BASE}/projects/${projectId}/folders`,
    {
      method: "POST",
      body: JSON.stringify({
        jsonapi: { version: "1.0" },
        data: {
          type: "folders",
          attributes: {
            name: folderName,
            extension: {
              type: "folders:autodesk.core:Folder",
              version: "1.0",
            },
          },
          relationships: {
            parent: {
              data: {
                type: "folders",
                id: parentFolderId,
              },
            },
          },
        },
      }),
    }
  );

  return response.data;
}

// ==============================
// CAM ASSETS FOLDER UTILITIES
// ==============================

export async function findOrCreateCamAssetsFolder(
  accessToken: string,
  hubId: string,
  projectId: string
): Promise<Folder> {
  // Get top folders
  const topFolders = await getTopFolders(accessToken, hubId, projectId);

  // Find "Project Files" folder (typical for Fusion Team)
  let projectFilesFolder = topFolders.find(
    (f) => f.attributes.name === "Project Files" || f.attributes.displayName === "Project Files"
  );

  // If not found, try to find any folder we can use
  if (!projectFilesFolder && topFolders.length > 0) {
    projectFilesFolder = topFolders[0];
  }

  if (!projectFilesFolder) {
    throw new Error("No accessible folders found in project");
  }

  // Navigate/create: Libraries > Assets > CAMTools
  // This is the standard path where Fusion 360 discovers CAM tool libraries
  let currentFolder = projectFilesFolder;
  const folderPath = ["Libraries", "Assets", "CAMTools"];

  for (const folderName of folderPath) {
    const contents = await listFolderContents(accessToken, projectId, currentFolder.id);
    const existingFolder = contents.find(
      (item) =>
        item.type === "folders" &&
        (item.attributes.name === folderName || item.attributes.displayName === folderName)
    ) as Folder | undefined;

    if (existingFolder) {
      currentFolder = existingFolder;
    } else {
      // Create the folder
      currentFolder = await createFolder(accessToken, projectId, currentFolder.id, folderName);
    }
  }

  return currentFolder;
}

// ==============================
// FILE UPLOAD
// ==============================

export async function createStorageLocation(
  accessToken: string,
  projectId: string,
  folderId: string,
  fileName: string
): Promise<{ objectId: string; uploadUrl: string; uploadKey: string }> {
  // Create storage location
  const storageResponse = await makeDataRequest<JsonApiResponse<{ id: string }>>(
    accessToken,
    `${APS_DATA_BASE}/projects/${projectId}/storage`,
    {
      method: "POST",
      body: JSON.stringify({
        jsonapi: { version: "1.0" },
        data: {
          type: "objects",
          attributes: {
            name: fileName,
          },
          relationships: {
            target: {
              data: {
                type: "folders",
                id: folderId,
              },
            },
          },
        },
      }),
    }
  );

  const objectId = storageResponse.data.id;

  // Get signed S3 URL for upload
  const bucketKey = objectId.split("/")[0].replace("urn:adsk.objects:os.object:", "");
  const objectKey = objectId.split("/")[1];

  const signedResponse = await makeDataRequest<SignedS3Upload>(
    accessToken,
    `${APS_OSS_BASE}/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
    {
      method: "GET",
    }
  );

  return {
    objectId,
    uploadUrl: signedResponse.urls[0],
    uploadKey: signedResponse.uploadKey,
  };
}

export async function uploadFileToStorage(
  uploadUrl: string,
  fileBlob: Blob
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: fileBlob,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }
}

export async function completeUpload(
  accessToken: string,
  objectId: string,
  uploadKey: string
): Promise<void> {
  const bucketKey = objectId.split("/")[0].replace("urn:adsk.objects:os.object:", "");
  const objectKey = objectId.split("/")[1];

  const response = await fetch(
    `${APS_OSS_BASE}/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uploadKey }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to complete upload: ${response.statusText}`);
  }
}

export async function createItem(
  accessToken: string,
  projectId: string,
  folderId: string,
  objectId: string,
  fileName: string
): Promise<Item> {
  const response = await makeDataRequest<JsonApiResponse<Item>>(
    accessToken,
    `${APS_DATA_BASE}/projects/${projectId}/items`,
    {
      method: "POST",
      body: JSON.stringify({
        jsonapi: { version: "1.0" },
        data: {
          type: "items",
          attributes: {
            displayName: fileName,
            extension: {
              type: "items:autodesk.core:File",
              version: "1.0",
            },
          },
          relationships: {
            tip: {
              data: {
                type: "versions",
                id: "1",
              },
            },
            parent: {
              data: {
                type: "folders",
                id: folderId,
              },
            },
          },
        },
        included: [
          {
            type: "versions",
            id: "1",
            attributes: {
              name: fileName,
              extension: {
                type: "versions:autodesk.core:File",
                version: "1.0",
              },
            },
            relationships: {
              storage: {
                data: {
                  type: "objects",
                  id: objectId,
                },
              },
            },
          },
        ],
      }),
    }
  );

  return response.data;
}

export async function createNewVersion(
  accessToken: string,
  projectId: string,
  itemId: string,
  objectId: string,
  fileName: string
): Promise<Version> {
  const response = await makeDataRequest<JsonApiResponse<Version>>(
    accessToken,
    `${APS_DATA_BASE}/projects/${projectId}/versions`,
    {
      method: "POST",
      body: JSON.stringify({
        jsonapi: { version: "1.0" },
        data: {
          type: "versions",
          attributes: {
            name: fileName,
            extension: {
              type: "versions:autodesk.core:File",
              version: "1.0",
            },
          },
          relationships: {
            item: {
              data: {
                type: "items",
                id: itemId,
              },
            },
            storage: {
              data: {
                type: "objects",
                id: objectId,
              },
            },
          },
        },
      }),
    }
  );

  return response.data;
}

// ==============================
// HIGH-LEVEL UPLOAD FUNCTION
// ==============================

export interface UploadResult {
  itemId: string;
  versionNumber: number;
  isNewItem: boolean;
}

export async function uploadToolsFile(
  accessToken: string,
  projectId: string,
  folderId: string,
  fileName: string,
  fileBlob: Blob,
  existingItemId?: string
): Promise<UploadResult> {
  // 1. Create storage location
  const { objectId, uploadUrl, uploadKey } = await createStorageLocation(
    accessToken,
    projectId,
    folderId,
    fileName
  );

  // 2. Upload file to S3
  await uploadFileToStorage(uploadUrl, fileBlob);

  // 3. Complete the upload (finalize in OSS)
  await completeUpload(accessToken, objectId, uploadKey);

  // 4. Create item or new version
  if (existingItemId) {
    // Update existing item with new version
    const version = await createNewVersion(
      accessToken,
      projectId,
      existingItemId,
      objectId,
      fileName
    );

    return {
      itemId: existingItemId,
      versionNumber: version.attributes.versionNumber,
      isNewItem: false,
    };
  } else {
    // Create new item
    const item = await createItem(accessToken, projectId, folderId, objectId, fileName);

    return {
      itemId: item.id,
      versionNumber: 1,
      isNewItem: true,
    };
  }
}

// ==============================
// UTILITIES
// ==============================

export async function findExistingToolsFile(
  accessToken: string,
  projectId: string,
  folderId: string,
  fileName: string
): Promise<Item | null> {
  const contents = await listFolderContents(accessToken, projectId, folderId);

  const existingItem = contents.find(
    (item) => item.type === "items" && item.attributes.displayName === fileName
  ) as Item | undefined;

  return existingItem || null;
}
