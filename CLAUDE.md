# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal website (https://dorianko.ch): a React 19 + TypeScript 7 single-page app built with Vite, plus a Rust→WebAssembly simulation under `src/experiments/genetics_rust/wasm`.

## Commands

- `npm start` — Vite dev server (port 5173).
- `npm run build` — runs `tsc` (type check only, `noEmit`) then `vite build` into `dist/`.
- `npx tsc` — type check alone.
- Dev in Docker (preferred per README): `cd dev && docker compose up --build`. This builds the wasm package inside the image and mounts `src/`, `config/`, `public/` for live reload.
- Build the wasm package (required before `tsc`/build succeeds, since TS imports `../wasm/pkg/wasm`): `wasm-pack build --target web` inside `src/experiments/genetics_rust/wasm`. Needs the nightly toolchain pinned in `rust-toolchain` (`nightly-2023-09-23`) with `rust-src`; `.cargo/config` enables atomics/bulk-memory and `build-std`.

There is no test or lint script. The `jest` block in `package.json`, `.babelrc`, `config/` (webpack, jest transforms) and `scripts/` are leftovers from the old Create React App setup and are not used by the Vite build; jest is not installed and there are no test files.

## Architecture

- Entry: `index.html` → `src/index.tsx` → `src/pages/App.tsx`, which defines all routes with `react-router-dom` (`/` NewHome, `/cv`, `/projects`, `/gym-analysis`, `/sims/*`, plus experiment routes `/g`, `/gr`, `/a`, `/b`, `/oldhome`). Most routes are wrapped in `<React.StrictMode>`; the genetic sim routes deliberately are not.
- Styling: Bootstrap is loaded globally from `public/assets/` via `<link>`/`<script>` in `index.html` (so Bootstrap class names are used throughout), plus per-page CSS/SCSS. `src/bootstrapp/` is a vendored copy.
- `index.html` contains a Content-Security-Policy meta tag. Any new external origin (fetch, script, font, iframe) must be added there or it will be blocked. `unsafe-eval` is required by the mathjs-based `/sims/graph` page.
- p5.js visualizations: `src/sket.tsx` exports the p5 sketches (`sketch2` = n-body planet sim, `makeSketch(math)` = expression graph). `src/pages/Sims.tsx` renders them via lazily loaded `@p5-wrapper/react`, with mathjs dynamically imported.
- Genetic simulation exists twice:
  - `src/experiments/genetics/` — pure TS implementation (`/g`).
  - `src/experiments/genetics_rust/` — Rust port compiled to wasm (`/gr`). `WasmGeneticSim.tsx` spawns `GeneticWebWorker.tsx` as a module Web Worker (`new Worker(new URL(...), import.meta.url)`) and talks to it via Comlink; the worker loads the wasm `NodeManager` and returns node state per tick for p5 to draw.
- `vite.config.ts` sets COOP/COEP headers on the dev server (cross-origin isolation for SharedArrayBuffer/wasm threads).
- GitHub data: `ProjectsSection.tsx` and `CvPage.tsx` fetch from `api.github.com` client-side.
- `GymWorkoutAnalyzer.tsx` is a self-contained page that parses uploaded workout exports in the browser and charts them with ApexCharts.

## Deployment

The root `Dockerfile` builds the wasm package and the Vite app, downloads the latest `upload.zip` release from `dorian-K/gamejam-2026` into `dist/gamejam-2026`, and the final alpine stage copies `dist/` to `/out` at runtime (served by an external web server).
