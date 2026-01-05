"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { AppLayout } from "@/components/AppLayout";
import { ErrorAlert } from "@/components/ErrorAlert";
import { BUCH_QUERY } from "@/graphql/operations";

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
    { variables: { id } }
  );

  const buch = data?.buch ?? null;

  return (
    <AppLayout title="Detail">
      <Stack gap={6}>
        <Heading size="lg">Buch-Detail</Heading>

        {error && <ErrorAlert description={error.message} />}
        {loading && <Text>Lade…</Text>}
        {!loading && !error && !buch && <Text>Nicht gefunden.</Text>}

        {buch && (
          <Box borderWidth="1px" rounded="lg" p={6}>
            <Text fontWeight="bold" mb={2}>
              {buch.titel?.titel ?? "(ohne Titel)"}
            </Text>
            <Text>Untertitel: {buch.titel?.untertitel ?? "-"}</Text>
            <Text>ISBN: {buch.isbn ?? "-"}</Text>
            <Text>Rating: {String(buch.rating ?? "-")}</Text>
            <Text>Art: {buch.art ?? "-"}</Text>
            <Text>Preis: {String(buch.preis ?? "-")}</Text>
            <Text>Lieferbar: {String(buch.lieferbar ?? "-")}</Text>
            <Text>Homepage: {buch.homepage ?? "-"}</Text>
            <Text>Rabatt: {String(buch.rabatt ?? "-")}</Text>
            <Text>Version: {String(buch.version ?? "-")}</Text>
            <Box mt={4}>
              <Text fontWeight="bold">Schlagwörter</Text>
              <Text>
                {Array.isArray(buch.schlagwoerter)
                  ? buch.schlagwoerter.join(", ")
                  : "-"}
              </Text>
            </Box>
          </Box>
        )}
      </Stack>
    </AppLayout>
  );
}
