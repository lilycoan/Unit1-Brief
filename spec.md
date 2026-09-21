# Technical Specification

> EDITING DIRECTIVE: USER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE USER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Define what the completed project must do so it can be planned, built, and verified.

## Instructions for the user

Translate the approved research into a specification without distorting its evidence, limitations, or uncertainty. Direct the work toward the intended result, judge gaps and trade-offs rather than accepting invented requirements, and approve only a complete, testable specification grounded in the research.

## Instructions for the agent

Read AGENTS.md, brief.md, research.md, and this file. Begin with a concise orientation and one focused question.

Guide the specification one feature at a time. Help turn approved decisions into precise requirements and surface gaps or trade-offs without inventing requirements or making product decisions. Draft concise updates for review, focus on the intended result rather than implementation steps, and never approve the specification on the user's behalf.

## Goal

State what the completed project should accomplish for its intended audience.

## Features

For each feature, define:

- the need it addresses and intended audience outcome
- its behavior, inputs, and outputs
- its calculations, supporting evidence, and uncertainty
- its interface expectations and acceptance checks

## User approval

Review the completed specification directly and explicitly approve it before planning begins. The agent cannot complete this approval on the user's behalf.

## Out of scope

Record ideas that will not be part of this project.

## Revisions

If implementation changes the intended result, update the specification and record what changed and why.

## Commands

### Start specification

User: Open the project repository as your workspace, start a fresh chat, and type `start specification`.

### Save transcript

Agent: After the user approves the specification, remind them that the transcript is a deliverable and ask them to say `save transcript`. Wait for that direction.

When the user directs the agent to save the transcript, the agent saves the entire conversation in the `transcripts/` directory as `spec-YYYY-MM-DD_HHMMSS.md`, marks user and agent responses clearly, and confirms the saved relative path.
