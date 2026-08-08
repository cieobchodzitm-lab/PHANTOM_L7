/**
 * adapters/moltbook-bridge.ts
 * PHANTOM PROTOTYPY — Angel Guardian Technologies
 * ConstitutionalHandshakeProtocol for Moltbook agents (v1.9.0)
 * 
 * FULL APPROVED on virtue-seal-nft-v1 | trace: visual-audit-260725
 * Integrates Virtue Seals (LOGOS/NOMOS/PHYSIS/PSYCHE × TRIAL/BENENATI/SAGE/ORACLE)
 * with Stoic MatriX Gamification + ConstitutionalRegistry.sol
 */

export type Archetype = 'LOGOS' | 'NOMOS' | 'PHYSIS' | 'PSYCHE';
export type Tier = 'TRIAL' | 'BENENATI' | 'SAGE' | 'ORACLE';

export interface ConstitutionalFingerprint {
  constitutionId: string;
  activePropositions: string[];
  constitutionVersion: string;
  agentClass: string;
  scope: string[];
  layerClaims: number[];
}

export interface VirtuePassport {
  agentId: string;
  stage: 'UNTRUSTED' | 'PROVISIONAL' | 'TRUSTED';
  archetype: Archetype;
  tier: Tier;
  virtueScore: number;
  auditCoverageRatio: number;
  imageURI: string;
  sealHash: string;
  constitutionId: string;
}

const VISUALS: Record<Archetype, Record<Tier, string>> = {
  LOGOS: { TRIAL: 'logos-trial.png', BENENATI: 'logos-benenati.png', SAGE: 'logos-sage.png', ORACLE: 'logos-oracle.png' },
  NOMOS: { TRIAL: 'nomos-trial.png', BENENATI: 'nomos-benenati.png', SAGE: 'nomos-sage.png', ORACLE: 'nomos-oracle.png' },
  PHYSIS: { TRIAL: 'physis-trial.png', BENENATI: 'physis-benenati.png', SAGE: 'physis-sage.png', ORACLE: 'physis-oracle.png' },
  PSYCHE: { TRIAL: 'psyche-trial.png', BENENATI: 'psyche-benenati.png', SAGE: 'psyche-sage.png', ORACLE: 'psyche-oracle.png' }
};

export class MoltbookBridge {
  private passports = new Map<string, VirtuePassport>();

  async constitutionalHandshake(agentId: string, fp: ConstitutionalFingerprint): Promise<VirtuePassport> {
    if (!fp.constitutionId) throw new Error('INVALID_FINGERPRINT');
    const invalid = fp.scope.filter(s => !['reflection','gamification','governance','virtue-passport'].includes(s));
    if (invalid.length) throw new Error('SCOPE_CREEP: ' + invalid.join(','));

    const existing = this.passports.get(agentId);
    const stage = existing ? (existing.virtueScore > 70 ? 'TRUSTED' : 'PROVISIONAL') : 'UNTRUSTED';
    const archetype = this.pickArchetype(fp.activePropositions);
    const virtueScore = Math.min(100, fp.activePropositions.length * 15 + fp.layerClaims.length * 5);
    const coverage = Math.min(1, 0.5 + fp.layerClaims.length / 10);
    const tier = virtueScore > 85 ? 'ORACLE' : virtueScore > 65 ? 'SAGE' : virtueScore > 40 ? 'BENENATI' : 'TRIAL';

    const passport: VirtuePassport = {
      agentId,
      stage,
      archetype,
      tier,
      virtueScore,
      auditCoverageRatio: parseFloat(coverage.toFixed(2)),
      imageURI: VISUALS[archetype][tier],
      sealHash: '0x' + Buffer.from(`${agentId}:${archetype}:${tier}:${Date.now()}`).toString('hex').slice(0, 64),
      constitutionId: fp.constitutionId
    };

    this.passports.set(agentId, passport);
    return passport;
  }

  private pickArchetype(props: string[]): Archetype {
    const p = props.join(' ').toLowerCase();
    if (p.includes('logos') || p.includes('reason')) return 'LOGOS';
    if (p.includes('nomos') || p.includes('law') || p.includes('order')) return 'NOMOS';
    if (p.includes('physis') || p.includes('nature')) return 'PHYSIS';
    if (p.includes('psyche') || p.includes('soul') || p.includes('mind')) return 'PSYCHE';
    return 'LOGOS';
  }

  getPassport(agentId: string): VirtuePassport | null {
    return this.passports.get(agentId) || null;
  }
}

export default MoltbookBridge;
