"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { AppLayout } from "@/components/AppLayout";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function BuchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [buch, setBuch] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/buecher/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setBuch)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AppLayout title="Detail">
      <Stack gap={6}>
        <Heading size="lg">Buch-Detail</Heading>

        {error && <ErrorAlert description={error} />}
        {loading && <Text>Lade…</Text>}
        {!loading && !buch && <Text>Nicht gefunden.</Text>}

        {buch && (
          <Box borderWidth="1px" rounded="lg" p={6}>
            <Text fontWeight="bold">{buch.titel?.titel}</Text>
            <Text>ISBN: {buch.isbn}</Text>
            <Text>Preis: {buch.preis}</Text>
          </Box>
        )}
      </Stack>
    </AppLayout>
  );
}
