import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * KPI-Enhanced Agent Service
 * Integrates BMW HR KPIs into multi-agent decision-making
 */

interface KPIContext {
  timeToFill?: number;
  qualityOfHire?: number;
  internalExternalRatio?: number;
  leadershipCompatibility?: number;
  scenarioRanking?: number;
  misHireCost?: number;
  skillGap?: number;
}

/**
 * Fetch KPI data for a candidate and job
 */
export async function fetchCandidateKPIs(
  candidateId: number,
  jobRequirementId: number
): Promise<KPIContext> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const kpis: KPIContext = {};

  // Fetch Time-to-Fill
  const ttf = await db
    .select()
    .from(schema.timeToFillMetrics)
    .where(eq(schema.timeToFillMetrics.jobRequirementId, jobRequirementId))
    .limit(1);
  if (ttf.length > 0) kpis.timeToFill = ttf[0]!.daysToFill || 0;

  // Fetch Quality of Hire
  const qoh = await db
    .select()
    .from(schema.qualityOfHireMetrics)
    .where(
      and(
        eq(schema.qualityOfHireMetrics.candidateId, candidateId),
        eq(schema.qualityOfHireMetrics.jobRequirementId, jobRequirementId)
      )
    )
    .limit(1);
  if (qoh.length > 0) kpis.qualityOfHire = qoh[0]!.qualityScore || 0;

  // Fetch Internal/External Ratio
  const ier = await db
    .select()
    .from(schema.internalExternalRatioMetrics)
    .where(
      and(
        eq(schema.internalExternalRatioMetrics.candidateId, candidateId),
        eq(schema.internalExternalRatioMetrics.jobRequirementId, jobRequirementId)
      )
    )
    .limit(1);
  if (ier.length > 0) {
    kpis.internalExternalRatio = ier[0]!.hireSource === "internal" ? 100 : 0;
  }

  // Fetch Mis-Hire Cost
  const mhc = await db
    .select()
    .from(schema.misHireCostMetrics)
    .where(
      and(
        eq(schema.misHireCostMetrics.candidateId, candidateId),
        eq(schema.misHireCostMetrics.jobRequirementId, jobRequirementId)
      )
    )
    .limit(1);
  if (mhc.length > 0) kpis.misHireCost = mhc[0]!.misHireRiskScore || 0;

  // Fetch Skill Gap
  const sg = await db
    .select()
    .from(schema.skillGapMetrics)
    .where(
      and(
        eq(schema.skillGapMetrics.candidateId, candidateId),
        eq(schema.skillGapMetrics.jobRequirementId, jobRequirementId)
      )
    )
    .limit(1);
  if (sg.length > 0) kpis.skillGap = sg[0]!.skillGapIndex || 0;

  return kpis;
}

/**
 * Fetch leadership compatibility metrics for a candidate pair
 */
export async function fetchLeadershipCompatibility(
  candidateId1: number,
  candidateId2: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const compat = await db
    .select()
    .from(schema.leadershipCompatibilityMetrics)
    .where(
      and(
        eq(schema.leadershipCompatibilityMetrics.candidateId1, candidateId1),
        eq(schema.leadershipCompatibilityMetrics.candidateId2, candidateId2)
      )
    )
    .limit(1);

  return compat.length > 0 ? compat[0]!.compatibilityScore : 50;
}

/**
 * KPI-Enhanced CV Agent
 * Incorporates quality of hire, mis-hire cost, and skill gap metrics
 */
export async function kpiEnhancedCVAgent(
  candidate: any,
  jobProfile: any,
  kpiContext: KPIContext
): Promise<any> {
  const prompt = `You are a KPI-Enhanced Candidate Evaluation Agent for BMW.

Candidate Profile:
- Name: ${candidate.firstName} ${candidate.lastName}
- Current Role: ${candidate.currentRole} at ${candidate.currentCompany}
- Years of Experience: ${candidate.yearsOfExperience}
- Leadership Style: ${candidate.leadershipStyle}
- Team Size Led: ${candidate.teamSize || "N/A"}
- Key Skills: ${candidate.skills}

Job Requirements:
${JSON.stringify(jobProfile, null, 2)}

BMW HR KPI Context:
- Quality of Hire Score: ${kpiContext.qualityOfHire || "N/A"} (0-100, higher is better)
- Mis-Hire Risk Score: ${kpiContext.misHireCost || "N/A"} (0-100, lower is better)
- Skill Gap Index: ${kpiContext.skillGap || "N/A"} (0-100, lower is better)
- Internal Candidate: ${kpiContext.internalExternalRatio === 100 ? "Yes" : "No"}
- Time-to-Fill Pressure: ${kpiContext.timeToFill ? `${kpiContext.timeToFill} days` : "N/A"}

Analyze this candidate considering:
1. Technical fit against job requirements
2. Historical quality of hire metrics (if available)
3. Mis-hire risk factors (skill gaps, experience gaps, cultural fit)
4. Skill development potential and training requirements
5. Internal mobility benefits vs. external hire costs

Provide a comprehensive evaluation with:
- Overall fit score (0-100)
- Skill match analysis with gap identification
- Quality of hire projection (0-100)
- Mis-hire risk assessment (0-100, where 100 = highest risk)
- Development recommendations
- Key strengths and concerns

Return as JSON with these exact fields:
{
  "candidateName": "string",
  "fitScore": number,
  "skillMatches": ["string"],
  "skillGaps": ["string"],
  "experienceMatch": number,
  "qualityOfHireProjection": number,
  "misHireRiskScore": number,
  "developmentPotential": number,
  "reasoning": "string"
}`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "kpi_cv_agent_output",
        strict: true,
        schema: {
          type: "object",
          properties: {
            candidateName: { type: "string" },
            fitScore: { type: "number" },
            skillMatches: { type: "array", items: { type: "string" } },
            skillGaps: { type: "array", items: { type: "string" } },
            experienceMatch: { type: "number" },
            qualityOfHireProjection: { type: "number" },
            misHireRiskScore: { type: "number" },
            developmentPotential: { type: "number" },
            reasoning: { type: "string" },
          },
          required: [
            "candidateName",
            "fitScore",
            "skillMatches",
            "skillGaps",
            "experienceMatch",
            "qualityOfHireProjection",
            "misHireRiskScore",
            "developmentPotential",
            "reasoning",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("No response from LLM");
  const contentStr = typeof content === "string" ? content : JSON.stringify(content);
  return JSON.parse(contentStr);
}

/**
 * KPI-Enhanced Leadership Agent
 * Incorporates leadership compatibility metrics
 */
export async function kpiEnhancedLeadershipAgent(
  candidate: any,
  jobProfile: any,
  compatibilityScores: Map<number, number> = new Map()
): Promise<any> {
  const prompt = `You are a KPI-Enhanced Leadership Assessment Agent for BMW.

Candidate Profile:
- Name: ${candidate.firstName} ${candidate.lastName}
- Leadership Style: ${candidate.leadershipStyle}
- Team Size Led: ${candidate.teamSize}
- Current Role: ${candidate.currentRole}

Job Context:
${JSON.stringify(jobProfile, null, 2)}

Leadership Compatibility Data:
${Array.from(compatibilityScores.entries())
  .map(([id, score]) => `- Compatibility Score: ${score}/100`)
  .join("\n")}

Assess this candidate's leadership profile considering:
1. Leadership style fit for the role
2. Team dynamics and collaboration potential
3. Cultural alignment with BMW's values
4. Pairing compatibility with existing leadership team
5. Ability to navigate EV transformation challenges

Provide analysis with:
- Leadership style assessment
- Leadership effectiveness score (0-100)
- Team dynamics score (0-100)
- Cultural fit score (0-100)
- Key leadership traits
- Pairing recommendations

Return as JSON:
{
  "leadershipStyle": "string",
  "leadershipScore": number,
  "teamDynamicsScore": number,
  "culturalFitScore": number,
  "leadershipTraits": ["string"],
  "pairingRecommendations": "string",
  "reasoning": "string"
}`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "kpi_leadership_agent_output",
        strict: true,
        schema: {
          type: "object",
          properties: {
            leadershipStyle: { type: "string" },
            leadershipScore: { type: "number" },
            teamDynamicsScore: { type: "number" },
            culturalFitScore: { type: "number" },
            leadershipTraits: { type: "array", items: { type: "string" } },
            pairingRecommendations: { type: "string" },
            reasoning: { type: "string" },
          },
          required: [
            "leadershipStyle",
            "leadershipScore",
            "teamDynamicsScore",
            "culturalFitScore",
            "leadershipTraits",
            "pairingRecommendations",
            "reasoning",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("No response from LLM");
  const contentStr = typeof content === "string" ? content : JSON.stringify(content);
  return JSON.parse(contentStr);
}

/**
 * KPI-Enhanced Scenario Agent
 * Incorporates scenario-adjusted rankings and cost-of-mis-hire
 */
export async function kpiEnhancedScenarioAgent(
  candidates: any[],
  jobProfile: any,
  scenario: any,
  kpiContexts: Map<number, KPIContext> = new Map()
): Promise<any> {
  const candidatesSummary = candidates
    .map((c, idx) => {
      const kpi = kpiContexts.get(c.id) || {};
      return `${idx + 1}. ${c.firstName} ${c.lastName} - Risk Score: ${kpi.misHireCost || "N/A"}, Skill Gap: ${kpi.skillGap || "N/A"}`;
    })
    .join("\n");

  const prompt = `You are a KPI-Enhanced Scenario Analysis Agent for BMW.

Scenario Context:
${JSON.stringify(scenario, null, 2)}

Job Requirements:
${JSON.stringify(jobProfile, null, 2)}

Candidates with KPI Data:
${candidatesSummary}

Analyze how this scenario changes candidate rankings considering:
1. Mis-hire cost implications in this context
2. Skill gap urgency and training timelines
3. Time-to-fill pressure vs. quality trade-offs
4. Strategic alignment with scenario priorities

Provide scenario-adjusted analysis with:
- Candidate re-ranking (1-5)
- Ranking shift rationale
- Scenario-specific risk assessment
- Cost-benefit analysis for each candidate

Return as JSON:
{
  "scenarioName": "string",
  "candidateRankings": [
    {
      "candidateName": "string",
      "rank": number,
      "rankingShift": number,
      "scenarioFitScore": number,
      "riskAssessment": "string"
    }
  ],
  "costBenefitAnalysis": "string",
  "reasoning": "string"
}`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "kpi_scenario_agent_output",
        strict: true,
        schema: {
          type: "object",
          properties: {
            scenarioName: { type: "string" },
            candidateRankings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  candidateName: { type: "string" },
                  rank: { type: "number" },
                  rankingShift: { type: "number" },
                  scenarioFitScore: { type: "number" },
                  riskAssessment: { type: "string" },
                },
                required: ["candidateName", "rank", "rankingShift", "scenarioFitScore", "riskAssessment"],
                additionalProperties: false,
              },
            },
            costBenefitAnalysis: { type: "string" },
            reasoning: { type: "string" },
          },
          required: ["scenarioName", "candidateRankings", "costBenefitAnalysis", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("No response from LLM");
  const contentStr = typeof content === "string" ? content : JSON.stringify(content);
  return JSON.parse(contentStr);
}

/**
 * KPI-Enhanced Decision Agent
 * Synthesizes all KPI data into final recommendation
 */
export async function kpiEnhancedDecisionAgent(
  topCandidates: any[],
  jobProfile: any,
  kpiSummary: any
): Promise<any> {
  const prompt = `You are a KPI-Enhanced Decision Agent for BMW's VP Engineering role.

Top Candidates:
${topCandidates.map((c) => `- ${c.firstName} ${c.lastName}: Fit Score ${c.fitScore}, Risk ${c.misHireRiskScore}`).join("\n")}

Job Requirements:
${JSON.stringify(jobProfile, null, 2)}

KPI Summary:
${JSON.stringify(kpiSummary, null, 2)}

Synthesize all data and provide:
1. Recommended candidate with full justification
2. Key decision factors (quality, risk, cost, skill gaps)
3. Alternative candidates and trade-offs
4. Risk mitigation strategies
5. Success metrics for the hire

Return as JSON:
{
  "recommendedCandidate": "string",
  "confidenceScore": number,
  "recommendation": "string",
  "keyDecisionFactors": ["string"],
  "tradeOffs": "string",
  "alternativeCandidates": ["string"],
  "riskMitigation": "string",
  "successMetrics": ["string"],
  "reasoning": "string"
}`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "kpi_decision_agent_output",
        strict: true,
        schema: {
          type: "object",
          properties: {
            recommendedCandidate: { type: "string" },
            confidenceScore: { type: "number" },
            recommendation: { type: "string" },
            keyDecisionFactors: { type: "array", items: { type: "string" } },
            tradeOffs: { type: "string" },
            alternativeCandidates: { type: "array", items: { type: "string" } },
            riskMitigation: { type: "string" },
            successMetrics: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" },
          },
          required: [
            "recommendedCandidate",
            "confidenceScore",
            "recommendation",
            "keyDecisionFactors",
            "tradeOffs",
            "alternativeCandidates",
            "riskMitigation",
            "successMetrics",
            "reasoning",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("No response from LLM");
  const contentStr = typeof content === "string" ? content : JSON.stringify(content);
  return JSON.parse(contentStr);
}
