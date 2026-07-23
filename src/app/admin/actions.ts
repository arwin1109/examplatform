"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";

import {
  clearAdminSession,
  createAdminSession,
  requireAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth/session";
import { sendOutlookEmail, testOutlookConnection } from "@/lib/email/outlook";
import { buildAttemptQuestionSet, slugifySessionId } from "@/lib/exam";
import { getStorageProvider } from "@/lib/storage";
import type { QuestionDifficulty } from "@/lib/storage/types";

export interface LoginActionState {
  message?: string;
}

function getTextField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

function getCheckboxValue(formData: FormData, fieldName: string) {
  return formData.get(fieldName) === "on";
}

function buildRedirectPath(basePath: string, kind: "success" | "error" | "notice", message: string) {
  const [pathname, existingQuery] = basePath.split("?");
  const params = new URLSearchParams(existingQuery ?? "");
  params.set(kind, message);
  return `${pathname}?${params.toString()}`;
}

function parseQuestionOptions(rawOptions: string) {
  return rawOptions
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+()-\s]/g, "").trim();
}

export interface RegisterActionState {
  message?: string;
}

export async function loginAction(
  _previousState: LoginActionState | undefined,
  formData: FormData,
): Promise<LoginActionState | undefined> {
  const email = getTextField(formData, "email");
  const password = getTextField(formData, "password");

  if (!email || !password) {
    return {
      message: "Email and password are required.",
    };
  }

  const isValid = await verifyAdminCredentials(email, password);

  if (!isValid) {
    return {
      message: "Invalid admin credentials.",
    };
  }

  await createAdminSession(email);
  redirect("/admin");
}

export async function registerAdminAction(
  _previousState: RegisterActionState | undefined,
  formData: FormData,
): Promise<RegisterActionState | undefined> {
  const name = getTextField(formData, "name");
  const email = getTextField(formData, "email");
  const password = getTextField(formData, "password");
  const confirmPassword = getTextField(formData, "confirmPassword");

  if (!name || !email || !password || !confirmPassword) {
    return { message: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { message: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { message: "Password must be at least 6 characters long." };
  }

  try {
    const storageProvider = await getStorageProvider();
    const existing = await storageProvider.getAdminByEmail(email);

    if (existing) {
      return { message: "An admin account with this email address already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await storageProvider.createAdminUser({
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
    });

    await createAdminSession(email);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to register admin account.";
    return { message };
  }

  revalidatePath("/admin");
  redirect(
    buildRedirectPath(
      "/admin",
      "success",
      `Welcome ${name}! Your admin account has been registered.`,
    ),
  );
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createQuestionAction(formData: FormData) {
  await requireAdminSession();

  const storageProvider = await getStorageProvider();
  const questionText = getTextField(formData, "questionText");
  const options = parseQuestionOptions(getTextField(formData, "options"));
  const correctAnswer = getTextField(formData, "correctAnswer");
  const category = getTextField(formData, "category") || "General";
  const topic = getTextField(formData, "topic") || "General";
  const difficulty = (getTextField(formData, "difficulty") as QuestionDifficulty) || "medium";
  const marks = parseInt(getTextField(formData, "marks") || "1", 10) || 1;
  const explanation = getTextField(formData, "explanation");
  const isEnabled = getCheckboxValue(formData, "isEnabled");

  try {
    await storageProvider.addQuestion({
      questionText,
      options,
      correctAnswer,
      category,
      topic,
      difficulty,
      marks,
      explanation,
      isEnabled,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create question.";
    redirect(buildRedirectPath("/admin/questions", "error", message));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/questions");
  redirect(buildRedirectPath("/admin/questions", "success", "Question created."));
}

export async function bulkCreateQuestionsAction(formData: FormData) {
  await requireAdminSession();

  const storageProvider = await getStorageProvider();
  const bulkQuestions = getTextField(formData, "bulkQuestions");
  const lines = bulkQuestions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    redirect(
      buildRedirectPath("/admin/questions", "error", "Add at least one bulk question line."),
    );
  }

  try {
    for (const line of lines) {
      const [questionText, optionsRaw, correctAnswer] = line
        .split("||")
        .map((part) => part.trim());

      const options = optionsRaw
        ? optionsRaw
            .split("|")
            .map((option) => option.trim())
            .filter(Boolean)
        : [];

      if (!questionText || !optionsRaw || !correctAnswer) {
        throw new Error(
          "Each bulk question line must follow: question || option 1 | option 2 || correct answer",
        );
      }

      await storageProvider.addQuestion({
        questionText,
        options,
        correctAnswer,
        category: "General",
        topic: "General",
        difficulty: "medium",
        marks: 1,
        isEnabled: true,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to import bulk questions.";
    redirect(buildRedirectPath("/admin/questions", "error", message));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/questions");
  redirect(
    buildRedirectPath(
      "/admin/questions",
      "success",
      `${lines.length} question${lines.length === 1 ? "" : "s"} added.`,
    ),
  );
}

export async function importQuestionsCsvAction(formData: FormData) {
  await requireAdminSession();

  const storageProvider = await getStorageProvider();
  const file = formData.get("csvFile") as File | null;

  if (!file || file.size === 0) {
    redirect(
      buildRedirectPath(
        "/admin/questions",
        "error",
        "Please select a valid CSV file to upload.",
      ),
    );
  }

  try {
    const content = await file.text();
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    if (!records || records.length === 0) {
      throw new Error("Uploaded CSV file is empty or has no data rows.");
    }

    let count = 0;
    for (const row of records) {
      const questionText =
        row.questionText || row.question || row["Question Text"] || row.Question || "";
      const correctAnswer =
        row.correctAnswer || row.correct_answer || row["Correct Answer"] || row["Correct answer"] || "";
      const isEnabled =
        row.isEnabled !== undefined
          ? row.isEnabled === "true" || row.isEnabled === "1"
          : true;

      if (!questionText.trim() || !correctAnswer.trim()) {
        continue;
      }

      let options: string[] = [];

      // 1. Check for separate dynamic option columns (e.g. option1, option2, option3... or optionA, optionB, Choice 1...)
      const optionColumnKeys = Object.keys(row)
        .filter((key) => /^(option|choice)[_\s]*[0-9a-z]+$/i.test(key.trim()))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

      if (optionColumnKeys.length >= 2) {
        options = optionColumnKeys
          .map((col) => row[col]?.trim())
          .filter((val): val is string => Boolean(val));
      }

      // 2. Fallback to single options/choices column (pipe-separated, JSON array, semicolon, or comma)
      if (options.length < 2) {
        const rawOptions = row.options || row.Options || row.choices || row.Choices || "";
        if (typeof rawOptions === "string" && rawOptions.trim().startsWith("[")) {
          try {
            options = JSON.parse(rawOptions);
          } catch {
            options = rawOptions.split("|").map((o) => o.trim()).filter(Boolean);
          }
        } else if (rawOptions.includes("|")) {
          options = rawOptions.split("|").map((o) => o.trim()).filter(Boolean);
        } else if (rawOptions.includes(";")) {
          options = rawOptions.split(";").map((o) => o.trim()).filter(Boolean);
        } else {
          options = rawOptions.split(/\||,/).map((o) => o.trim()).filter(Boolean);
        }
      }

      if (options.length < 2) {
        continue;
      }

      const category = row.category || row.Category || "General";
      const topic = row.topic || row.Topic || "General";
      const rawDiff = (row.difficulty || row.Difficulty || "medium").toLowerCase();
      const difficulty: QuestionDifficulty =
        rawDiff === "easy" || rawDiff === "hard" ? rawDiff : "medium";
      const marks = parseInt(row.marks || row.Marks || "1", 10) || 1;
      const explanation = row.explanation || row.Explanation || "";

      await storageProvider.addQuestion({
        questionText: questionText.trim(),
        options,
        correctAnswer: correctAnswer.trim(),
        category: category.trim(),
        topic: topic.trim(),
        difficulty,
        marks,
        explanation: explanation.trim(),
        isEnabled,
      });
      count++;
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/questions");
    redirect(
      buildRedirectPath(
        "/admin/questions",
        "success",
        `${count} question${count === 1 ? "" : "s"} imported successfully.`,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to parse CSV file.";
    redirect(buildRedirectPath("/admin/questions", "error", message));
  }
}

export async function updateQuestionAction(formData: FormData) {
  await requireAdminSession();

  const storageProvider = await getStorageProvider();
  const questionId = getTextField(formData, "id");
  const questionText = getTextField(formData, "questionText");
  const options = parseQuestionOptions(getTextField(formData, "options"));
  const correctAnswer = getTextField(formData, "correctAnswer");
  const category = getTextField(formData, "category") || "General";
  const topic = getTextField(formData, "topic") || "General";
  const difficulty = (getTextField(formData, "difficulty") as QuestionDifficulty) || "medium";
  const marks = parseInt(getTextField(formData, "marks") || "1", 10) || 1;
  const explanation = getTextField(formData, "explanation");
  const isEnabled = getCheckboxValue(formData, "isEnabled");

  try {
    const updatedQuestion = await storageProvider.updateQuestion(questionId, {
      questionText,
      options,
      correctAnswer,
      category,
      topic,
      difficulty,
      marks,
      explanation,
      isEnabled,
    });

    if (!updatedQuestion) {
      redirect(buildRedirectPath("/admin/questions", "error", "Question not found."));
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update question.";
    redirect(buildRedirectPath(`/admin/questions?edit=${questionId}`, "error", message));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/questions");
  redirect(buildRedirectPath("/admin/questions", "success", "Question updated."));
}

export async function toggleQuestionAction(formData: FormData) {
  await requireAdminSession();

  const storageProvider = await getStorageProvider();
  const questionId = getTextField(formData, "id");
  const question = await storageProvider.toggleQuestion(questionId);

  if (!question) {
    redirect(buildRedirectPath("/admin/questions", "error", "Question not found."));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/questions");
  redirect(
    buildRedirectPath(
      "/admin/questions",
      "success",
      question.isEnabled ? "Question enabled." : "Question disabled.",
    ),
  );
}

export async function deleteQuestionAction(formData: FormData) {
  await requireAdminSession();

  const storageProvider = await getStorageProvider();
  const questionId = getTextField(formData, "id");
  const deleted = await storageProvider.deleteQuestion(questionId);

  if (!deleted) {
    redirect(buildRedirectPath("/admin/questions", "error", "Question not found."));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/questions");
  redirect(buildRedirectPath("/admin/questions", "success", "Question deleted."));
}

export async function createSessionAction(formData: FormData) {
  const session = await requireAdminSession();
  const storageProvider = await getStorageProvider();

  const title = getTextField(formData, "title");
  const rawSessionId = getTextField(formData, "sessionId");
  const questionCount = Number(getTextField(formData, "questionCount"));
  const timeLimitMinutes = Number(getTextField(formData, "timeLimitMinutes"));
  const isActive = getCheckboxValue(formData, "isActive");

  const enabledQuestions = (await storageProvider.getQuestions()).filter(
    (question) => question.isEnabled,
  );

  if (questionCount > enabledQuestions.length) {
    redirect(
      buildRedirectPath(
        "/admin/sessions",
        "error",
        `Only ${enabledQuestions.length} enabled questions are currently available.`,
      ),
    );
  }

  const baseSessionId =
    rawSessionId || slugifySessionId(title) || `session-${uuidv4().slice(0, 8)}`;
  const uniqueSessionId =
    (await storageProvider.getSession(baseSessionId)) === null
      ? baseSessionId
      : `${baseSessionId}-${uuidv4().slice(0, 6)}`;

  try {
    await storageProvider.createSession({
      sessionId: uniqueSessionId,
      title,
      questionCount,
      timeLimitMinutes,
      createdBy: session.email,
      isActive,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create session.";
    redirect(buildRedirectPath("/admin/sessions", "error", message));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  redirect(
    buildRedirectPath(
      "/admin/sessions",
      "success",
      `Session created. Test link: /test/${uniqueSessionId}`,
    ),
  );
}

export async function toggleSessionAction(formData: FormData) {
  await requireAdminSession();

  const storageProvider = await getStorageProvider();
  const sessionId = getTextField(formData, "sessionId");
  const session = await storageProvider.toggleSession(sessionId);

  if (!session) {
    redirect(buildRedirectPath("/admin/sessions", "error", "Session not found."));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  redirect(
    buildRedirectPath(
      "/admin/sessions",
      "success",
      session.isActive ? "Session activated." : "Session deactivated.",
    ),
  );
}

export async function updateSettingsAction(formData: FormData) {
  await requireAdminSession();

  const requestedProvider = getTextField(formData, "storageProvider") === "postgres" ? "postgres" : "csv";
  const postgresConfigured = getCheckboxValue(formData, "postgresConfigured");

  const storageProvider = await getStorageProvider();
  await storageProvider.updateSettings({
    storageProvider: requestedProvider,
    postgresConfigured,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect(
    buildRedirectPath(
      "/admin/settings",
      "success",
      `Storage settings updated. Active provider: ${requestedProvider.toUpperCase()}.`,
    ),
  );
}

export async function changeAdminPasswordAction(formData: FormData) {
  const session = await requireAdminSession();

  const currentPassword = getTextField(formData, "currentPassword");
  const newPassword = getTextField(formData, "newPassword");
  const confirmPassword = getTextField(formData, "confirmPassword");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(
      buildRedirectPath(
        "/admin/settings",
        "error",
        "All password fields are required.",
      ),
    );
  }

  if (newPassword !== confirmPassword) {
    redirect(
      buildRedirectPath(
        "/admin/settings",
        "error",
        "New password and confirmation password do not match.",
      ),
    );
  }

  if (newPassword.length < 6) {
    redirect(
      buildRedirectPath(
        "/admin/settings",
        "error",
        "New password must be at least 6 characters long.",
      ),
    );
  }

  const isValidCurrent = await verifyAdminCredentials(
    session.email,
    currentPassword,
  );

  if (!isValidCurrent) {
    redirect(
      buildRedirectPath(
        "/admin/settings",
        "error",
        "Current password is incorrect.",
      ),
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const storageProvider = await getStorageProvider();
  await storageProvider.updateSettings({ adminPasswordHash: hashedPassword });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect(
    buildRedirectPath(
      "/admin/settings",
      "success",
      "Admin password changed successfully.",
    ),
  );
}

export async function startAttemptAction(formData: FormData) {
  const storageProvider = await getStorageProvider();
  const sessionId = getTextField(formData, "sessionId");
  const name = getTextField(formData, "name");
  const email = normalizeEmail(getTextField(formData, "email"));
  const phone = normalizePhone(getTextField(formData, "phone"));

  if (!name || !email || !phone) {
    redirect(
      buildRedirectPath(`/test/${sessionId}`, "error", "Name, email, and phone are required."),
    );
  }

  const session = await storageProvider.getSession(sessionId);

  if (!session || !session.isActive) {
    redirect(buildRedirectPath(`/test/${sessionId}`, "error", "This session is not active."));
  }

  const enabledQuestions = (await storageProvider.getQuestions()).filter(
    (question) => question.isEnabled,
  );

  if (enabledQuestions.length < session.questionCount) {
    redirect(
      buildRedirectPath(
        `/test/${sessionId}`,
        "error",
        "This session does not have enough enabled questions to start.",
      ),
    );
  }

  const attemptId = uuidv4();

  await storageProvider.createAttempt({
    attemptId,
    sessionId,
    name,
    email,
    phone,
    startedAt: new Date().toISOString(),
    status: "in_progress",
    totalQuestions: session.questionCount,
  });

  const selectedQuestions = buildAttemptQuestionSet(
    enabledQuestions,
    session.questionCount,
    attemptId,
  );

  await Promise.all(
    selectedQuestions.map((question, index) =>
      storageProvider.saveAttemptAnswer({
        attemptId,
        questionId: question.id,
        selectedAnswer: "",
        isCorrect: false,
        answeredAt: new Date().toISOString(),
        questionOrder: index + 1,
      }),
    ),
  );

  revalidatePath("/admin");
  revalidatePath("/admin/results");
  redirect(`/test/${sessionId}?attemptId=${attemptId}`);
}

export async function addEmailConfigAction(formData: FormData) {
  await requireAdminSession();

  const emailAddress = normalizeEmail(getTextField(formData, "emailAddress"));
  const applicationId = getTextField(formData, "applicationId");
  const tenantId = getTextField(formData, "tenantId");
  const authType = (getTextField(formData, "authType") as "client_credentials" | "delegated") || "client_credentials";
  const rawSecretOrPass = getTextField(formData, "clientSecret") || getTextField(formData, "password");

  if (!emailAddress || !applicationId || !tenantId || !rawSecretOrPass) {
    redirect(
      buildRedirectPath(
        "/admin/settings",
        "error",
        "Email address, Application ID, Tenant ID, and Client Secret / Password are required.",
      ),
    );
  }

  const clientSecret = rawSecretOrPass;
  const password = authType === "delegated" ? rawSecretOrPass : "";

  try {
    const storageProvider = await getStorageProvider();
    await storageProvider.addEmailConfig({
      emailAddress,
      applicationId,
      tenantId,
      clientSecret,
      authType,
      password,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add email configuration.";
    redirect(buildRedirectPath("/admin/settings", "error", message));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/sessions");
  redirect(
    buildRedirectPath(
      "/admin/settings",
      "success",
      `Outlook email configuration for ${emailAddress} added successfully in ${authType} mode.`,
    ),
  );
}

export async function updateEmailConfigAction(formData: FormData) {
  await requireAdminSession();

  const id = getTextField(formData, "id");
  const emailAddress = normalizeEmail(getTextField(formData, "emailAddress"));
  const applicationId = getTextField(formData, "applicationId");
  const tenantId = getTextField(formData, "tenantId");
  const authType = (getTextField(formData, "authType") as "client_credentials" | "delegated") || "client_credentials";
  const rawSecretOrPass = getTextField(formData, "clientSecret") || getTextField(formData, "password");

  if (!id || !emailAddress || !applicationId || !tenantId) {
    redirect(
      buildRedirectPath(
        "/admin/settings",
        "error",
        "Required configuration fields are missing.",
      ),
    );
  }

  const clientSecret = rawSecretOrPass;
  const password = authType === "delegated" ? rawSecretOrPass : "";

  try {
    const storageProvider = await getStorageProvider();
    const updated = await storageProvider.updateEmailConfig(id, {
      emailAddress,
      applicationId,
      tenantId,
      clientSecret,
      authType,
      password,
    });

    if (!updated) {
      redirect(
        buildRedirectPath("/admin/settings", "error", "Email configuration not found."),
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update email configuration.";
    redirect(buildRedirectPath("/admin/settings", "error", message));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/sessions");
  redirect(
    buildRedirectPath(
      "/admin/settings",
      "success",
      `Email configuration updated for ${emailAddress} (${authType} mode).`,
    ),
  );
}

export async function deleteEmailConfigAction(formData: FormData) {
  await requireAdminSession();

  const id = getTextField(formData, "id");

  if (!id) {
    redirect(buildRedirectPath("/admin/settings", "error", "Invalid config ID."));
  }

  try {
    const storageProvider = await getStorageProvider();
    const deleted = await storageProvider.deleteEmailConfig(id);

    if (!deleted) {
      redirect(
        buildRedirectPath("/admin/settings", "error", "Email configuration not found."),
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete email configuration.";
    redirect(buildRedirectPath("/admin/settings", "error", message));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/sessions");
  redirect(
    buildRedirectPath(
      "/admin/settings",
      "success",
      "Email configuration deleted successfully.",
    ),
  );
}

export async function testEmailConfigAction(formData: FormData) {
  await requireAdminSession();

  const id = getTextField(formData, "id");

  if (!id) {
    redirect(
      buildRedirectPath("/admin/settings", "error", "Select an email configuration to test."),
    );
  }

  const storageProvider = await getStorageProvider();
  const config = await storageProvider.getEmailConfig(id);

  if (!config) {
    redirect(
      buildRedirectPath("/admin/settings", "error", "Email configuration not found."),
    );
  }

  const testResult = await testOutlookConnection(config);

  if (!testResult.success) {
    redirect(
      buildRedirectPath(
        "/admin/settings",
        "error",
        `Test failed for ${config.emailAddress}: ${testResult.message}`,
      ),
    );
  }

  redirect(
    buildRedirectPath(
      "/admin/settings",
      "success",
      testResult.message,
    ),
  );
}

export async function bulkCreateCandidateSessionsAction(formData: FormData) {
  const session = await requireAdminSession();
  const storageProvider = await getStorageProvider();

  const titlePrefix = getTextField(formData, "titlePrefix") || "Candidate Aptitude Test";
  const questionCount = Number(getTextField(formData, "questionCount")) || 10;
  const timeLimitMinutes = Number(getTextField(formData, "timeLimitMinutes")) || 20;
  const senderEmailId = getTextField(formData, "senderEmailId");
  const emailSubjectTemplate =
    getTextField(formData, "emailSubject") || "Your Aptitude Assessment Test Link - {test_title}";
  const emailBodyTemplate =
    getTextField(formData, "emailBody") ||
    "Hello {candidate_name},\n\nYou have been invited to complete the aptitude assessment: {test_title}.\n\nPlease click the link below to start your test:\n{test_link}\n\nDetails:\n- Time limit: {time_limit} minutes\n- Questions: {question_count}\n\nNote: Once completed or ended, this link will expire.\n\nGood luck!";
  const sendEmail = getCheckboxValue(formData, "sendEmail");

  const file = formData.get("candidateCsv") as File | null;

  if (!file || file.size === 0) {
    redirect(
      buildRedirectPath(
        "/admin/sessions",
        "error",
        "Please select a valid candidate CSV file to upload.",
      ),
    );
  }

  const enabledQuestions = (await storageProvider.getQuestions()).filter(
    (q) => q.isEnabled,
  );

  if (questionCount > enabledQuestions.length) {
    redirect(
      buildRedirectPath(
        "/admin/sessions",
        "error",
        `Only ${enabledQuestions.length} enabled questions are currently available.`,
      ),
    );
  }

  let emailConfig = null;
  if (sendEmail && senderEmailId) {
    emailConfig = await storageProvider.getEmailConfig(senderEmailId);
    if (!emailConfig) {
      redirect(
        buildRedirectPath(
          "/admin/sessions",
          "error",
          "Selected sender email configuration was not found.",
        ),
      );
    }
  }

  const reqHeaders = await headers();
  const host = reqHeaders.get("host") || "localhost:3000";
  const protocol = reqHeaders.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  let createdCount = 0;
  let sentEmailCount = 0;
  const emailErrors: string[] = [];

  try {
    const content = await file.text();
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    if (!records || records.length === 0) {
      throw new Error("Uploaded candidate CSV is empty or has no rows.");
    }

    for (const row of records) {
      const candidateName =
        row.name || row.Name || row["Full Name"] || row.candidate_name || "";
      const candidateEmail = normalizeEmail(
        row.email || row.Email || row["Email Address"] || "",
      );
      const candidatePhone = normalizePhone(
        row.phone || row.Phone || row["Phone Number"] || "",
      );

      if (!candidateName || !candidateEmail) {
        continue;
      }

      const nameSlug = slugifySessionId(candidateName) || "candidate";
      const baseSessionId = `test-${nameSlug}-${uuidv4().slice(0, 6)}`;

      const uniqueSessionId =
        (await storageProvider.getSession(baseSessionId)) === null
          ? baseSessionId
          : `${baseSessionId}-${uuidv4().slice(0, 4)}`;

      const sessionTitle = `${titlePrefix} - ${candidateName}`;

      await storageProvider.createSession({
        sessionId: uniqueSessionId,
        title: sessionTitle,
        questionCount,
        timeLimitMinutes,
        createdBy: session.email,
        isActive: true,
      });

      createdCount++;

      const testLink = `${baseUrl}/test/${uniqueSessionId}`;

      if (sendEmail && emailConfig) {
        const formatVariables = (str: string) =>
          str
            .replaceAll("{candidate_name}", candidateName)
            .replaceAll("{candidate_email}", candidateEmail)
            .replaceAll("{candidate_phone}", candidatePhone)
            .replaceAll("{test_title}", sessionTitle)
            .replaceAll("{test_link}", testLink)
            .replaceAll("{time_limit}", String(timeLimitMinutes))
            .replaceAll("{question_count}", String(questionCount));

        const subject = formatVariables(emailSubjectTemplate);
        const body = formatVariables(emailBodyTemplate);

        try {
          await sendOutlookEmail({
            config: emailConfig,
            to: candidateEmail,
            subject,
            body,
          });
          sentEmailCount++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown email error";
          emailErrors.push(`${candidateEmail} (${msg})`);
        }
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process candidate CSV.";
    redirect(buildRedirectPath("/admin/sessions", "error", message));
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/sessions");

  let noticeMessage = `${createdCount} candidate session link${createdCount === 1 ? "" : "s"} created successfully.`;
  if (sendEmail && emailConfig) {
    noticeMessage += ` ${sentEmailCount} email invitation${sentEmailCount === 1 ? "" : "s"} dispatched via ${emailConfig.emailAddress}.`;
    if (emailErrors.length > 0) {
      noticeMessage += ` (${emailErrors.length} email delivery warnings: ${emailErrors.join(", ")})`;
    }
  }

  redirect(
    buildRedirectPath(
      "/admin/sessions",
      emailErrors.length > 0 ? "notice" : "success",
      noticeMessage,
    ),
  );
}

