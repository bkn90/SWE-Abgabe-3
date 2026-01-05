"use client";

import React from "react";
import NextLink from "next/link";
import { Box, Button, Container, Flex, HStack, Heading, Link } from "@chakra-ui/react";

export function AppLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }

  return (
    <Box>
      <Box borderBottomWidth="1px">
        <Container maxW="container.lg" py={4}>
          <Flex align="center" justify="space-between">
            <Heading size="md">{title}</Heading>

            <HStack gap={3}>
              <Link as={NextLink} href="/search" _hover={{ textDecoration: "none" }}>
                <Button variant="ghost" size="sm">Suche</Button>
              </Link>

              <Link as={NextLink} href="/items/new" _hover={{ textDecoration: "none" }}>
                <Button variant="ghost" size="sm">Neu</Button>
              </Link>

              <Button onClick={logout} variant="outline" size="sm">
                Logout
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.lg" py={8}>
        {children}
      </Container>
    </Box>
  );
}
