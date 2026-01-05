"use client";

import React, { useMemo } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { ApolloProvider } from "@apollo/client/react";
import { makeApolloClient } from "@/graphql/client";
import { system } from "@/theme/system";
import { ClientOnly } from "@/components/ClientOnly";

export function Providers({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => makeApolloClient(), []);

  return (
    <ClientOnly>
      <ApolloProvider client={client}>
        <ChakraProvider value={system}>{children}</ChakraProvider>
      </ApolloProvider>
    </ClientOnly>
  );
}
