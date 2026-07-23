import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { v4 as uuidv4 } from "uuid";

import type {
  AdminUser,
  AppSettings,
  Attempt,
  AttemptAnswer,
  EmailConfig,
  Question,
  QuestionDifficulty,
  StorageProvider,
  TestSession,
} from "./types";

type FileKey =
  | "questions"
  | "sessions"
  | "attempts"
  | "attemptAnswers"
  | "settings"
  | "admins"
  | "emailConfigs";

type CsvRow = Record<string, string>;

const DATA_DIRECTORY = path.join(process.cwd(), "data");

const DEFAULT_SETTINGS: AppSettings = {
  storageProvider: "csv",
  postgresConfigured: false,
};

const FILE_CONFIG: Record<
  FileKey,
  {
    fileName: string;
    headers: string[];
    seedRows: CsvRow[];
  }
> = {
  questions: {
    fileName: "questions.csv",
    headers: [
      "id",
      "questionText",
      "options",
      "correctAnswer",
      "category",
      "topic",
      "difficulty",
      "marks",
      "explanation",
      "isEnabled",
      "createdAt",
      "updatedAt",
    ],
    seedRows: [
      {
        id: "q-html-basics",
        questionText: "Which HTML tag is used to create a hyperlink?",
        options: JSON.stringify(["<link>", "<a>", "<href>", "<url>"]),
        correctAnswer: "<a>",
        isEnabled: "true",
        createdAt: "2026-07-22T08:00:00.000Z",
        updatedAt: "2026-07-22T08:00:00.000Z",
      },
      {
        id: "q-js-array",
        questionText: "Which array method returns a new array with matching items?",
        options: JSON.stringify(["map", "filter", "reduce", "find"]),
        correctAnswer: "filter",
        isEnabled: "true",
        createdAt: "2026-07-22T08:05:00.000Z",
        updatedAt: "2026-07-22T08:05:00.000Z",
      },
      {
        id: "q-css-flex",
        questionText: "Which CSS property aligns flex items on the main axis?",
        options: JSON.stringify([
          "align-items",
          "justify-content",
          "place-items",
          "align-content",
        ]),
        correctAnswer: "justify-content",
        isEnabled: "true",
        createdAt: "2026-07-22T08:10:00.000Z",
        updatedAt: "2026-07-22T08:10:00.000Z",
      },
      {
        id: "q-js-promises",
        questionText: "Which method receives an array of promises and resolves when ALL of them have resolved?",
        options: JSON.stringify(["Promise.race", "Promise.all", "Promise.any", "Promise.allSettled"]),
        correctAnswer: "Promise.all",
        isEnabled: "true",
        createdAt: "2026-07-23T09:00:00.000Z",
        updatedAt: "2026-07-23T09:00:00.000Z",
      },
      {
        id: "q-css-box-model",
        questionText: "Which CSS box-sizing value includes padding and border in the total width and height?",
        options: JSON.stringify(["content-box", "border-box", "padding-box", "inherit"]),
        correctAnswer: "border-box",
        isEnabled: "true",
        createdAt: "2026-07-23T09:01:00.000Z",
        updatedAt: "2026-07-23T09:01:00.000Z",
      },
      {
        id: "q-sql-join",
        questionText: "Which SQL JOIN clause returns all rows from the left table and matched rows from the right table?",
        options: JSON.stringify(["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"]),
        correctAnswer: "LEFT JOIN",
        isEnabled: "true",
        createdAt: "2026-07-23T09:02:00.000Z",
        updatedAt: "2026-07-23T09:02:00.000Z",
      },
      {
        id: "q-js-closure",
        questionText: "What is a closure in JavaScript?",
        options: JSON.stringify([
          "A function combined with references to its lexical environment",
          "A method that terminates function execution",
          "A way to close browser windows programmatically",
          "A built-in data structure for key-value pairs",
        ]),
        correctAnswer: "A function combined with references to its lexical environment",
        isEnabled: "true",
        createdAt: "2026-07-23T09:03:00.000Z",
        updatedAt: "2026-07-23T09:03:00.000Z",
      },
      {
        id: "q-http-status-404",
        questionText: "Which HTTP response status code indicates that the requested resource was Not Found?",
        options: JSON.stringify(["200", "301", "404", "500"]),
        correctAnswer: "404",
        isEnabled: "true",
        createdAt: "2026-07-23T09:04:00.000Z",
        updatedAt: "2026-07-23T09:04:00.000Z",
      },
      {
        id: "q-git-checkout",
        questionText: "Which Git command creates and switches to a new branch simultaneously?",
        options: JSON.stringify([
          "git branch -n <name>",
          "git checkout -b <name>",
          "git switch --create-new <name>",
          "git merge -b <name>",
        ]),
        correctAnswer: "git checkout -b <name>",
        isEnabled: "true",
        createdAt: "2026-07-23T09:05:00.000Z",
        updatedAt: "2026-07-23T09:05:00.000Z",
      },
      {
        id: "q-react-hooks",
        questionText: "Which React hook is designed for handling side effects like data fetching or subscriptions?",
        options: JSON.stringify(["useState", "useEffect", "useMemo", "useContext"]),
        correctAnswer: "useEffect",
        isEnabled: "true",
        createdAt: "2026-07-23T09:06:00.000Z",
        updatedAt: "2026-07-23T09:06:00.000Z",
      },
      {
        id: "q-data-structure-stack",
        questionText: "Which data structure operates on a Last-In First-Out (LIFO) principle?",
        options: JSON.stringify(["Queue", "Stack", "Linked List", "Binary Search Tree"]),
        correctAnswer: "Stack",
        isEnabled: "true",
        createdAt: "2026-07-23T09:07:00.000Z",
        updatedAt: "2026-07-23T09:07:00.000Z",
      },
      {
        id: "q-ts-generics",
        questionText: "What syntax is used in TypeScript to define generic type parameters?",
        options: JSON.stringify(["<T>", "typeof", "instanceof", "as"]),
        correctAnswer: "<T>",
        isEnabled: "true",
        createdAt: "2026-07-23T09:08:00.000Z",
        updatedAt: "2026-07-23T09:08:00.000Z",
      },
      {
        id: "q-web-storage-local",
        questionText: "Which Web Storage API mechanism persists stored data even after the browser is closed and reopened?",
        options: JSON.stringify(["sessionStorage", "localStorage", "IndexedDB Cache", "Cookie Session"]),
        correctAnswer: "localStorage",
        isEnabled: "true",
        createdAt: "2026-07-23T09:09:00.000Z",
        updatedAt: "2026-07-23T09:09:00.000Z",
      },
      {
        id: "q-algo-binary-search",
        questionText: "What is the worst-case time complexity of Binary Search on a sorted array of size N?",
        options: JSON.stringify(["O(1)", "O(N)", "O(log N)", "O(N^2)"]),
        correctAnswer: "O(log N)",
        isEnabled: "true",
        createdAt: "2026-07-23T09:10:00.000Z",
        updatedAt: "2026-07-23T09:10:00.000Z",
      },
      {
        id: "q-rest-methods",
        questionText: "Which HTTP method is typically used to update an existing resource by replacing its entire payload?",
        options: JSON.stringify(["GET", "POST", "PUT", "DELETE"]),
        correctAnswer: "PUT",
        isEnabled: "true",
        createdAt: "2026-07-23T09:11:00.000Z",
        updatedAt: "2026-07-23T09:11:00.000Z",
      },
      {
        id: "q-js-event-loop",
        questionText: "Where do microtasks (such as Promise callbacks) get queued relative to macrotasks (such as setTimeout)?",
        options: JSON.stringify([
          "Microtask queue executes before the next macrotask",
          "Macrotask queue always runs first",
          "They execute in parallel on separate threads",
          "Microtasks only run when idle",
        ]),
        correctAnswer: "Microtask queue executes before the next macrotask",
        isEnabled: "true",
        createdAt: "2026-07-23T09:12:00.000Z",
        updatedAt: "2026-07-23T09:12:00.000Z",
      },
      {
        id: "q-db-primary-key",
        questionText: "Which database constraint uniquely identifies each record in a table and cannot contain NULL values?",
        options: JSON.stringify(["FOREIGN KEY", "PRIMARY KEY", "CHECK", "UNIQUE INDEX"]),
        correctAnswer: "PRIMARY KEY",
        isEnabled: "true",
        createdAt: "2026-07-23T09:13:00.000Z",
        updatedAt: "2026-07-23T09:13:00.000Z",
      },
      {
        id: "q-css-z-index",
        questionText: "Which CSS property specifies the stack order of an element along the z-axis?",
        options: JSON.stringify(["z-index", "elevation", "order", "stack-order"]),
        correctAnswer: "z-index",
        isEnabled: "true",
        createdAt: "2026-07-23T09:14:00.000Z",
        updatedAt: "2026-07-23T09:14:00.000Z",
      },
    ],
  },
  sessions: {
    fileName: "sessions.csv",
    headers: [
      "sessionId",
      "title",
      "questionCount",
      "timeLimitMinutes",
      "createdBy",
      "createdAt",
      "isActive",
    ],
    seedRows: [
      {
        sessionId: "frontend-basics-demo",
        title: "Frontend Basics Demo",
        questionCount: "3",
        timeLimitMinutes: "15",
        createdBy: "admin@exam-platform.local",
        createdAt: "2026-07-22T08:30:00.000Z",
        isActive: "true",
      },
    ],
  },
  attempts: {
    fileName: "attempts.csv",
    headers: [
      "attemptId",
      "sessionId",
      "name",
      "email",
      "phone",
      "startedAt",
      "endedAt",
      "status",
      "score",
      "totalQuestions",
      "answeredQuestions",
    ],
    seedRows: [],
  },
  attemptAnswers: {
    fileName: "attempt-answers.csv",
    headers: [
      "attemptId",
      "questionId",
      "selectedAnswer",
      "isCorrect",
      "answeredAt",
      "questionOrder",
    ],
    seedRows: [],
  },
  settings: {
    fileName: "settings.csv",
    headers: ["storageProvider", "postgresConfigured", "adminPasswordHash"],
    seedRows: [
      {
        storageProvider: "csv",
        postgresConfigured: "false",
        adminPasswordHash: "",
      },
    ],
  },
  admins: {
    fileName: "admins.csv",
    headers: ["id", "name", "email", "passwordHash", "createdAt"],
    seedRows: [],
  },
  emailConfigs: {
    fileName: "email-configs.csv",
    headers: [
      "id",
      "emailAddress",
      "applicationId",
      "tenantId",
      "clientSecret",
      "authType",
      "password",
      "createdAt",
      "updatedAt",
    ],
    seedRows: [],
  },
};


function parseBoolean(value: string | undefined): boolean {
  return value === "true";
}

function parseNullableString(value: string | undefined): string | null {
  return value ? value : null;
}

function parseNullableNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNumber(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseOptions(rawOptions: string | undefined): string[] {
  if (!rawOptions) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawOptions);

    if (Array.isArray(parsed)) {
      return parsed.map((option) => String(option));
    }
  } catch {
    return rawOptions
      .split("|")
      .map((option) => option.trim())
      .filter(Boolean);
  }

  return [];
}

function assertQuestionPayload(
  payload: Pick<Question, "questionText" | "options" | "correctAnswer">,
) {
  if (!payload.questionText.trim()) {
    throw new Error("Question text is required.");
  }

  if (payload.options.length < 2) {
    throw new Error("Questions must include at least two options.");
  }

  if (!payload.options.includes(payload.correctAnswer)) {
    throw new Error("Correct answer must match one of the provided options.");
  }
}

function assertSessionPayload(
  payload: Pick<TestSession, "title" | "questionCount" | "timeLimitMinutes">,
) {
  if (!payload.title.trim()) {
    throw new Error("Session title is required.");
  }

  if (payload.questionCount < 1) {
    throw new Error("Sessions must include at least one question.");
  }

  if (payload.timeLimitMinutes < 1) {
    throw new Error("Sessions must have a positive time limit.");
  }
}

export class CsvStorageProvider implements StorageProvider {
  private initializationPromise: Promise<void> | null = null;
  private mutationQueue = Promise.resolve();

  async getQuestions(): Promise<Question[]> {
    await this.ensureInitialized();
    const rows = await this.readRows("questions");

    return rows.map((row) => ({
      id: row.id,
      questionText: row.questionText,
      options: parseOptions(row.options),
      correctAnswer: row.correctAnswer,
      category: row.category || "General",
      topic: row.topic || "General",
      difficulty: (row.difficulty as QuestionDifficulty) || "medium",
      marks: parseNumber(row.marks, 1),
      explanation: row.explanation || "",
      isEnabled: parseBoolean(row.isEnabled),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async getQuestion(id: string): Promise<Question | null> {
    const questions = await this.getQuestions();
    return questions.find((question) => question.id === id) ?? null;
  }

  async addQuestion(
    question: Omit<Question, "id" | "createdAt" | "updatedAt">,
  ): Promise<Question> {
    assertQuestionPayload(question);

    return this.enqueueMutation(async () => {
      const now = new Date().toISOString();
      const questions = await this.getQuestions();
      const createdQuestion: Question = {
        id: uuidv4(),
        questionText: question.questionText.trim(),
        options: question.options.map((option) => option.trim()),
        correctAnswer: question.correctAnswer,
        category: (question.category || "General").trim(),
        topic: (question.topic || "General").trim(),
        difficulty: question.difficulty || "medium",
        marks: question.marks || 1,
        explanation: question.explanation?.trim() || "",
        isEnabled: question.isEnabled,
        createdAt: now,
        updatedAt: now,
      };

      questions.push(createdQuestion);
      await this.writeQuestions(questions);

      return createdQuestion;
    });
  }

  async updateQuestion(
    id: string,
    updates: Partial<Question>,
  ): Promise<Question | null> {
    return this.enqueueMutation(async () => {
      const questions = await this.getQuestions();
      const questionIndex = questions.findIndex((question) => question.id === id);

      if (questionIndex === -1) {
        return null;
      }

      const currentQuestion = questions[questionIndex];
      const nextQuestion: Question = {
        ...currentQuestion,
        ...updates,
        id: currentQuestion.id,
        createdAt: currentQuestion.createdAt,
        updatedAt: new Date().toISOString(),
        questionText: updates.questionText?.trim() ?? currentQuestion.questionText,
        options:
          updates.options?.map((option) => option.trim()) ?? currentQuestion.options,
        category: updates.category?.trim() ?? currentQuestion.category,
        topic: updates.topic?.trim() ?? currentQuestion.topic,
        difficulty: updates.difficulty ?? currentQuestion.difficulty,
        marks: updates.marks ?? currentQuestion.marks,
        explanation: updates.explanation?.trim() ?? currentQuestion.explanation,
      };

      assertQuestionPayload(nextQuestion);

      questions[questionIndex] = nextQuestion;
      await this.writeQuestions(questions);

      return nextQuestion;
    });
  }

  async deleteQuestion(id: string): Promise<boolean> {
    return this.enqueueMutation(async () => {
      const questions = await this.getQuestions();
      const nextQuestions = questions.filter((question) => question.id !== id);

      if (nextQuestions.length === questions.length) {
        return false;
      }

      await this.writeQuestions(nextQuestions);
      return true;
    });
  }

  async toggleQuestion(id: string): Promise<Question | null> {
    return this.enqueueMutation(async () => {
      const questions = await this.getQuestions();
      const questionIndex = questions.findIndex((question) => question.id === id);

      if (questionIndex === -1) {
        return null;
      }

      const currentQuestion = questions[questionIndex];
      const nextQuestion: Question = {
        ...currentQuestion,
        isEnabled: !currentQuestion.isEnabled,
        updatedAt: new Date().toISOString(),
      };

      questions[questionIndex] = nextQuestion;
      await this.writeQuestions(questions);

      return nextQuestion;
    });
  }

  async getSessions(): Promise<TestSession[]> {
    await this.ensureInitialized();
    const rows = await this.readRows("sessions");

    return rows.map((row) => ({
      sessionId: row.sessionId,
      title: row.title,
      questionCount: parseNumber(row.questionCount),
      timeLimitMinutes: parseNumber(row.timeLimitMinutes),
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      isActive: parseBoolean(row.isActive),
    }));
  }

  async getSession(sessionId: string): Promise<TestSession | null> {
    const sessions = await this.getSessions();
    return sessions.find((session) => session.sessionId === sessionId) ?? null;
  }

  async createSession(session: Omit<TestSession, "createdAt">): Promise<TestSession> {
    assertSessionPayload(session);

    return this.enqueueMutation(async () => {
      const sessions = await this.getSessions();
      const createdSession: TestSession = {
        ...session,
        createdAt: new Date().toISOString(),
      };

      sessions.push(createdSession);
      await this.writeSessions(sessions);

      return createdSession;
    });
  }

  async toggleSession(sessionId: string): Promise<TestSession | null> {
    return this.enqueueMutation(async () => {
      const sessions = await this.getSessions();
      const sessionIndex = sessions.findIndex(
        (session) => session.sessionId === sessionId,
      );

      if (sessionIndex === -1) {
        return null;
      }

      const nextSession: TestSession = {
        ...sessions[sessionIndex],
        isActive: !sessions[sessionIndex].isActive,
      };

      sessions[sessionIndex] = nextSession;
      await this.writeSessions(sessions);

      return nextSession;
    });
  }

  async getAttempts(sessionId?: string): Promise<Attempt[]> {
    await this.ensureInitialized();
    const rows = await this.readRows("attempts");
    const attempts = rows.map((row) => ({
      attemptId: row.attemptId,
      sessionId: row.sessionId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      startedAt: row.startedAt,
      endedAt: parseNullableString(row.endedAt),
      status: (row.status as Attempt["status"]) ?? "in_progress",
      score: parseNullableNumber(row.score),
      totalQuestions: parseNumber(row.totalQuestions),
      answeredQuestions: parseNumber(row.answeredQuestions),
    }));

    if (!sessionId) {
      return attempts;
    }

    return attempts.filter((attempt) => attempt.sessionId === sessionId);
  }

  async getAttempt(attemptId: string): Promise<Attempt | null> {
    const attempts = await this.getAttempts();
    return attempts.find((attempt) => attempt.attemptId === attemptId) ?? null;
  }

  async createAttempt(
    attempt: Omit<Attempt, "endedAt" | "score" | "answeredQuestions">,
  ): Promise<Attempt> {
    return this.enqueueMutation(async () => {
      const attempts = await this.getAttempts();
      const createdAttempt: Attempt = {
        ...attempt,
        endedAt: null,
        score: null,
        answeredQuestions: 0,
      };

      attempts.push(createdAttempt);
      await this.writeAttempts(attempts);

      return createdAttempt;
    });
  }

  async updateAttempt(
    attemptId: string,
    updates: Partial<Attempt>,
  ): Promise<Attempt | null> {
    return this.enqueueMutation(async () => {
      const attempts = await this.getAttempts();
      const attemptIndex = attempts.findIndex(
        (attempt) => attempt.attemptId === attemptId,
      );

      if (attemptIndex === -1) {
        return null;
      }

      const currentAttempt = attempts[attemptIndex];
      const nextAttempt: Attempt = {
        ...currentAttempt,
        ...updates,
        attemptId: currentAttempt.attemptId,
      };

      attempts[attemptIndex] = nextAttempt;
      await this.writeAttempts(attempts);

      return nextAttempt;
    });
  }

  async getAttemptAnswers(attemptId: string): Promise<AttemptAnswer[]> {
    await this.ensureInitialized();
    const rows = await this.readRows("attemptAnswers");

    return rows
      .map((row) => ({
        attemptId: row.attemptId,
        questionId: row.questionId,
        selectedAnswer: row.selectedAnswer,
        isCorrect: parseBoolean(row.isCorrect),
        answeredAt: row.answeredAt,
        questionOrder: parseNumber(row.questionOrder),
      }))
      .filter((answer) => answer.attemptId === attemptId)
      .sort((left, right) => left.questionOrder - right.questionOrder);
  }

  async saveAttemptAnswer(answer: AttemptAnswer): Promise<void> {
    return this.enqueueMutation(async () => {
      const attempts = await this.getAttempts();
      const attemptIndex = attempts.findIndex(
        (attempt) => attempt.attemptId === answer.attemptId,
      );

      if (attemptIndex === -1) {
        throw new Error("Attempt not found for answer save.");
      }

      const answers = await this.getAllAttemptAnswers();
      const existingIndex = answers.findIndex(
        (existingAnswer) =>
          existingAnswer.attemptId === answer.attemptId &&
          existingAnswer.questionId === answer.questionId,
      );

      if (existingIndex === -1) {
        answers.push(answer);
      } else {
        answers[existingIndex] = answer;
      }

      await this.writeAttemptAnswers(answers);

      const answeredQuestions = new Set(
        answers
          .filter(
            (existingAnswer) =>
              existingAnswer.attemptId === answer.attemptId &&
              existingAnswer.selectedAnswer.trim().length > 0,
          )
          .map((existingAnswer) => existingAnswer.questionId),
      ).size;

      attempts[attemptIndex] = {
        ...attempts[attemptIndex],
        answeredQuestions,
      };

      await this.writeAttempts(attempts);
    });
  }

  async getSettings(): Promise<AppSettings> {
    await this.ensureInitialized();
    const rows = await this.readRows("settings");
    const currentRow = rows[0];

    if (!currentRow) {
      return DEFAULT_SETTINGS;
    }

    return {
      storageProvider:
        currentRow.storageProvider === "postgres" ? "postgres" : "csv",
      postgresConfigured: parseBoolean(currentRow.postgresConfigured),
      adminPasswordHash: currentRow.adminPasswordHash || undefined,
    };
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    return this.enqueueMutation(async () => {
      const currentSettings = await this.getSettings();
      const nextSettings: AppSettings = {
        ...currentSettings,
        ...settings,
      };

      await this.writeRows("settings", [
        {
          storageProvider: nextSettings.storageProvider,
          postgresConfigured: String(nextSettings.postgresConfigured),
          adminPasswordHash: nextSettings.adminPasswordHash ?? "",
        },
      ]);

      return nextSettings;
    });
  }

  async getAdmins(): Promise<AdminUser[]> {
    await this.ensureInitialized();
    const rows = await this.readRows("admins");

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
    }));
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const admins = await this.getAdmins();
    const normalized = email.trim().toLowerCase();
    return admins.find((admin) => admin.email.toLowerCase() === normalized) ?? null;
  }

  async createAdminUser(
    admin: Omit<AdminUser, "id" | "createdAt">,
  ): Promise<AdminUser> {
    return this.enqueueMutation(async () => {
      const admins = await this.getAdmins();
      const existing = admins.find(
        (a) => a.email.toLowerCase() === admin.email.trim().toLowerCase(),
      );

      if (existing) {
        throw new Error("An admin user with this email address already exists.");
      }

      const now = new Date().toISOString();
      const createdAdmin: AdminUser = {
        id: uuidv4(),
        name: admin.name.trim(),
        email: admin.email.trim().toLowerCase(),
        passwordHash: admin.passwordHash,
        createdAt: now,
      };

      admins.push(createdAdmin);
      await this.writeRows(
        "admins",
        admins.map((a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          passwordHash: a.passwordHash,
          createdAt: a.createdAt,
        })),
      );

      return createdAdmin;
    });
  }

  async getEmailConfigs(): Promise<EmailConfig[]> {
    await this.ensureInitialized();
    const rows = await this.readRows("emailConfigs");

    return rows.map((row) => ({
      id: row.id,
      emailAddress: row.emailAddress,
      applicationId: row.applicationId,
      tenantId: row.tenantId,
      clientSecret: row.clientSecret,
      authType: (row.authType as "client_credentials" | "delegated") || "delegated",
      password: row.password || "",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async getEmailConfig(id: string): Promise<EmailConfig | null> {
    const configs = await this.getEmailConfigs();
    return configs.find((config) => config.id === id) ?? null;
  }

  async addEmailConfig(
    config: Omit<EmailConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<EmailConfig> {
    return this.enqueueMutation(async () => {
      const configs = await this.getEmailConfigs();
      const now = new Date().toISOString();
      const createdConfig: EmailConfig = {
        id: uuidv4(),
        emailAddress: config.emailAddress.trim().toLowerCase(),
        applicationId: config.applicationId.trim(),
        tenantId: config.tenantId.trim(),
        clientSecret: config.clientSecret.trim(),
        authType: config.authType || "delegated",
        password: config.password?.trim() || "",
        createdAt: now,
        updatedAt: now,
      };

      configs.push(createdConfig);
      await this.writeEmailConfigs(configs);

      return createdConfig;
    });
  }

  async updateEmailConfig(
    id: string,
    updates: Partial<EmailConfig>,
  ): Promise<EmailConfig | null> {
    return this.enqueueMutation(async () => {
      const configs = await this.getEmailConfigs();
      const index = configs.findIndex((c) => c.id === id);

      if (index === -1) {
        return null;
      }

      const current = configs[index];
      const updatedConfig: EmailConfig = {
        ...current,
        ...updates,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
        emailAddress: updates.emailAddress?.trim().toLowerCase() ?? current.emailAddress,
        applicationId: updates.applicationId?.trim() ?? current.applicationId,
        tenantId: updates.tenantId?.trim() ?? current.tenantId,
        clientSecret: updates.clientSecret?.trim() ?? current.clientSecret,
        authType: updates.authType ?? current.authType ?? "delegated",
        password: updates.password?.trim() ?? current.password ?? "",
      };

      configs[index] = updatedConfig;
      await this.writeEmailConfigs(configs);

      return updatedConfig;
    });
  }

  async deleteEmailConfig(id: string): Promise<boolean> {
    return this.enqueueMutation(async () => {
      const configs = await this.getEmailConfigs();
      const filtered = configs.filter((c) => c.id !== id);

      if (filtered.length === configs.length) {
        return false;
      }

      await this.writeEmailConfigs(filtered);
      return true;
    });
  }

  private async writeEmailConfigs(configs: EmailConfig[]) {
    await this.writeRows(
      "emailConfigs",
      configs.map((c) => ({
        id: c.id,
        emailAddress: c.emailAddress,
        applicationId: c.applicationId,
        tenantId: c.tenantId,
        clientSecret: c.clientSecret,
        authType: c.authType || "delegated",
        password: c.password || "",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    );
  }


  private async getAllAttemptAnswers(): Promise<AttemptAnswer[]> {
    await this.ensureInitialized();
    const rows = await this.readRows("attemptAnswers");

    return rows.map((row) => ({
      attemptId: row.attemptId,
      questionId: row.questionId,
      selectedAnswer: row.selectedAnswer,
      isCorrect: parseBoolean(row.isCorrect),
      answeredAt: row.answeredAt,
      questionOrder: parseNumber(row.questionOrder),
    }));
  }

  private async writeQuestions(questions: Question[]) {
    await this.writeRows(
      "questions",
      questions.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        options: JSON.stringify(question.options),
        correctAnswer: question.correctAnswer,
        category: question.category || "General",
        topic: question.topic || "General",
        difficulty: question.difficulty || "medium",
        marks: String(question.marks ?? 1),
        explanation: question.explanation || "",
        isEnabled: String(question.isEnabled),
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      })),
    );
  }

  private async writeSessions(sessions: TestSession[]) {
    await this.writeRows(
      "sessions",
      sessions.map((session) => ({
        sessionId: session.sessionId,
        title: session.title,
        questionCount: String(session.questionCount),
        timeLimitMinutes: String(session.timeLimitMinutes),
        createdBy: session.createdBy,
        createdAt: session.createdAt,
        isActive: String(session.isActive),
      })),
    );
  }

  private async writeAttempts(attempts: Attempt[]) {
    await this.writeRows(
      "attempts",
      attempts.map((attempt) => ({
        attemptId: attempt.attemptId,
        sessionId: attempt.sessionId,
        name: attempt.name,
        email: attempt.email,
        phone: attempt.phone,
        startedAt: attempt.startedAt,
        endedAt: attempt.endedAt ?? "",
        status: attempt.status,
        score: attempt.score === null ? "" : String(attempt.score),
        totalQuestions: String(attempt.totalQuestions),
        answeredQuestions: String(attempt.answeredQuestions),
      })),
    );
  }

  private async writeAttemptAnswers(answers: AttemptAnswer[]) {
    await this.writeRows(
      "attemptAnswers",
      answers.map((answer) => ({
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: String(answer.isCorrect),
        answeredAt: answer.answeredAt,
        questionOrder: String(answer.questionOrder),
      })),
    );
  }

  private enqueueMutation<T>(mutation: () => Promise<T>): Promise<T> {
    const result = this.mutationQueue.then(mutation, mutation);
    this.mutationQueue = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  private async ensureInitialized() {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeDataFiles();
    }

    await this.initializationPromise;
  }

  private async initializeDataFiles() {
    await mkdir(DATA_DIRECTORY, { recursive: true });

    for (const fileKey of Object.keys(FILE_CONFIG) as FileKey[]) {
      const filePath = this.getFilePath(fileKey);

      try {
        await access(filePath);
      } catch {
        const config = FILE_CONFIG[fileKey];
        const fileContents = stringify(config.seedRows, {
          header: true,
          columns: config.headers,
        });

        await writeFile(filePath, fileContents, "utf8");
      }
    }
  }

  private getFilePath(fileKey: FileKey) {
    return path.join(DATA_DIRECTORY, FILE_CONFIG[fileKey].fileName);
  }

  private async readRows(fileKey: FileKey): Promise<CsvRow[]> {
    const fileContents = await readFile(this.getFilePath(fileKey), "utf8");
    const rows = parse(fileContents, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return rows as CsvRow[];
  }

  private async writeRows(fileKey: FileKey, rows: CsvRow[]) {
    const config = FILE_CONFIG[fileKey];
    const fileContents = stringify(rows, {
      header: true,
      columns: config.headers,
    });

    await writeFile(this.getFilePath(fileKey), fileContents, "utf8");
  }
}
