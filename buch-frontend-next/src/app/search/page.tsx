"use client";

import React, { useMemo, useState } from "react";
import NextLink from "next/link";
import { useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Link,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { AppLayout } from "@/components/AppLayout";
import { ErrorAlert } from "@/components/ErrorAlert";
import { BUECHER_QUERY } from "@/graphql/operations";

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

type SuchparameterInput = {
  titel?: string;
  isbn?: string;
  rating?: number;
  art?: string;
  lieferbar?: boolean;
};

type BuecherQueryData = { buecher: Buch[] };

// ✅ WICHTIG: kein `| null` mehr, damit wir nicht aus Versehen null senden
type BuecherQueryVars = { suchparameter?: SuchparameterInput };

const PAGE_SIZE = 5;

// ⚠️ Passe diese Werte an dein Enum Art im Backend an
const ART_OPTIONS = ["", "HARDCOVER", "PAPERBACK", "EBOOK"];

const Select = chakra("select");

export default function SearchPage() {
  const [page, setPage] = useState(1);

  // Form-State (damit Query-Variablen stabil sind)
  const [filter, setFilter] = useState<{
    titel: string;
    isbn: string;
    rating: string;
    art: string;
    lieferbar: boolean;
  }>({
    titel: "",
    isbn: "",
    rating: "",
    art: "",
    lieferbar: false,
  });

  // ✅ Suchparameter bauen, aber NIE null senden.
  // Wenn leer: Property weglassen (undefined)
  const variables = useMemo<BuecherQueryVars>(() => {
    const sp: SuchparameterInput = {};

    const titel = filter.titel.trim();
    const isbn = filter.isbn.trim();
    const ratingStr = filter.rating.trim();
    const art = filter.art.trim();

    if (titel) sp.titel = titel;
    if (isbn) sp.isbn = isbn;

    if (ratingStr) {
      const parsed = Number(ratingStr);
      if (!Number.isNaN(parsed)) sp.rating = parsed;
    }

    if (art) sp.art = art;
    if (filter.lieferbar) sp.lieferbar = true;

    // ✅ leer => { } statt { suchparameter: null }
    return Object.keys(sp).length ? { suchparameter: sp } : {};
  }, [filter]);

  const { data, loading, error, refetch } = useQuery<
    BuecherQueryData,
    BuecherQueryVars
  >(BUECHER_QUERY, {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const buecher = data?.buecher ?? [];
  const total = buecher.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = buecher.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    const next = {
      titel: String(form.get("titel") ?? ""),
      isbn: String(form.get("isbn") ?? ""),
      rating: String(form.get("rating") ?? ""),
      art: String(form.get("art") ?? ""),
      lieferbar: form.get("lieferbar") ? true : false,
    };

    setPage(1);
    setFilter(next);

    // optional sofort refetch
    const sp: SuchparameterInput = {};
    const titel = next.titel.trim();
    const isbn = next.isbn.trim();
    const ratingStr = next.rating.trim();
    const art = next.art.trim();

    if (titel) sp.titel = titel;
    if (isbn) sp.isbn = isbn;

    if (ratingStr) {
      const parsed = Number(ratingStr);
      if (!Number.isNaN(parsed)) sp.rating = parsed;
    }

    if (art) sp.art = art;
    if (next.lieferbar) sp.lieferbar = true;

    // ✅ leer => {} statt null
    await refetch(Object.keys(sp).length ? { suchparameter: sp } : {});
  }

  return (
    <AppLayout title="Suche">
      <Stack gap={6}>
        <Heading size="lg">Suchformular</Heading>

        {error && <ErrorAlert description={error.message} />}

        <Box borderWidth="1px" rounded="lg" p={6}>
          <form onSubmit={onSubmit}>
            <Stack gap={4}>
              <Box>
                <Text mb={1}>Titel (Textfeld)</Text>
                <Input name="titel" defaultValue={filter.titel} />
              </Box>

              <Box>
                <Text mb={1}>ISBN (Textfeld)</Text>
                <Input name="isbn" defaultValue={filter.isbn} />
              </Box>

              <Box>
                <Text mb={1}>Rating</Text>
                <Input
                  name="rating"
                  type="number"
                  min={0}
                  max={5}
                  defaultValue={filter.rating}
                />
              </Box>

              <Box>
                <Text mb={1}>Art (Dropdown)</Text>
                <Select
                  name="art"
                  defaultValue={filter.art}
                  style={{
                    border: "1px solid",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                >
                  {ART_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v === "" ? "Alle" : v}
                    </option>
                  ))}
                </Select>
                <Text mt={1} fontSize="sm" opacity={0.8}>
                  Wenn hier ein GraphQL-Enum-Fehler kommt, ART_OPTIONS an dein Backend-Enum anpassen.
                </Text>
              </Box>

              <Box>
                <Text mb={1}>Lieferbar (Checkbox)</Text>
                <label>
                  <input
                    type="checkbox"
                    name="lieferbar"
                    defaultChecked={filter.lieferbar}
                  />{" "}
                  Nur lieferbare Bücher
                </label>
              </Box>

              <Box>
                <Text mb={1}>Radiobuttons (UI-Requirement)</Text>
                <HStack gap={6}>
                  <label>
                    <input type="radio" name="statusDemo" defaultChecked /> Alle
                  </label>
                  <label>
                    <input type="radio" name="statusDemo" /> Aktiv
                  </label>
                  <label>
                    <input type="radio" name="statusDemo" /> Inaktiv
                  </label>
                </HStack>
                <Text mt={1} fontSize="sm" opacity={0.8}>
                  (Demo, weil dein Backend keinen Status-Suchparameter hat.)
                </Text>
              </Box>

              <Box>
                <Text mb={1}>Checkboxen (UI-Requirement)</Text>
                <HStack gap={6} wrap="wrap">
                  <label>
                    <input type="checkbox" name="tagsDemo" value="JAVA" /> JAVA
                  </label>
                  <label>
                    <input type="checkbox" name="tagsDemo" value="TS" /> TYPESCRIPT
                  </label>
                  <label>
                    <input type="checkbox" name="tagsDemo" value="DB" /> DATABASE
                  </label>
                </HStack>
                <Text mt={1} fontSize="sm" opacity={0.8}>
                  (Demo, weil dein Backend Schlagwörter nicht im Suchparameter filtert.)
                </Text>
              </Box>

              <Button type="submit" colorScheme="teal" loading={loading}>
                Suchen
              </Button>
            </Stack>
          </form>
        </Box>

        <Box borderBottomWidth="1px" />

        <Heading size="md">Suchergebnis</Heading>

        {loading && <Text>Lade…</Text>}

        {!loading && total === 0 ? (
          <Text>Keine Treffer.</Text>
        ) : (
          <Box borderWidth="1px" rounded="lg" p={6}>
            <Stack gap={3}>
              {paged.map((b) => (
                <Box
                  key={b.id}
                  borderWidth="1px"
                  rounded="md"
                  p={4}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Text fontWeight="bold">{b.titel?.titel ?? "(ohne Titel)"}</Text>
                    <Text fontSize="sm">
                      ISBN: {b.isbn ?? "-"} · Rating: {String(b.rating ?? "-")} · Art:{" "}
                      {b.art ?? "-"}
                    </Text>
                    <Text fontSize="sm">
                      Lieferbar: {String(b.lieferbar ?? "-")} · Preis: {String(b.preis ?? "-")}
                    </Text>
                  </Box>

                  <Link
                    as={NextLink}
                    href={`/items/${b.id}`}
                    _hover={{ textDecoration: "none" }}
                  >
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </Link>
                </Box>
              ))}

              <HStack justify="space-between" pt={2}>
                <Text>
                  Seite {page} / {totalPages} (Total: {total})
                </Text>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Zurück
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Weiter
                  </Button>
                </HStack>
              </HStack>
            </Stack>
          </Box>
        )}
      </Stack>
    </AppLayout>
  );
}
