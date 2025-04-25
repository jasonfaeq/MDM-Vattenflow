import { Timestamp } from "firebase/firestore";

export type UserRole = "Controller" | "MDM" | "Administrator";

export type Region = "DE" | "NL" | "SE" | "DK" | "UK";

export type RequestType = "WBS" | "PC" | "CC" | "PCCC" | "Modify" | "Lock" | "Unlock";

export type RequestStatus =
  | "Submitted"
  | "InProgress"
  | "PendingInfo"
  | "ForwardedToSD"
  | "Completed"
  | "Rejected";

export type RegionType = "DE" | "NL" | "SE" | "PL";

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

export interface BaseRequestData {
  startDate?: Date | null;
  endDate?: Date | null;
  region: Region;
}

export interface StoredBaseRequestData {
  startDate?: Timestamp | null;
  endDate?: Timestamp | null;
  region: Region;
}

export interface WBSData extends BaseRequestData {
  type: "New" | "Update" | "Lock" | "Unlock" | "Close";
  controllingArea: string;
  companyCode: string;
  projectName: string;
  projectDefinition: string;
  level: string;
  projectType: string;
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
}

export interface PCData extends BaseRequestData {
  // Add PC specific fields
  pcId: string;
  description: string;
  // Add other fields as needed
}

export interface CCData extends BaseRequestData {
  // Add CC specific fields
  ccId: string;
  description: string;
  // Add other fields as needed
}

export interface PCCCData extends BaseRequestData {
  type: "New" | "Update" | "Lock" | "Unlock" | "Close";
  pcccId: string;
  description: string;
  controllingArea: string;
  companyCode: string;
  responsiblePerson: string;
  userId: string;
  employmentNumber: string;
  functionalArea?: string;
  comment?: string;
}

export interface ModifyData extends BaseRequestData {
  objectType: "WBS" | "PC" | "CC";
  objectId: string;
  changes: string;
  justification: string;
}

export interface LockUnlockData extends BaseRequestData {
  objectType: "WBS" | "PC" | "CC";
  objectId: string;
  action: "Lock" | "Unlock";
  justification: string;
}

export type StoredWBSData = Omit<WBSData, 'startDate' | 'endDate'> & StoredBaseRequestData;
export type StoredPCData = Omit<PCData, 'startDate' | 'endDate'> & StoredBaseRequestData;
export type StoredCCData = Omit<CCData, 'startDate' | 'endDate'> & StoredBaseRequestData;
export type StoredPCCCData = Omit<PCCCData, 'startDate' | 'endDate'> & StoredBaseRequestData;
export type StoredModifyData = Omit<ModifyData, 'startDate' | 'endDate'> & StoredBaseRequestData;
export type StoredLockUnlockData = Omit<LockUnlockData, 'startDate' | 'endDate'> & StoredBaseRequestData;

export type SubmittedData = WBSData | WBSData[] | PCData | PCData[] | CCData | CCData[] | PCCCData | PCCCData[] | ModifyData | LockUnlockData;

export type StoredSubmittedData = 
  | StoredWBSData 
  | StoredWBSData[] 
  | StoredPCData 
  | StoredPCData[] 
  | StoredCCData 
  | StoredCCData[] 
  | StoredPCCCData
  | StoredPCCCData[]
  | StoredModifyData 
  | StoredLockUnlockData;

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
}

export interface Request {
  id: string;
  requesterId: string;
  requesterEmail: string;
  requestName: string;
  requestType: RequestType;
  region: Region;
  status: RequestStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedData: StoredSubmittedData;
  comments: Comment[];
  internalComments: Comment[];
  history: HistoryEntry[];
}

export interface WBSElement {
  type: string;
  controllingArea: string;
  companyCode: string;
  projectName: string;
  projectDefinition: string;
  level: string;
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
}
