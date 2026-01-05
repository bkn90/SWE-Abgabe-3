import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";

const uri =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8080/graphql";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

type ApolloErrorLike = {
  graphQLErrors?: Array<{ message?: string }>;
  networkError?: unknown;
};

export function makeApolloClient() {
  const httpLink = new HttpLink({
    uri,
    credentials: "include",
  });

  const authLink = new SetContextLink((prevContext) => {
  const token =
    typeof window === "undefined" ? null : localStorage.getItem("access_token");

  const prevHeaders =
    (prevContext.headers as Record<string, string>) ?? {};

  return {
    headers: {
      ...prevHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

  // NEW: ErrorLink statt onError()
  const errorLink = new ErrorLink((args) => {
    const { graphQLErrors, networkError } = args as ApolloErrorLike;

    if (graphQLErrors?.length) {
      for (const e of graphQLErrors) {
        console.warn("[GraphQL error]", e?.message ?? "(no message)");
      }
    }

    if (networkError) {
      console.warn("[Network error]", networkError);
    }
  });

  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
  });
}
