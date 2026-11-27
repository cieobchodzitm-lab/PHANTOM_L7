# Berkeley Humanoid Lite × AGT R&D Integration Spec
## Project Management Document — Phantom Prototypy Series

**Document ID:** AGT-PM-BHL-HS-001  
**Version:** 1.0.0-draft  
**Date:** 2026-11-27  
**Status:** CONCEPT / ID_APPROVED pending CAD lock  
**Related:** HU-SAR (AGT-HS-148-CX), exo-skeleton integration, J1939 constraints (APPROVED)  

### Source References
- X post: https://x.com/oliviscusAI/status/2125961372559454527 (CAD video, Onshape model)
- Berkeley Humanoid Lite: https://github.com/HybridRobotics/berkeley-humanoid-lite
- Docs: https://berkeley-humanoid-lite.gitbook.io/docs
- Specs: ~0.8–1 m height, ~16 kg, 22 DOF, sub-$5k, modular 3D-printed cycloidal gearboxes, Onshape CAD → URDF/MJCF/USD

### Integration Goal
Adapt open-source BHL modular actuation and CAD pipeline into AGT Phantom Prototypy for humanoid/exo-skeleton support of HU-SAR tactical helmet system (UNARMED SAR). Maintain L0–L5 constitutional compliance.

### Key Technical Mapping
| Element | BHL | AGT Adaptation | Layer |
|---------|-----|----------------|-------|
| Actuators | 6512 / 5010 modular 3D-printed gearboxes | Evaluate for exo load-relief or auxiliary limbs; keep drone motors isolated | L0 / L1 |
| CAD | Onshape export to URDF/MJCF | Import relevant modules into AGT seed; annotate constitutional tags | L4 |
| Control | CAN-Bus, low-level, Isaac Lab policies | Apply L1-CAN-001/002 + approved J1939 constraints (crypto signature, actuator isolation) | L1 |
| Mass / Form | 16 kg full body | Exo interface ≤40 g on helmet dock; full system under operator-wearable constraints | L0 |
| Role | Research humanoid | UNARMED SPOT / SAR support only | L2 |

### Constraints (Locked)
- L0 keep-out for rotating mass (drone props unchanged).
- L1 cryptographic signature on critical frames / PGN; actuator isolation.
- CEO lock before any fab or field trial.
- No Pinky: every design change requires ConstitutionalAudit.

### Next Actions
1. Selective CAD import from Onshape links (actuators, interfaces).
2. Update seed/phantom-v1.json with new propositions if geometry changes.
3. L4 mini-audit on integrated model.
4. Skill iteration: extend agt-project-designer / agt-husar-board with BHL CAD reference mode.

**Constitutional Trace:** Proposition accepted for structured documentation. Evidence: public BHL sources + prior HU-SAR audits. Enforcement: pending CAD lock.
