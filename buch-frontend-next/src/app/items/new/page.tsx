"use client";

import { chakra } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  HStack,
  Input,
  Link,
  Separator,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { AppLayout } from "@/components/AppLayout";
import { StarRatingInput } from "@/components/StarRatingInput";
import { CREATE_BUCH_MUTATION } from "@/graphql/operations";

const Label = chakra("label");

const ART_OPTIONS = ["EPUB", "HARDCOVER", "PAPERBACK"] as const;
type Art = (typeof ART_OPTIONS)[number];

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

type ResultBox =
  | { ok: true; status: 200; body: unknown }
  | { ok: false; status: number; body: unknown };

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

type CreateMutationData = { create?: { id?: string | null } | null };
type CreateMutationVars = {
  input: {
    isbn?: string | null;
    rating?: number | null;
    art?: Art | null;
    preis?: number | null;
    lieferbar?: boolean | null;
    datum?: string | null;
    homepage?: string | null;
    schlagwoerter?: string[] | null;
    titel: { titel: string; untertitel?: string | null };
  };
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") ?? localStorage.getItem("token");
}

export default function NewBookPage() {
  const router = useRouter();

  // Lazy init
  const [token, setToken] = useState<string | null>(() => getToken());

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

  // Formularfelder
  const [titel, setTitel] = useState("");
  const [untertitel, setUntertitel] = useState("");
  const [isbn, setIsbn] = useState("");
  const [art, setArt] = useState<Art>("EPUB");
  const [rating, setRating] = useState<number>(3);
  const [preis, setPreis] = useState<number>(9.99);
  const [datum, setDatum] = useState<string>(""); // YYYY-MM-DD
  const [lieferbar, setLieferbar] = useState(true);
  const [homepage, setHomepage] = useState("https://acme.at");
  const [schlagwoerter, setSchlagwoerter] = useState("JAVA");

  const [result, setResult] = useState<ResultBox | null>(null);

  const datumIso = datum
    ? new Date(`${datum}T00:00:00.000Z`).toISOString()
    : null;

  const [createBuch, { loading: creating }] = useMutation<
    CreateMutationData,
    CreateMutationVars
  >(CREATE_BUCH_MUTATION);

  const onSubmit = async () => {
    setResult(null);

    if (!token) {
      setResult({
        ok: false,
        status: 401,
        body: "Kein Token gefunden. Bitte einloggen.",
      });
      return;
    }
    if (!isAdmin) {
      setResult({
        ok: false,
        status: 403,
        body: "Kein Zugriff: Nur Admin darf Bücher anlegen.",
      });
      return;
    }
    if (!titel.trim()) {
      setResult({ ok: false, status: 400, body: "Titel ist ein Pflichtfeld." });
      return;
    }

    const input: CreateMutationVars["input"] = {
      isbn: isbn.trim() || null,
      rating,
      art,
      preis,
      lieferbar,
      datum: datumIso,
      homepage: homepage.trim() || null,
      schlagwoerter: schlagwoerter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      titel: {
        titel: titel.trim(),
        untertitel: untertitel.trim() ? untertitel.trim() : null,
      },
    };

    try {
      const res = await createBuch({
        variables: { input },
        context: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      });

      const id = res.data?.create?.id ?? null;

      setResult({
        ok: true,
        status: 200,
        body: { message: "Buch angelegt", id, inputSent: input },
      });

      // optional: direkt zur Detailseite
      // if (id) {
      //   router.push(`/items/${id}`);
      //   router.refresh();
      // }
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Unbekannter Fehler bei GraphQL Mutation.";
      setResult({ ok: false, status: 500, body: message });
    }
  };

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token");
    setToken(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <AppLayout title="Neues Buch">
      <Stack gap={6}>
        {/* Zugriff / Status */}
        <Box
          borderWidth="1px"
          borderRadius="xl"
          bg="white"
          p={{ base: 4, md: 6 }}
        >
          <Stack gap={3}>
            <HStack gap={2} wrap="wrap">
              <StatusBadge
                label={token ? "Eingeloggt" : "Nicht eingeloggt"}
                tone={token ? "green" : "red"}
              />
              <StatusBadge
                label={isAdmin ? "Admin" : "User"}
                tone={isAdmin ? "purple" : "blue"}
              />
              <Text fontSize="sm" color="gray.600">
                Nutzer: <Code>{username ?? "-"}</Code>
              </Text>
            </HStack>

            <Text fontSize="sm" color="gray.600">
              Rollen: <Code>{roles.join(", ") || "-"}</Code>
            </Text>

            {!token ? (
              <Alert.Root status="warning" borderRadius="md">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Login erforderlich</Alert.Title>
                  <Alert.Description>
                    Kein Token gefunden – bitte einloggen.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}

            {token && !isAdmin ? (
              <Alert.Root status="error" borderRadius="md">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Kein Zugriff</Alert.Title>
                  <Alert.Description>
                    Du bist eingeloggt, aber hast keine <Code>admin</Code>
                    -Rolle.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}

            <HStack gap={2} wrap="wrap">
              {!token ? (
                <Link
                  as={NextLink}
                  href="/login"
                  _hover={{ textDecoration: "none" }}
                >
                  <Button colorScheme="teal">Zum Login</Button>
                </Link>
              ) : null}

              <Link
                as={NextLink}
                href="/search"
                _hover={{ textDecoration: "none" }}
              >
                <Button variant="outline">Zur Suche</Button>
              </Link>

              {token ? (
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              ) : null}
            </HStack>
          </Stack>
        </Box>

        <Separator />

        {/* Formular nur Admin */}
        {token && isAdmin ? (
          <Box
            borderWidth="1px"
            borderRadius="xl"
            bg="white"
            p={{ base: 4, md: 6 }}
          >
            <Stack gap={4}>
              <Text fontWeight="semibold">Buchdaten</Text>

              <SimpleField label="Titel" hint="Pflichtfeld">
                <Input
                  value={titel}
                  onChange={(e) => setTitel(e.target.value)}
                  placeholder="z.B. Clean Code"
                />
              </SimpleField>

              <SimpleField label="Untertitel" hint="Optional">
                <Input
                  value={untertitel}
                  onChange={(e) => setUntertitel(e.target.value)}
                  placeholder="z.B. A Handbook of Agile Software Craftsmanship"
                />
              </SimpleField>

              <HStack gap={4} align="start" flexWrap="wrap">
                <Box flex="1" minW="240px">
                  <SimpleField label="ISBN" hint="z.B. 978-3-...">
                    <Input
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="978-..."
                    />
                  </SimpleField>
                </Box>

                <Box flex="1" minW="240px">
                  <SimpleField label="Art" hint="Enum">
                    <select
                      value={art}
                      onChange={(e) => setArt(e.target.value as Art)}
                      style={{
                        border: "1px solid",
                        borderRadius: "8px",
                        padding: "8px",
                        width: "100%",
                      }}
                    >
                      {ART_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </SimpleField>
                </Box>
              </HStack>

              <HStack gap={4} align="start" flexWrap="wrap">
                <Box flex="1" minW="240px">
                  <SimpleField label="Rating" hint="1–5 Sterne">
                    <StarRatingInput value={rating} onChange={setRating} />
                  </SimpleField>
                </Box>

                <Box flex="1" minW="240px">
                  <SimpleField label="Preis" hint="z.B. 19.99">
                    <Input
                      type="number"
                      value={preis}
                      onChange={(e) => setPreis(Number(e.target.value))}
                      step="0.01"
                      min={0}
                    />
                  </SimpleField>
                </Box>
              </HStack>

              <SimpleField label="Datum" hint="Kalenderauswahl">
                <Input
                  type="date"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                />
              </SimpleField>

              <SimpleField label="Homepage" hint="URL">
                <Input
                  value={homepage}
                  onChange={(e) => setHomepage(e.target.value)}
                />
              </SimpleField>

              <SimpleField
                label="Schlagwörter"
                hint='Komma-separiert, z.B. "JAVA, TYPESCRIPT"'
              >
                <Textarea
                  value={schlagwoerter}
                  onChange={(e) => setSchlagwoerter(e.target.value)}
                />
              </SimpleField>

              <HStack>
                <input
                  id="lieferbar"
                  type="checkbox"
                  checked={lieferbar}
                  onChange={(e) => setLieferbar(e.target.checked)}
                />
                <Label htmlFor="lieferbar" cursor="pointer">
                  Lieferbar
                </Label>
              </HStack>

              <HStack gap={3} wrap="wrap">
                <Button
                  colorScheme="purple"
                  onClick={() => void onSubmit()}
                  loading={creating}
                  disabled={!titel.trim()}
                >
                  Buch anlegen (GraphQL)
                </Button>

                <Link
                  as={NextLink}
                  href="/search"
                  _hover={{ textDecoration: "none" }}
                >
                  <Button variant="outline">Zur Suche</Button>
                </Link>
              </HStack>

              {result ? (
                <Box>
                  <Text fontWeight="semibold">
                    Ergebnis:{" "}
                    <Text as="span" color={result.ok ? "green.600" : "red.600"}>
                      {result.ok ? "OK" : "Fehler"} (Status {result.status})
                    </Text>
                  </Text>
                  <Code
                    display="block"
                    whiteSpace="pre"
                    p={3}
                    borderRadius="md"
                    mt={2}
                  >
                    {JSON.stringify(result.body, null, 2)}
                  </Code>
                </Box>
              ) : null}
            </Stack>
          </Box>
        ) : null}
      </Stack>
    </AppLayout>
  );
}

function SimpleField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Text fontWeight="semibold">{label}</Text>
      {hint ? (
        <Text fontSize="sm" color="gray.600" mb={2}>
          {hint}
        </Text>
      ) : null}
      {children}
    </Box>
  );
}
