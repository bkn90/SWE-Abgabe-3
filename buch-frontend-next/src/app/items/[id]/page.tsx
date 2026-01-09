"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { AppLayout } from "@/components/AppLayout";
import { ErrorAlert } from "@/components/ErrorAlert";
import { BUCH_QUERY } from "@/graphql/operations";
import { StarRating } from "@/components/StarRating";

type Titel = { titel?: string | null; untertitel?: string | null };

type Buch = {
  id: string;
  isbn?: string | null;
  rating?: number | null;
  art?: string | null;
  preis?: number | null;
  lieferbar?: boolean | null;
  datum?: string | null;
  homepage?: string | null;
  schlagwoerter?: string[] | null;
  titel?: Titel | null;
  rabatt?: number | null;
  version?: number | null;
};

type BuchQueryData = { buch: Buch | null };
type BuchQueryVars = { id: string };

export default function BuchDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, loading, error } = useQuery<BuchQueryData, BuchQueryVars>(
    BUCH_QUERY,
    { variables: { id } },
  );

  const buch = data?.buch ?? null;

  return (
    <AppLayout title="Buchdetails">
      <Stack gap={6}>
        {error && <ErrorAlert description={error.message} />}
        {loading && <Text>Lade…</Text>}
        {!loading && !error && !buch && <Text>Nicht gefunden.</Text>}

        {buch && (
          <Box borderWidth="1px" borderRadius="xl" bg="white" p={{ base: 4, md: 6 }}>
            <Stack gap={3}>
              <Text fontWeight="bold" fontSize="lg">
                {buch.titel?.titel ?? "(ohne Titel)"}
              </Text>

              <Text color="gray.600">{buch.titel?.untertitel ?? "—"}</Text>

              <HStack>
                <Text fontWeight="semibold">Rating:</Text>
                <StarRating value={buch.rating} size="20px" />
              </HStack>

              <Text>ISBN: {buch.isbn ?? "-"}</Text>
              <Text>Art: {buch.art ?? "-"}</Text>
              <Text>Preis: {String(buch.preis ?? "-")}</Text>
              <Text>Lieferbar: {String(buch.lieferbar ?? "-")}</Text>
              <Text>Homepage: {buch.homepage ?? "-"}</Text>
              <Text>Rabatt: {String(buch.rabatt ?? "-")}</Text>
              <Text>Version: {String(buch.version ?? "-")}</Text>

              <Box>
                <Text fontWeight="semibold">Schlagwörter</Text>
                <Text color="gray.600">
                  {Array.isArray(buch.schlagwoerter)
                    ? buch.schlagwoerter.join(", ")
                    : "-"}
                </Text>
              </Box>
            </Stack>
          </Box>
        )}
      </Stack>
    </AppLayout>
  );
}