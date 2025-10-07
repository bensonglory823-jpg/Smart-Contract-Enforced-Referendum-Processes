# 🗳️ Smart Contract-Enforced Referendum Processes

Welcome to a transparent and tamper-proof way to conduct referendums on the blockchain! This project enables communities, organizations, or governments to run secure voting processes using the Stacks blockchain, solving real-world issues like electoral fraud, lack of voter trust, and high administrative costs in traditional referendums.

## ✨ Features

🔒 Secure proposal creation and voting with cryptographic proofs  
🕒 Time-bound referendums with automatic start/end enforcement  
📊 Real-time vote tallying and immutable results  
👥 Voter registration and eligibility checks  
🤝 Vote delegation for flexible participation  
💰 Optional treasury integration for funding referendum outcomes  
🔍 Audit trails for full transparency  
🚫 Prevention of double-voting or unauthorized participation  

## 🛠 How It Works

This project is built with Clarity smart contracts on the Stacks blockchain, modularized into 8 interconnected contracts for scalability and security. It addresses real-world problems in democratic processes by ensuring every step—from proposal submission to result execution—is enforced on-chain, reducing manipulation risks and enabling global participation without intermediaries.

**For Proposal Creators**  
- Register as a user via the UserRegistry contract.  
- Submit a proposal through the ProposalFactory contract, including details like title, description, voting period, and required quorum.  
- If funding is needed, link it to the Treasury contract for automated disbursement upon approval.

**For Voters**  
- Verify eligibility and register via the VoterEligibility contract.  
- Acquire or stake voting tokens from the GovernanceToken contract.  
- Delegate votes if desired using the VoteDelegation contract.  
- Cast votes during the active period via the VotingMechanism contract.  

**For Verifiers and Executors**  
- Monitor progress with the ReferendumTracker contract.  
- View final results and audits through the ResultsAggregator contract.  
- Execute approved outcomes automatically via the ProposalExecutor contract (e.g., releasing funds or triggering on-chain actions).  

That's it! The blockchain handles enforcement, ensuring fair and verifiable referendums.

## 📜 Smart Contracts Overview

This project involves 8 Clarity smart contracts for a robust, decentralized system:

1. **UserRegistry.clar**: Handles user registration and identity verification to ensure only eligible participants can engage.  
2. **GovernanceToken.clar**: Manages ERC-20-like tokens used for voting weight (e.g., based on stake or community contribution).  
3. **ProposalFactory.clar**: Allows creation of new referendum proposals with parameters like duration, quorum, and description.  
4. **VoterEligibility.clar**: Checks and enforces voter qualifications (e.g., token holdings, residency proofs via oracles).  
5. **VotingMechanism.clar**: Core contract for casting, counting, and preventing invalid votes during the referendum window.  
6. **VoteDelegation.clar**: Enables users to delegate their voting power to others without transferring tokens.  
7. **ResultsAggregator.clar**: Tallies votes post-referendum, computes outcomes, and provides immutable audit logs.  
8. **ProposalExecutor.clar**: Automatically executes passed proposals, such as transferring funds from the Treasury or signaling off-chain actions.  
9. **ReferendumTracker.clar**: Tracks active referendums, timelines, and status updates for real-time querying.  
10. **Treasury.clar**: Optional contract for holding and disbursing funds tied to referendum outcomes (e.g., community grants).  

These contracts interact seamlessly: For example, VotingMechanism calls VoterEligibility to validate votes, and ResultsAggregator triggers ProposalExecutor upon success.

## 🚀 Getting Started

1. Install the Clarinet CLI for Clarity development.  
2. Clone this repo and deploy contracts to Stacks testnet.  
3. Use the provided scripts to simulate a referendum: Create a proposal, register voters, vote, and execute results.  

Protect democracy with blockchain—start building today!