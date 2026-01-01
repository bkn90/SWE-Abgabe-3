"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Code,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

type ApiResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unbekannter Fehler";
}

function StatusBox({
  title,
  result,
}: {
  title: string;
  result: ApiResult | null;
}) {
  if (!result) return null;

  return (
    <Box
      borderRadius="md"
      p={3}
      borderWidth="1px"
      borderColor={result.ok ? "green.300" : "red.300"}
      bg={result.ok ? "green.50" : "red.50"}
    >
      <Text fontWeight="semibold">
        {title}: {result.ok ? "OK" : "Fehler"} (HTTP {result.status})
      </Text>

      <Text mt={2} fontWeight="semibold">
        Antwort:
      </Text>
      <Code display="block" whiteSpace="pre" p={3} borderRadius="md" mt={2}>
        {JSON.stringify(result.body, null, 2)}
      </Code>
    </Box>
  );
}

export function BackendTest() {
  const [health, setHealth] = useState<ApiResult | null>(null);
  const [count, setCount] = useState<ApiResult | null>(null);

  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingCount, setLoadingCount] = useState(false);

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

  return (
    <Box p={6} borderRadius="lg" boxShadow="md" bg="white">
      <VStack align="stretch" gap={4}>
        <Heading size="md">Backend-Test</Heading>

        <HStack>
          <Button onClick={loadHealth} colorScheme="blue">
            Health prüfen
          </Button>
          {loadingHealth && <Spinner />}
        </HStack>

        <StatusBox title="Health" result={health} />

        <HStack>
          <Button onClick={loadCount} colorScheme="green">
            Buch-Count laden
          </Button>
          {loadingCount && <Spinner />}
        </HStack>

        <StatusBox title="Count" result={count} />
      </VStack>
    </Box>
  );
}