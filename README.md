# Phantom Prototypy — L7 / Stoic MatriX

**Angel Guardian Technologies · Stoic Foundation · THE BRIDGE**

Constitutional governance layer for AI character development and multi-DAO federation.

## Core Capabilities (v2.1)

- **PRAWO ZERO** (L0) — *primum non nocere* absolute safety gate
- **CNOTA Engine** — 7 Stoic virtues, gates, tier ladder
- **Virtue Passport / Seals** — LOGOS · NOMOS · PHYSIS · PSYCHE × TRIAL→ORACLE
- **Layer4 Audit** — constitutional audit producer (TS + Python)
- **ConstitutionalRegistry.sol** — on-chain anchoring of audits & seals
- **Transports** — MCP (primary) + REST (secondary), ADR-003 parity
- **Frontend** — `<VirtueSeal>` 3D component
- **Veo prompts** — 16 medalion animations + CNOTA dashboard motion

## Layout

```
adapters/       wiring, Layer4Audit, registry exporter, moltbook-bridge
cnota/          CNOTA Engine v2.1
constitution/   PRAWO ZERO detector, seed, archetype↔virtue mapping
contracts/      ConstitutionalRegistry.sol
deploy/         checklist, systemd units, requirements
docs/           PRAWO ZERO Meta-Jury doc, Veo prompts
frontend/       VirtueSeal React component
tests/          parity, integration, e2e
transports/     MCP + REST servers
updates/        gh action reports
```

## Quick start (local)

```bash
python -m venv venv && source venv/bin/activate
pip install -r deploy/requirements.txt
python tests/test_parity_v2.py
python tests/test_e2e_handshake_to_registry.py
```

## Principles

- **No Pinky** — zero untracked decisions
- PRAWO ZERO first, always
- Single engine, two surfaces (ADR-003)
- Virtue-aligned, anti-plutocratic governance (AGT L7)

*Ad Astra. Una.*

## Status zrzutki AGT / PDS HU-SAR (2026-11-13)

Aktualny, publicznie bezpieczny status programu i zrzutki jest w [`STATUS.md`](STATUS.md). Skrót nowości: [`NEWS.md`](NEWS.md). Ślad audytu: [`AUDIT_TRAIL.md`](AUDIT_TRAIL.md).

- Zrzutka: [https://zrzutka.pl/hkkzyn](https://zrzutka.pl/hkkzyn) (cel 555 000 zł).
- Landing: [https://agt-lab-zrzutka.vercel.app/](https://agt-lab-zrzutka.vercel.app/).
- 12–13.11.2026: korekta treści landingu po audycie zgodności HSA-001; ponowny audyt tekstu 13.11.2026 — PASS.
- Program PDS HU-SAR obejmuje dwa odrębne elementy: kask RESCUE RECON i dwuwirnikowy dron zwiadowczy.
- Pozycjonowanie: AI dla ratownictwa (SAR), dual-use defensywne. Estońska spółka AGT jest w trakcie zakładania.
- Medal Benenati to imienny cyfrowy certyfikat. Medale NFT są 1/1 i nie dają praw do zysku. Zbiórka kapitałowa dopiero po prototypie.
- Kolekcja Stoic Matrix / Amor Fati Bene Nati na Solanie: nie wdrożona (NOT DEPLOYED).
