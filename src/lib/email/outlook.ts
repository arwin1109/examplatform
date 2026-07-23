import type { EmailConfig } from "@/lib/storage/types";

export interface SendEmailOptions {
  config: EmailConfig;
  to: string;
  subject: string;
  body: string;
}

export interface OutlookTestResult {
  success: boolean;
  message: string;
}

async function fetchAccessToken(config: EmailConfig): Promise<string> {
  const tokenEndpoint = `https://login.microsoftonline.com/${encodeURIComponent(
    config.tenantId,
  )}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", config.applicationId);
  params.append("client_secret", config.clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorDescription =
      data.error_description || data.error || response.statusText;
    throw new Error(`Microsoft OAuth Authentication failed: ${errorDescription}`);
  }

  if (!data.access_token) {
    throw new Error("No access token returned by Microsoft OAuth provider.");
  }

  return data.access_token;
}

export async function testOutlookConnection(
  config: EmailConfig,
): Promise<OutlookTestResult> {
  try {
    const accessToken = await fetchAccessToken(config);

    // Verify user mailbox access with Microsoft Graph API
    const userEndpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      config.emailAddress,
    )}`;

    const response = await fetch(userEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorMsg = data.error?.message || response.statusText;

      if (response.status === 403 || errorMsg.includes("Insufficient privileges")) {
        return {
          success: false,
          message: `OAuth Token acquired! However, Azure returned "Insufficient privileges". Action required: In Azure Portal → App Registrations → API Permissions, add Application Permission "Mail.Send" (and "User.Read.All") and click "Grant admin consent for [Tenant]".`,
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          message: `OAuth Token acquired, but user account "${config.emailAddress}" was not found in Azure AD Tenant. Please check the email address.`,
        };
      }

      return {
        success: false,
        message: `Token acquired, but mailbox check failed: ${errorMsg}`,
      };
    }

    return {
      success: true,
      message: `Connection successful! Verified Microsoft Graph API access for ${config.emailAddress}.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Outlook connection test failed.";
    return {
      success: false,
      message,
    };
  }
}

export async function sendOutlookEmail({
  config,
  to,
  subject,
  body,
}: SendEmailOptions): Promise<void> {
  const accessToken = await fetchAccessToken(config);

  const sendMailEndpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    config.emailAddress,
  )}/sendMail`;

  const payload = {
    message: {
      subject,
      body: {
        contentType: "Text",
        content: body,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    },
    saveToSentItems: "true",
  };

  const response = await fetch(sendMailEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status !== 202) {
    const data = await response.json().catch(() => ({}));
    const errorMsg =
      data.error?.message ||
      `HTTP ${response.status} ${response.statusText}`;

    if (response.status === 403) {
      throw new Error(
        `Azure permission error (403 Forbidden): Ensure Application Permission 'Mail.Send' is granted and Admin Consent is clicked in Azure Portal. Details: ${errorMsg}`
      );
    }

    throw new Error(`Failed to send email via Microsoft Graph API: ${errorMsg}`);
  }
}
