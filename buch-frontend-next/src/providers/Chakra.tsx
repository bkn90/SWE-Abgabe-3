"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { system } from "../theme/system";

export function Chakra({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}