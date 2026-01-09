type GraphQLError = { message?: string };

export type TokenPayload = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
};

type TokenMutationData = { token: TokenPayload | null };
type TokenMutationVars = { username: string; password: string };

type RefreshMutationData = { refresh: TokenPayload | null };
type RefreshMutationVars = { refreshToken: string };

const TOKEN_MUTATION = `
  mutation Token($username: String!, $password: String!) {
    token(username: $username, password: $password) {
      access_token
      expires_in
      refresh_token
      refresh_expires_in
    }
  }
`;

const REFRESH_MUTATION = `
  mutation Refresh($refreshToken: String!) {
    refresh(refreshToken: $refreshToken) {
      access_token
      expires_in
      refresh_token
      refresh_expires_in
    }
  }
`;

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unbekannter Fehler";
}

async function postGraphQL<TData, TVars>(
  query: string,
  variables: TVars,
): Promise<{ data?: TData; errors?: GraphQLError[]; httpStatus: number }> {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as { data?: TData; errors?: GraphQLError[] };
  return { ...json, httpStatus: res.status };
}

function saveTokens(tp: TokenPayload) {
  localStorage.setItem("access_token", tp.access_token);
  localStorage.setItem("refresh_token", tp.refresh_token);
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token");
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token") ?? localStorage.getItem("token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export async function login(
  username: string,
  password: string,
): Promise<TokenPayload> {
  try {
    const { data, errors, httpStatus } = await postGraphQL<
      TokenMutationData,
      TokenMutationVars
    >(TOKEN_MUTATION, { username, password });

    if (httpStatus >= 400) throw new Error(`HTTP ${httpStatus} beim Login`);
    if (errors?.length)
      throw new Error(errors[0]?.message ?? "Login fehlgeschlagen (GraphQL).");

    const tokenPayload = data?.token ?? null;
    if (!tokenPayload?.access_token)
      throw new Error("Login fehlgeschlagen: Kein access_token erhalten.");

    saveTokens(tokenPayload);
    return tokenPayload;
  } catch (e: unknown) {
    throw new Error(getErrorMessage(e));
  }
}

export async function refreshTokens(): Promise<TokenPayload> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("Kein refresh_token vorhanden.");

  try {
    const { data, errors, httpStatus } = await postGraphQL<
      RefreshMutationData,
      RefreshMutationVars
    >(REFRESH_MUTATION, { refreshToken });

    if (httpStatus >= 400) throw new Error(`HTTP ${httpStatus} beim Refresh`);
    if (errors?.length)
      throw new Error(
        errors[0]?.message ?? "Token-Refresh fehlgeschlagen (GraphQL).",
      );

    const tokenPayload = data?.refresh ?? null;
    if (!tokenPayload?.access_token)
      throw new Error(
        "Token-Refresh fehlgeschlagen: Kein access_token erhalten.",
      );

    saveTokens(tokenPayload);
    return tokenPayload;
  } catch (e: unknown) {
    throw new Error(getErrorMessage(e));
  }
}
