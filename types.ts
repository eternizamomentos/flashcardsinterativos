export type SRSStatus = 'new' | 'learning' | 'review' | 'graduated';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  status: SRSStatus;
  nextReview: number; // Timestamp
  interval: number; // Days
  easeFactor: number;
}

export interface FlashcardSet {
  id: string;
  title: string;
  category: string;
  cards: Flashcard[];
  createdAt: number;
  lastStudied: number | null;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  language: 'pt-BR';
}

export interface AIRequestSchema {
  front: string;
  back: string;
}
