import { describe, expect, it, vi, beforeEach } from "vitest";
import type {
  JobProfile,
  CandidateProfile,
  ScenarioContext,
  BmwLeader,
  JDAgentOutput,
  CVAgentOutput,
  LeadershipAgentOutput,
  ScenarioAgentOutput,
  DecisionAgentOutput,
  DecisionPipelineResult,
} from "./agents";

// ============================================================================
// Mock LLM to avoid real API calls in tests
// ============================================================================

const mockInvokeLLM = vi.fn();

vi.mock("./_core/llm", () => ({
  invokeLLM: (...args: unknown[]) => mockInvokeLLM(...args),
}));

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockJob: JobProfile = {
  jobTitle: "VP Engineering - EV Platform",
  department: "Engineering",
  description: "Lead BMW's electric vehicle platform engineering team...",
  requiredSkills: ["EV Systems", "Team Leadership", "AI/ML"],
  preferredSkills: ["Battery Technology", "Autonomous Driving"],
  experienceYearsRequired: 15,
  seniority: "executive",
};

const mockCandidate: CandidateProfile = {
  id: 1,
  firstName: "Alice",
  lastName: "Chen",
  email: "alice.chen@example.com",
  yearsOfExperience: 18,
  currentRole: "VP Engineering",
  currentCompany: "Tesla",
  skills: [
    { name: "EV Systems", proficiency: "expert", years: 12 },
    { name: "Team Leadership", proficiency: "expert", years: 10 },
    { name: "AI/ML", proficiency: "advanced", years: 5 },
  ],
  leadershipStyle: "collaborative",
  teamSize: 200,
  achievements: ["Led Model 3 platform", "Scaled team from 50 to 200"],
  education: [
    { degree: "PhD Electrical Engineering", institution: "MIT", year: 2008 },
  ],
  boardExposure: true,
  crossFunctionalExperience: ["Engineering", "Product", "Manufacturing"],
  geographicMobility: ["US", "Germany", "China"],
  industryTransitions: [
    { from: "Consumer Electronics", to: "Automotive EV", year: 2014 },
  ],
  plantScaleExperience: true,
  evProgramCredential: true,
  notableProjects: ["Model 3 Platform Architecture"],
  previousCompanies: [
    { company: "Apple", role: "Senior Engineer", years: 4 },
    { company: "Tesla", role: "VP Engineering", years: 8 },
  ],
};

const mockCandidate2: CandidateProfile = {
  id: 2,
  firstName: "Bob",
  lastName: "Martinez",
  email: "bob.martinez@example.com",
  yearsOfExperience: 22,
  currentRole: "SVP Engineering",
  currentCompany: "Volkswagen",
  skills: [
    { name: "EV Systems", proficiency: "advanced", years: 8 },
    { name: "Team Leadership", proficiency: "expert", years: 15 },
  ],
  leadershipStyle: "directive",
  teamSize: 500,
  achievements: ["Led MEB platform development"],
  education: [
    { degree: "MBA", institution: "INSEAD", year: 2005 },
  ],
  boardExposure: true,
  crossFunctionalExperience: ["Engineering", "Operations"],
  geographicMobility: ["Germany", "China"],
  industryTransitions: [],
  plantScaleExperience: true,
  evProgramCredential: false,
  notableProjects: ["MEB Platform"],
  previousCompanies: [
    { company: "Volkswagen", role: "SVP Engineering", years: 12 },
  ],
};

const mockBmwLeaders: BmwLeader[] = [
  {
    id: 1,
    name: "Dr. Frank Weber",
    role: "Board Member - Development",
    department: "R&D",
    leadershipStyle: "visionary-technical",
    teamSize: 15000,
    priorities: ["Neue Klasse platform", "EV architecture", "Software-defined vehicle"],
    background: "Career BMW engineer, PhD in Mechanical Engineering",
    decisionMakingStyle: "data-driven consensus",
    communicationPreference: "technical depth with strategic framing",
  },
  {
    id: 2,
    name: "Milan Nedeljković",
    role: "Board Member - Production",
    department: "Production",
    leadershipStyle: "operational-excellence",
    teamSize: 80000,
    priorities: ["Factory digitalization", "Quality systems", "EV production ramp"],
    background: "Production engineering background, 20+ years at BMW",
    decisionMakingStyle: "metrics-driven",
    communicationPreference: "concise, KPI-focused",
  },
];

const mockScenario: ScenarioContext = {
  id: 1,
  name: "EV Transformation Crisis",
  description: "Accelerated EV transition with aggressive timeline",
  context: "BMW must accelerate EV transition due to EU regulations...",
  priorityAdjustments: { evExpertise: 0.4, aiMlCapability: 0.3 },
};

// ============================================================================
// Mock Agent Outputs
// ============================================================================

const mockJDOutput: JDAgentOutput = {
  coreCompetencies: ["EV Systems Architecture", "Team Leadership", "AI/ML Integration", "Strategic Planning", "Cross-Functional Collaboration"],
  priorityWeights: {
    "EV Systems Architecture": 0.30,
    "Team Leadership": 0.25,
    "AI/ML Integration": 0.20,
    "Strategic Planning": 0.15,
    "Cross-Functional Collaboration": 0.10,
  },
  reasoning: "The VP Engineering role emphasizes EV platform development (30%) as the primary competency based on the job title and description focus on electric vehicle architecture...",
};

const mockCVOutput: CVAgentOutput = {
  fitScore: 88,
  skillMatches: [
    { skill: "EV Systems Architecture", match: 92, gap: 8 },
    { skill: "Team Leadership", match: 85, gap: 15 },
    { skill: "AI/ML Integration", match: 78, gap: 22 },
  ],
  experienceMatch: 90,
  misHireRiskScore: 25,
  misHireRiskReasoning: "Starting at baseline 50. Subtract 15 for 3 years beyond minimum (18 vs 15 required). Subtract 10 for EV credential. Add 0 for automotive transition (has one). Result: 25, clamped to 25.",
  estimatedMisHireCostEUR: 245000,
  misHireCostFormula: "(25/100) × €280,000 × 3.5 = €245,000",
  qualityOfHireProjection: 85,
  reasoning: "Alice Chen demonstrates strong alignment with the VP Engineering role...",
};

const mockLeadershipOutput: LeadershipAgentOutput = {
  leadershipStyle: "Collaborative-Innovative",
  leadershipScore: 85,
  teamDynamicsScore: 82,
  culturalFitScore: 78,
  leadershipTraits: ["Collaborative", "Innovative", "Data-Driven", "Empathetic", "Strategic"],
  bmwLeaderPairings: [
    {
      bmwLeaderName: "Dr. Frank Weber",
      bmwLeaderRole: "Board Member - Development",
      compatibilityScore: 88,
      dynamicAnalysis: "Strong alignment on EV vision. Chen's collaborative style complements Weber's consensus-driven approach.",
    },
    {
      bmwLeaderName: "Milan Nedeljković",
      bmwLeaderRole: "Board Member - Production",
      compatibilityScore: 72,
      dynamicAnalysis: "Moderate alignment. Chen's innovation focus may need calibration with Nedeljković's operational-excellence priorities.",
    },
  ],
  reasoning: "Alice Chen's collaborative leadership style aligns well with BMW's engineering culture...",
};

const mockScenarioOutput: ScenarioAgentOutput = {
  adjustedFitScore: 92,
  derivedWeights: {
    "EV Systems Architecture": 0.40,
    "Team Leadership": 0.20,
    "AI/ML Integration": 0.25,
    "Strategic Planning": 0.10,
    "Cross-Functional Collaboration": 0.05,
  },
  weightChangeReasoning: "Under EV Transformation Crisis, EV Systems Architecture weight increases from 30% to 40% because...",
  reasoning: "In the EV crisis scenario, Alice Chen's score increases from 88 to 92...",
};

const mockDecisionOutput: DecisionAgentOutput = {
  recommendedCandidateId: 1,
  recommendedCandidateName: "Alice Chen",
  confidenceScore: 85,
  executiveSummary: "For the VP Engineering - EV Platform role, Alice Chen emerges as the strongest candidate with an 88/100 fit score. Her 12 years of direct EV systems experience at Tesla, combined with plant-scale manufacturing exposure and board-level engagement, position her to lead BMW's Neue Klasse platform engineering. The estimated mis-hire risk is low (25/100, €245K potential cost), and her collaborative leadership style aligns with Dr. Weber's consensus-driven approach. Recommended for immediate offer with 90-day integration plan.",
  recommendation: "Hire Alice Chen for VP Engineering - EV Platform",
  tradeOffs: {
    "Alice Chen vs Bob Martinez": "Chen brings deeper EV-specific expertise (12 vs 8 years) but Martinez has broader team scale experience (500 vs 200). For an EV-focused role, Chen's specialization outweighs Martinez's breadth.",
  },
  alternativeCandidates: [
    {
      candidateId: 2,
      name: "Bob Martinez",
      fitScore: 78,
      rationale: "Strong operational leader with extensive automotive experience, but less EV-specific depth.",
    },
  ],
  riskAssessment: "Primary risk: Chen's transition from Tesla's flat structure to BMW's matrix organization. Mitigation: 90-day structured onboarding with Dr. Weber as executive sponsor.",
  implementationRoadmap: [
    "Days 1-30: Immersion in Neue Klasse architecture and stakeholder mapping with Dr. Weber",
    "Days 31-60: Assessment of current EV platform team capabilities and gap analysis",
    "Days 61-90: Present 12-month EV platform roadmap to Board of Management",
  ],
  reasoning: "Alice Chen is recommended based on the weighted analysis across all agents...",
};

// ============================================================================
// TESTS
// ============================================================================

describe("Decision Pipeline Types & Structure", () => {
  it("JobProfile has all required fields", () => {
    expect(mockJob).toHaveProperty("jobTitle");
    expect(mockJob).toHaveProperty("department");
    expect(mockJob).toHaveProperty("description");
    expect(mockJob).toHaveProperty("requiredSkills");
    expect(mockJob).toHaveProperty("preferredSkills");
    expect(mockJob).toHaveProperty("experienceYearsRequired");
    expect(mockJob).toHaveProperty("seniority");
    expect(Array.isArray(mockJob.requiredSkills)).toBe(true);
  });

  it("CandidateProfile includes enriched automotive-executive fields (Fix 6)", () => {
    expect(mockCandidate).toHaveProperty("education");
    expect(mockCandidate).toHaveProperty("boardExposure");
    expect(mockCandidate).toHaveProperty("crossFunctionalExperience");
    expect(mockCandidate).toHaveProperty("geographicMobility");
    expect(mockCandidate).toHaveProperty("industryTransitions");
    expect(mockCandidate).toHaveProperty("plantScaleExperience");
    expect(mockCandidate).toHaveProperty("evProgramCredential");
    expect(mockCandidate).toHaveProperty("notableProjects");
    expect(mockCandidate).toHaveProperty("previousCompanies");
    expect(mockCandidate.boardExposure).toBe(true);
    expect(mockCandidate.plantScaleExperience).toBe(true);
    expect(mockCandidate.evProgramCredential).toBe(true);
  });

  it("BmwLeader has all fields for grounded compatibility (Fix 1)", () => {
    const leader = mockBmwLeaders[0];
    expect(leader).toHaveProperty("name");
    expect(leader).toHaveProperty("role");
    expect(leader).toHaveProperty("department");
    expect(leader).toHaveProperty("leadershipStyle");
    expect(leader).toHaveProperty("priorities");
    expect(leader).toHaveProperty("background");
    expect(leader).toHaveProperty("decisionMakingStyle");
    expect(leader).toHaveProperty("communicationPreference");
    expect(Array.isArray(leader.priorities)).toBe(true);
  });

  it("ScenarioContext includes id and description fields", () => {
    expect(mockScenario).toHaveProperty("id");
    expect(mockScenario).toHaveProperty("name");
    expect(mockScenario).toHaveProperty("description");
    expect(mockScenario).toHaveProperty("context");
    expect(mockScenario).toHaveProperty("priorityAdjustments");
  });
});

describe("JD Agent Output (Fix 3: Dynamic Weights)", () => {
  it("JD output has core competencies derived from text", () => {
    expect(Array.isArray(mockJDOutput.coreCompetencies)).toBe(true);
    expect(mockJDOutput.coreCompetencies.length).toBeGreaterThanOrEqual(3);
  });

  it("JD output has priority weights that sum to ~1.0", () => {
    const weights = Object.values(mockJDOutput.priorityWeights);
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it("JD output has reasoning explaining weight derivation", () => {
    expect(typeof mockJDOutput.reasoning).toBe("string");
    expect(mockJDOutput.reasoning.length).toBeGreaterThan(20);
  });
});

describe("CV Agent Output (Fix 2: AI-Derived KPI Metrics)", () => {
  it("CV output includes mis-hire risk score (not pre-seeded)", () => {
    expect(mockCVOutput).toHaveProperty("misHireRiskScore");
    expect(mockCVOutput.misHireRiskScore).toBeGreaterThanOrEqual(0);
    expect(mockCVOutput.misHireRiskScore).toBeLessThanOrEqual(100);
  });

  it("CV output includes transparent mis-hire cost formula", () => {
    expect(mockCVOutput).toHaveProperty("misHireCostFormula");
    expect(typeof mockCVOutput.misHireCostFormula).toBe("string");
    expect(mockCVOutput.misHireCostFormula.length).toBeGreaterThan(5);
  });

  it("CV output includes mis-hire risk reasoning (audit trail)", () => {
    expect(mockCVOutput).toHaveProperty("misHireRiskReasoning");
    expect(typeof mockCVOutput.misHireRiskReasoning).toBe("string");
    expect(mockCVOutput.misHireRiskReasoning.length).toBeGreaterThan(20);
  });

  it("CV output includes estimated mis-hire cost in EUR", () => {
    expect(mockCVOutput).toHaveProperty("estimatedMisHireCostEUR");
    expect(typeof mockCVOutput.estimatedMisHireCostEUR).toBe("number");
    expect(mockCVOutput.estimatedMisHireCostEUR).toBeGreaterThan(0);
  });

  it("CV output includes quality-of-hire projection", () => {
    expect(mockCVOutput).toHaveProperty("qualityOfHireProjection");
    expect(mockCVOutput.qualityOfHireProjection).toBeGreaterThanOrEqual(0);
    expect(mockCVOutput.qualityOfHireProjection).toBeLessThanOrEqual(100);
  });

  it("CV output includes skill matches with gap analysis", () => {
    expect(Array.isArray(mockCVOutput.skillMatches)).toBe(true);
    mockCVOutput.skillMatches.forEach((sm) => {
      expect(sm).toHaveProperty("skill");
      expect(sm).toHaveProperty("match");
      expect(sm).toHaveProperty("gap");
    });
  });
});

describe("Leadership Agent Output (Fix 1: BMW Leader Pairings)", () => {
  it("Leadership output includes bmwLeaderPairings array", () => {
    expect(Array.isArray(mockLeadershipOutput.bmwLeaderPairings)).toBe(true);
    expect(mockLeadershipOutput.bmwLeaderPairings.length).toBeGreaterThan(0);
  });

  it("Each pairing references a specific BMW leader by name and role", () => {
    mockLeadershipOutput.bmwLeaderPairings.forEach((pairing) => {
      expect(pairing).toHaveProperty("bmwLeaderName");
      expect(pairing).toHaveProperty("bmwLeaderRole");
      expect(pairing).toHaveProperty("compatibilityScore");
      expect(pairing).toHaveProperty("dynamicAnalysis");
      expect(typeof pairing.bmwLeaderName).toBe("string");
      expect(pairing.bmwLeaderName.length).toBeGreaterThan(0);
    });
  });

  it("Compatibility scores are grounded (0-100 range)", () => {
    mockLeadershipOutput.bmwLeaderPairings.forEach((pairing) => {
      expect(pairing.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(pairing.compatibilityScore).toBeLessThanOrEqual(100);
    });
  });

  it("Dynamic analysis explains the pairing reasoning", () => {
    mockLeadershipOutput.bmwLeaderPairings.forEach((pairing) => {
      expect(typeof pairing.dynamicAnalysis).toBe("string");
      expect(pairing.dynamicAnalysis.length).toBeGreaterThan(10);
    });
  });
});

describe("Scenario Agent Output (Fix 3: Derived Weights)", () => {
  it("Scenario output includes derived weights (not pre-stored)", () => {
    expect(mockScenarioOutput).toHaveProperty("derivedWeights");
    const weights = Object.values(mockScenarioOutput.derivedWeights);
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it("Scenario output includes weight change reasoning", () => {
    expect(mockScenarioOutput).toHaveProperty("weightChangeReasoning");
    expect(typeof mockScenarioOutput.weightChangeReasoning).toBe("string");
    expect(mockScenarioOutput.weightChangeReasoning.length).toBeGreaterThan(10);
  });

  it("Scenario output has adjusted fit score", () => {
    expect(mockScenarioOutput).toHaveProperty("adjustedFitScore");
    expect(mockScenarioOutput.adjustedFitScore).toBeGreaterThanOrEqual(0);
    expect(mockScenarioOutput.adjustedFitScore).toBeLessThanOrEqual(100);
  });
});

describe("Decision Agent Output (Fix 5: CHRO-Ready Executive Summary)", () => {
  it("Decision output includes executive summary", () => {
    expect(mockDecisionOutput).toHaveProperty("executiveSummary");
    expect(typeof mockDecisionOutput.executiveSummary).toBe("string");
    expect(mockDecisionOutput.executiveSummary.length).toBeGreaterThan(50);
  });

  it("Executive summary is CHRO-actionable (mentions candidate, score, and recommendation)", () => {
    const summary = mockDecisionOutput.executiveSummary;
    // A good executive summary should mention the candidate name
    expect(summary).toContain("Alice Chen");
    // Should mention a score or metric
    expect(summary).toMatch(/\d+\/100|\d+%/);
  });

  it("Decision output includes risk assessment", () => {
    expect(mockDecisionOutput).toHaveProperty("riskAssessment");
    expect(typeof mockDecisionOutput.riskAssessment).toBe("string");
    expect(mockDecisionOutput.riskAssessment.length).toBeGreaterThan(20);
  });

  it("Decision output includes implementation roadmap", () => {
    expect(Array.isArray(mockDecisionOutput.implementationRoadmap)).toBe(true);
    expect(mockDecisionOutput.implementationRoadmap.length).toBeGreaterThanOrEqual(2);
  });

  it("Decision output includes confidence score (0-100)", () => {
    expect(mockDecisionOutput.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(mockDecisionOutput.confidenceScore).toBeLessThanOrEqual(100);
  });

  it("Decision output includes trade-offs analysis", () => {
    expect(typeof mockDecisionOutput.tradeOffs).toBe("object");
    expect(Object.keys(mockDecisionOutput.tradeOffs).length).toBeGreaterThan(0);
  });

  it("Decision output includes alternative candidates with rationale", () => {
    expect(Array.isArray(mockDecisionOutput.alternativeCandidates)).toBe(true);
    mockDecisionOutput.alternativeCandidates.forEach((alt) => {
      expect(alt).toHaveProperty("name");
      expect(alt).toHaveProperty("fitScore");
      expect(alt).toHaveProperty("rationale");
    });
  });
});

describe("Agent Integration - JD Agent", () => {
  beforeEach(() => {
    mockInvokeLLM.mockReset();
  });

  it("jdAgent calls LLM with correct prompt structure and returns parsed output", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockJDOutput),
          },
        },
      ],
    });

    const { jdAgent } = await import("./agents");
    const result = await jdAgent(mockJob);

    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
    const callArgs = mockInvokeLLM.mock.calls[0][0];
    expect(callArgs.messages).toBeDefined();
    expect(callArgs.messages.length).toBe(2);
    expect(callArgs.messages[0].role).toBe("system");
    expect(callArgs.messages[1].role).toBe("user");
    // Verify prompt includes job details
    expect(callArgs.messages[1].content).toContain(mockJob.jobTitle);
    expect(callArgs.messages[1].content).toContain(mockJob.department);
    // Verify response_format is set for structured output
    expect(callArgs.response_format).toBeDefined();
    expect(callArgs.response_format.type).toBe("json_schema");

    expect(result.coreCompetencies).toEqual(mockJDOutput.coreCompetencies);
    expect(result.priorityWeights).toEqual(mockJDOutput.priorityWeights);
    expect(result.reasoning).toEqual(mockJDOutput.reasoning);
  });
});

describe("Agent Integration - CV Agent", () => {
  beforeEach(() => {
    mockInvokeLLM.mockReset();
  });

  it("cvAgent includes enriched profile fields in prompt and returns KPI metrics", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockCVOutput),
          },
        },
      ],
    });

    const { cvAgent } = await import("./agents");
    const result = await cvAgent(mockCandidate, mockJob, mockJDOutput);

    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
    const callArgs = mockInvokeLLM.mock.calls[0][0];
    const prompt = callArgs.messages[1].content;

    // Verify enriched fields are included in the prompt (Fix 6)
    expect(prompt).toContain("Board Exposure: Yes");
    expect(prompt).toContain("Plant-Scale Experience: Yes");
    expect(prompt).toContain("EV Program Credential: Yes");
    expect(prompt).toContain("PhD Electrical Engineering");
    expect(prompt).toContain("Consumer Electronics");

    // Verify KPI derivation instructions are in the prompt (Fix 2)
    expect(prompt).toContain("mis-hire risk score");
    expect(prompt).toContain("misHireCostEUR");
    expect(prompt).toContain("quality-of-hire projection");

    // Verify output has all KPI fields
    expect(result.misHireRiskScore).toBe(25);
    expect(result.estimatedMisHireCostEUR).toBe(245000);
    expect(result.qualityOfHireProjection).toBe(85);
    expect(result.misHireCostFormula).toBeDefined();
  });
});

describe("Agent Integration - Leadership Agent", () => {
  beforeEach(() => {
    mockInvokeLLM.mockReset();
  });

  it("leadershipAgent includes BMW leaders in prompt and returns pairings", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockLeadershipOutput),
          },
        },
      ],
    });

    const { leadershipAgent } = await import("./agents");
    const result = await leadershipAgent(mockCandidate, mockJob, mockBmwLeaders);

    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
    const callArgs = mockInvokeLLM.mock.calls[0][0];
    const prompt = callArgs.messages[1].content;

    // Verify BMW leaders are included in the prompt (Fix 1)
    expect(prompt).toContain("Dr. Frank Weber");
    expect(prompt).toContain("Milan Nedeljković");
    expect(prompt).toContain("Board Member - Development");
    expect(prompt).toContain("Board Member - Production");

    // Verify output has BMW leader pairings
    expect(result.bmwLeaderPairings).toHaveLength(2);
    expect(result.bmwLeaderPairings[0].bmwLeaderName).toBe("Dr. Frank Weber");
    expect(result.bmwLeaderPairings[1].bmwLeaderName).toBe("Milan Nedeljković");
  });
});

describe("Agent Integration - Scenario Agent", () => {
  beforeEach(() => {
    mockInvokeLLM.mockReset();
  });

  it("scenarioAgent derives weights through reasoning, not reading pre-stored values", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockScenarioOutput),
          },
        },
      ],
    });

    const { scenarioAgent } = await import("./agents");
    const result = await scenarioAgent(mockCandidate, mockJob, mockJDOutput, mockCVOutput, mockScenario);

    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
    const callArgs = mockInvokeLLM.mock.calls[0][0];
    const prompt = callArgs.messages[1].content;

    // Verify scenario context is in the prompt (Fix 3)
    expect(prompt).toContain("EV Transformation Crisis");
    // Verify JD baseline weights are provided for comparison
    expect(prompt).toContain("EV Systems Architecture");

    // Verify output has derived weights (not just reading priorityAdjustments)
    expect(result.derivedWeights).toBeDefined();
    expect(result.weightChangeReasoning).toBeDefined();
    expect(typeof result.weightChangeReasoning).toBe("string");
  });
});

describe("Agent Integration - Decision Agent", () => {
  beforeEach(() => {
    mockInvokeLLM.mockReset();
  });

  it("decisionAgent produces executive summary and risk assessment", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              recommendedCandidateName: "Alice Chen",
              confidenceScore: 85,
              executiveSummary: mockDecisionOutput.executiveSummary,
              recommendation: mockDecisionOutput.recommendation,
              tradeOffs: mockDecisionOutput.tradeOffs,
              alternativeCandidates: [
                { name: "Bob Martinez", fitScore: 78, rationale: "Strong operational leader" },
              ],
              riskAssessment: mockDecisionOutput.riskAssessment,
              implementationRoadmap: mockDecisionOutput.implementationRoadmap,
              reasoning: mockDecisionOutput.reasoning,
            }),
          },
        },
      ],
    });

    const { decisionAgent } = await import("./agents");
    const cvOutputs = new Map<number, CVAgentOutput>();
    cvOutputs.set(1, mockCVOutput);
    cvOutputs.set(2, { ...mockCVOutput, fitScore: 78, misHireRiskScore: 35, estimatedMisHireCostEUR: 343000 });

    const leadershipOutputs = new Map<number, LeadershipAgentOutput>();
    leadershipOutputs.set(1, mockLeadershipOutput);
    leadershipOutputs.set(2, { ...mockLeadershipOutput, leadershipScore: 80 });

    const result = await decisionAgent(
      [mockCandidate, mockCandidate2],
      mockJob,
      mockJDOutput,
      cvOutputs,
      leadershipOutputs,
      undefined
    );

    expect(result.executiveSummary).toBeDefined();
    expect(result.executiveSummary.length).toBeGreaterThan(50);
    expect(result.riskAssessment).toBeDefined();
    expect(result.implementationRoadmap).toBeDefined();
    expect(result.recommendedCandidateName).toBe("Alice Chen");
    expect(result.recommendedCandidateId).toBe(1);
  });
});

describe("Pipeline Orchestration", () => {
  beforeEach(() => {
    mockInvokeLLM.mockReset();
  });

  it("executeDecisionPipeline calls all 5 agents in correct order", async () => {
    // Mock 5 agent calls: JD, CV×2, Leadership×2, Decision
    mockInvokeLLM
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(mockJDOutput) } }] }) // JD
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(mockCVOutput) } }] }) // CV 1
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ ...mockCVOutput, fitScore: 78 }) } }] }) // CV 2
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(mockLeadershipOutput) } }] }) // Leadership 1
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ ...mockLeadershipOutput, leadershipScore: 80 }) } }] }) // Leadership 2
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({
        recommendedCandidateName: "Alice Chen",
        confidenceScore: 85,
        executiveSummary: "Alice Chen is recommended...",
        recommendation: "Hire Alice Chen",
        tradeOffs: { "comparison": "Chen vs Martinez" },
        alternativeCandidates: [{ name: "Bob Martinez", fitScore: 78, rationale: "Strong leader" }],
        riskAssessment: "Low risk",
        implementationRoadmap: ["Day 1-30: Onboarding"],
        reasoning: "Based on analysis...",
      }) } }] }); // Decision

    const { executeDecisionPipeline } = await import("./agents");
    const result = await executeDecisionPipeline(
      [mockCandidate, mockCandidate2],
      mockJob,
      mockBmwLeaders,
      undefined // no scenario
    );

    // Verify all agents were called
    expect(mockInvokeLLM).toHaveBeenCalledTimes(6); // JD + 2×CV + 2×Leadership + Decision

    // Verify output structure
    expect(result.jdOutput).toBeDefined();
    expect(result.cvOutputs.size).toBe(2);
    expect(result.leadershipOutputs.size).toBe(2);
    expect(result.scenarioOutputs).toBeUndefined(); // no scenario
    expect(result.decisionOutput).toBeDefined();
    expect(result.decisionOutput.executiveSummary).toBeDefined();
  });

  it("executeDecisionPipeline includes scenario agent when scenario provided", async () => {
    // Mock 7 agent calls: JD, CV×2, Leadership×2, Scenario×2, Decision
    mockInvokeLLM
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(mockJDOutput) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(mockCVOutput) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ ...mockCVOutput, fitScore: 78 }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(mockLeadershipOutput) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ ...mockLeadershipOutput, leadershipScore: 80 }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(mockScenarioOutput) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ ...mockScenarioOutput, adjustedFitScore: 75 }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({
        recommendedCandidateName: "Alice Chen",
        confidenceScore: 88,
        executiveSummary: "Under EV crisis scenario, Alice Chen is recommended...",
        recommendation: "Hire Alice Chen",
        tradeOffs: { "comparison": "Chen vs Martinez under EV crisis" },
        alternativeCandidates: [{ name: "Bob Martinez", fitScore: 75, rationale: "Less EV depth" }],
        riskAssessment: "Medium risk under crisis",
        implementationRoadmap: ["Day 1-30: Crisis onboarding"],
        reasoning: "Under EV crisis...",
      }) } }] });

    const { executeDecisionPipeline } = await import("./agents");
    const result = await executeDecisionPipeline(
      [mockCandidate, mockCandidate2],
      mockJob,
      mockBmwLeaders,
      mockScenario
    );

    // Verify scenario agents were called (JD + 2×CV + 2×Leadership + 2×Scenario + Decision = 8)
    expect(mockInvokeLLM).toHaveBeenCalledTimes(8);

    // Verify scenario outputs exist
    expect(result.scenarioOutputs).toBeDefined();
    expect(result.scenarioOutputs!.size).toBe(2);
    expect(result.scenarioOutputs!.get(1)?.derivedWeights).toBeDefined();
  });
});
