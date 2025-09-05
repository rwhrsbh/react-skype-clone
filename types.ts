
export interface User {
  username: string;
}

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  timestamp: number;
}

export enum CallStatus {
  IDLE,
  CALLING,
  INCOMING,
  ACTIVE,
}

export interface CallState {
  status: CallStatus;
  with: string | null; // username of the other person in the call
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}
