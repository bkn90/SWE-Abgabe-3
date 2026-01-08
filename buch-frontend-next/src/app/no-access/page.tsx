"use client";

import NextLink from "next/link";
import { Box, Button, Stack, Text, Link } from "@chakra-ui/react";
import { AppLayout } from "@/components/AppLayout";

export default function NoAccessPage() {
  return (
    <AppLayout title="Kein Zugriff">
      <Box
        borderWidth="1px"
        borderRadius="xl"
        bg="white"
        p={{ base: 4, md: 6 }}
      >
        <Stack gap={4}>
          <Text color="gray.700">
            Du hast keine Berechtigung, diese Seite zu öffnen. (Nur Admin)
          </Text>

          <Stack direction={{ base: "column", sm: "row" }} gap={3}>
            <Link as={NextLink} href="/" _hover={{ textDecoration: "none" }}>
              <Button colorScheme="teal">Zurück zum Dashboard</Button>
            </Link>

            <Link
              as={NextLink}
              href="/search"
              _hover={{ textDecoration: "none" }}
            >
              <Button variant="outline">Zur Suche</Button>
            </Link>
          </Stack>
        </Stack>
      </Box>
    </AppLayout>
  );
}
