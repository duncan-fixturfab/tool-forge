// Autodesk APS (Platform Services) Types
// ==============================

// ==============================
// OAUTH TYPES
// ==============================

export interface AutodeskTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
}

// OIDC-standard userinfo response from Autodesk
export interface AutodeskUserProfile {
  // OIDC standard claims (current format)
  sub?: string;           // User ID (OIDC standard)
  name?: string;          // Full name
  email?: string;         // Email
  email_verified?: boolean;
  given_name?: string;    // First name
  family_name?: string;   // Last name
  picture?: string;       // Profile picture URL
  locale?: string;
  updated_at?: number;

  // Legacy format fields (kept for backwards compatibility)
  userId?: string;
  userName?: string;
  emailId?: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  "2FaEnabled"?: boolean;
  countryCode?: string;
  language?: string;
  optin?: boolean;
  lastModified?: string;
  profileImages?: {
    sizeX20?: string;
    sizeX40?: string;
    sizeX50?: string;
    sizeX58?: string;
    sizeX80?: string;
    sizeX120?: string;
    sizeX160?: string;
    sizeX176?: string;
    sizeX240?: string;
    sizeX360?: string;
  };
}

// ==============================
// DATA MANAGEMENT API TYPES
// ==============================

export interface HubAttributes {
  name: string;
  extension: {
    type: string;
    version: string;
    schema?: {
      href: string;
    };
    data?: {
      type?: string;
    };
  };
  region?: string;
}

export interface Hub {
  type: "hubs";
  id: string;
  attributes: HubAttributes;
  relationships?: {
    projects?: {
      links?: {
        related?: {
          href: string;
        };
      };
    };
  };
  links?: {
    self?: {
      href: string;
    };
  };
}

export interface ProjectAttributes {
  name: string;
  scopes?: string[];
  extension: {
    type: string;
    version: string;
    data?: Record<string, unknown>;
  };
}

export interface Project {
  type: "projects";
  id: string;
  attributes: ProjectAttributes;
  relationships?: {
    hub?: {
      data?: {
        type: string;
        id: string;
      };
    };
    rootFolder?: {
      data?: {
        type: string;
        id: string;
      };
    };
    topFolders?: {
      links?: {
        related?: {
          href: string;
        };
      };
    };
  };
  links?: {
    self?: {
      href: string;
    };
  };
}

export interface FolderAttributes {
  name: string;
  displayName: string;
  objectCount?: number;
  createTime?: string;
  createUserId?: string;
  lastModifiedTime?: string;
  lastModifiedUserId?: string;
  hidden?: boolean;
  extension: {
    type: string;
    version: string;
    data?: Record<string, unknown>;
  };
}

export interface Folder {
  type: "folders";
  id: string;
  attributes: FolderAttributes;
  relationships?: {
    parent?: {
      data?: {
        type: string;
        id: string;
      };
    };
    contents?: {
      links?: {
        related?: {
          href: string;
        };
      };
    };
  };
  links?: {
    self?: {
      href: string;
    };
  };
}

export interface ItemAttributes {
  displayName: string;
  createTime: string;
  createUserId: string;
  lastModifiedTime: string;
  lastModifiedUserId: string;
  hidden?: boolean;
  extension: {
    type: string;
    version: string;
    data?: Record<string, unknown>;
  };
}

export interface Item {
  type: "items";
  id: string;
  attributes: ItemAttributes;
  relationships?: {
    tip?: {
      data?: {
        type: string;
        id: string;
      };
    };
    versions?: {
      links?: {
        related?: {
          href: string;
        };
      };
    };
    parent?: {
      data?: {
        type: string;
        id: string;
      };
    };
  };
  links?: {
    self?: {
      href: string;
    };
  };
}

export interface Version {
  type: "versions";
  id: string;
  attributes: {
    name: string;
    displayName: string;
    createTime: string;
    createUserId: string;
    lastModifiedTime: string;
    lastModifiedUserId: string;
    versionNumber: number;
    storageSize?: number;
    fileType?: string;
    extension: {
      type: string;
      version: string;
      data?: Record<string, unknown>;
    };
  };
  relationships?: {
    item?: {
      data?: {
        type: string;
        id: string;
      };
    };
    storage?: {
      data?: {
        type: string;
        id: string;
      };
    };
  };
}

// ==============================
// API RESPONSE TYPES
// ==============================

export interface JsonApiResponse<T> {
  jsonapi: {
    version: string;
  };
  links?: {
    self?: {
      href: string;
    };
    first?: {
      href: string;
    };
    prev?: {
      href: string;
    } | null;
    next?: {
      href: string;
    } | null;
  };
  data: T;
  included?: Array<Hub | Project | Folder | Item | Version>;
}

export interface StorageLocation {
  type: "objects";
  id: string;
  relationships?: {
    target?: {
      data?: {
        type: string;
        id: string;
      };
    };
  };
}

export interface SignedS3Upload {
  uploadKey: string;
  urls: string[];
}

// ==============================
// DATABASE TYPES
// ==============================

export interface AutodeskConnection {
  id: string;
  user_id: string;
  autodesk_user_id: string;
  autodesk_email: string | null;
  autodesk_name: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  default_hub_id: string | null;
  default_hub_name: string | null;
  default_project_id: string | null;
  default_project_name: string | null;
  default_folder_id: string | null;
  default_folder_path: string | null;
  connected_at: string;
  last_sync_at: string | null;
  updated_at: string;
}

export type SyncStatus = "pending" | "uploading" | "success" | "failed";

export interface AutodeskSyncHistory {
  id: string;
  user_id: string;
  library_id: string | null;
  library_name: string;
  hub_id: string;
  hub_name: string | null;
  project_id: string;
  project_name: string | null;
  folder_id: string;
  folder_path: string | null;
  item_id: string | null;
  version_number: number | null;
  status: SyncStatus;
  error_message: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

// ==============================
// UI TYPES
// ==============================

export interface SyncDestination {
  hubId: string;
  hubName: string;
  projectId: string;
  projectName: string;
  folderId: string;
  folderPath: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  type: "hub" | "project" | "folder";
}

// ==============================
// PKCE TYPES
// ==============================

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
}
