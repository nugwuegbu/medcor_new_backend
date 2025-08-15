// Chat and messaging types
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderRole?: 'user' | 'assistant' | 'doctor' | 'nurse';
  content: string;
  timestamp: string;
  type: MessageType;
  metadata?: MessageMetadata;
  attachments?: Attachment[];
  isRead?: boolean;
  reactions?: Reaction[];
}

export type MessageType = 
  | 'text'
  | 'voice'
  | 'image'
  | 'file'
  | 'system'
  | 'appointment'
  | 'prescription';

export interface MessageMetadata {
  language?: string;
  emotion?: string;
  intent?: string;
  voiceId?: string;
  duration?: number;
  appointmentId?: string;
  prescriptionId?: string;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'closed';
  type: 'support' | 'consultation' | 'general';
}

export interface Participant {
  userId: string;
  name: string;
  role: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface Reaction {
  userId: string;
  emoji: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
}