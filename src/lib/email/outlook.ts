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

  const isDelegated = config.authType === "delegated";

  // Delegated ROPC Flow (ONLY executed when authType === "delegated")
  if (isDelegated) {
    const userPassword = config.password || config.clientSecret;

    // Attempt 1: Public Client ROPC (without client_secret parameter)
    const publicParams = new URLSearchParams();
    publicParams.append("grant_type", "password");
    publicParams.append("client_id", config.applicationId);
    publicParams.append("username", config.emailAddress);
    publicParams.append("password", userPassword);
    publicParams.append(
      "scope",
      "https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read openid profile offline_access",
    );

    const publicResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publicParams.toString(),
    });

    const publicData = await publicResponse.json();

    if (publicResponse.ok && publicData.access_token) {
      return { accessToken: publicData.access_token, isDelegated: true };
    }

    // Attempt 2: Confidential Client ROPC (with client_secret parameter)
    if (config.clientSecret && config.clientSecret !== userPassword) {
      const confidentialParams = new URLSearchParams();
      confidentialParams.append("grant_type", "password");
      confidentialParams.append("client_id", config.applicationId);
      confidentialParams.append("client_secret", config.clientSecret);
      confidentialParams.append("username", config.emailAddress);
      confidentialParams.append("password", userPassword);
      confidentialParams.append(
        "scope",
        "https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read openid profile offline_access",
      );

      const confidentialResponse = await fetch(tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: confidentialParams.toString(),
      });

      const confidentialData = await confidentialResponse.json();

      if (confidentialResponse.ok && confidentialData.access_token) {
        return { accessToken: confidentialData.access_token, isDelegated: true };
      }
    }

    const errorDescription =
      publicData.error_description || publicData.error || publicResponse.statusText;
    throw new Error(`Microsoft Delegated Authentication failed: ${errorDescription}`);
  }

  // Application Flow (grant_type=client_credentials) - ONLY executed when authType is 'client_credentials'
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

    if (errorDescription.includes("AADSTS7000215")) {
      throw new Error(
        `Azure Client Secret Error (AADSTS7000215): Ensure you pasted the Client Secret "Value" (not Secret ID) from Azure Portal → App Registrations → Certificates & secrets.`,
      );
    }

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
          message: `Application Token acquired, but Azure returned "Insufficient privileges". Action required: In Azure Portal → App Registrations → API Permissions, add Application Permission "Mail.Send" (and "User.Read.All") and click "Grant admin consent".`,
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
