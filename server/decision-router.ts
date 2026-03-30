import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  executeDecisionPipeline,
  jdAgent,
  cvAgent,
  leadershipAgent,
  scenarioAgent,
  decisionAgent,
  CandidateProfile,
  JobProfile,
  ScenarioContext,
  BmwLeader,
  JDAgentOutput,
  CVAgentOutput,
  LeadershipAgentOutput,
} from "./agents";
import { getDb } from "./db";
import { candidates, jobRequirements, scenarios, bmwLeadershipTeam } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Decision Router - tRPC procedures for multi-agent decision pipeline (v3)
 * Fixes applied:
 *   Fix 2: DB persistence via jobRequirementId passed to executeDecisionPipeline
 *   Fix 3: Two-phase compareScenarios (shared Phase 1 + per-scenario Phase 2)
 *   Fix 4: protectedProcedure on all write mutations
 *   Fix 6: createBmwLeader + updateBmwLeader mutations
 */

// Helper to build CandidateProfile from DB row
function buildCandidateProfile(c: any): CandidateProfile {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    yearsOfExperience: c.yearsOfExperience,
    currentRole: c.currentRole,
    currentCompany: c.currentCompany,
    skills: JSON.parse(c.skills || "[]"),
    leadershipStyle: c.leadershipStyle || undefined,
    teamSize: c.teamSize || undefined,
    achievements: JSON.parse(c.achievements || "[]"),
    education: JSON.parse(c.education || "[]"),
    boardExposure: c.boardExposure || false,
    crossFunctionalExperience: JSON.parse(c.crossFunctionalExperience || "[]"),
    geographicMobility: JSON.parse(c.geographicMobility || "[]"),
    industryTransitions: JSON.parse(c.industryTransitions || "[]"),
    plantScaleExperience: c.plantScaleExperience || false,
    evProgramCredential: c.evProgramCredential || false,
    notableProjects: JSON.parse(c.notableProjects || "[]"),
    previousCompanies: JSON.parse(c.previousCompanies || "[]"),
  };
}

// Helper to build JobProfile from DB row
function buildJobProfile(job: any): JobProfile {
  return {
    jobTitle: job.jobTitle,
    department: job.department,
    description: job.description,
    requiredSkills: JSON.parse(job.requiredSkills || "[]"),
    preferredSkills: JSON.parse(job.preferredSkills || "[]"),
    experienceYearsRequired: job.experienceYearsRequired,
    seniority: job.seniority,
  };
}

export const decisionRouter = router({
  /**
   * Get all job requirements
   */
  getJobs: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const jobs = await db.select().from(jobRequirements);
    return jobs.map((job) => ({
      ...job,
      requiredSkills: JSON.parse(job.requiredSkills || "[]"),
      preferredSkills: JSON.parse(job.preferredSkills || "[]"),
    }));
  }),

  /**
   * Get all candidates (with enriched fields)
   */
  getCandidates: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const cands = await db.select().from(candidates);
    return cands.map((c) => ({
      ...c,
      skills: JSON.parse(c.skills || "[]"),
      achievements: JSON.parse(c.achievements || "[]"),
      education: JSON.parse(c.education || "[]"),
      crossFunctionalExperience: JSON.parse(c.crossFunctionalExperience || "[]"),
      geographicMobility: JSON.parse(c.geographicMobility || "[]"),
      industryTransitions: JSON.parse(c.industryTransitions || "[]"),
      notableProjects: JSON.parse(c.notableProjects || "[]"),
      previousCompanies: JSON.parse(c.previousCompanies || "[]"),
    }));
  }),

  /**
   * Get all scenarios
   */
  getScenarios: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const scens = await db.select().from(scenarios);
    return scens.map((s) => ({
      ...s,
      priorityAdjustments: JSON.parse(s.priorityAdjustments || "{}"),
    }));
  }),

  /**
   * Get BMW Leadership Team
   */
  getBmwLeaders: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const leaders = await db.select().from(bmwLeadershipTeam);
    return leaders.map((l) => ({
      ...l,
      priorities: JSON.parse(l.priorities || "[]"),
    }));
  }),

  /**
   * Create a new job requirement (Fix 4: protected)
   */
  createJob: protectedProcedure
    .input(
      z.object({
        jobTitle: z.string(),
        department: z.string(),
        description: z.string(),
        requiredSkills: z.array(z.string()),
        preferredSkills: z.array(z.string()).optional(),
        experienceYearsRequired: z.number(),
        seniority: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(jobRequirements).values({
        jobTitle: input.jobTitle,
        department: input.department,
        description: input.description,
        requiredSkills: JSON.stringify(input.requiredSkills),
        preferredSkills: JSON.stringify(input.preferredSkills || []),
        experienceYearsRequired: input.experienceYearsRequired,
        seniority: input.seniority,
      });
      return result;
    }),

  /**
   * Create a new candidate (Fix 4: protected)
   */
  createCandidate: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        yearsOfExperience: z.number(),
        currentRole: z.string(),
        currentCompany: z.string(),
        skills: z.array(
          z.object({ name: z.string(), proficiency: z.string(), years: z.number() })
        ),
        leadershipStyle: z.string().optional(),
        teamSize: z.number().optional(),
        achievements: z.array(z.string()).optional(),
        education: z.array(z.object({ degree: z.string(), institution: z.string(), year: z.number() })).optional(),
        boardExposure: z.boolean().optional(),
        crossFunctionalExperience: z.array(z.string()).optional(),
        geographicMobility: z.array(z.string()).optional(),
        industryTransitions: z.array(z.object({ from: z.string(), to: z.string(), year: z.number() })).optional(),
        plantScaleExperience: z.boolean().optional(),
        evProgramCredential: z.boolean().optional(),
        notableProjects: z.array(z.string()).optional(),
        previousCompanies: z.array(z.object({ company: z.string(), role: z.string(), years: z.number() })).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(candidates).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        yearsOfExperience: input.yearsOfExperience,
        currentRole: input.currentRole,
        currentCompany: input.currentCompany,
        skills: JSON.stringify(input.skills),
        leadershipStyle: input.leadershipStyle,
        teamSize: input.teamSize,
        achievements: JSON.stringify(input.achievements || []),
        education: JSON.stringify(input.education || []),
        boardExposure: input.boardExposure || false,
        crossFunctionalExperience: JSON.stringify(input.crossFunctionalExperience || []),
        geographicMobility: JSON.stringify(input.geographicMobility || []),
        industryTransitions: JSON.stringify(input.industryTransitions || []),
        plantScaleExperience: input.plantScaleExperience || false,
        evProgramCredential: input.evProgramCredential || false,
        notableProjects: JSON.stringify(input.notableProjects || []),
        previousCompanies: JSON.stringify(input.previousCompanies || []),
      });
      return result;
    }),

  /**
   * Create a new scenario (Fix 4: protected)
   */
  createScenario: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        context: z.string().default("general"),
        priorityAdjustments: z.record(z.string(), z.number()).default({}),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(scenarios).values({
        name: input.name,
        description: input.description,
        context: input.context,
        priorityAdjustments: JSON.stringify(input.priorityAdjustments),
      });
      return result;
    }),

  /**
   * Create a new BMW leader (Fix 6)
   */
  createBmwLeader: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        role: z.string(),
        department: z.string(),
        leadershipStyle: z.string(),
        teamSize: z.number().default(0),
        priorities: z.array(z.string()),
        background: z.string().default(""),
        decisionMakingStyle: z.string().default(""),
        communicationPreference: z.string().default(""),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(bmwLeadershipTeam).values({
        name: input.name,
        role: input.role,
        department: input.department,
        leadershipStyle: input.leadershipStyle,
        teamSize: input.teamSize,
        priorities: JSON.stringify(input.priorities),
        background: input.background,
        decisionMakingStyle: input.decisionMakingStyle,
        communicationPreference: input.communicationPreference,
      });
      return result;
    }),

  /**
   * Update an existing BMW leader (Fix 6)
   */
  updateBmwLeader: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        role: z.string(),
        department: z.string(),
        leadershipStyle: z.string(),
        teamSize: z.number().default(0),
        priorities: z.array(z.string()),
        background: z.string().default(""),
        decisionMakingStyle: z.string().default(""),
        communicationPreference: z.string().default(""),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...fields } = input;
      const result = await db
        .update(bmwLeadershipTeam)
        .set({
          name: fields.name,
          role: fields.role,
          department: fields.department,
          leadershipStyle: fields.leadershipStyle,
          teamSize: fields.teamSize,
          priorities: JSON.stringify(fields.priorities),
          background: fields.background,
          decisionMakingStyle: fields.decisionMakingStyle,
          communicationPreference: fields.communicationPreference,
        })
        .where(eq(bmwLeadershipTeam.id, id));
      return result;
    }),

  /**
   * Execute the full multi-agent decision pipeline (single scenario)
   * Fix 2: passes jobRequirementId for DB persistence
   * Fix 4: protected
   */
  analyzeDecision: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        candidateIds: z.array(z.number()),
        scenarioId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const jobData = await db.select().from(jobRequirements).where(eq(jobRequirements.id, input.jobId));
      if (!jobData.length) throw new Error("Job not found");
      const jobProfile = buildJobProfile(jobData[0]);

      const candidateData = await db.select().from(candidates).where(inArray(candidates.id, input.candidateIds));
      const candidateProfiles = candidateData.map(buildCandidateProfile);

      const bmwLeadersRaw = await db.select().from(bmwLeadershipTeam);
      const bmwLeaders: BmwLeader[] = bmwLeadersRaw.map((l) => ({
        ...l,
        priorities: JSON.parse(l.priorities || "[]"),
      }));

      let scenarioContext: ScenarioContext | undefined;
      if (input.scenarioId) {
        const scenarioData = await db.select().from(scenarios).where(eq(scenarios.id, input.scenarioId));
        if (scenarioData.length) {
          const s = scenarioData[0];
          scenarioContext = {
            id: s.id,
            name: s.name,
            description: s.description,
            context: s.context,
            priorityAdjustments: JSON.parse(s.priorityAdjustments || "{}"),
          };
        }
      }

      // Fix 2: pass jobRequirementId so pipeline persists agent outputs to DB
      const result = await executeDecisionPipeline(
        candidateProfiles,
        jobProfile,
        bmwLeaders,
        scenarioContext,
        input.jobId
      );

      return {
        jobId: input.jobId,
        scenarioId: input.scenarioId,
        jdAnalysis: result.jdOutput,
        candidateScores: Array.from(result.cvOutputs.entries()).map(([candidateId, cvOutput]) => ({
          candidateId,
          fitScore: cvOutput.fitScore,
          skillMatches: cvOutput.skillMatches,
          experienceMatch: cvOutput.experienceMatch,
          misHireRiskScore: cvOutput.misHireRiskScore,
          misHireRiskReasoning: cvOutput.misHireRiskReasoning,
          estimatedMisHireCostEUR: cvOutput.estimatedMisHireCostEUR,
          misHireCostFormula: cvOutput.misHireCostFormula,
          qualityOfHireProjection: cvOutput.qualityOfHireProjection,
          reasoning: cvOutput.reasoning,
        })),
        leadershipAssessments: Array.from(result.leadershipOutputs.entries()).map(([candidateId, leadOutput]) => ({
          candidateId,
          leadershipStyle: leadOutput.leadershipStyle,
          leadershipScore: leadOutput.leadershipScore,
          teamDynamicsScore: leadOutput.teamDynamicsScore,
          culturalFitScore: leadOutput.culturalFitScore,
          leadershipTraits: leadOutput.leadershipTraits,
          bmwLeaderPairings: leadOutput.bmwLeaderPairings,
          reasoning: leadOutput.reasoning,
        })),
        scenarioAnalysis: result.scenarioOutputs
          ? Array.from(result.scenarioOutputs.entries()).map(([candidateId, scenOut]) => ({
              candidateId,
              adjustedFitScore: scenOut.adjustedFitScore,
              derivedWeights: scenOut.derivedWeights,
              weightChangeReasoning: scenOut.weightChangeReasoning,
              weightDeviationExplanation: scenOut.weightDeviationExplanation,
              reasoning: scenOut.reasoning,
            }))
          : undefined,
        recommendation: {
          recommendedCandidateId: result.decisionOutput.recommendedCandidateId,
          recommendedCandidateName: result.decisionOutput.recommendedCandidateName,
          confidenceScore: result.decisionOutput.confidenceScore,
          executiveSummary: result.decisionOutput.executiveSummary,
          recommendation: result.decisionOutput.recommendation,
          tradeOffs: result.decisionOutput.tradeOffs,
          alternativeCandidates: result.decisionOutput.alternativeCandidates,
          riskAssessment: result.decisionOutput.riskAssessment,
          implementationRoadmap: result.decisionOutput.implementationRoadmap,
          reasoning: result.decisionOutput.reasoning,
        },
      };
    }),

  /**
   * Scenario Comparison - Two-phase optimized pipeline (Fix 3)
   * Phase 1 (shared, run once): JD Agent + CV Agent × N + Leadership Agent × N
   * Phase 2 (per scenario): Scenario Agent × N + Decision Agent (once per scenario)
   * For 5 candidates, 3 scenarios: 11 calls (Phase 1) + 18 calls (Phase 2) = 29 total vs 51+ before
   * Fix 4: protected
   */
  compareScenarios: protectedProcedure
    .input(
      z.object({
        jobId: z.number(),
        candidateIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const jobData = await db.select().from(jobRequirements).where(eq(jobRequirements.id, input.jobId));
      if (!jobData.length) throw new Error("Job not found");
      const jobProfile = buildJobProfile(jobData[0]);

      const candidateData = await db.select().from(candidates).where(inArray(candidates.id, input.candidateIds));
      const candidateProfiles = candidateData.map(buildCandidateProfile);

      const bmwLeadersRaw = await db.select().from(bmwLeadershipTeam);
      const bmwLeaders: BmwLeader[] = bmwLeadersRaw.map((l) => ({
        ...l,
        priorities: JSON.parse(l.priorities || "[]"),
      }));

      const allScenarios = await db.select().from(scenarios);
      const scenarioContexts: ScenarioContext[] = allScenarios.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        context: s.context,
        priorityAdjustments: JSON.parse(s.priorityAdjustments || "{}"),
      }));

      // ── PHASE 1: Shared agents (run once for all scenarios) ──────────────────
      const jdOutput: JDAgentOutput = await jdAgent(jobProfile);

      const cvOutputs = new Map<number, CVAgentOutput>();
      for (const candidate of candidateProfiles) {
        const cvOut = await cvAgent(candidate, jobProfile, jdOutput);
        cvOutputs.set(candidate.id, cvOut);
      }

      const leadershipOutputs = new Map<number, LeadershipAgentOutput>();
      for (const candidate of candidateProfiles) {
        const leadOut = await leadershipAgent(candidate, jobProfile, bmwLeaders);
        leadershipOutputs.set(candidate.id, leadOut);
      }

      // ── Baseline (no scenario): Decision Agent runs directly on Phase 1 ──────
      const baselineDecision = await decisionAgent(
        candidateProfiles,
        jobProfile,
        jdOutput,
        cvOutputs,
        leadershipOutputs,
        undefined
      );

      // ── PHASE 2: Per-scenario (Scenario Agent × N + Decision Agent × 1) ──────
      const scenarioResults: Array<{
        scenarioId: number | undefined;
        scenarioName: string;
        scenarioOutputs: Map<number, import("./agents").ScenarioAgentOutput>;
        decisionOutput: import("./agents").DecisionAgentOutput;
      }> = [];

      for (const scenario of scenarioContexts) {
        const scenOutMap = new Map<number, import("./agents").ScenarioAgentOutput>();
        for (const candidate of candidateProfiles) {
          const cvOut = cvOutputs.get(candidate.id);
          if (cvOut) {
            const scenOut = await scenarioAgent(candidate, jobProfile, jdOutput, cvOut, scenario);
            scenOutMap.set(candidate.id, scenOut);
          }
        }
        const scenDecision = await decisionAgent(
          candidateProfiles,
          jobProfile,
          jdOutput,
          cvOutputs,
          leadershipOutputs,
          { scenario, outputs: scenOutMap }
        );
        scenarioResults.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          scenarioOutputs: scenOutMap,
          decisionOutput: scenDecision,
        });
      }

      // ── Build comparison matrix ───────────────────────────────────────────────
      const comparisonMatrix = candidateProfiles.map((c) => {
        const baselineCv = cvOutputs.get(c.id);
        const baselineScore = baselineCv?.fitScore || 0;

        const scenarioScores = scenarioResults.map((sr) => {
          const scenOut = sr.scenarioOutputs.get(c.id);
          return {
            scenarioId: sr.scenarioId,
            scenarioName: sr.scenarioName,
            adjustedFitScore: scenOut?.adjustedFitScore || baselineScore,
            derivedWeights: scenOut?.derivedWeights || {},
          };
        });

        return {
          candidateId: c.id,
          candidateName: `${c.firstName} ${c.lastName}`,
          currentRole: c.currentRole,
          currentCompany: c.currentCompany,
          baselineScore,
          misHireRiskScore: baselineCv?.misHireRiskScore || 0,
          estimatedMisHireCostEUR: baselineCv?.estimatedMisHireCostEUR || 0,
          qualityOfHireProjection: baselineCv?.qualityOfHireProjection || 0,
          scenarioScores,
        };
      });

      // Add ranks
      const sortedBaseline = [...comparisonMatrix].sort((a, b) => b.baselineScore - a.baselineScore);
      sortedBaseline.forEach((item, idx) => { (item as any).baselineRank = idx + 1; });

      for (let i = 0; i < scenarioContexts.length; i++) {
        const sorted = [...comparisonMatrix].sort(
          (a, b) => (b.scenarioScores[i]?.adjustedFitScore || 0) - (a.scenarioScores[i]?.adjustedFitScore || 0)
        );
        sorted.forEach((item, idx) => { (item.scenarioScores[i] as any).rank = idx + 1; });
      }

      return {
        jobId: input.jobId,
        jobTitle: jobProfile.jobTitle,
        scenarios: scenarioContexts.map((s) => ({ id: s.id, name: s.name, description: s.description })),
        comparisonMatrix,
        baselineRecommendation: {
          candidateName: baselineDecision.recommendedCandidateName,
          confidenceScore: baselineDecision.confidenceScore,
          executiveSummary: baselineDecision.executiveSummary,
        },
        scenarioRecommendations: scenarioResults.map((sr) => ({
          scenarioId: sr.scenarioId,
          scenarioName: sr.scenarioName,
          candidateName: sr.decisionOutput.recommendedCandidateName,
          confidenceScore: sr.decisionOutput.confidenceScore,
          executiveSummary: sr.decisionOutput.executiveSummary,
        })),
      };
    }),
});
