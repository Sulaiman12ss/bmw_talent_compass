# BMW Talent Compass - Multi-Agent Implementation TODO

## Phase 1: Database Schema Refactoring
- [ ] Update schema with Job, Candidate, JobRequirement tables
- [ ] Add Agent tables (JDAgentOutput, CVAgentOutput, ScenarioAgentOutput, LeadershipAgentOutput)
- [ ] Create DecisionRecommendation table for storing final outputs
- [ ] Add Scenario table with context definitions
- [ ] Create migration and apply to database

## Phase 2: Agent Implementation
- [ ] Implement JD Agent (requirement parsing and priority extraction)
- [ ] Implement CV Agent (candidate scoring and ranking)
- [ ] Implement Scenario Agent (dynamic re-ranking based on context)
- [ ] Implement Leadership Agent (trait profiling and team dynamics)
- [ ] Implement Decision Agent (synthesis and recommendation generation)
- [ ] Create agent orchestration layer
- [ ] Write unit tests for each agent
- [ ] Create agent service in server/agents/

## Phase 3: Frontend UI - Decision Flow
- [ ] Create JobInput page for entering job requirements
- [ ] Create CandidateInput page for uploading candidate profiles
- [ ] Create DecisionFlow page showing multi-agent pipeline
- [ ] Build ScenarioSelector component for context selection
- [ ] Create RankingVisualization component with charts
- [ ] Build TradeOffComparison component
- [ ] Create RecommendationDetail modal
- [ ] Add navigation between decision flow pages

## Phase 4: Demo Scenario & Testing
- [ ] Create seed data for "Speed vs. Right Hire" use case
- [ ] Add 5 realistic candidate profiles (Alice, Bob, Carol, David, Eve)
- [ ] Create VP Engineering job requirement
- [ ] Define 3 scenarios (Transformation, Continuity, Crisis)
- [ ] Test end-to-end agent pipeline
- [ ] Verify agent outputs are correct
- [ ] Test scenario re-ranking logic
- [ ] Create demo walkthrough documentation

## Phase 5: Demo Video & Submission
- [ ] Record 3-minute demo video (0:00-0:20 Problem, 0:20-0:50 Input, 0:50-2:20 Live Demo, 2:20-2:50 AI/Agents, 2:50-3:00 Business Value)
- [ ] Prepare GitHub repository with README
- [ ] Test Lovable app link accessibility
- [ ] Verify working execution (local + deployed)
- [ ] Create submission checklist
- [ ] Submit to hackathon

## Implementation Details

### Agent Responsibilities

**JD Agent**
- Input: Job description, context
- Process: Parse requirements, extract competencies, identify priorities
- Output: Structured job profile with weighted criteria

**CV Agent**
- Input: Candidate profiles, job profile
- Process: Score each candidate against criteria, rank by fit
- Output: Ranked candidate list with fit scores

**Scenario Agent**
- Input: Ranked candidates, scenario context
- Process: Re-evaluate priorities based on scenario, re-rank
- Output: Scenario-specific rankings with rationale

**Leadership Agent**
- Input: Candidate profiles, leadership traits
- Process: Profile leadership style, assess team fit, model pairing effects
- Output: Leadership assessment + team dynamics analysis

**Decision Agent**
- Input: All agent outputs
- Process: Synthesize recommendations, explain trade-offs, present options
- Output: Final recommendation with transparent reasoning

### Demo Scenario: Speed vs. Right Hire

**Company Context**: BMW facing EV transition, need VP Engineering urgently

**Job**: VP Engineering - EV Platform
- Timeline: 2 weeks to hire
- Key Requirements:
  - EV/Battery expertise (30%)
  - AI/ML capability (25%)
  - Team leadership (25%)
  - Execution speed (20%)

**Candidates**:
1. Alice - 15 years automotive, 5 years EV, led team of 50, collaborative
2. Bob - 12 years tech, 2 years automotive, led team of 100, directive
3. Carol - 10 years manufacturing, 1 year automotive, no EV
4. David - 8 years EV startups, 2 years automotive, led team of 30, entrepreneurial
5. Eve - 14 years traditional automotive, no EV, strong execution

**Scenarios**:
1. Transformation Crisis (EV expertise weight: 40%)
2. Automotive Continuity (Traditional expertise weight: 35%)
3. Supply Chain Crisis (Execution speed weight: 35%)

### API Endpoints

- `POST /api/trpc/decision.analyzeJob` - Trigger JD Agent
- `POST /api/trpc/decision.scoreCandidate` - Trigger CV Agent
- `POST /api/trpc/decision.simulateScenario` - Trigger Scenario Agent
- `POST /api/trpc/decision.assessLeadership` - Trigger Leadership Agent
- `POST /api/trpc/decision.synthesizeRecommendation` - Trigger Decision Agent
- `GET /api/trpc/decision.getDecisionFlow` - Get full pipeline results

### Frontend Routes

- `/decision` - Main decision flow page
- `/decision/job-input` - Job requirement input
- `/decision/candidate-input` - Candidate profile input
- `/decision/analysis` - View agent outputs
- `/decision/scenario` - Scenario selector and re-ranking
- `/decision/recommendation` - Final recommendation

### Testing Strategy

- Unit tests for each agent
- Integration tests for orchestration
- End-to-end tests for full pipeline
- Demo scenario validation
- UI component tests

### Success Criteria

✅ All 5 agents implemented and working
✅ Multi-agent orchestration functioning correctly
✅ Frontend UI intuitive and responsive
✅ Demo scenario runs end-to-end
✅ Agent outputs are explainable and transparent
✅ 3-minute demo video recorded and clear
✅ GitHub repository complete with README
✅ Lovable app link publicly accessible


## Phase 10: BMW HR KPI Integration

### KPI Data Model & Schema
- [ ] Add HR KPI tables to database schema (time_to_fill, quality_of_hire, internal_external_ratio, leadership_compatibility, scenario_rankings, mis_hire_costs, skill_gaps)
- [ ] Generate synthesized KPI data for all 7 BMW-specific KPIs
- [ ] Create KPI historical tracking tables for feedback loops
- [ ] Add candidate-KPI relationship tables for correlation analysis

### KPI-Enhanced Agent Logic
- [ ] Update JD Agent to incorporate skill gap index and future-critical competencies
- [ ] Enhance CV Agent to consider quality of hire metrics and internal mobility rates
- [ ] Extend Scenario Agent to model time-to-fill trade-offs and cost-of-mis-hire impacts
- [ ] Add Leadership Compatibility Agent to assess pairing effects on team outcomes
- [ ] Implement Skill Evolution Agent to track emerging competency requirements

### UI & Reporting
- [ ] Add KPI dashboard showing 7 key metrics for current role
- [ ] Display candidate compatibility matrix (leadership pairing analysis)
- [ ] Show scenario-adjusted rankings with KPI impact projections
- [ ] Add cost-of-mis-hire calculator and risk assessment
- [ ] Create skill gap visualization and development recommendations

### Testing & Validation
- [ ] Verify synthesized KPI data is realistic and BMW-aligned
- [ ] Test agent decision-making with KPI inputs
- [ ] Validate KPI-informed recommendations against business logic
- [ ] End-to-end testing with full KPI integration


## Phase 11: Dynamic Data Management for BMW HR Users
- [ ] Create job management UI (create, edit, delete jobs)
- [ ] Create candidate management UI (add, edit, delete candidates)
- [ ] Create scenario management UI (define custom scenarios)
- [ ] Implement auto-generation of KPI data for new entries
- [ ] Build search and filter functionality
- [ ] Add data import/export capabilities
- [ ] Create job and candidate library views
- [ ] Test full end-to-end workflow with multiple jobs and candidates

## Phase 12: Critical Gap Fixes (User Feedback)
- [x] Fix 1: Leadership Agent circular logic - add currentTeam/BMW leaders table, ground compatibility in real pairings
- [x] Fix 2: Make KPI metrics AI-generated (mis-hire cost, quality-of-hire) with transparent formulas instead of pre-seeded
- [x] Fix 3: Dynamic weight generation - JD Agent derives base weights from job text, Scenario Agent overrides with reasoning
- [x] Fix 4: Scenario comparison UI - side-by-side ranking table showing same candidates across different scenarios
- [x] Fix 5: CHRO-ready executive summary in Decision Agent output (3-4 sentence actionable brief)
- [x] Fix 6: Enrich candidate profiles with automotive-executive fields (plantScaleExperience, evProgramCredential, boardExposure, etc.)

## Phase 13: CV Parsing Flow (PDF Upload → Structured Profile)
- [x] Add CV Parser Agent in agents.ts (PDF text → structured candidate JSON via LLM)
- [x] Add file upload endpoint (/api/parse-cv with multer + pdf-parse v2)
- [x] Schema already has structured achievements, careerTrajectory, rawSummary fields from Phase 12
- [x] Build CV upload UI with drag-and-drop on candidate creation screen
- [x] Build parsed result review/edit-before-save UI with confidence indicators (inferred vs stated)
- [x] Show yellow highlight on inferred fields (leadershipStyle, careerTrajectory) vs stated fields (name, role)
- [x] Write vitest tests for CV Parser Agent (19 tests in cv-parser.test.ts)

## Bug Fixes
- [x] Fix: Unterminated string in JSON at position 112600 - LLM agent response too long, gets truncated mid-parse
- [x] Fix: Text truncation in analysis results - skill names, reasoning, titles cut off with "..."
  - [x] Remove/relax aggressive server-side cap() limits in decision-router.ts
  - [x] Fix frontend CSS so all text wraps and displays fully (no overflow hidden, no text-ellipsis)
  - [x] Ensure skill gap analysis shows full skill names
  - [x] Ensure reasoning sections show complete text

## Phase 14: Six Priority Fixes
- [x] Fix 1: Agent step progress indicator in DecisionFlow.tsx (vertical stepper, per-agent timing)
- [x] Fix 2: Persist agent outputs to 5 DB tables after each agent call (non-blocking inserts)
- [x] Fix 3: Optimize compareScenarios - Phase 1 shared (JD+CV+Leadership), Phase 2 per-scenario (Scenario+Decision)
- [x] Fix 4: Protect mutations with protectedProcedure (createJob, createCandidate, createScenario, analyzeDecision, compareScenarios)
- [x] Fix 5: Reduce Scenario Agent anchoring - restructure prompt, add weightDeviationExplanation field and UI
- [x] Fix 6: BMW Leader Management UI tab in AdminManagement (edit/add leaders, updateBmwLeader + createBmwLeader mutations)
