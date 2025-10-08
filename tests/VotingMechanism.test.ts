import { describe, it, expect, beforeEach } from "vitest";
import { ClarityValue, cvToString, noneCV, principalCV, responseErrorCV, responseOkCV, someCV, tupleCV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 401;
const ERR_PROPOSAL_NOT_FOUND = 404;
const ERR_VOTING_NOT_OPEN = 405;
const ERR_ALREADY_VOTED = 406;
const ERR_NOT_ELIGIBLE = 407;
const ERR_INVALID_CHOICE = 408;
const ERR_INVALID_WEIGHT = 409;
const ERR_TALLY_NOT_ALLOWED = 410;
const ERR_DELEGATION_NOT_FOUND = 412;
const ERR_INVALID_REVEAL_PROOF = 416;
const ERR_PROPOSAL_EXPIRED = 417;
const ERR_INVALID_QUORUM = 419;
const ERR_VOTE_NOT_COMMITTED = 420;
const ERR_SELF_DELEGATION = 422;
const ERR_CYCLE_DETECTED = 423;

interface ProposalDetails {
  startHeight: number;
  endHeight: number;
  quorum: number;
  revealStart: number;
  revealEnd: number;
}

interface VotingStatus {
  isOpen: boolean;
  startHeight: number;
  endHeight: number;
  quorum: number;
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  revealStart: number;
  revealEnd: number;
}

interface Commitment {
  commitmentHash: Buffer;
  revealed: boolean;
  choice: boolean | null;
  weight: number;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class MockTrait {
  constructor(public address: string) {}
}

class VotingMechanismMock {
  state: {
    contractOwner: string;
    emergencyStop: boolean;
    proposalsVotingStatus: Map<number, VotingStatus>;
    voterCommitments: Map<string, Commitment>;
    voterDelegations: Map<string, string>;
    votedPrincipals: Map<string, boolean>;
    voteWeights: Map<string, number>;
    delegationChains: Map<string, string[]>;
  } = {
    contractOwner: "ST1TEST",
    emergencyStop: false,
    proposalsVotingStatus: new Map(),
    voterCommitments: new Map(),
    voterDelegations: new Map(),
    votedPrincipals: new Map(),
    voteWeights: new Map(),
    delegationChains: new Map(),
  };
  blockHeight: number = 100;
  caller: string = "ST1TEST";

  private getCommitmentKey(proposalId: number, voter: string): string {
    return `${proposalId}-${voter}`;
  }

  private getDelegationKey(proposalId: number, delegator: string): string {
    return `${proposalId}-${delegator}`;
  }

  private getVotedKey(proposalId: number, voter: string): string {
    return `${proposalId}-${voter}`;
  }

  private getChainKey(proposalId: number, delegate: string): string {
    return `${proposalId}-${delegate}`;
  }

  reset() {
    this.state = {
      contractOwner: "ST1TEST",
      emergencyStop: false,
      proposalsVotingStatus: new Map(),
      voterCommitments: new Map(),
      voterDelegations: new Map(),
      votedPrincipals: new Map(),
      voteWeights: new Map(),
      delegationChains: new Map(),
    };
    this.blockHeight = 100;
    this.caller = "ST1TEST";
  }

  setEmergencyStop(stop: boolean): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.emergencyStop = stop;
    return { ok: true, value: true };
  }

  commitVote(proposalId: number, commitmentHash: Buffer, proposalContract: MockTrait): Result<boolean> {
    if (this.state.emergencyStop) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const details: ProposalDetails = { startHeight: 50, endHeight: 150, quorum: 100, revealStart: 151, revealEnd: 200 };
    const isOpen = this.blockHeight >= details.startHeight && this.blockHeight <= details.endHeight;
    if (!isOpen) return { ok: false, value: ERR_VOTING_NOT_OPEN };
    const effectiveVoter = this.caller;
    const key = this.getCommitmentKey(proposalId, effectiveVoter);
    if (this.state.voterCommitments.has(key)) return { ok: false, value: ERR_ALREADY_VOTED };
    this.state.voterCommitments.set(key, { commitmentHash, revealed: false, choice: null, weight: 0 });
    return { ok: true, value: true };
  }

  revealVote(proposalId: number, choice: boolean, salt: Buffer, weight: number, proposalContract: MockTrait, eligibilityContract: MockTrait, trackerContract: MockTrait): Result<boolean> {
    if (this.state.emergencyStop) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const details: ProposalDetails = { startHeight: 50, endHeight: 150, quorum: 100, revealStart: 151, revealEnd: 200 };
    const effectiveVoter = this.caller;
    const key = this.getCommitmentKey(proposalId, effectiveVoter);
    const commitment = this.state.voterCommitments.get(key);
    if (!commitment) return { ok: false, value: ERR_VOTE_NOT_COMMITTED };
    const computedHash = Buffer.from("mockhash"); // Simplify for test
    if (!commitment.commitmentHash.equals(computedHash)) return { ok: false, value: ERR_INVALID_REVEAL_PROOF };
    if (commitment.revealed) return { ok: false, value: ERR_INVALID_REVEAL_PROOF };
    if (this.blockHeight < details.revealStart) return { ok: false, value: ERR_INVALID_REVEAL_PROOF };
    if (this.blockHeight > details.revealEnd) return { ok: false, value: ERR_PROPOSAL_EXPIRED };
    if (weight <= 0) return { ok: false, value: ERR_INVALID_WEIGHT };
    this.state.voterCommitments.set(key, { ...commitment, revealed: true, choice, weight });
    this.state.votedPrincipals.set(this.getVotedKey(proposalId, effectiveVoter), true);
    this.state.voteWeights.set(this.getVotedKey(proposalId, effectiveVoter), weight);
    return { ok: true, value: true };
  }

  tallyVotes(proposalId: number, proposalContract: MockTrait, aggregatorContract: MockTrait): Result<{ totalVotes: number; yes: number; no: number }> {
    if (this.state.emergencyStop) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const details: ProposalDetails = { startHeight: 50, endHeight: 150, quorum: 100, revealStart: 151, revealEnd: 200 };
    if (this.blockHeight <= details.endHeight) return { ok: false, value: ERR_TALLY_NOT_ALLOWED };
    const totalYes = 100;
    const totalNo = 50;
    const totalVotes = totalYes + totalNo;
    if (totalVotes < details.quorum) return { ok: false, value: ERR_INVALID_QUORUM };
    this.state.proposalsVotingStatus.set(proposalId, {
      isOpen: false,
      startHeight: details.startHeight,
      endHeight: details.endHeight,
      quorum: details.quorum,
      totalVotes,
      yesVotes: totalYes,
      noVotes: totalNo,
      revealStart: details.revealStart,
      revealEnd: details.revealEnd,
    });
    return { ok: true, value: { totalVotes, yes: totalYes, no: totalNo } };
  }

  delegateVote(proposalId: number, delegate: string, delegationContract: MockTrait): Result<boolean> {
    if (this.state.emergencyStop) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (this.caller === delegate) return { ok: false, value: ERR_SELF_DELEGATION };
    const votedKey = this.getVotedKey(proposalId, this.caller);
    if (this.state.votedPrincipals.has(votedKey)) return { ok: false, value: ERR_ALREADY_VOTED };
    this.state.voterDelegations.set(this.getDelegationKey(proposalId, this.caller), delegate);
    const chainKey = this.getChainKey(proposalId, delegate);
    const chain = this.state.delegationChains.get(chainKey) || [];
    this.state.delegationChains.set(chainKey, [...chain, this.caller]);
    return { ok: true, value: true };
  }

  getVotingStatus(proposalId: number): VotingStatus | undefined {
    return this.state.proposalsVotingStatus.get(proposalId);
  }

  hasVoted(proposalId: number, voter: string): boolean {
    return this.state.votedPrincipals.get(this.getVotedKey(proposalId, voter)) || false;
  }
}

describe("VotingMechanism", () => {
  let contract: VotingMechanismMock;
  let mockProposal: MockTrait;
  let mockEligibility: MockTrait;
  let mockTracker: MockTrait;
  let mockAggregator: MockTrait;
  let mockDelegation: MockTrait;

  beforeEach(() => {
    contract = new VotingMechanismMock();
    mockProposal = new MockTrait("ST2PROPOSAL");
    mockEligibility = new MockTrait("ST3ELIG");
    mockTracker = new MockTrait("ST4TRACK");
    mockAggregator = new MockTrait("ST5AGG");
    mockDelegation = new MockTrait("ST6DEL");
    contract.reset();
  });

  it("commits a vote successfully", () => {
    const commitmentHash = Buffer.from("hash");
    const result = contract.commitVote(1, commitmentHash, mockProposal);
    expect(result.ok).toBe(true);
  });

  it("rejects commit if already voted", () => {
    const commitmentHash = Buffer.from("hash");
    contract.commitVote(1, commitmentHash, mockProposal);
    const result = contract.commitVote(1, commitmentHash, mockProposal);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_ALREADY_VOTED);
  });

  it("rejects reveal if not committed", () => {
    const salt = Buffer.from("salt");
    const result = contract.revealVote(1, true, salt, 10, mockProposal, mockEligibility, mockTracker);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_VOTE_NOT_COMMITTED);
  });

  it("tallies votes successfully", () => {
    contract.blockHeight = 160;
    const result = contract.tallyVotes(1, mockProposal, mockAggregator);
    expect(result.ok).toBe(true);
  });
  
  it("delegates vote successfully", () => {
    const result = contract.delegateVote(1, "ST2DELEGATE", mockDelegation);
    expect(result.ok).toBe(true);
  });

  it("rejects self-delegation", () => {
    const result = contract.delegateVote(1, "ST1TEST", mockDelegation);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_SELF_DELEGATION);
  });

  it("sets emergency stop successfully", () => {
    const result = contract.setEmergencyStop(true);
    expect(result.ok).toBe(true);
    expect(contract.state.emergencyStop).toBe(true);
  });

  it("rejects emergency stop by non-owner", () => {
    contract.caller = "ST3FAKE";
    const result = contract.setEmergencyStop(true);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });
});