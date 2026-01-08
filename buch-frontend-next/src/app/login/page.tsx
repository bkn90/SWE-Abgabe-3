"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Input, Stack, Text } from "@chakra-ui/react";
import { AppLayout } from "@/components/AppLayout";
import { ErrorAlert } from "@/components/ErrorAlert";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();

    if (!username || !password) {
      setErrorMsg("Bitte Benutzername und Passwort eingeben.");
      return;
    }

    try {
      setLoading(true);
      await login(username, password);
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login fehlgeschlagen.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="Login">
      <Stack gap={6} maxW="md">
        {errorMsg && <ErrorAlert description={errorMsg} />}

        <Box
          borderWidth="1px"
          borderRadius="xl"
          bg="white"
          p={{ base: 4, md: 6 }}
        >
          <form onSubmit={onSubmit}>
            <Stack gap={4}>
              <Box>
                <Text mb={1}>Benutzername</Text>
                <Input name="username" autoComplete="username" />
              </Box>

              <Box>
                <Text mb={1}>Passwort</Text>
                <Input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                />
              </Box>

              <Button type="submit" colorScheme="teal" loading={loading}>
                Einloggen
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </AppLayout>
  );
}
