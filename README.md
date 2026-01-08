# Buchverwaltung – SWE Abgabe 3

**Single Page Application (SPA)** zur Verwaltung von Büchern mit **Login**, **Suche**, **Detailansicht** und **Neuanlage**.
Frontend und Backend sind sauber getrennt und kommunizieren über **GraphQL**.

## Inhaltsverzeichnis

* [Überblick](#-überblick)
* [Funktionale Features](#-funktionale-features)
* [Technologie-Stack](#-technologie-stack)
* [Architektur](#-architektur)
* [Installation & Start](#-installation--start)

  * [Voraussetzungen](#1-voraussetzungen)
  * [Backend starten (Docker)](#2-backend-starten-docker)
  * [Frontend starten](#3-frontend-starten)
* [Rollen & Berechtigungen](#-rollen--berechtigungen)
* [HTTPS](#-https)
* [Codequalität](#-codequalität)
* [Zustandsdiagramm](#-zustandsdiagramm)
* [Figma Design](#-figma-design)
* [Bekannte Einschränkungen](#-bekannte-einschränkungen)

## Überblick

Diese Anwendung ist eine **moderne Buchverwaltungs-SPA**, umgesetzt mit:

* **Next.js (App Router)**
* **Chakra UI (v3)**
* **GraphQL (Apollo Server im Backend)**
* **Keycloak (OAuth2 / OpenID Connect)**
* **Docker / Docker Compose**

## Funktionale Features

**Login**

* Anmeldung über Keycloak
* Fehlerhandling bei falschen Zugangsdaten

**Suchformular**

* Textfelder
* Dropdown
* Radiobuttons
* Checkboxen

**Suchergebnis**

* Ergebnisliste mit Pagination
* Fehleranzeige bei leeren Treffern

**Detailansicht**

* Anzeige aller Buchdaten

**Neu anlegen (Admin)**

* Formular mit Validierung
* ISBN-Validierung im Backend
* Fehler- und Erfolgsmeldungen

**Routing**

* `/login`
* `/search`
* `/items/[id]`
* `/items/new`
* `/` (Dashboard)

**GraphQL-Client**

* Alle fachlichen Datenzugriffe erfolgen über **GraphQL**

## Technologie-Stack

### Frontend

* **Next.js 16 (App Router)**
* **TypeScript**
* **Chakra UI v3**
* **pnpm**
* **ESLint + Prettier**

### Backend

* **NestJS**
* **GraphQL (Apollo Server)**
* **Keycloak**
* **PostgreSQL**
* **Docker / Docker Compose**

## Architektur

```
Browser
  │
  │ HTTPS
  ▼
Frontend (Next.js)
  │
  │ GraphQL
  ▼
Backend (NestJS + Apollo)
  │
  ├─ PostgreSQL
  └─ Keycloak
```

## Installation & Start

### 1. Voraussetzungen

* Docker & Docker Compose
* Node.js ≥ 18
* pnpm
* Git

### 2. Backend starten (Docker)

#### Start:

```bash
cd backend/.extras/compose/buch
docker compose up
```

#### Health-Check:

```bash
https://localhost:3000/health/liveness
```

### 3. Frontend starten

```bash
cd buch-frontend-next
pnpm install
pnpm run dev
```

Frontend läuft unter:

```
http://localhost:3001
```

## Rollen & Berechtigungen

| Rolle     | Rechte                                            |
| --------- | ------------------------------------------------- |
| **admin** | Suche, Detailansicht, **Buch anlegen**, Dashboard |
| **user**  | Suche, Detailansicht, Dashboard                   |
| **alle**  | Login, Logout                                     |

Rollen werden aus dem **JWT (Keycloak)** gelesen.

## HTTPS

* Backend läuft mit **HTTPS (self-signed Zertifikat)**
* Frontend nutzt HTTPS über Proxy / API-Routen
* Für Entwicklung ist `NODE_TLS_REJECT_UNAUTHORIZED=0` konfiguriert

## Codequalität

**pnpm**
**ESLint**
**Prettier**
Einheitliche **LF Line Endings**
Keine `any`-Typen
TypeScript strikt typisiert

## Zustandsdiagramm

Ein **Zustandsdiagramm (PlantUML)** beschreibt:

* Nicht eingeloggt
* Login erfolgreich / fehlgeschlagen
* User- vs. Admin-Zugriff
* Suche
* Detailansicht
* Neuanlage (Admin)
* Logout

Datei:

```text
docs/zustandsdiagramm.plantuml
```

## Figma Design

Das UI-Konzept wurde zusätzlich in **Figma** modelliert:

* Login
* Dashboard
* Suche
* Detailansicht
* Neuanlage

Figma dient als **visuelle Ergänzung**, nicht als Implementationsvorgabe.

## Bekannte Einschränkungen

* Self-signed Zertifikate nur für Entwicklung
* Frontend-Dockerisierung optional (lokal mit pnpm empfohlen)
