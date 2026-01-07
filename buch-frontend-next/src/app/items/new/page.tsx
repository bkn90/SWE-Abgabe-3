"use client";

import { chakra } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Button,
  Code,
  Container,
  Heading,
  HStack,
  Input,
  Link,
  Text,
  Textarea,
} from "@chakra-ui/react";

const Label = chakra("label");

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

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unbekannter Fehler";
}

type CreateResponse = {
  ok: boolean;
  status: number;
  body: unknown;
  raw?: string;
};

export default function NewBookPage() {
  const [token, setToken] = useState<string | null>(null);

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
  const [art, setArt] = useState("EPUB");
  const [rating, setRating] = useState<number>(1);
  const [preis, setPreis] = useState<number>(9.99);
  const [lieferbar, setLieferbar] = useState(true);
  const [homepage, setHomepage] = useState("https://acme.at");
  const [schlagwoerter, setSchlagwoerter] = useState("JAVA");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateResponse | null>(null);

  useEffect(() => {
    const t =
      localStorage.getItem("access_token") ?? localStorage.getItem("token");
    setToken(t);
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setResult(null);

    try {
      if (!token) {
        setResult({
          ok: false,
          status: 401,
          body: "Kein Token gefunden. Bitte einloggen.",
        });
        return;
      }

      const payloadBody = {
        isbn,
        rating,
        art,
        preis,
        lieferbar,
        homepage,
        schlagwoerter: schlagwoerter
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        titel: {
          titel,
          untertitel: untertitel || null,
        },
      };

      const r = await fetch("/api/buecher", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadBody),
      });

      const json = (await r.json()) as CreateResponse;
      setResult(json);
    } catch (e: unknown) {
      setResult({ ok: false, status: 0, body: getErrorMessage(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box bg="gray.50" minH="100vh" py={10}>
      <Container maxW="4xl">
        <HStack
          justify="space-between"
          align="start"
          mb={8}
          wrap="wrap"
          gap={4}
        >
          <Box>
            <Heading>Neues Buch anlegen</Heading>
            <Text mt={2} color="gray.600">
              Nur Admin darf Bücher anlegen.
            </Text>
          </Box>

          <HStack gap={3}>
            <Link as={NextLink} href="/" _hover={{ textDecoration: "none" }}>
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </HStack>
        </HStack>

        {/* Zugriffskarte */}
        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={4}
          bg="white"
          boxShadow="md"
          mb={6}
        >
          <Text fontWeight="semibold">
            Nutzer: <Code>{username ?? "-"}</Code>
          </Text>
          <Text mt={2}>
            Rollen: <Code>{roles.join(", ") || "-"}</Code>
          </Text>

          {!token && (
            <Box
              mt={3}
              borderWidth="1px"
              borderColor="red.300"
              bg="red.50"
              borderRadius="md"
              p={3}
            >
              <Text fontWeight="semibold" color="red.700">
                Kein Token gefunden – bitte einloggen.
              </Text>
              <Link
                as={NextLink}
                href="/login"
                _hover={{ textDecoration: "none" }}
              >
                <Button mt={3} colorScheme="teal">
                  Zum Login
                </Button>
              </Link>
            </Box>
          )}

          {token && !isAdmin && (
            <Box
              mt={3}
              borderWidth="1px"
              borderColor="red.300"
              bg="red.50"
              borderRadius="md"
              p={3}
            >
              <Text fontWeight="semibold" color="red.700">
                Kein Zugriff: Nur Admin
              </Text>
              <Text fontSize="sm" mt={1}>
                Du bist eingeloggt, aber hast keine <Code>admin</Code>-Rolle im
                Token.
              </Text>
              <HStack mt={3}>
                <Link
                  as={NextLink}
                  href="/search"
                  _hover={{ textDecoration: "none" }}
                >
                  <Button colorScheme="teal" variant="outline">
                    Zur Suche
                  </Button>
                </Link>
                <Link
                  as={NextLink}
                  href="/"
                  _hover={{ textDecoration: "none" }}
                >
                  <Button variant="outline">Dashboard</Button>
                </Link>
              </HStack>
            </Box>
          )}
        </Box>

        {/* Formular: nur Admin */}
        {token && isAdmin && (
          <Box bg="white" borderRadius="lg" boxShadow="md" p={6}>
            <Heading size="md" mb={4}>
              Buchdaten
            </Heading>

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
                <SimpleField label="Art" hint='z.B. "EPUB", "HARDCOVER"'>
                  <Input value={art} onChange={(e) => setArt(e.target.value)} />
                </SimpleField>
              </Box>
            </HStack>

            <HStack gap={4} align="start" flexWrap="wrap">
              <Box flex="1" minW="240px">
                <SimpleField label="Rating" hint="1-5">
                  <Input
                    type="number"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    min={1}
                    max={5}
                  />
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

            {/* Checkbox + Label (Chakra v3 kompatibel) */}
            <HStack mt={3}>
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

            <HStack mt={6} gap={3}>
              <Button
                colorScheme="purple"
                onClick={() => void onSubmit()}
                loading={submitting}
                disabled={!titel.trim()}
              >
                Buch anlegen
              </Button>

              <Link
                as={NextLink}
                href="/search"
                _hover={{ textDecoration: "none" }}
              >
                <Button variant="outline">Zur Suche</Button>
              </Link>
            </HStack>

            {result && (
              <Box mt={6}>
                <Text fontWeight="semibold">
                  Ergebnis:{" "}
                  <Text as="span" color={result.ok ? "green.600" : "red.600"}>
                    {result.ok ? "OK" : "Fehler"} (HTTP {result.status})
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
            )}
          </Box>
        )}
      </Container>
    </Box>
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
    <Box mb={4}>
      <Text fontWeight="semibold">{label}</Text>
      {hint && (
        <Text fontSize="sm" color="gray.600" mb={2}>
          {hint}
        </Text>
      )}
      {children}
    </Box>
  );
}
