type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type UatRequestOptions = {
  method: HttpMethod;
  path: string;
  token?: string;
  body?: Record<string, unknown>;
  qs?: Record<string, string | number | boolean>;
};

type Staff = {
  id: number;
  username: string;
  full_name: string;
  role: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  staff: Staff;
};

const API_BASE_PATH = "/api";

export function uatRequest<T>({
  method,
  path,
  token,
  body,
  qs,
}: UatRequestOptions): Cypress.Chainable<Cypress.Response<T>> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return cy
    .request<T>({
      method,
      url: `${API_BASE_PATH}${normalizedPath}`,
      headers,
      body,
      qs,
      log: false,
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status < 200 || response.status >= 300) {
        const detail =
          typeof response.body === "object" &&
          response.body !== null &&
          "detail" in response.body
            ? response.body.detail
            : undefined;

        let message =
          `UAT API request failed: ${method} ${normalizedPath}` +
          ` [HTTP ${response.status}]`;

        if (typeof detail === "string") {
          message += `: ${detail}`;
        } else if (Array.isArray(detail)) {
          message += `: ${JSON.stringify(detail)}`;
        }

        throw new Error(message);
      }

      return response;
    });
}

export function loginUatAdmin(): Cypress.Chainable<AuthResponse> {
  return cy
    .env(["UAT_ADMIN_USERNAME", "UAT_ADMIN_PASSWORD"])
    .then(({ UAT_ADMIN_USERNAME, UAT_ADMIN_PASSWORD }) => {
      if (
        typeof UAT_ADMIN_USERNAME !== "string" ||
        typeof UAT_ADMIN_PASSWORD !== "string" ||
        UAT_ADMIN_USERNAME.trim() === "" ||
        UAT_ADMIN_PASSWORD.trim() === ""
      ) {
        throw new Error(
          "UAT_ADMIN_USERNAME and UAT_ADMIN_PASSWORD must be configured.",
        );
      }

      return uatRequest<AuthResponse>({
        method: "POST",
        path: "/auth/login",
        body: {
          username: UAT_ADMIN_USERNAME,
          password: UAT_ADMIN_PASSWORD,
        },
      }).then((response) => response.body);
    });
}

export function establishUatSession(): Cypress.Chainable<null> {
  const baseUrl = String(Cypress.config("baseUrl"));

  return cy.session(
    ["uat-admin", baseUrl],
    () => {
      return loginUatAdmin().then((auth) => {
        window.localStorage.setItem(
          "access_token",
          auth.access_token,
        );

        window.localStorage.setItem(
          "staff",
          JSON.stringify(auth.staff),
        );
      });
    },
    {
      cacheAcrossSpecs: false,
    },
  );
}
