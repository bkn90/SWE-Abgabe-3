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
  datum?: string | null;
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
const Range = chakra("input");

const rangeCss = {
  appearance: "none",
  height: "28px",
  cursor: "pointer",
  outline: "none",

  // Track unsichtbar (weil wir eigenen Track zeichnen)
  "&::-webkit-slider-runnable-track": {
    height: "4px",
    background: "transparent",
    borderRadius: "999px",
  },
  "&::-moz-range-track": {
    height: "4px",
    background: "transparent",
    borderRadius: "999px",
  },

  // Thumb
  "&::-webkit-slider-thumb": {
    appearance: "none",
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    background: "#2563EB",
    border: "2px solid white",
    boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
    marginTop: "-5px",
    position: "relative",
    zIndex: 2,
  },
  "&::-moz-range-thumb": {
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    background: "#2563EB",
    border: "2px solid white",
    boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
    position: "relative",
    zIndex: 2,
  },
} as const;

type SortKey = "TITLE_ASC" | "PRICE_ASC" | "PRICE_DESC" | "DATE_DESC";

const INITIAL_FILTER = {
  titel: "",
  isbn: "",
  rating: "",
  art: "",
  lieferbar: false,
};

const INITIAL_SORT: SortKey = "TITLE_ASC";

export default function SearchPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(INITIAL_FILTER);

  const [sort, setSort] = useState<SortKey>(INITIAL_SORT);

  // User-Inputs für Preisrange (nullable -> "Auto" aus Daten)
  const [priceMinInput, setPriceMinInput] = useState<number | null>(null);
  const [priceMaxInput, setPriceMaxInput] = useState<number | null>(null);

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

  // stabiler buecher-array
  const buecher = useMemo(() => data?.buecher ?? [], [data?.buecher]);

  // dynamische Bounds aus Daten
  const priceBounds = useMemo(() => {
    const prices = buecher
      .map((b) => b.preis)
      .filter((p): p is number => typeof p === "number" && Number.isFinite(p));

    if (prices.length === 0) return { min: 0, max: 0 };

    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));

    // Slider bedienbar halten
    if (min === max) return { min, max: max + 1 };
    return { min, max };
  }, [buecher]);

  // effektive Range
  const effectivePriceMin = useMemo(() => {
    const raw = priceMinInput ?? priceBounds.min;
    return Math.max(priceBounds.min, Math.min(raw, priceBounds.max));
  }, [priceMinInput, priceBounds.min, priceBounds.max]);

  const effectivePriceMax = useMemo(() => {
    const raw = priceMaxInput ?? priceBounds.max;
    return Math.max(priceBounds.min, Math.min(raw, priceBounds.max));
  }, [priceMaxInput, priceBounds.min, priceBounds.max]);

  // wenn min > max (z.B. durch Inputs), clampen wir für Filter
  const [rangeMin, rangeMax] = useMemo(() => {
    const a = effectivePriceMin;
    const b = effectivePriceMax;
    return a <= b ? [a, b] : [b, a];
  }, [effectivePriceMin, effectivePriceMax]);

  const filteredSorted = useMemo(() => {
    let arr = [...buecher];

    // Preisrange Filter
    arr = arr.filter((x) => {
      const p = x.preis ?? 0;
      return p >= rangeMin && p <= rangeMax;
    });

    switch (sort) {
      case "PRICE_ASC":
        arr.sort((a, b) => (a.preis ?? 0) - (b.preis ?? 0));
        break;
      case "PRICE_DESC":
        arr.sort((a, b) => (b.preis ?? 0) - (a.preis ?? 0));
        break;
      case "TITLE_ASC":
        arr.sort((a, b) =>
          (a.titel?.titel ?? "").localeCompare(b.titel?.titel ?? "", "de", {
            sensitivity: "base",
          }),
        );
        break;
      case "DATE_DESC":
        arr.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
        break;
    }

    return arr;
  }, [buecher, rangeMin, rangeMax, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filteredSorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    await refetch(variables);
  }

  async function onReset() {
    setPage(1);
    setFilter(INITIAL_FILTER);
    setSort(INITIAL_SORT);
    setPriceMinInput(null);
    setPriceMaxInput(null);
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
                onChange={(e) => {
                  setPage(1);
                  setFilter((f) => ({ ...f, titel: e.target.value }));
                }}
              />

              <Input
                placeholder="ISBN"
                value={filter.isbn}
                onChange={(e) => {
                  setPage(1);
                  setFilter((f) => ({ ...f, isbn: e.target.value }));
                }}
              />

              <Input
                type="number"
                min={0}
                max={5}
                placeholder="Rating (0–5)"
                value={filter.rating}
                onChange={(e) => {
                  setPage(1);
                  setFilter((f) => ({ ...f, rating: e.target.value }));
                }}
              />

              <Select
                value={filter.art}
                onChange={(e) => {
                  setPage(1);
                  setFilter((f) => ({ ...f, art: e.target.value }));
                }}
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
                  onChange={(e) => {
                    setPage(1);
                    setFilter((f) => ({
                      ...f,
                      lieferbar: e.target.checked,
                    }));
                  }}
                />{" "}
                Nur lieferbare Bücher
              </label>

              {/* Sortierung */}
              <Box>
                <Text fontWeight="semibold">Sortierung</Text>
                <Select
                  value={sort}
                  onChange={(e) => {
                    setPage(1);
                    setSort(e.target.value as SortKey);
                  }}
                >
                  <option value="TITLE_ASC">Alphabetisch (A–Z)</option>
                  <option value="PRICE_ASC">Preis (niedrig → hoch)</option>
                  <option value="PRICE_DESC">Preis (hoch → niedrig)</option>
                  <option value="DATE_DESC">Neueste zuerst</option>
                </Select>
              </Box>

              {/* Preisrange dynamisch (ohne useEffect) */}
              <Box>
                <Text fontWeight="semibold">Preis</Text>
                <Text fontSize="sm" color="gray.600">
                  €{rangeMin} – €{rangeMax} (aus {buecher.length} geladenen
                  Treffern)
                </Text>

                <Box position="relative" height="28px" mt={2}>
                  {/* Track (einmal) */}
                  <Box
                    position="absolute"
                    top="50%"
                    left={0}
                    right={0}
                    height="4px"
                    transform="translateY(-50%)"
                    bg="gray.300"
                    borderRadius="999px"
                  />

                  {/* Min thumb */}
                  <Range
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    value={effectivePriceMin}
                    onChange={(e) => {
                      setPage(1);
                      setPriceMinInput(Number(e.target.value));
                    }}
                    disabled={priceBounds.max === 0}
                    css={rangeCss}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "100%",
                      background: "transparent",
                    }}
                  />

                  {/* Max thumb */}
                  <Range
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    value={effectivePriceMax}
                    onChange={(e) => {
                      setPage(1);
                      setPriceMaxInput(Number(e.target.value));
                    }}
                    disabled={priceBounds.max === 0}
                    css={rangeCss}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "100%",
                      background: "transparent",
                    }}
                  />
                </Box>
              </Box>

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
                Seite {safePage} / {totalPages} · Treffer:{" "}
                {filteredSorted.length}
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
