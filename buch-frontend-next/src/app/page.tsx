"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Button,
  Code,
  Container,
  Heading,
  HStack,
  Link,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

type ApiResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

type Titel = { titel?: string | null; untertitel?: string | null };
type Buch = {
  id: string;
  isbn?: string | null;
  rating?: number | null;
  art?: string | null;
  preis?: number | null;
  lieferbar?: boolean | null;
  titel?: Titel | null;
};

type GqlError = { message?: string };
type LatestQueryResponse = {
  data?: { buecher?: Buch[] };
  errors?: GqlError[];
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unbekannter Fehler";
}

function safeParseJwt(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractRoles(payload: Record<string, unknown> | null): string[] {
  if (!payload) return [];

  const roles: string[] = [];

  const realmAccess = payload["realm_access"];
  if (realmAccess && typeof realmAccess === "object") {
    const r = (realmAccess as Record<string, unknown>)["roles"];
    if (Array.isArray(r)) roles.push(...r.filter((x): x is string => typeof x === "string"));
  }

  const resourceAccess = payload["resource_access"];
  if (resourceAccess && typeof resourceAccess === "object") {
    const ra = resourceAccess as Record<string, unknown>;
    const nestClient = ra["nest-client"];
    if (nestClient && typeof nestClient === "object") {
      const r = (nestClient as Record<string, unknown>)["roles"];
      if (Array.isArray(r)) roles.push(...r.filter((x): x is string => typeof x === "string"));
    }
  }

  return Array.from(new Set(roles));
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box bg="white" borderRadius="lg" boxShadow="md" p={6}>
      <Heading size="md" mb={4}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}

function StatusBox({
  title,
  result,
  loading,
}: {
  title: string;
  result: ApiResult | null;
  loading?: boolean;
}) {
  if (!result && !loading) return null;

  const ok = result?.ok ?? false;
  const status = result?.status ?? 0;

  return (
    <Box
      borderRadius="md"
      p={3}
      borderWidth="1px"
      borderColor={ok ? "green.300" : "red.300"}
      bg={ok ? "green.50" : "red.50"}
    >
      <HStack justify="space-between" align="start">
        <Text fontWeight="semibold">
          {title}: {loading ? "Lade…" : ok ? "OK" : "Fehler"} {loading ? "" : `(HTTP ${status})`}
        </Text>
        {loading && <Spinner size="sm" />}
      </HStack>

      {!loading && (
        <>
          <Text mt={2} fontWeight="semibold">
            Antwort:
          </Text>
          <Code display="block" whiteSpace="pre" p={3} borderRadius="md" mt={2}>
            {JSON.stringify(result?.body ?? null, null, 2)}
          </Code>
        </>
      )}
    </Box>
  );
}

export default function Page() {
  // Token + Payload IMMER über State/Effect -> keine Hook-Order Probleme
  const [token, setToken] = useState<string | null>(null);
  const payload = useMemo(() => (token ? safeParseJwt(token) : null), [token]);
  const roles = useMemo(() => extractRoles(payload), [payload]);
  const isAdmin = roles.includes("admin");

  const username =
    (payload && typeof payload["preferred_username"] === "string" && (payload["preferred_username"] as string)) ||
    (payload && typeof payload["name"] === "string" && (payload["name"] as string)) ||
    null;

  const exp = payload && typeof payload["exp"] === "number" ? (payload["exp"] as number) : null;

  const tokenStatus = useMemo(() => {
    if (!token) return { label: "Nicht eingeloggt", color: "red.500" };
    if (!exp) return { label: "Token da, aber exp unbekannt", color: "orange.500" };
    const now = Math.floor(Date.now() / 1000);
    const remaining = exp - now;
    if (remaining <= 0) return { label: "Token abgelaufen", color: "red.500" };
    const mins = Math.floor(remaining / 60);
    return { label: `Token gültig (noch ~${mins} min)`, color: "green.600" };
  }, [token, exp]);

  // Backend-Test
  const [health, setHealth] = useState<ApiResult | null>(null);
  const [count, setCount] = useState<ApiResult | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingCount, setLoadingCount] = useState(false);

  // Letzte Bücher
  const [latest, setLatest] = useState<Buch[]>([]);
  const [latestErr, setLatestErr] = useState<string | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("access_token") ?? localStorage.getItem("token");
    setToken(t);
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const loadHealth = async () => {
    setLoadingHealth(true);
    setHealth(null);
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      const data = (await r.json()) as ApiResult;
      setHealth(data);
    } catch (e: unknown) {
      setHealth({ ok: false, status: 0, body: getErrorMessage(e) });
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadCount = async () => {
    setLoadingCount(true);
    setCount(null);
    try {
      const r = await fetch("/api/buch-count", { cache: "no-store" });
      const data = (await r.json()) as ApiResult;
      setCount(data);
    } catch (e: unknown) {
      setCount({ ok: false, status: 0, body: getErrorMessage(e) });
    } finally {
      setLoadingCount(false);
    }
  };

  const loadLatest = async () => {
    setLoadingLatest(true);
    setLatestErr(null);
    setLatest([]);

    try {
      // Wichtig: Kein "PageableInput" Typ verwenden -> inline Argumente vermeiden Schema-Mismatch
      const query = `
        query {
          buecher(suchkriterien: {}, pageable: { number: 0, size: 5 }) {
            id
            isbn
            rating
            art
            preis
            lieferbar
            titel { titel untertitel }
          }
        }
      `;

      const r = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query }),
      });

      const json = (await r.json()) as LatestQueryResponse;

      if (!r.ok || (json.errors && json.errors.length > 0)) {
        const msg = json.errors?.[0]?.message ?? `HTTP ${r.status} beim Laden der Bücher`;
        setLatestErr(String(msg));
        return;
      }

      setLatest(json.data?.buecher ?? []);
    } catch (e: unknown) {
      setLatestErr(getErrorMessage(e));
    } finally {
      setLoadingLatest(false);
    }
  };

  const loadAdminStuff = async () => {
    await Promise.all([loadHealth(), loadCount(), loadLatest()]);
  };

  useEffect(() => {
    // Admin lädt automatisch die Admin-Widgets
    if (isAdmin) void loadAdminStuff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  return (
    <Box bg="gray.50" minH="100vh" py={10}>
      <Container maxW="6xl">
        <HStack justify="space-between" align="start" mb={8} wrap="wrap" gap={4}>
          <Box>
            <Heading>Buch Frontend Dashboard</Heading>
            <Text mt={2} color="gray.600">
              {isAdmin ? "Admin: Status + Tools" : "User: Quick Links"}
            </Text>
          </Box>

          <HStack gap={3}>
            {isAdmin && (
              <Button onClick={() => void loadAdminStuff()} colorScheme="blue" variant="outline">
                Reload
              </Button>
            )}
            {token ? (
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            ) : (
              <Link as={NextLink} href="/login" _hover={{ textDecoration: "none" }}>
                <Button colorScheme="teal">Zum Login</Button>
              </Link>
            )}
          </HStack>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          {/* Quick Links - IMMER sichtbar */}
          <Card title="Quick Links">
            <VStack align="stretch" gap={3}>
              <Link as={NextLink} href="/search" _hover={{ textDecoration: "none" }}>
                <Button w="full" colorScheme="teal">
                  Zur Suche
                </Button>
              </Link>

              {isAdmin ? (
                <Link as={NextLink} href="/items/new" _hover={{ textDecoration: "none" }}>
                  <Button w="full" colorScheme="purple" variant="outline">
                    Neues Buch anlegen
                  </Button>
                </Link>
              ) : (
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3} bg="gray.50">
                  <Text fontSize="sm" color="gray.700">
                    “Neues Buch anlegen” ist nur für Admin verfügbar.
                  </Text>
                </Box>
              )}
            </VStack>
          </Card>

          {/* Admin-only: Auth Status */}
          {isAdmin && (
            <Card title="Auth Status">
              <VStack align="stretch" gap={3}>
                <Text>
                  Nutzer:{" "}
                  <Text as="span" fontWeight="semibold">
                    {username ?? "(unbekannt)"}
                  </Text>
                </Text>

                <Text fontSize="sm" color="gray.600">
                  Rollen: <Code>{roles.join(", ") || "-"}</Code>
                </Text>

                <Text color={tokenStatus.color} fontWeight="semibold">
                  {tokenStatus.label}
                </Text>

                {token && (
                  <>
                    <Text fontSize="sm" color="gray.600">
                      Token (gekürzt):
                    </Text>
                    <Code p={2} borderRadius="md">
                      {token.slice(0, 40)}…{token.slice(-20)}
                    </Code>
                  </>
                )}
              </VStack>
            </Card>
          )}

          {/* Admin-only: Backend */}
          {isAdmin && (
            <Card title="Backend Health">
              <VStack align="stretch" gap={3}>
                <HStack>
                  <Button onClick={() => void loadHealth()} colorScheme="blue">
                    Health prüfen
                  </Button>
                  {loadingHealth && <Spinner />}
                </HStack>
                <StatusBox title="Health" result={health} loading={loadingHealth} />
              </VStack>
            </Card>
          )}

          {isAdmin && (
            <Card title="Bücher Count">
              <VStack align="stretch" gap={3}>
                <HStack>
                  <Button onClick={() => void loadCount()} colorScheme="green">
                    Buch-Count laden
                  </Button>
                  {loadingCount && <Spinner />}
                </HStack>
                <StatusBox title="Count" result={count} loading={loadingCount} />
              </VStack>
            </Card>
          )}

          {/* Admin-only: Letzte Bücher */}
          {isAdmin && (
            <Box gridColumn={{ base: "auto", md: "1 / -1" }}>
              <Card title="Letzte 5 Bücher">
                <VStack align="stretch" gap={3}>
                  <HStack justify="space-between">
                    <Button
                      onClick={() => void loadLatest()}
                      variant="outline"
                      loading={loadingLatest}
                    >
                      Neu laden
                    </Button>
                    <Text fontSize="sm" color="gray.600">
                      (nur Admin)
                    </Text>
                  </HStack>

                  {loadingLatest ? (
                    <HStack>
                      <Spinner />
                      <Text>Lade…</Text>
                    </HStack>
                  ) : latestErr ? (
                    <Box borderWidth="1px" borderColor="red.300" bg="red.50" borderRadius="md" p={3}>
                      <Text fontWeight="semibold" color="red.700">
                        Fehler beim Laden
                      </Text>
                      <Text fontSize="sm" mt={1}>
                        {latestErr}
                      </Text>
                    </Box>
                  ) : latest.length === 0 ? (
                    <Text color="gray.600">Keine Bücher gefunden.</Text>
                  ) : (
                    <VStack align="stretch" gap={3}>
                      {latest.map((b) => (
                        <Box
                          key={b.id}
                          borderWidth="1px"
                          borderRadius="md"
                          p={4}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          gap={4}
                        >
                          <Box>
                            <Text fontWeight="bold">{b.titel?.titel ?? "(ohne Titel)"}</Text>
                            <Text fontSize="sm" color="gray.600">
                              ISBN: {b.isbn ?? "-"} · Rating: {String(b.rating ?? "-")} · Art:{" "}
                              {b.art ?? "-"}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              Lieferbar: {String(b.lieferbar ?? "-")} · Preis:{" "}
                              {String(b.preis ?? "-")}
                            </Text>
                          </Box>

                          <Link as={NextLink} href={`/items/${b.id}`} _hover={{ textDecoration: "none" }}>
                            <Button size="sm" variant="outline">
                              Details
                            </Button>
                          </Link>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </Card>
            </Box>
          )}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
