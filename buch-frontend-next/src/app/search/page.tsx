"use client";

import React, { useMemo, useState } from "react";
import NextLink from "next/link";
import { useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  HStack,
  Input,
  Link,
  Separator,
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
  homepage?: string | null;
  schlagwoerter?: string[] | null;
  titel?: Titel | null;
  rabatt?: string | null;
};

type SuchparameterInput = {
  titel?: string;
  isbn?: string;
  rating?: number;
  art?: string;
  lieferbar?: boolean;
};

type BuecherQueryData = { buecher: Buch[] };
type BuecherQueryVars = { suchparameter?: SuchparameterInput };

const PAGE_SIZE = 10;
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
  const [filter, setFilter] = useState(INITIAL_FILTER);

  const variables = useMemo<BuecherQueryVars>(() => {
    const sp: SuchparameterInput = {};
    if (filter.titel.trim()) sp.titel = filter.titel.trim();
    if (filter.isbn.trim()) sp.isbn = filter.isbn.trim();

    if (filter.rating.trim()) {
      const r = Number(filter.rating);
      if (!Number.isNaN(r)) sp.rating = r;
    }

    if (filter.art) sp.art = filter.art;
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
  const totalPages = Math.max(1, Math.ceil(buecher.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = buecher.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    await refetch(variables);
  }

  async function onReset() {
    setPage(1);
    setFilter(INITIAL_FILTER);
    await refetch({});
  }

  return (
    <AppLayout title="Suche">
      <Stack gap={6}>
        {error && <ErrorAlert description={error.message} />}

        {/* Suchformular */}
        <Box
          borderWidth="1px"
          borderRadius="xl"
          bg="white"
          p={{ base: 4, md: 6 }}
        >
          <form onSubmit={onSubmit}>
            <Stack gap={4}>
              <Input
                placeholder="Titel"
                value={filter.titel}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, titel: e.target.value }))
                }
              />

              <Input
                placeholder="ISBN"
                value={filter.isbn}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, isbn: e.target.value }))
                }
              />

              <Input
                type="number"
                min={0}
                max={5}
                placeholder="Rating (0–5)"
                value={filter.rating}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, rating: e.target.value }))
                }
              />

              <Select
                value={filter.art}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, art: e.target.value }))
                }
              >
                {ART_OPTIONS.map((v) => (
                  <option key={v || "ALL"} value={v}>
                    {v === "" ? "Alle Arten" : v}
                  </option>
                ))}
              </Select>

              <label>
                <input
                  type="checkbox"
                  checked={filter.lieferbar}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      lieferbar: e.target.checked,
                    }))
                  }
                />{" "}
                Nur lieferbare Bücher
              </label>

              <HStack>
                <Button type="submit" colorScheme="teal" loading={loading}>
                  Suchen
                </Button>
                <Button variant="outline" onClick={onReset} disabled={loading}>
                  Zurücksetzen
                </Button>
              </HStack>
            </Stack>
          </form>
        </Box>

        <Separator />

        {/* Ergebnisse */}
        <Box
          borderWidth="1px"
          borderRadius="xl"
          bg="white"
          p={{ base: 4, md: 6 }}
        >
          <Stack gap={4}>
            {loading && <Text>Lade…</Text>}
            {!loading && paged.length === 0 && <Text>Keine Treffer.</Text>}

            {paged.map((b) => (
              <Box
                key={b.id}
                borderWidth="1px"
                borderRadius="lg"
                p={4}
                bg="gray.50"
                display="flex"
                justifyContent="space-between"
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

                  <Text fontSize="sm" color="gray.600">
                    Lieferbar: {String(b.lieferbar ?? "-")} · Preis:{" "}
                    {String(b.preis ?? "-")}
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

            <HStack justify="space-between">
              <Text>
                Seite {safePage} / {totalPages}
              </Text>
              <HStack>
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
      </Stack>
    </AppLayout>
  );
}
