const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');

// Helper to load env variables from .env file if present
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

// Check StorageProvider case-insensitively from process.env
function getStorageProviderSetting() {
  return (
    process.env.STORAGE_PROVIDER ||
    process.env.StorageProvider ||
    process.env.DB_PROVIDER ||
    'csv'
  ).trim();
}

async function runStorageInit() {
  const rawProvider = getStorageProviderSetting();
  const normalized = rawProvider.toLowerCase();

  console.log(`\n========================================`);
  console.log(`[Deploy DB Check] StorageProvider = "${rawProvider}"`);
  console.log(`========================================`);

  if (normalized === 'postgres' || normalized === 'postgress' || normalized === 'postgresql') {
    console.log(`[Deploy DB Check] StorageProvider is PostgreSQL. Validating connection...`);

    const connectionString = process.env.DATABASE_URL;
    const poolConfig = connectionString
      ? { connectionString }
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432', 10),
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
          database: process.env.PGDATABASE || 'exam_platform',
        };

    const pool = new Pool(poolConfig);

    let client;
    let connected = false;
    const maxRetries = 10;
    const retryDelayMs = 2000;

    for (let i = 1; i <= maxRetries; i++) {
      try {
        client = await pool.connect();
        connected = true;
        console.log(`✓ [Deploy DB Check] Connected to PostgreSQL successfully on attempt ${i}.`);
        break;
      } catch (err) {
        console.warn(`⚠️ [Deploy DB Check] Connection attempt ${i}/${maxRetries} failed: ${err.message}`);
        if (i < maxRetries) {
          console.log(`   Retrying in ${retryDelayMs / 1000}s...`);
          await new Promise((r) => setTimeout(r, retryDelayMs));
        }
      }
    }

    if (!connected || !client) {
      console.error(`❌ [Deploy DB Check] Failed to connect to PostgreSQL after ${maxRetries} attempts.`);
      await pool.end();
      process.exit(1);
    }

    try {
      // Check if schema exists (e.g. check for 'questions' table)
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'questions'
        ) as exists;
      `);

      const schemaExists = tableCheck.rows[0]?.exists === true;

      if (!schemaExists) {
        console.log(`[Deploy DB Check] Database schema does not exist. Creating schema from configuration/db/schema.sql...`);
        const schemaPath = path.join(process.cwd(), 'configuration', 'db', 'schema.sql');

        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(sql);
          console.log(`✓ [Deploy DB Check] DB schema created successfully from configuration/db/schema.sql.`);
        } else {
          console.error(`❌ [Deploy DB Check] schema.sql not found at ${schemaPath}`);
        }
      } else {
        console.log(`✓ [Deploy DB Check] DB schema already exists.`);
      }

      // Check and seed questions if available in data/questions.csv
      const csvPath = path.join(process.cwd(), 'data', 'questions.csv');
      if (fs.existsSync(csvPath)) {
        console.log(`[Deploy DB Check] Checking questions seed from CSV (${csvPath})...`);
        const csvContent = fs.readFileSync(csvPath, 'utf8').trim();
        if (csvContent) {
          const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
          let insertedCount = 0;

          for (const row of records) {
            const id = row.id || `q-${Math.random().toString(36).substring(2, 9)}`;
            const questionText = row.questionText || row.question || '';
            const correctAnswer = row.correctAnswer || row.correct_answer || '';
            const isEnabled = row.isEnabled === 'true' || row.isEnabled === '1' || row.isEnabled === true;
            
            let optionsJson = '[]';
            if (row.options) {
              if (row.options.trim().startsWith('[')) {
                optionsJson = row.options.trim();
              } else {
                optionsJson = JSON.stringify(row.options.split('|').map(o => o.trim()));
              }
            }

            if (questionText && correctAnswer) {
              await client.query(
                `INSERT INTO questions (id, question_text, options, correct_answer, is_enabled)
                 VALUES ($1, $2, $3::jsonb, $4, $5)
                 ON CONFLICT (id) DO NOTHING;`,
                [id, questionText, optionsJson, correctAnswer, isEnabled]
              );
              insertedCount++;
            }
          }
          console.log(`✓ [Deploy DB Check] Processed and seeded ${insertedCount} questions into PostgreSQL.`);
        }
      }

      // Ensure settings table has storage_provider='postgres' and postgres_configured=true
      await client.query(`
        INSERT INTO settings (id, storage_provider, postgres_configured)
        VALUES (1, 'postgres', true)
        ON CONFLICT (id) DO UPDATE SET storage_provider = 'postgres', postgres_configured = true;
      `);

      console.log(`✓ [Deploy DB Check] PostgreSQL deployment initialization complete.\n`);
    } catch (err) {
      console.error(`❌ [Deploy DB Check] Error during PostgreSQL setup:`, err);
      process.exit(1);
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    console.log(`[Deploy DB Check] StorageProvider is CSV ("${rawProvider}").`);
    console.log(`✓ [Deploy DB Check] Using CSV files in data/ directory as database.`);

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const defaultFiles = {
      'questions.csv': 'id,questionText,options,correctAnswer,category,topic,difficulty,marks,explanation,isEnabled,createdAt,updatedAt\n',
      'sessions.csv': 'sessionId,title,questionCount,timeLimitMinutes,createdBy,createdAt,isActive\n',
      'attempts.csv': 'attemptId,sessionId,name,email,phone,startedAt,endedAt,status,score,totalQuestions,answeredQuestions\n',
      'attempt-answers.csv': 'attemptId,questionId,selectedAnswer,isCorrect,answeredAt,questionOrder\n',
      'admins.csv': 'id,name,email,passwordHash,createdAt\n',
      'settings.csv': 'storageProvider,postgresConfigured\ncsv,false\n',
    };

    for (const [filename, header] of Object.entries(defaultFiles)) {
      const filePath = path.join(dataDir, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, header, 'utf8');
        console.log(`   Created missing CSV file: data/${filename}`);
      }
    }

    console.log(`✓ [Deploy DB Check] CSV storage verification complete.\n`);
  }
}

runStorageInit().catch((err) => {
  console.error(`❌ [Deploy DB Check] Unexpected error:`, err);
  process.exit(1);
});
