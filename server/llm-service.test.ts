import { describe, it, expect, vi } from "vitest";
import {
  generateTalentAssessmentSummary,
  generateSuccessionRecommendations,
  generateUpskillRecommendations,
  generateTalentRiskAlert,
} from "./llm-service";
import type { Employee, Skill, PerformanceRating, TrainingRecord } from "../drizzle/schema";

// Mock the LLM service
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async (params: any) => {
    // Mock response for talent assessment
    if (params.response_format?.json_schema?.name === "talent_assessment") {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "Test employee shows strong technical skills and leadership potential",
                hiddenTalentFlags: ["Strategic thinker", "Mentorship capability"],
                recommendedSkills: ["Executive leadership", "AI fundamentals"],
                recommendedRoles: ["Engineering Manager", "Technical Director"],
              }),
            },
          },
        ],
      };
    }
    // Mock response for upskilling plan
    if (params.response_format?.json_schema?.name === "upskilling_plan") {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recommendedPath: "Transition to senior engineering leadership role",
                trainingPrograms: ["Executive Leadership Program", "AI/ML Fundamentals", "Strategic Planning"],
                timeline: "12-18 months",
              }),
            },
          },
        ],
      };
    }
    // Mock response for talent risk
    if (params.response_format?.json_schema?.name === "talent_risk") {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "High Performer Retention Risk",
                description: "Employee shows signs of seeking external opportunities",
                severity: "high",
              }),
            },
          },
        ],
      };
    }
    // Default text response
    return {
      choices: [
        {
          message: {
            content: "Test recommendation for succession planning",
          },
        },
      ],
    };
  }),
}));

describe("LLM Service", () => {
  const mockEmployee: Employee = {
    id: 1,
    userId: 1,
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@bmw.com",
    department: "Engineering",
    position: "Senior Software Engineer",
    level: "senior",
    yearsAtCompany: 8,
    yearsInRole: 3,
    managerId: null,
    biography: "Expert in cloud architecture",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSkills: Skill[] = [
    {
      id: 1,
      employeeId: 1,
      skillName: "Cloud Architecture",
      category: "technical",
      proficiencyLevel: "expert",
      yearsOfExperience: 6,
      endorsements: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPerformance: PerformanceRating[] = [
    {
      id: 1,
      employeeId: 1,
      ratingYear: 2025,
      overallRating: "exceeds",
      technicalScore: 5,
      leadershipScore: 4,
      collaborationScore: 5,
      innovationScore: 5,
      comments: "Outstanding contributor",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockTraining: TrainingRecord[] = [
    {
      id: 1,
      employeeId: 1,
      trainingName: "Advanced Kubernetes",
      category: "technical",
      status: "completed",
      hoursSpent: 40,
      completionDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe("generateTalentAssessmentSummary", () => {
    it("should generate talent assessment with summary and recommendations", async () => {
      const result = await generateTalentAssessmentSummary(mockEmployee, mockSkills, mockPerformance, mockTraining);

      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("hiddenTalentFlags");
      expect(result).toHaveProperty("recommendedSkills");
      expect(result).toHaveProperty("recommendedRoles");

      expect(result.summary).toBeTruthy();
      expect(Array.isArray(result.hiddenTalentFlags)).toBe(true);
      expect(Array.isArray(result.recommendedSkills)).toBe(true);
      expect(Array.isArray(result.recommendedRoles)).toBe(true);
    });

    it("should handle empty skills and performance data", async () => {
      const result = await generateTalentAssessmentSummary(mockEmployee, [], [], []);

      expect(result).toHaveProperty("summary");
      expect(result.summary).toBeTruthy();
    });
  });

  describe("generateSuccessionRecommendations", () => {
    it("should generate succession planning recommendations", async () => {
      const result = await generateSuccessionRecommendations("VP Engineering", mockEmployee, [mockEmployee]);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle null current holder", async () => {
      const result = await generateSuccessionRecommendations("VP Engineering", null, [mockEmployee]);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle empty successor candidates", async () => {
      const result = await generateSuccessionRecommendations("VP Engineering", mockEmployee, []);

      expect(typeof result).toBe("string");
    });
  });

  describe("generateUpskillRecommendations", () => {
    it("should generate personalized upskilling path", async () => {
      const result = await generateUpskillRecommendations(mockEmployee, mockSkills, ["AI/ML", "Leadership"]);

      expect(result).toHaveProperty("recommendedPath");
      expect(result).toHaveProperty("trainingPrograms");
      expect(result).toHaveProperty("timeline");

      expect(typeof result.recommendedPath).toBe("string");
      expect(Array.isArray(result.trainingPrograms)).toBe(true);
      expect(typeof result.timeline).toBe("string");
    });

    it("should handle empty future needs", async () => {
      const result = await generateUpskillRecommendations(mockEmployee, mockSkills, []);

      expect(result).toHaveProperty("recommendedPath");
      expect(result.recommendedPath).toBeTruthy();
    });
  });

  describe("generateTalentRiskAlert", () => {
    it("should generate talent risk alert with severity", async () => {
      const result = await generateTalentRiskAlert(mockEmployee, ["Below market compensation", "Limited growth opportunities"]);

      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("severity");

      expect(typeof result.title).toBe("string");
      expect(typeof result.description).toBe("string");
      expect(["low", "medium", "high", "critical"]).toContain(result.severity);
    });

    it("should handle empty risk factors", async () => {
      const result = await generateTalentRiskAlert(mockEmployee, []);

      expect(result).toHaveProperty("title");
      expect(result.title).toBeTruthy();
    });
  });
});
