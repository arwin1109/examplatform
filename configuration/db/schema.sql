-- PostgreSQL Database Schema for Accelirate Exam Platform
-- Location: ./exam-platform/configuration/db/schema.sql

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(255) PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 1,
  time_limit_minutes INTEGER NOT NULL DEFAULT 15,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Candidate Exam Attempts Table
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

-- Attempt Answers Table
CREATE TABLE IF NOT EXISTS attempt_answers (
  attempt_id VARCHAR(255) NOT NULL REFERENCES attempts(attempt_id) ON DELETE CASCADE,
  question_id VARCHAR(255) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL DEFAULT '',
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  question_order INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (attempt_id, question_id)
);

-- App Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'csv',
  postgres_configured BOOLEAN NOT NULL DEFAULT false,
  admin_password_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Admin Accounts Table
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_enabled ON questions(is_enabled);
CREATE INDEX IF NOT EXISTS idx_attempts_session_id ON attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_started_at ON attempts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(LOWER(email));

-- Initial Seed Data
INSERT INTO settings (id, storage_provider, postgres_configured)
VALUES (1, 'csv', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, question_text, options, correct_answer, is_enabled, created_at, updated_at)
VALUES 
  ('q-html-basics', 'Which HTML tag is used to create a hyperlink?', '["<link>", "<a>", "<href>", "<url>"]'::jsonb, '<a>', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-js-array', 'Which array method returns a new array with matching items?', '["map", "filter", "reduce", "find"]'::jsonb, 'filter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-css-flex', 'Which CSS property aligns flex items on the main axis?', '["align-items", "justify-content", "place-items", "align-content"]'::jsonb, 'justify-content', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-js-promises', 'Which method receives an array of promises and resolves when ALL of them have resolved?', '["Promise.race", "Promise.all", "Promise.any", "Promise.allSettled"]'::jsonb, 'Promise.all', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-css-box-model', 'Which CSS box-sizing value includes padding and border in the total width and height?', '["content-box", "border-box", "padding-box", "inherit"]'::jsonb, 'border-box', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-sql-join', 'Which SQL JOIN clause returns all rows from the left table and matched rows from the right table?', '["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"]'::jsonb, 'LEFT JOIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-js-closure', 'What is a closure in JavaScript?', '["A function combined with references to its lexical environment", "A method that terminates function execution", "A way to close browser windows programmatically", "A built-in data structure for key-value pairs"]'::jsonb, 'A function combined with references to its lexical environment', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-http-status-404', 'Which HTTP response status code indicates that the requested resource was Not Found?', '["200", "301", "404", "500"]'::jsonb, '404', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-git-checkout', 'Which Git command creates and switches to a new branch simultaneously?', '["git branch -n <name>", "git checkout -b <name>", "git switch --create-new <name>", "git merge -b <name>"]'::jsonb, 'git checkout -b <name>', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-react-hooks', 'Which React hook is designed for handling side effects like data fetching or subscriptions?', '["useState", "useEffect", "useMemo", "useContext"]'::jsonb, 'useEffect', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-data-structure-stack', 'Which data structure operates on a Last-In First-Out (LIFO) principle?', '["Queue", "Stack", "Linked List", "Binary Search Tree"]'::jsonb, 'Stack', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-ts-generics', 'What syntax is used in TypeScript to define generic type parameters?', '["<T>", "typeof", "instanceof", "as"]'::jsonb, '<T>', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-web-storage-local', 'Which Web Storage API mechanism persists stored data even after the browser is closed and reopened?', '["sessionStorage", "localStorage", "IndexedDB Cache", "Cookie Session"]'::jsonb, 'localStorage', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-algo-binary-search', 'What is the worst-case time complexity of Binary Search on a sorted array of size N?', '["O(1)", "O(N)", "O(log N)", "O(N^2)"]'::jsonb, 'O(log N)', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-rest-methods', 'Which HTTP method is typically used to update an existing resource by replacing its entire payload?', '["GET", "POST", "PUT", "DELETE"]'::jsonb, 'PUT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-js-event-loop', 'Where do microtasks (such as Promise callbacks) get queued relative to macrotasks (such as setTimeout)?', '["Microtask queue executes before the next macrotask", "Macrotask queue always runs first", "They execute in parallel on separate threads", "Microtasks only run when idle"]'::jsonb, 'Microtask queue executes before the next macrotask', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-db-primary-key', 'Which database constraint uniquely identifies each record in a table and cannot contain NULL values?', '["FOREIGN KEY", "PRIMARY KEY", "CHECK", "UNIQUE INDEX"]'::jsonb, 'PRIMARY KEY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('q-css-z-index', 'Which CSS property specifies the stack order of an element along the z-axis?', '["z-index", "elevation", "order", "stack-order"]'::jsonb, 'z-index', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (session_id, title, question_count, time_limit_minutes, created_by, created_at, is_active)
VALUES ('frontend-basics-demo', 'Frontend & Full-Stack Assessment', 15, 20, 'admin@exam-platform.local', CURRENT_TIMESTAMP, true)
ON CONFLICT (session_id) DO NOTHING;
