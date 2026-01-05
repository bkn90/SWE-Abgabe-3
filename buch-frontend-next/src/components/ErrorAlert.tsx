"use client";

import React from "react";
import { Box, Text } from "@chakra-ui/react";

export function ErrorAlert({
  title = "Fehler",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <Box borderWidth="1px" borderColor="red.400" bg="red.50" p={4} rounded="md">
      <Text fontWeight="bold" mb={1}>
        {title}
      </Text>
      <Text>{description}</Text>
    </Box>
  );
}
