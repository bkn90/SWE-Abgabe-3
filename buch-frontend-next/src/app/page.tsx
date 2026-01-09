"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Grid,
  Heading,
  HStack,
  Link,
  Separator,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { AppLayout } from "@/components/AppLayout";
import { StarRating } from "@/components/StarRating";

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

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") ?? localStorage.getItem("token");
}

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
        .join(""),
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
    if (Array.isArray(r))
      roles.push(...r.filter((x): x is string => typeof x === "string"));
  }

  const resourceAccess = payload["resource_access"];
  if (resourceAccess && typeof resourceAccess === "object") {
    const ra = resourceAccess as Record<string, unknown>;
    const nestClient = ra["nest-client"];
    if (nestClient && typeof nestClient === "object") {
      const r = (nestClient as Record<string, unknown>)["roles"];
      if (Array.isArray(r))
        roles.push(...r.filter((x): x is string => typeof x === "string"));
    }
  }

  return Array.from(new Set(roles));
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "red" | "orange" | "gray" | "blue" | "purple";
}) {
  return (
    <Badge
      px={2}
      py={1}
      borderRadius="md"
      bg={`${tone}.100`}
      color={`${tone}.800`}
    >
      {label}
    </Badge>
  );
}

function PrettyResult({ result }: { result: ApiResult | null }) {
  if (!result) return null;
  const ok = result.ok;

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={3}
      bg={ok ? "green.50" : "red.50"}
      borderColor={ok ? "green.200" : "red.200"}
    >
      <HStack justify="space-between" align="start">
        <Text fontWeight="semibold">
          {ok ? "OK" : "Fehler"}{" "}
          <Text as="span" fontWeight="normal">
            (HTTP {result.status || "?"})
          </Text>
        </Text>
        <StatusBadge
          label={ok ? "Success" : "Error"}
          tone={ok ? "green" : "red"}
        />
      </HStack>

      <Text mt={2} fontSize="sm" color="gray.700">
        Antwort (gekürzt):
      </Text>
      <Code
        display="block"
        whiteSpace="pre"
        p={3}
        borderRadius="md"
        mt={2}
        maxH="220px"
        overflow="auto"
      >
        {JSON.stringify(result.body ?? null, null, 2)}
      </Code>
    </Box>
  );
}

export default function Page() {
  const router = useRouter();

  // lazy init (konsistent mit AppLayout)
  const [token, setToken] = useState<string | null>(() => getToken());

  useEffect(() => {
    const onFocus = () => setToken(getToken());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const payload = useMemo(() => (token ? safeParseJwt(token) : null), [token]);
  const roles = useMemo(() => extractRoles(payload), [payload]);
  const isAdmin = roles.includes("admin");

  const username =
    (payload &&
      typeof payload["preferred_username"] === "string" &&
      (payload["preferred_username"] as string)) ||
    (payload &&
      typeof payload["name"] === "string" &&
      (payload["name"] as string)) ||
    null;

  const exp =
    payload && typeof payload["exp"] === "number"
      ? (payload["exp"] as number)
      : null;

  const tokenMeta = useMemo(() => {
    if (!token) {
      return {
        badge: <StatusBadge label="Nicht eingeloggt" tone="red" />,
        detail: "Bitte einloggen.",
      };
    }
    if (!exp) {
      return {
        badge: <StatusBadge label="Token vorhanden" tone="orange" />,
        detail: "Ablaufdatum (exp) nicht gefunden.",
      };
    }
    const now = Math.floor(Date.now() / 1000);
    const remaining = exp - now;
    if (remaining <= 0) {
      return {
        badge: <StatusBadge label="Token abgelaufen" tone="red" />,
        detail: "Bitte neu einloggen.",
      };
    }
    const mins = Math.floor(remaining / 60);
    return {
      badge: <StatusBadge label="Eingeloggt" tone="green" />,
      detail: `Token gültig (noch ca. ${mins} min).`,
    };
  }, [token, exp]);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token");
    setToken(null);
    router.push("/login");
    router.refresh();
  }

  const [health, setHealth] = useState<ApiResult | null>(null);
  const [count, setCount] = useState<ApiResult | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingCount, setLoadingCount] = useState(false);

  const [latest, setLatest] = useState<Buch[]>([]);
  const [latestErr, setLatestErr] = useState<string | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);

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
      const query = `
        query {
          buecher {
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
        const msg =
          json.errors?.[0]?.message ?? `HTTP ${r.status} beim Laden der Bücher`;
        setLatestErr(String(msg));
        return;
      }

      const all = json.data?.buecher ?? [];
      setLatest(all.slice(0, 5));
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
    if (isAdmin) void loadAdminStuff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  return (
    <AppLayout title="Dashboard">
      <Stack gap={6}>
        <Box
          borderWidth="1px"
          borderRadius="xl"
          bg="white"
          p={{ base: 4, md: 6 }}
        >
          <Grid
            templateColumns={{ base: "1fr", md: "1.2fr 0.8fr" }}
            gap={6}
            alignItems="center"
          >
            <Box>
              <Heading size="lg">Buch Frontend</Heading>
              <Text mt={2} color="gray.600">
                Schnellzugriff auf Suche & (optional) Admin-Tools.
              </Text>

              <HStack mt={4} gap={2} wrap="wrap">
                {tokenMeta.badge}
                {isAdmin ? (
                  <StatusBadge label="Admin" tone="purple" />
                ) : (
                  <StatusBadge label="User" tone="blue" />
                )}
                {username ? (
                  <Text fontSize="sm" color="gray.600">
                    Angemeldet als {username}.
                  </Text>
                ) : null}
              </HStack>

              <Text mt={2} fontSize="sm" color="gray.600">
                {tokenMeta.detail}
              </Text>

              {!token ? (
                <Alert.Root status="warning" mt={4} borderRadius="md">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Hinweis</Alert.Title>
                    <Alert.Description>
                      Du bist nicht eingeloggt. Manche Funktionen (GraphQL /
                      Admin) könnten fehlschlagen.
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              ) : null}
            </Box>

            <Box>
              <Stack gap={3}>
                <Link
                  as={NextLink}
                  href="/search"
                  _hover={{ textDecoration: "none" }}
                >
                  <Button
                    w="full"
                    size="lg"
                    bg="teal.600"
                    color="white"
                    _hover={{ bg: "teal.700" }}
                  >
                    Zur Suche
                  </Button>
                </Link>

                {isAdmin ? (
                  <Link
                    as={NextLink}
                    href="/items/new"
                    _hover={{ textDecoration: "none" }}
                  >
                    <Button
                      w="full"
                      variant="outline"
                      size="lg"
                      borderColor="purple.400"
                      color="purple.700"
                    >
                      Neues Buch anlegen
                    </Button>
                  </Link>
                ) : (
                  <Box borderWidth="1px" borderRadius="lg" p={3} bg="gray.50">
                    <Text fontSize="sm" color="gray.600">
                      „Neues Buch anlegen“ ist nur für Admin verfügbar.
                    </Text>
                  </Box>
                )}

                {token ? (
                  <Button onClick={logout} variant="ghost" size="sm">
                    Logout
                  </Button>
                ) : null}
              </Stack>
            </Box>
          </Grid>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Box borderWidth="1px" borderRadius="xl" bg="white" p={5}>
            <Text fontSize="sm" color="gray.600">
              Rollen
            </Text>
            <Text fontSize="2xl" fontWeight="bold" mt={1}>
              {roles.length}
            </Text>
            <Text mt={2} fontSize="sm" color="gray.600">
              <Code>{roles.join(", ") || "-"}</Code>
            </Text>
          </Box>

          <Box borderWidth="1px" borderRadius="xl" bg="white" p={5}>
            <Text fontSize="sm" color="gray.600">
              Auth
            </Text>
            <Text fontSize="2xl" fontWeight="bold" mt={1}>
              {token ? "Token" : "—"}
            </Text>
            <Text mt={2} fontSize="sm" color="gray.600">
              {token ? "Token vorhanden" : "Nicht eingeloggt"}
            </Text>
          </Box>

          <Box borderWidth="1px" borderRadius="xl" bg="white" p={5}>
            <Text fontSize="sm" color="gray.600">
              Quick Tip
            </Text>
            <Text fontSize="2xl" fontWeight="bold" mt={1}>
              Suche
            </Text>
            <Text mt={2} fontSize="sm" color="gray.600">
              Nutze Filter + Reset für schnelles Testen.
            </Text>
          </Box>
        </SimpleGrid>

        {isAdmin ? (
          <>
            <Separator />

            <Stack gap={4}>
              <HStack justify="space-between" wrap="wrap" gap={3}>
                <Heading size="md">Admin Tools</Heading>
                <Button onClick={() => void loadAdminStuff()} variant="outline">
                  Alles neu laden
                </Button>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Box borderWidth="1px" borderRadius="xl" bg="white" p={5}>
                  <HStack justify="space-between" mb={3} wrap="wrap" gap={2}>
                    <Heading size="sm">Backend Health</Heading>
                    <Button
                      onClick={() => void loadHealth()}
                      size="sm"
                      loading={loadingHealth}
                    >
                      Prüfen
                    </Button>
                  </HStack>

                  <Skeleton loading={loadingHealth}>
                    <PrettyResult result={health} />
                    {!health ? (
                      <Text fontSize="sm" color="gray.600">
                        Klicke auf „Prüfen“ oder „Alles neu laden“.
                      </Text>
                    ) : null}
                  </Skeleton>
                </Box>

                <Box borderWidth="1px" borderRadius="xl" bg="white" p={5}>
                  <HStack justify="space-between" mb={3} wrap="wrap" gap={2}>
                    <Heading size="sm">Buch-Count</Heading>
                    <Button
                      onClick={() => void loadCount()}
                      size="sm"
                      loading={loadingCount}
                    >
                      Laden
                    </Button>
                  </HStack>

                  <Skeleton loading={loadingCount}>
                    <PrettyResult result={count} />
                    {!count ? (
                      <Text fontSize="sm" color="gray.600">
                        Klicke auf „Laden“ oder „Alles neu laden“.
                      </Text>
                    ) : null}
                  </Skeleton>
                </Box>

                <Box
                  borderWidth="1px"
                  borderRadius="xl"
                  bg="white"
                  p={5}
                  gridColumn={{ base: "auto", md: "1 / -1" }}
                >
                  <HStack justify="space-between" mb={3} wrap="wrap" gap={2}>
                    <Heading size="sm">Bücher (Top 5)</Heading>
                    <Button
                      onClick={() => void loadLatest()}
                      size="sm"
                      variant="outline"
                      loading={loadingLatest}
                    >
                      Neu laden
                    </Button>
                  </HStack>

                  {loadingLatest ? (
                    <Stack gap={3}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          height="64px"
                          borderRadius="md"
                          loading
                        />
                      ))}
                    </Stack>
                  ) : latestErr ? (
                    <Alert.Root status="error" borderRadius="md">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>Fehler</Alert.Title>
                        <Alert.Description>{latestErr}</Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  ) : latest.length === 0 ? (
                    <Text color="gray.600">Keine Bücher gefunden.</Text>
                  ) : (
                    <Stack gap={3}>
                      {latest.map((b) => (
                        <Box
                          key={b.id}
                          borderWidth="1px"
                          borderRadius="lg"
                          p={4}
                          bg="gray.50"
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          gap={4}
                        >
                          <Box>
                            <Text fontWeight="bold">
                              {b.titel?.titel ?? "(ohne Titel)"}
                            </Text>

                            <HStack
                              fontSize="sm"
                              color="gray.600"
                              wrap="wrap"
                              gap={2}
                            >
                              <Text>ISBN: {b.isbn ?? "-"}</Text>
                              <Text>·</Text>
                              <HStack gap={2}>
                                <Text>Rating:</Text>
                                <StarRating value={b.rating} />
                              </HStack>
                              <Text>·</Text>
                              <Text>Art: {b.art ?? "-"}</Text>
                            </HStack>

                            <Text fontSize="sm" color="gray.600">
                              Lieferbar: {String(b.lieferbar ?? "-")} · Preis:{" "}
                              {String(b.preis ?? "-")}
                            </Text>
                          </Box>

                          <Link
                            as={NextLink}
                            href={`/items/${b.id}`}
                            _hover={{ textDecoration: "none" }}
                          >
                            <Button size="sm" variant="outline">
                              Details
                            </Button>
                          </Link>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </SimpleGrid>

              {token ? (
                <Box borderWidth="1px" borderRadius="xl" bg="white" p={5}>
                  <Heading size="sm" mb={2}>
                    Debug (Token gekürzt)
                  </Heading>
                  <Code display="block" p={3} borderRadius="md">
                    {token.slice(0, 40)}…{token.slice(-20)}
                  </Code>
                </Box>
              ) : null}
            </Stack>
          </>
        ) : null}
        {/* Feature-Übersicht (User) */}
        <Box>
          <Heading size="sm" mb={3}>
            Was kannst du hier tun?
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box borderWidth="1px" borderRadius="xl" bg="white" p={4}>
              <Text fontWeight="medium">🔍 Bücher suchen</Text>
              <Text fontSize="sm" color="gray.600">
                Suche nach Titel, ISBN, Bewertung, Preis und Verfügbarkeit.
              </Text>
            </Box>

            <Box borderWidth="1px" borderRadius="xl" bg="white" p={4}>
              <Text fontWeight="medium">📖 Buchdetails ansehen</Text>
              <Text fontSize="sm" color="gray.600">
                Detailansicht mit Bewertung, Preis und weiteren Informationen.
              </Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Feature-Übersicht (Admin) */}
        {isAdmin && (
          <Box>
            <Heading size="sm" mb={3}>
              Admin-Funktionen
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box borderWidth="1px" borderRadius="xl" bg="white" p={4}>
                <Text fontWeight="medium">➕ Bücher anlegen</Text>
                <Text fontSize="sm" color="gray.600">
                  Neue Bücher mit Validierung erstellen.
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
        )}

        {/* Footer (alle) */}
        <Box pt={8}>
          <Separator mb={4} />
          <Text fontSize="sm" color="gray.500" textAlign="center">
            SWE Abgabe · Buchverwaltung · Next.js · GraphQL · Chakra UI
          </Text>

          {isAdmin && (
            <Text fontSize="xs" color="gray.400" textAlign="center" mt={1}>
              Admin-Modus aktiv
            </Text>
          )}
        </Box>
      </Stack>
    </AppLayout>
  );
}
