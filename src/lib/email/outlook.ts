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

async function fetchAccessToken(
  config: EmailConfig,
): Promise<{ accessToken: string; isDelegated: boolean }> {
  const tokenEndpoint = `https://login.microsoftonline.com/${encodeURIComponent(
    config.tenantId,
  )}/oauth2/v2.0/token`;

  const authType = config.authType || (config.password ? "delegated" : "client_credentials");

  // If authType is delegated OR if password is provided, try ROPC Delegated Flow first
  if (authType === "delegated" || config.password) {
    const params = new URLSearchParams();
    params.append("grant_type", "password");
    params.append("client_id", config.applicationId);
    if (config.clientSecret) {
      params.append("client_secret", config.clientSecret);
    }
    params.append("username", config.emailAddress);
    params.append("password", config.password || config.clientSecret);
    params.append(
      "scope",
      "https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read openid profile offline_access",
    );

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      return { accessToken: data.access_token, isDelegated: true };
    }

    if (config.authType === "delegated") {
      const errorDescription =
        data.error_description || data.error || response.statusText;
      throw new Error(`Microsoft Delegated Authentication failed: ${errorDescription}`);
    }
  }

  // Application Flow (grant_type=client_credentials)
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", config.applicationId);
  params.append("client_secret", config.clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

  return { accessToken: data.access_token, isDelegated: false };
}

export async function testOutlookConnection(
  config: EmailConfig,
): Promise<OutlookTestResult> {
  try {
    const { accessToken, isDelegated } = await fetchAccessToken(config);

    if (isDelegated) {
      // Test via /v1.0/me endpoint for Delegated Permissions
      const meEndpoint = "https://graph.microsoft.com/v1.0/me";
      const response = await fetch(meEndpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMsg = data.error?.message || response.statusText;
        return {
          success: false,
          message: `Delegated Token acquired, but /me test failed: ${errorMsg}`,
        };
      }

      const meData = await response.json();
      return {
        success: true,
        message: `Connection successful! Verified Delegated Graph API access for ${meData.userPrincipalName || config.emailAddress}.`,
      };
    }

    // Application Flow: test via /v1.0/users/{email} endpoint
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
          message: `Application Token acquired, but Azure returned "Insufficient privileges". Since your Azure tenant uses Delegated Permissions, please select "Delegated Permissions" and enter your account/app password in Settings.`,
        };
      }

      return {
        success: false,
        message: `Token acquired, but mailbox check failed: ${errorMsg}`,
      };
    }

    return {
      success: true,
      message: `Connection successful! Verified Application Graph API access for ${config.emailAddress}.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Outlook connection test failed.";
    return { success: false, message };
  }
}

export async function sendOutlookEmail({
  config,
  to,
  subject,
  body,
}: SendEmailOptions): Promise<void> {
  const { accessToken, isDelegated } = await fetchAccessToken(config);

  const sendMailEndpoint = isDelegated
    ? "https://graph.microsoft.com/v1.0/me/sendMail"
    : `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
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
      data.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Failed to send email via Microsoft Graph API (${isDelegated ? "Delegated" : "Application"}): ${errorMsg}`);
  }
}
