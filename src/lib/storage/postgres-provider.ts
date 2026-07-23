import { Pool, type QueryResultRow } from "pg";
import { v4 as uuidv4 } from "uuid";

import type {
  AdminUser,
  AppSettings,
  Attempt,
  AttemptAnswer,
  Question,
  QuestionDifficulty,
  StorageProvider,
  TestSession,
} from "./types";

function getConnectionString(): string | undefined {
  return process.env.DATABASE_URL;
}

function getPoolConfig() {
  const connectionString = getConnectionString();

  if (connectionString) {
    return { connectionString };
  }

  return {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "exam_platform",
  };
}

export class PostgresStorageProvider implements StorageProvider {
  private pool: Pool | null = null;
  private schemaInitialized = false;
  private schemaPromise: Promise<void> | null = null;

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool(getPoolConfig());
    }
    return this.pool;
  }

  public async isConnected(): Promise<boolean> {
    try {
      const pool = this.getPool();
      const client = await pool.connect();
      client.release();
      return true;
    } catch {
      return false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.schemaInitialized) return;

    if (!this.schemaPromise) {
      this.schemaPromise = this.initSchema();
    }

    await this.schemaPromise;
  }

  private async initSchema(): Promise<void> {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id VARCHAR(255) PRIMARY KEY,
          question_text TEXT NOT NULL,
          options JSONB NOT NULL DEFAULT '[]'::jsonb,
          correct_answer TEXT NOT NULL,
          category VARCHAR(255) NOT NULL DEFAULT 'General',
          topic VARCHAR(255) NOT NULL DEFAULT 'General',
          difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',
          marks INTEGER NOT NULL DEFAULT 1,
          explanation TEXT,
          is_enabled BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
          session_id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          question_count INTEGER NOT NULL DEFAULT 1,
          time_limit_minutes INTEGER NOT NULL DEFAULT 15,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN NOT NULL DEFAULT true
        );

        CREATE TABLE IF NOT EXISTS attempts (
          attempt_id VARCHAR(255) PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(100) NOT NULL,
          started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMPTZ,
          status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
          score INTEGER,
          total_questions INTEGER NOT NULL DEFAULT 0,
          answered_questions INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS attempt_answers (
          attempt_id VARCHAR(255) NOT NULL REFERENCES attempts(attempt_id) ON DELETE CASCADE,
          question_id VARCHAR(255) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
          selected_answer TEXT NOT NULL DEFAULT '',
          is_correct BOOLEAN NOT NULL DEFAULT false,
          answered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          question_order INTEGER NOT NULL DEFAULT 1,
          PRIMARY KEY (attempt_id, question_id)
        );

        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          storage_provider VARCHAR(50) NOT NULL DEFAULT 'postgres',
          postgres_configured BOOLEAN NOT NULL DEFAULT true,
          admin_password_hash TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT single_settings_row CHECK (id = 1)
        );

        CREATE TABLE IF NOT EXISTS admins (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO settings (id, storage_provider, postgres_configured)
        VALUES (1, 'postgres', true)
        ON CONFLICT (id) DO NOTHING;
      `);
      this.schemaInitialized = true;
    } finally {
      client.release();
    }
  }

  // --- Questions ---

  async getQuestions(): Promise<Question[]> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "SELECT * FROM questions ORDER BY created_at DESC",
    );

    return result.rows.map(this.mapQuestionRow);
  }

  async getQuestion(id: string): Promise<Question | null> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "SELECT * FROM questions WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) return null;
    return this.mapQuestionRow(result.rows[0]);
  }

  async addQuestion(
    question: Omit<Question, "id" | "createdAt" | "updatedAt">,
  ): Promise<Question> {
    await this.ensureInitialized();
    const id = uuidv4();
    const now = new Date().toISOString();

    const optionsJson = JSON.stringify(question.options);

    await this.getPool().query(
      `INSERT INTO questions (id, question_text, options, correct_answer, category, topic, difficulty, marks, explanation, is_enabled, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        question.questionText.trim(),
        optionsJson,
        question.correctAnswer,
        question.category?.trim() || "General",
        question.topic?.trim() || "General",
        question.difficulty || "medium",
        question.marks || 1,
        question.explanation?.trim() || "",
        question.isEnabled,
        now,
        now,
      ],
    );

    return {
      id,
      questionText: question.questionText.trim(),
      options: question.options.map((o) => o.trim()),
      correctAnswer: question.correctAnswer,
      category: question.category?.trim() || "General",
      topic: question.topic?.trim() || "General",
      difficulty: question.difficulty || "medium",
      marks: question.marks || 1,
      explanation: question.explanation?.trim() || "",
      isEnabled: question.isEnabled,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateQuestion(
    id: string,
    updates: Partial<Question>,
  ): Promise<Question | null> {
    await this.ensureInitialized();
    const current = await this.getQuestion(id);
    if (!current) return null;

    const next: Question = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.getPool().query(
      `UPDATE questions
       SET question_text = $1, options = $2::jsonb, correct_answer = $3, category = $4, topic = $5, difficulty = $6, marks = $7, explanation = $8, is_enabled = $9, updated_at = $10
       WHERE id = $11`,
      [
        next.questionText,
        JSON.stringify(next.options),
        next.correctAnswer,
        next.category,
        next.topic,
        next.difficulty,
        next.marks,
        next.explanation || "",
        next.isEnabled,
        next.updatedAt,
        id,
      ],
    );

    return next;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "DELETE FROM questions WHERE id = $1",
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async toggleQuestion(id: string): Promise<Question | null> {
    await this.ensureInitialized();
    const current = await this.getQuestion(id);
    if (!current) return null;

    return this.updateQuestion(id, { isEnabled: !current.isEnabled });
  }

  // --- Sessions ---

  async getSessions(): Promise<TestSession[]> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "SELECT * FROM sessions ORDER BY created_at DESC",
    );

    return result.rows.map(this.mapSessionRow);
  }

  async getSession(sessionId: string): Promise<TestSession | null> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "SELECT * FROM sessions WHERE session_id = $1",
      [sessionId],
    );

    if (result.rows.length === 0) return null;
    return this.mapSessionRow(result.rows[0]);
  }

  async createSession(
    session: Omit<TestSession, "createdAt">,
  ): Promise<TestSession> {
    await this.ensureInitialized();
    const now = new Date().toISOString();

    await this.getPool().query(
      `INSERT INTO sessions (session_id, title, question_count, time_limit_minutes, created_by, created_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        session.sessionId,
        session.title.trim(),
        session.questionCount,
        session.timeLimitMinutes,
        session.createdBy,
        now,
        session.isActive,
      ],
    );

    return {
      ...session,
      createdAt: now,
    };
  }

  async toggleSession(sessionId: string): Promise<TestSession | null> {
    await this.ensureInitialized();
    const current = await this.getSession(sessionId);
    if (!current) return null;

    const nextIsActive = !current.isActive;
    await this.getPool().query(
      "UPDATE sessions SET is_active = $1 WHERE session_id = $2",
      [nextIsActive, sessionId],
    );

    return {
      ...current,
      isActive: nextIsActive,
    };
  }

  // --- Attempts ---

  async getAttempts(sessionId?: string): Promise<Attempt[]> {
    await this.ensureInitialized();
    const query = sessionId
      ? "SELECT * FROM attempts WHERE session_id = $1 ORDER BY started_at DESC"
      : "SELECT * FROM attempts ORDER BY started_at DESC";
    const params = sessionId ? [sessionId] : [];

    const result = await this.getPool().query(query, params);
    return result.rows.map(this.mapAttemptRow);
  }

  async getAttempt(attemptId: string): Promise<Attempt | null> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "SELECT * FROM attempts WHERE attempt_id = $1",
      [attemptId],
    );

    if (result.rows.length === 0) return null;
    return this.mapAttemptRow(result.rows[0]);
  }

  async createAttempt(
    attempt: Omit<Attempt, "endedAt" | "score" | "answeredQuestions">,
  ): Promise<Attempt> {
    await this.ensureInitialized();

    await this.getPool().query(
      `INSERT INTO attempts (attempt_id, session_id, name, email, phone, started_at, ended_at, status, score, total_questions, answered_questions)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, NULL, $8, 0)`,
      [
        attempt.attemptId,
        attempt.sessionId,
        attempt.name,
        attempt.email,
        attempt.phone,
        attempt.startedAt,
        attempt.status,
        attempt.totalQuestions,
      ],
    );

    return {
      ...attempt,
      endedAt: null,
      score: null,
      answeredQuestions: 0,
    };
  }

  async updateAttempt(
    attemptId: string,
    updates: Partial<Attempt>,
  ): Promise<Attempt | null> {
    await this.ensureInitialized();
    const current = await this.getAttempt(attemptId);
    if (!current) return null;

    const next: Attempt = {
      ...current,
      ...updates,
      attemptId: current.attemptId,
    };

    await this.getPool().query(
      `UPDATE attempts
       SET name = $1, email = $2, phone = $3, ended_at = $4, status = $5, score = $6, answered_questions = $7
       WHERE attempt_id = $8`,
      [
        next.name,
        next.email,
        next.phone,
        next.endedAt,
        next.status,
        next.score,
        next.answeredQuestions,
        attemptId,
      ],
    );

    return next;
  }

  // --- Attempt Answers ---

  async getAttemptAnswers(attemptId: string): Promise<AttemptAnswer[]> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "SELECT * FROM attempt_answers WHERE attempt_id = $1 ORDER BY question_order ASC",
      [attemptId],
    );

    return result.rows.map(this.mapAttemptAnswerRow);
  }

  async saveAttemptAnswer(answer: AttemptAnswer): Promise<void> {
    await this.ensureInitialized();
    const pool = this.getPool();

    await pool.query(
      `INSERT INTO attempt_answers (attempt_id, question_id, selected_answer, is_correct, answered_at, question_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (attempt_id, question_id) DO UPDATE
       SET selected_answer = EXCLUDED.selected_answer,
           is_correct = EXCLUDED.is_correct,
           answered_at = EXCLUDED.answered_at,
           question_order = EXCLUDED.question_order`,
      [
        answer.attemptId,
        answer.questionId,
        answer.selectedAnswer,
        answer.isCorrect,
        answer.answeredAt,
        answer.questionOrder,
      ],
    );

    // Update answered_questions count for attempt
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM attempt_answers WHERE attempt_id = $1 AND TRIM(selected_answer) != ''",
      [answer.attemptId],
    );
    const answeredCount = Number(countResult.rows[0]?.count ?? 0);

    await pool.query(
      "UPDATE attempts SET answered_questions = $1 WHERE attempt_id = $2",
      [answeredCount, answer.attemptId],
    );
  }

  // --- Settings ---

  async getSettings(): Promise<AppSettings> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "SELECT * FROM settings WHERE id = 1",
    );

    if (result.rows.length === 0) {
      return { storageProvider: "postgres", postgresConfigured: true };
    }

    const row = result.rows[0];
    return {
      storageProvider: row.storage_provider === "postgres" ? "postgres" : "csv",
      postgresConfigured: Boolean(row.postgres_configured),
      adminPasswordHash: row.admin_password_hash || undefined,
    };
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    await this.ensureInitialized();
    const current = await this.getSettings();
    const next: AppSettings = {
      ...current,
      ...settings,
    };

    await this.getPool().query(
      `INSERT INTO settings (id, storage_provider, postgres_configured, admin_password_hash, updated_at)
       VALUES (1, $1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE
       SET storage_provider = EXCLUDED.storage_provider,
           postgres_configured = EXCLUDED.postgres_configured,
           admin_password_hash = COALESCE(EXCLUDED.admin_password_hash, settings.admin_password_hash),
           updated_at = CURRENT_TIMESTAMP`,
      [next.storageProvider, next.postgresConfigured, next.adminPasswordHash || null],
    );

    return next;
  }

  // --- Admins ---

  async getAdmins(): Promise<AdminUser[]> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "SELECT * FROM admins ORDER BY created_at DESC",
    );
    return result.rows.map(this.mapAdminRow);
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    await this.ensureInitialized();
    const result = await this.getPool().query(
      "SELECT * FROM admins WHERE LOWER(email) = LOWER($1)",
      [email.trim()],
    );
    if (result.rows.length === 0) return null;
    return this.mapAdminRow(result.rows[0]);
  }

  async createAdminUser(
    admin: Omit<AdminUser, "id" | "createdAt">,
  ): Promise<AdminUser> {
    await this.ensureInitialized();
    const id = uuidv4();
    const now = new Date().toISOString();

    const existing = await this.getAdminByEmail(admin.email);
    if (existing) {
      throw new Error("An admin user with this email address already exists.");
    }

    await this.getPool().query(
      `INSERT INTO admins (id, name, email, password_hash, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, admin.name.trim(), admin.email.trim().toLowerCase(), admin.passwordHash, now],
    );

    return {
      id,
      name: admin.name.trim(),
      email: admin.email.trim().toLowerCase(),
      passwordHash: admin.passwordHash,
      createdAt: now,
    };
  }

  // --- Row Mappers ---

  private mapQuestionRow(row: QueryResultRow): Question {
    let options: string[] = [];
    if (typeof row.options === "string") {
      try {
        options = JSON.parse(row.options);
      } catch {
        options = [];
      }
    } else if (Array.isArray(row.options)) {
      options = row.options.map(String);
    }

    return {
      id: row.id,
      questionText: row.question_text,
      options,
      correctAnswer: row.correct_answer,
      category: row.category || "General",
      topic: row.topic || "General",
      difficulty: (row.difficulty as QuestionDifficulty) || "medium",
      marks: Number(row.marks ?? 1),
      explanation: row.explanation || "",
      isEnabled: Boolean(row.is_enabled),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  private mapSessionRow(row: QueryResultRow): TestSession {
    return {
      sessionId: row.session_id,
      title: row.title,
      questionCount: Number(row.question_count),
      timeLimitMinutes: Number(row.time_limit_minutes),
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).toISOString(),
      isActive: Boolean(row.is_active),
    };
  }

  private mapAttemptRow(row: QueryResultRow): Attempt {
    return {
      attemptId: row.attempt_id,
      sessionId: row.session_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      startedAt: new Date(row.started_at).toISOString(),
      endedAt: row.ended_at ? new Date(row.ended_at).toISOString() : null,
      status: row.status as Attempt["status"],
      score: row.score !== null && row.score !== undefined ? Number(row.score) : null,
      totalQuestions: Number(row.total_questions),
      answeredQuestions: Number(row.answered_questions),
    };
  }

  private mapAttemptAnswerRow(row: QueryResultRow): AttemptAnswer {
    return {
      attemptId: row.attempt_id,
      questionId: row.question_id,
      selectedAnswer: row.selected_answer,
      isCorrect: Boolean(row.is_correct),
      answeredAt: new Date(row.answered_at).toISOString(),
      questionOrder: Number(row.question_order),
    };
  }

  private mapAdminRow(row: QueryResultRow): AdminUser {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}
