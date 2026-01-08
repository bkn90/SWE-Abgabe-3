"use client";

import NextLink from "next/link";
import {
  Box,
  Button,
  Container,
  Heading,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";

export default function NoAccessPage() {
  return (
    <Box bg="gray.50" minH="100vh" py={10}>
      <Container maxW="lg">
        <Box bg="white" borderRadius="lg" boxShadow="md" p={8}>
          <VStack align="start" gap={3}>
            <Heading size="lg">Kein Zugriff</Heading>
            <Text color="gray.700">
              Du hast keine Berechtigung, diese Seite zu öffnen. (Nur Admin)
            </Text>

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
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
