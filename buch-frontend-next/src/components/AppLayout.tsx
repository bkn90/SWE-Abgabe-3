"use client";

import React, { useMemo, useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Drawer,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";

type NavItem = { label: string; href: string };
type Crumb = { label: string; href?: string };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") ?? localStorage.getItem("token");
}

function safeParseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isAdminFromToken(token: string | null): boolean {
  if (!token) return false;

  const payload = safeParseJwtPayload(token);
  if (!payload) return false;

  // realm_access.roles
  const realmAccess = payload["realm_access"];
  if (realmAccess && typeof realmAccess === "object") {
    const roles = (realmAccess as Record<string, unknown>)["roles"];
    if (Array.isArray(roles) && roles.includes("admin")) return true;
  }

  // resource_access["nest-client"].roles
  const resourceAccess = payload["resource_access"];
  if (resourceAccess && typeof resourceAccess === "object") {
    const client = (resourceAccess as Record<string, unknown>)["nest-client"];
    if (client && typeof client === "object") {
      const roles = (client as Record<string, unknown>)["roles"];
      if (Array.isArray(roles) && roles.includes("admin")) return true;
    }
  }

  return false;
}

// Active highlight auch bei Unterseiten:
// z.B. /items/123 -> "Suche" (oder Items) aktiv lassen
function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;

  if (href === "/search" && pathname.startsWith("/items/")) return true;

  return false;
}

function MenuIcon() {
  return (
    <Box as="span" display="inline-block" lineHeight={0}>
      <Box as="span" display="block" w="18px" h="2px" bg="currentColor" mb="4px" />
      <Box as="span" display="block" w="18px" h="2px" bg="currentColor" mb="4px" />
      <Box as="span" display="block" w="18px" h="2px" bg="currentColor" />
    </Box>
  );
}

function NavButtons({
  navItems,
  pathname,
  token,
  onLogout,
  onNavigate,
  variant = "desktop",
}: {
  navItems: NavItem[];
  pathname: string;
  token: string | null;
  onLogout: () => void;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}) {
  return (
    <Stack direction={variant === "desktop" ? "row" : "column"} gap={2}>
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            as={NextLink}
            href={item.href}
            _hover={{ textDecoration: "none" }}
            onClick={() => onNavigate?.()}
          >
            <Button
              w={variant === "mobile" ? "full" : undefined}
              size="sm"
              variant={active ? "solid" : variant === "mobile" ? "outline" : "ghost"}
              bg={active ? "teal.600" : undefined}
              color={active ? "white" : undefined}
              _hover={active ? { bg: "teal.700" } : undefined}
            >
              {item.label}
            </Button>
          </Link>
        );
      })}

      {token ? (
        <Button
          size="sm"
          w={variant === "mobile" ? "full" : undefined}
          variant={variant === "mobile" ? "solid" : "outline"}
          bg={variant === "mobile" ? "red.600" : undefined}
          color={variant === "mobile" ? "white" : undefined}
          _hover={variant === "mobile" ? { bg: "red.700" } : undefined}
          onClick={() => {
            onNavigate?.();
            onLogout();
          }}
        >
          Logout
        </Button>
      ) : (
        <Link
          as={NextLink}
          href="/login"
          _hover={{ textDecoration: "none" }}
          onClick={() => onNavigate?.()}
        >
          <Button
            size="sm"
            w={variant === "mobile" ? "full" : undefined}
            bg="teal.600"
            color="white"
            _hover={{ bg: "teal.700" }}
          >
            Login
          </Button>
        </Link>
      )}
    </Stack>
  );
}

function BreadcrumbsBar({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Flex
      wrap="wrap"
      gap={2}
      align="center"
      fontSize="sm"
      color="gray.600"
      mt={2}
    >
      {crumbs.map((c, i) => (
        <React.Fragment key={`${c.label}-${i}`}>
          {i > 0 ? <Text as="span">/</Text> : null}

          {c.href ? (
            <Link as={NextLink} href={c.href} color="teal.700" _hover={{ textDecoration: "underline" }}>
              {c.label}
            </Link>
          ) : (
            <Text as="span" color="gray.700" fontWeight="semibold">
              {c.label}
            </Text>
          )}
        </React.Fragment>
      ))}
    </Flex>
  );
}

function buildCrumbs(pathname: string): Crumb[] {
  // Beispiele:
  // "/" => Home
  // "/search" => Home / Suche
  // "/items/new" => Home / Bücher / Neu
  // "/items/123" => Home / Bücher / 123

  if (!pathname || pathname === "/") return [{ label: "Home", href: "/" }];

  const parts = pathname.split("/").filter(Boolean);

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];

  // Map für schöneren Text
  const labelMap: Record<string, string> = {
    search: "Suche",
    items: "Bücher",
    new: "Neu",
    login: "Login",
  };

  // Akkumulierte URL
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    acc += `/${seg}`;

    const label = labelMap[seg] ?? seg;

    // Letztes Element: kein Link
    const isLast = i === parts.length - 1;

    // IDs (z.B. 123) nicht unbedingt als Link, aber du kannst es ändern
    // Hier: Link nur, wenn nicht last und nicht "id"
    const looksLikeId = /^[0-9a-fA-F-]{6,}$/.test(seg) || /^[0-9]+$/.test(seg);

    crumbs.push({
      label,
      href: !isLast && !looksLikeId ? acc : undefined,
    });
  }

  return crumbs;
}

export function AppLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(() => getToken());
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = useMemo(() => isAdminFromToken(token), [token]);

  const navItems = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      { label: "Home", href: "/" },
      { label: "Suche", href: "/search" },
    ];
    if (isAdmin) base.push({ label: "Neu", href: "/items/new" });
    return base;
  }, [isAdmin]);

  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token");
    setToken(null);

    router.push("/login");
    router.refresh();
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Sticky Topbar */}
      <Box position="sticky" top={0} zIndex={10} bg="white" borderBottomWidth="1px">
        <Container maxW="container.lg" py={3}>
          <Flex align="center" gap={3}>
            {/* Brand */}
            <Link
              as={NextLink}
              href="/"
              _hover={{ textDecoration: "none" }}
              display="flex"
              alignItems="baseline"
              gap={2}
            >
              <Heading size="sm">Bücher</Heading>
              <Text fontSize="sm" color="gray.500">
                Frontend
              </Text>
            </Link>

            {/* Desktop Nav */}
            <Box display={{ base: "none", md: "block" }} ms="auto">
              <NavButtons
                navItems={navItems}
                pathname={pathname}
                token={token}
                onLogout={logout}
                variant="desktop"
              />
            </Box>

            {/* Mobile Hamburger */}
            <Box display={{ base: "block", md: "none" }} ms="auto">
              <IconButton aria-label="Menü öffnen" variant="outline" onClick={() => setMenuOpen(true)}>
                <MenuIcon />
              </IconButton>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Drawer */}
      <Drawer.Root open={menuOpen} onOpenChange={(e) => setMenuOpen(e.open)} placement="end">
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Menü</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <Button variant="outline" size="sm">
                  Schließen
                </Button>
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body>
              <Stack gap={4}>
                <Text fontSize="sm" color="gray.600">
                  Navigation
                </Text>
                <NavButtons
                  navItems={navItems}
                  pathname={pathname}
                  token={token}
                  onLogout={logout}
                  variant="mobile"
                  onNavigate={() => setMenuOpen(false)}
                />
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      {/* Content */}
      <Container maxW="container.lg" py={{ base: 6, md: 8 }}>
        <Heading size="lg">{title}</Heading>
        <BreadcrumbsBar crumbs={crumbs} />

        <Box mt={6}>{children}</Box>
      </Container>
    </Box>
  );
}
