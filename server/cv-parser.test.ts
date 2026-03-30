import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CVParserOutput } from "./agents";

// ============================================================================
// Mock LLM to avoid real API calls in tests
// ============================================================================

const mockInvokeLLM = vi.fn();

vi.mock("./_core/llm", () => ({
  invokeLLM: (...args: unknown[]) => mockInvokeLLM(...args),
}));

// ============================================================================
// Mock CV Parser Output
// ============================================================================

const mockParsedProfile: CVParserOutput = {
  firstName: "Alice",
  lastName: "Chen",
  email: "alice.chen@tesla.com",
  currentRole: "VP Engineering",
  currentCompany: "Tesla",
  yearsOfExperience: 18,
  skills: [
    { name: "EV Systems Architecture", proficiency: "expert", years: 12 },
    { name: "Team Leadership", proficiency: "expert", years: 10 },
    { name: "AI/ML Integration", proficiency: "advanced", years: 5 },
    { name: "Battery Technology", proficiency: "advanced", years: 8 },
  ],
  leadershipStyle: "collaborative",
  teamSize: 200,
  achievements: [
    { text: "Led Model 3 platform architecture from concept to production", metric: "500K units/year", domain: "product development" },
    { text: "Scaled engineering team from 50 to 200 engineers", metric: "300% growth", domain: "team scaling" },
    { text: "Reduced battery pack cost by 30% through design optimization", metric: "30%", domain: "cost reduction" },
  ],
  education: [
    { degree: "PhD Electrical Engineering", institution: "MIT", year: 2008 },
    { degree: "BS Computer Science", institution: "Stanford", year: 2004 },
  ],
  boardExposure: true,
  crossFunctionalExperience: ["Engineering", "Product", "Manufacturing", "Supply Chain"],
  geographicMobility: ["US", "Germany", "China"],
  industryTransitions: [
    { from: "Consumer Electronics", to: "Automotive EV", year: 2014 },
  ],
  plantScaleExperience: true,
  evProgramCredential: true,
  notableProjects: ["Model 3 Platform Architecture", "Gigafactory Berlin Setup"],
  previousCompanies: [
    { company: "Apple", role: "Senior Engineer", years: 4 },
    { company: "Tesla", role: "VP Engineering", years: 8 },
  ],
  careerTrajectory: "ascending",
  rawSummary: "Alice Chen is a seasoned EV engineering leader with 18 years of experience spanning consumer electronics and automotive EV. She led Tesla's Model 3 platform from concept to 500K units/year production and scaled her team 300%. Her collaborative leadership style and board-level exposure make her a strong candidate for senior automotive roles.",
  confidenceIndicators: {
    firstName: "stated",
    lastName: "stated",
    email: "stated",
    currentRole: "stated",
    currentCompany: "stated",
    yearsOfExperience: "inferred",
    leadershipStyle: "inferred",
    teamSize: "stated",
    boardExposure: "inferred",
    plantScaleExperience: "inferred",
    evProgramCredential: "inferred",
    careerTrajectory: "inferred",
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe("CV Parser Agent - Output Structure", () => {
  it("parsed profile has all required basic fields", () => {
    expect(mockParsedProfile).toHaveProperty("firstName");
    expect(mockParsedProfile).toHaveProperty("lastName");
    expect(mockParsedProfile).toHaveProperty("email");
    expect(mockParsedProfile).toHaveProperty("currentRole");
    expect(mockParsedProfile).toHaveProperty("currentCompany");
    expect(mockParsedProfile).toHaveProperty("yearsOfExperience");
    expect(typeof mockParsedProfile.firstName).toBe("string");
    expect(typeof mockParsedProfile.yearsOfExperience).toBe("number");
  });

  it("parsed profile has structured skills with proficiency and years", () => {
    expect(Array.isArray(mockParsedProfile.skills)).toBe(true);
    expect(mockParsedProfile.skills.length).toBeGreaterThan(0);
    mockParsedProfile.skills.forEach((skill) => {
      expect(skill).toHaveProperty("name");
      expect(skill).toHaveProperty("proficiency");
      expect(skill).toHaveProperty("years");
      expect(["beginner", "intermediate", "advanced", "expert"]).toContain(skill.proficiency);
      expect(skill.years).toBeGreaterThanOrEqual(0);
    });
  });

  it("parsed profile has structured achievements with metrics and domains", () => {
    expect(Array.isArray(mockParsedProfile.achievements)).toBe(true);
    expect(mockParsedProfile.achievements.length).toBeGreaterThan(0);
    mockParsedProfile.achievements.forEach((ach) => {
      expect(ach).toHaveProperty("text");
      expect(ach).toHaveProperty("metric");
      expect(ach).toHaveProperty("domain");
      expect(typeof ach.text).toBe("string");
      expect(typeof ach.domain).toBe("string");
    });
  });

  it("parsed profile has education array with degree, institution, and year", () => {
    expect(Array.isArray(mockParsedProfile.education)).toBe(true);
    mockParsedProfile.education.forEach((edu) => {
      expect(edu).toHaveProperty("degree");
      expect(edu).toHaveProperty("institution");
      expect(edu).toHaveProperty("year");
      expect(typeof edu.year).toBe("number");
    });
  });

  it("parsed profile has automotive-executive indicator booleans", () => {
    expect(typeof mockParsedProfile.boardExposure).toBe("boolean");
    expect(typeof mockParsedProfile.plantScaleExperience).toBe("boolean");
    expect(typeof mockParsedProfile.evProgramCredential).toBe("boolean");
  });

  it("parsed profile has career trajectory classification", () => {
    expect(["ascending", "lateral", "specialist"]).toContain(mockParsedProfile.careerTrajectory);
  });

  it("parsed profile has raw summary for downstream agents", () => {
    expect(typeof mockParsedProfile.rawSummary).toBe("string");
    expect(mockParsedProfile.rawSummary.length).toBeGreaterThan(20);
  });
});

describe("CV Parser Agent - Confidence Indicators", () => {
  it("confidence indicators map exists", () => {
    expect(mockParsedProfile.confidenceIndicators).toBeDefined();
    expect(typeof mockParsedProfile.confidenceIndicators).toBe("object");
  });

  it("each confidence indicator is either 'stated' or 'inferred'", () => {
    Object.values(mockParsedProfile.confidenceIndicators).forEach((value) => {
      expect(["stated", "inferred"]).toContain(value);
    });
  });

  it("directly extractable fields are marked as 'stated'", () => {
    expect(mockParsedProfile.confidenceIndicators.firstName).toBe("stated");
    expect(mockParsedProfile.confidenceIndicators.lastName).toBe("stated");
    expect(mockParsedProfile.confidenceIndicators.currentRole).toBe("stated");
    expect(mockParsedProfile.confidenceIndicators.currentCompany).toBe("stated");
  });

  it("interpreted fields are marked as 'inferred'", () => {
    expect(mockParsedProfile.confidenceIndicators.leadershipStyle).toBe("inferred");
    expect(mockParsedProfile.confidenceIndicators.careerTrajectory).toBe("inferred");
    expect(mockParsedProfile.confidenceIndicators.plantScaleExperience).toBe("inferred");
    expect(mockParsedProfile.confidenceIndicators.evProgramCredential).toBe("inferred");
  });
});

describe("CV Parser Agent - LLM Integration", () => {
  beforeEach(() => {
    mockInvokeLLM.mockReset();
  });

  it("cvParserAgent calls LLM with CV text and returns structured profile", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockParsedProfile),
          },
        },
      ],
    });

    const { cvParserAgent } = await import("./agents");
    const rawCvText = `
      Alice Chen
      VP Engineering at Tesla
      alice.chen@tesla.com
      
      Experience: 18 years
      Led Model 3 platform architecture from concept to production (500K units/year)
      Scaled engineering team from 50 to 200 engineers
      
      Education:
      PhD Electrical Engineering, MIT, 2008
      BS Computer Science, Stanford, 2004
      
      Skills: EV Systems Architecture, Team Leadership, AI/ML Integration, Battery Technology
      
      Previous: Apple (Senior Engineer, 4 years)
      Board presentations to Tesla Board of Directors
      Managed Gigafactory Berlin setup and production ramp
    `;

    const result = await cvParserAgent(rawCvText);

    // Verify LLM was called
    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);

    // Verify prompt structure
    const callArgs = mockInvokeLLM.mock.calls[0][0];
    expect(callArgs.messages).toBeDefined();
    expect(callArgs.messages.length).toBe(2);
    expect(callArgs.messages[0].role).toBe("system");
    expect(callArgs.messages[1].role).toBe("user");

    // Verify CV text is included in prompt
    expect(callArgs.messages[1].content).toContain("Alice Chen");
    expect(callArgs.messages[1].content).toContain("VP Engineering at Tesla");

    // Verify response_format is set for structured JSON output
    expect(callArgs.response_format).toBeDefined();
    expect(callArgs.response_format.type).toBe("json_schema");
    expect(callArgs.response_format.json_schema.name).toBe("cv_parser_output");

    // Verify output structure
    expect(result.firstName).toBe("Alice");
    expect(result.lastName).toBe("Chen");
    expect(result.email).toBe("alice.chen@tesla.com");
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.achievements.length).toBeGreaterThan(0);
    expect(result.confidenceIndicators).toBeDefined();
  });

  it("cvParserAgent throws on invalid LLM response", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: null,
          },
        },
      ],
    });

    const { cvParserAgent } = await import("./agents");

    await expect(cvParserAgent("Some CV text")).rejects.toThrow("Invalid CV Parser Agent response");
  });
});

describe("CV Parser Agent - Achievement Extraction Quality", () => {
  it("achievements have quantitative metrics when available", () => {
    const withMetrics = mockParsedProfile.achievements.filter((a) => a.metric !== null);
    expect(withMetrics.length).toBeGreaterThan(0);
  });

  it("achievements have domain classification", () => {
    const domains = mockParsedProfile.achievements.map((a) => a.domain);
    expect(domains.every((d) => typeof d === "string" && d.length > 0)).toBe(true);
  });

  it("achievement metrics are specific (not generic)", () => {
    const withMetrics = mockParsedProfile.achievements.filter((a) => a.metric !== null);
    withMetrics.forEach((ach) => {
      // Metrics should contain numbers or currency symbols
      expect(ach.metric).toMatch(/\d|€|%|\$/);
    });
  });
});

describe("CV Parser Agent - Previous Companies & Industry Transitions", () => {
  it("previous companies have role and years", () => {
    expect(Array.isArray(mockParsedProfile.previousCompanies)).toBe(true);
    mockParsedProfile.previousCompanies.forEach((comp) => {
      expect(comp).toHaveProperty("company");
      expect(comp).toHaveProperty("role");
      expect(comp).toHaveProperty("years");
      expect(typeof comp.years).toBe("number");
    });
  });

  it("industry transitions have from, to, and year", () => {
    expect(Array.isArray(mockParsedProfile.industryTransitions)).toBe(true);
    mockParsedProfile.industryTransitions.forEach((t) => {
      expect(t).toHaveProperty("from");
      expect(t).toHaveProperty("to");
      expect(t).toHaveProperty("year");
      expect(typeof t.year).toBe("number");
    });
  });

  it("geographic mobility is an array of regions", () => {
    expect(Array.isArray(mockParsedProfile.geographicMobility)).toBe(true);
    expect(mockParsedProfile.geographicMobility.length).toBeGreaterThan(0);
    mockParsedProfile.geographicMobility.forEach((region) => {
      expect(typeof region).toBe("string");
    });
  });
});
