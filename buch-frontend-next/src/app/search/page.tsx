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
  rabatt?: string | null;
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

// Wichtig: kein null senden
type BuecherQueryVars = { suchparameter?: SuchparameterInput };

const PAGE_SIZE = 5;

// "" = Alle
const ART_OPTIONS = ["", "EPUB", "HARDCOVER", "PAPERBACK"];
const Select = chakra("select");

const INITIAL_FILTER = {
  titel: "",
  isbn: "",
  rating: "",
  art: "",
  lieferbar: false,
};

export default function SearchPage() {
  const [page, setPage] = useState(1);

  // Controlled form state
  const [filter, setFilter] = useState(INITIAL_FILTER);

  // Suchparameter bauen (ohne null)
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
  const safePage = Math.min(page, totalPages);
  const paged = buecher.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
    // variables kommen aus filter-state -> refetch triggert Suche
    await refetch(variables);
  }

  async function onReset() {
    setPage(1);
    setFilter(INITIAL_FILTER);
    // komplett ohne suchparameter => "alle Bücher" (oder Standard)
    await refetch({});
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
                <Text mb={1}>Titel</Text>
                <Input
                  name="titel"
                  value={filter.titel}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, titel: e.target.value }))
                  }
                />
              </Box>

              <Box>
                <Text mb={1}>ISBN</Text>
                <Input
                  name="isbn"
                  value={filter.isbn}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, isbn: e.target.value }))
                  }
                />
              </Box>

              <Box>
                <Text mb={1}>Rating</Text>
                <Input
                  name="rating"
                  type="number"
                  min={0}
                  max={5}
                  value={filter.rating}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, rating: e.target.value }))
                  }
                />
              </Box>

              <Box>
                <Text mb={1}>Art</Text>
                <Select
                  name="art"
                  value={filter.art}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, art: e.target.value }))
                  }
                  style={{
                    border: "1px solid",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                >
                  {ART_OPTIONS.map((v) => (
                    <option key={v || "ALL"} value={v}>
                      {v === "" ? "Alle" : v}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text mb={1}>Lieferbar</Text>
                <label>
                  <input
                    type="checkbox"
                    name="lieferbar"
                    checked={filter.lieferbar}
                    onChange={(e) =>
                      setFilter((f) => ({ ...f, lieferbar: e.target.checked }))
                    }
                  />{" "}
                  Nur lieferbare Bücher
                </label>
              </Box>

              <HStack>
                <Button type="submit" colorScheme="teal" loading={loading}>
                  Suchen
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onReset}
                  disabled={loading}
                >
                  Zurücksetzen
                </Button>
              </HStack>
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
                  gap={4}
                >
                  <Box>
                    <Text fontWeight="bold">
                      {b.titel?.titel ?? "(ohne Titel)"}
                    </Text>

                    <HStack fontSize="sm" color="gray.600" wrap="wrap" gap={2}>
                      <Text>ISBN: {b.isbn ?? "-"}</Text>
                      <Text>·</Text>

                      <HStack gap={2}>
                        <Text>Rating:</Text>
                        <StarRating value={b.rating} />
                      </HStack>

                      <Text>·</Text>
                      <Text>Art: {b.art ?? "-"}</Text>
                    </HStack>

                    <Text fontSize="sm">
                      Lieferbar: {String(b.lieferbar ?? "-")} · Preis:{" "}
                      {String(b.preis ?? "-")}
                      {" · "}Rabatt: {b.rabatt ?? "-"}
                    </Text>

                    {(b.homepage || (b.schlagwoerter?.length ?? 0) > 0) && (
                      <Text fontSize="sm">
                        {b.homepage ? `Homepage: ${b.homepage}` : ""}
                        {b.homepage && (b.schlagwoerter?.length ?? 0) > 0
                          ? " · "
                          : ""}
                        {(b.schlagwoerter?.length ?? 0) > 0
                          ? `Schlagwörter: ${b.schlagwoerter!.join(", ")}`
                          : ""}
                      </Text>
                    )}
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
                  Seite {safePage} / {totalPages} (Total: {total})
                </Text>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                  >
                    Zurück
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
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
