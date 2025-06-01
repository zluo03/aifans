export enum Role {
  NORMAL = 'NORMAL',
  PREMIUM = 'PREMIUM',
  LIFETIME = 'LIFETIME',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  MUTED = 'MUTED',
  BANNED = 'BANNED',
}

export enum AIPlatformType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum PostType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum PostStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  ADMIN_DELETED = 'ADMIN_DELETED',
}

export enum NoteStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN_BY_ADMIN = 'HIDDEN_BY_ADMIN',
  ADMIN_DELETED = 'ADMIN_DELETED',
}

export enum EntityType {
  POST = 'POST',
  NOTE = 'NOTE',
  SCREENING = 'SCREENING',
  REQUEST = 'REQUEST',
}

export enum CommentStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

export enum RequestStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLVED = 'SOLVED',
  CLOSED = 'CLOSED',
  HIDDEN = 'HIDDEN',
}

export enum RequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ResponseStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
} 