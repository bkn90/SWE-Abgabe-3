"use client";

import { Container, Box, Heading } from "@chakra-ui/react";
import { BackendTest } from "../components/BackendTest";

export default function Page() {
  return (
    <Box bg="gray.50" minH="100vh" py={10}>
      <Container maxW="3xl">
        <Heading mb={6}>Buch Frontend (Next + Chakra)</Heading>
        <BackendTest />
      </Container>
    </Box>
  );
}