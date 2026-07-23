export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  category: string;
  topic: string;
  difficulty: QuestionDifficulty;
  marks: number;
  explanation?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestSession {
  sessionId: string;
  title: string;
  questionCount: number;
  timeLimitMinutes: number;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  selectedCategories?: string[];
  selectedTopics?: string[];
}

export interface Attempt {
  attemptId: string;
  sessionId: string;
  name: string;
  email: string;
  phone: string;
  startedAt: string;
  endedAt: string | null;
  status: 'in_progress' | 'completed' | 'timed_out' | 'ended_early';
  score: number | null;
  totalQuestions: number;
  answeredQuestions: number;
}

export interface AttemptAnswer {
  attemptId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
  questionOrder: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface EmailConfig {
  id: string;
  emailAddress: string;
  applicationId: string;
  tenantId: string;
  clientSecret: string;
  authType?: 'client_credentials' | 'delegated';
  password?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  storageProvider: 'csv' | 'postgres';
  postgresConfigured: boolean;
  adminPasswordHash?: string;
}

export interface StorageProvider {
  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | null>;
  addQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question>;
  updateQuestion(id: string, updates: Partial<Question>): Promise<Question | null>;
  deleteQuestion(id: string): Promise<boolean>;
  toggleQuestion(id: string): Promise<Question | null>;

  // Sessions
  getSessions(): Promise<TestSession[]>;
  getSession(sessionId: string): Promise<TestSession | null>;
  createSession(session: Omit<TestSession, 'createdAt'>): Promise<TestSession>;
  toggleSession(sessionId: string): Promise<TestSession | null>;

  // Attempts
  getAttempts(sessionId?: string): Promise<Attempt[]>;
  getAttempt(attemptId: string): Promise<Attempt | null>;
  createAttempt(attempt: Omit<Attempt, 'endedAt' | 'score' | 'answeredQuestions'>): Promise<Attempt>;
  updateAttempt(attemptId: string, updates: Partial<Attempt>): Promise<Attempt | null>;

  // Attempt Answers
  getAttemptAnswers(attemptId: string): Promise<AttemptAnswer[]>;
  saveAttemptAnswer(answer: AttemptAnswer): Promise<void>;

  // Email Configs
  getEmailConfigs(): Promise<EmailConfig[]>;
  getEmailConfig(id: string): Promise<EmailConfig | null>;
  addEmailConfig(config: Omit<EmailConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailConfig>;
  updateEmailConfig(id: string, updates: Partial<EmailConfig>): Promise<EmailConfig | null>;
  deleteEmailConfig(id: string): Promise<boolean>;

  // Settings
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  // Admins
  getAdmins(): Promise<AdminUser[]>;
  getAdminByEmail(email: string): Promise<AdminUser | null>;
  createAdminUser(admin: Omit<AdminUser, 'id' | 'createdAt'>): Promise<AdminUser>;
}

