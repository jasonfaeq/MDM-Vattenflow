import { Timestamp } from "firebase/firestore";

export type UserRole = "Controller" | "MDM" | "Administrator";

export type Region = "DE" | "NL" | "SE" | "DK" | "UK";

export type RequestType = "WBS" | "PC" | "CC" | "Modify" | "Lock" | "Unlock";

export type RequestStatus =
  | "Submitted"
  | "InProgress"
  | "PendingInfo"
  | "ForwardedToSD"
  | "Completed"
  | "Rejected";

export interface Comment {
  userId: string;
  userName: string;
  timestamp: Timestamp;
  text: string;
  isAiResponse?: boolean;
}

export interface HistoryEntry {
  timestamp: Timestamp;
  status: RequestStatus;
  changedByUserId: string;
  changedByUserName: string;
}

export interface WBSData {
  type: "New" | "Update" | "Lock" | "Unlock" | "Close";
  controllingArea: string;
  companyCode: string;
  projectName: string;
  projectDefinition: string;
  level?: string;
  responsiblePCCC: string;
  planningElement?: boolean;
  rubricElement?: boolean;
  billingElement?: boolean;
  settlementRulePercent?: string;
  settlementRuleGoal?: string;
  responsiblePerson?: string;
  userId?: string;
  employmentNumber?: string;
  functionalArea?: string;
  tgPhase?: string;
  projectSpec?: string;
  motherCode?: string;
  comment?: string;
  region: Region;
}

export interface PCData {
  // Define PC request fields
  costCenter: string;
  profitCenterName: string;
  region: Region;
  // Add other fields as needed
}

export interface CCData {
  // Define CC request fields
  costCenterName: string;
  region: Region;
  // Add other fields as needed
}

export interface ModifyData {
  // Define Modify request fields
  objectId: string;
  objectType: "WBS" | "PC" | "CC";
  changes: string;
  region: Region;
  // Add other fields as needed
}

export interface LockUnlockData {
  // Define Lock/Unlock request fields
  objectId: string;
  objectType: "WBS" | "PC" | "CC";
  reason: string;
  region: Region;
  // Add other fields as needed
}

export type SubmittedData =
  | WBSData
  | PCData
  | CCData
  | ModifyData
  | LockUnlockData
  | WBSData[]; // For bulk WBS submission

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
}

export interface Request {
  id?: string;
  requesterId: string;
  requesterEmail: string;
  requestType: RequestType;
  region: Region;
  status: RequestStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedData: SubmittedData;
  comments: Comment[];
  internalComments: Comment[];
  history: HistoryEntry[];
}
