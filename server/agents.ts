import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import {
  jdAgentOutputs,
  cvAgentOutputs,
  leadershipAgentOutputs,
  scenarioAgentOutputs,
  decisionAgentOutputs,
} from "../drizzle/schema";

// ============================================================================
// UTILITY: Robust JSON parsing with truncation recovery
// ============================================================================

function safeParseJSON(content: any, agentName: string): any {
  if (!content || typeof content !== "string") {
    throw new Error(`Invalid ${agentName} response: no content`);
  }

  // Try direct parse first
  try {
    return JSON.parse(content);
  } catch (e) {
    // If truncated, try to repair by closing open strings/objects/arrays
    console.warn(`[${agentName}] JSON parse failed, attempting repair...`);
    let repaired = content.trim();

    // Count open braces/brackets
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"' && !escaped) { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') openBraces++;
      if (ch === '}') openBraces--;
      if (ch === '[') openBrackets++;
      if (ch === ']') openBrackets--;
    }

    // If we're inside a string, close it
    if (inString) {
      repaired += '"';
    }

    // Close any open brackets/braces
    while (openBrackets > 0) { repaired += ']'; openBrackets--; }
    while (openBraces > 0) { repaired += '}'; openBraces--; }

    try {
      return JSON.parse(repaired);
    } catch (e2) {
      throw new Error(`Invalid ${agentName} response: JSON parse failed even after repair. Length: ${content.length}`);
    }
  }
}

// Truncate long string fields to prevent oversized responses
function truncateString(s: string | undefined | null, maxLen: number): string {
  if (!s) return "";
  if (s.length <= maxLen) return s;
  return s.substring(0, maxLen) + "...";
}

/**
 * Multi-Agent Decision Intelligence System (v2 - All 6 Gap Fixes)
 * 
 * Fixes applied:
 * 1. Leadership Agent grounded in real BMW leader pairings (not floating scores)
 * 2. KPI metrics (mis-hire cost, quality-of-hire) derived by agents with transparent formulas
 * 3. JD Agent derives weights from job text; Scenario Agent reasons about weight changes
 * 4. Scenario comparison support (multi-scenario execution)
 * 5. Decision Agent outputs CHRO-ready executive summary
 * 6. Enriched candidate profiles with automotive-executive context
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface JobProfile {
  jobTitle: string;
  department: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceYearsRequired: number;
  seniority: string;
}

export interface CandidateProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  yearsOfExperience: number;
  currentRole: string;
  currentCompany: string;
  skills: Array<{ name: string; proficiency: string; years: number }>;
  leadershipStyle?: string;
  teamSize?: number;
  achievements?: string[];
  // Enriched automotive-executive fields (Fix 6)
  education?: Array<{ degree: string; institution: string; year: number }>;
  boardExposure?: boolean;
  crossFunctionalExperience?: string[];
  geographicMobility?: string[];
  industryTransitions?: Array<{ from: string; to: string; year: number }>;
  plantScaleExperience?: boolean;
  evProgramCredential?: boolean;
  notableProjects?: string[];
  previousCompanies?: Array<{ company: string; role: string; years: number }>;
}

export interface ScenarioContext {
  id?: number;
  name: string;
  description: string;
  context: string;
  priorityAdjustments: Record<string, number>; // treated as suggestions only
}

export interface BmwLeader {
  id: number;
  name: string;
  role: string;
  department: string;
  leadershipStyle: string;
  teamSize: number;
  priorities: string[];
  background: string;
  decisionMakingStyle: string;
  communicationPreference: string;
}

// ============================================================================
// 1. JD AGENT - Job Description Analysis (Fix 3: derives weights from text)
// ============================================================================

export interface JDAgentOutput {
  coreCompetencies: string[];
  priorityWeights: Record<string, number>;
  reasoning: string;
}

export async function jdAgent(job: JobProfile): Promise<JDAgentOutput> {
  const prompt = `You are a Job Description Analysis Agent for BMW Group's HR Decision Intelligence system.

Your task: Analyze this job description and DERIVE core competencies with priority weights purely from the text. Do NOT use pre-defined weights — reason about what matters most based on the role description, seniority level, and department context.

JOB DESCRIPTION:
Title: ${job.jobTitle}
Department: ${job.department}
Seniority: ${job.seniority}
Experience Required: ${job.experienceYearsRequired} years
Description: ${job.description}
Listed Required Skills: ${job.requiredSkills.join(", ")}
Listed Preferred Skills: ${job.preferredSkills.join(", ")}

INSTRUCTIONS:
1. Read the job description carefully and identify the 5-7 most critical competencies for SUCCESS in this role
2. Assign priority weights (0.0 to 1.0 scale, must sum to 1.0) based on your analysis of the description
3. The weights should reflect what the description EMPHASIZES, not just what's listed
4. Consider: What would make someone FAIL in this role? Weight those competencies higher
5. For executive roles, include both technical AND leadership/strategic competencies
6. Explain your weight derivation logic clearly — a judge should understand WHY each weight was chosen

IMPORTANT: Keep your reasoning CONCISE (max 200 words). Be specific but brief.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a Job Description Analysis Agent. You derive competency weights from job description text through careful reasoning. You never use pre-stored or default weights. Keep all text fields concise (under 200 words each).",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 2000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "jd_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            coreCompetencies: {
              type: "array",
              items: { type: "string" },
              description: "Top 5-7 core competencies derived from the job description",
            },
            priorityWeights: {
              type: "object",
              additionalProperties: { type: "number" },
              description: "Priority weight for each competency (0-1 scale, sum to 1.0), derived from job description emphasis",
            },
            reasoning: {
              type: "string",
              description: "Detailed explanation of HOW weights were derived from the job description text, including which phrases/requirements drove each weight",
            },
          },
          required: ["coreCompetencies", "priorityWeights", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  return safeParseJSON(content, "JD Agent");
}

// ============================================================================
// 2. CV AGENT - Candidate Scoring with KPI Derivation (Fix 2 + Fix 6)
// ============================================================================

export interface CVAgentOutput {
  fitScore: number;
  skillMatches: Array<{ skill: string; match: number; gap: number }>;
  experienceMatch: number;
  misHireRiskScore: number;
  misHireRiskReasoning: string;
  estimatedMisHireCostEUR: number;
  misHireCostFormula: string;
  qualityOfHireProjection: number;
  reasoning: string;
}

export async function cvAgent(
  candidate: CandidateProfile,
  jobProfile: JobProfile,
  jdOutput: JDAgentOutput
): Promise<CVAgentOutput> {
  const candidateSkillsStr = candidate.skills
    .map((s) => `${s.name} (${s.proficiency}, ${s.years} years)`)
    .join("; ");

  const educationStr = candidate.education
    ? candidate.education.map((e) => `${e.degree} from ${e.institution} (${e.year})`).join("; ")
    : "Not specified";

  const previousCompaniesStr = candidate.previousCompanies
    ? candidate.previousCompanies.map((c) => `${c.role} at ${c.company} (${c.years} yrs)`).join("; ")
    : "Not specified";

  const notableProjectsStr = candidate.notableProjects
    ? candidate.notableProjects.join("; ")
    : "Not specified";

  const industryTransitionsStr = candidate.industryTransitions && candidate.industryTransitions.length > 0
    ? candidate.industryTransitions.map((t) => `${t.from} → ${t.to} (${t.year})`).join("; ")
    : "None (single-industry career)";

  const prompt = `You are a Candidate Evaluation Agent for BMW Group's HR Decision Intelligence system.

CANDIDATE PROFILE:
Name: ${candidate.firstName} ${candidate.lastName}
Years of Experience: ${candidate.yearsOfExperience}
Current Role: ${candidate.currentRole}
Current Company: ${candidate.currentCompany}
Skills: ${candidateSkillsStr}
Leadership Style: ${candidate.leadershipStyle || "Not specified"}
Team Size Led: ${candidate.teamSize || "Not specified"}
Education: ${educationStr}
Previous Companies: ${previousCompaniesStr}
Notable Projects: ${notableProjectsStr}
Industry Transitions: ${industryTransitionsStr}
Board Exposure: ${candidate.boardExposure ? "Yes" : "No"}
Plant-Scale Experience: ${candidate.plantScaleExperience ? "Yes" : "No"}
EV Program Credential: ${candidate.evProgramCredential ? "Yes" : "No"}
Cross-Functional Experience: ${candidate.crossFunctionalExperience?.join(", ") || "Not specified"}
Geographic Mobility: ${candidate.geographicMobility?.join(", ") || "Not specified"}

JOB PROFILE:
Title: ${jobProfile.jobTitle}
Department: ${jobProfile.department}
Core Competencies: ${jdOutput.coreCompetencies.join(", ")}
Priority Weights: ${JSON.stringify(jdOutput.priorityWeights)}
Experience Required: ${jobProfile.experienceYearsRequired} years

YOUR TASKS:
1. Score overall fit (0-100) using the JD Agent's priority weights
2. Score each core competency match (0-100) with gap analysis
3. Score experience match (0-100)
4. DERIVE a mis-hire risk score (0-100) using this transparent formula:
   - Start at 50 (baseline risk)
   - Subtract 5 for each year of directly relevant experience beyond minimum requirement (min 0)
   - Add 10 if candidate has no industry transition experience into automotive
   - Add 15 if candidate lacks plant-scale experience for a manufacturing-adjacent role
   - Subtract 10 if candidate has EV program credentials
   - Add 10 for each critical skill gap (proficiency below "advanced" in top-3 weighted competencies)
   - Clamp final score between 5 and 95
5. CALCULATE estimated mis-hire cost using: misHireCostEUR = (misHireRiskScore / 100) × annualCompensation × 3.5
   where annualCompensation is estimated at €${jobProfile.seniority === 'executive' ? '280000' : '180000'} for this seniority level
   Show the full calculation.
6. DERIVE quality-of-hire projection (0-100) as: (fitScore × 0.35) + (experienceMatch × 0.25) + (leadershipReadiness × 0.20) + (culturalAlignment × 0.20)
   where leadershipReadiness and culturalAlignment are your assessed scores.

IMPORTANT: Keep all text fields CONCISE. Reasoning max 150 words. Risk reasoning max 100 words. Formula should be one line.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a Candidate Evaluation Agent. You score candidates AND derive KPI metrics using transparent, auditable formulas. Every number you produce must be traceable to a calculation. Keep all text fields concise — reasoning under 150 words, formulas in one line.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 2000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "cv_evaluation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            fitScore: { type: "number", description: "Overall fit score (0-100)" },
            skillMatches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  match: { type: "number" },
                  gap: { type: "number" },
                },
                required: ["skill", "match", "gap"],
                additionalProperties: false,
              },
            },
            experienceMatch: { type: "number", description: "Experience match score (0-100)" },
            misHireRiskScore: { type: "number", description: "Derived mis-hire risk score (0-100) using the specified formula" },
            misHireRiskReasoning: { type: "string", description: "Step-by-step calculation showing how risk score was derived" },
            estimatedMisHireCostEUR: { type: "number", description: "Calculated mis-hire cost in EUR" },
            misHireCostFormula: { type: "string", description: "The exact formula and numbers used: (riskScore/100) × annualComp × 3.5 = result" },
            qualityOfHireProjection: { type: "number", description: "Derived quality-of-hire projection (0-100)" },
            reasoning: { type: "string", description: "Overall evaluation reasoning" },
          },
          required: ["fitScore", "skillMatches", "experienceMatch", "misHireRiskScore", "misHireRiskReasoning", "estimatedMisHireCostEUR", "misHireCostFormula", "qualityOfHireProjection", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  return safeParseJSON(content, "CV Agent");
}

// ============================================================================
// 3. SCENARIO AGENT - Dynamic Re-ranking (Fix 3: reasons about weight changes)
// ============================================================================

export interface ScenarioAgentOutput {
  adjustedFitScore: number;
  derivedWeights: Record<string, number>;
  weightChangeReasoning: string;
  weightDeviationExplanation: string;
  reasoning: string;
}

export async function scenarioAgent(
  candidate: CandidateProfile,
  jobProfile: JobProfile,
  jdOutput: JDAgentOutput,
  cvOutput: CVAgentOutput,
  scenario: ScenarioContext
): Promise<ScenarioAgentOutput> {
  const prompt = `You are a Scenario Analysis Agent for BMW Group's HR Decision Intelligence system.

SCENARIO:
Name: ${scenario.name}
Description: ${scenario.description}
Context Type: ${scenario.context}

CANDIDATE:
Name: ${candidate.firstName} ${candidate.lastName}
Current Fit Score (baseline): ${cvOutput.fitScore}
Experience: ${candidate.yearsOfExperience} years
Current Company: ${candidate.currentCompany}
Key Skills: ${candidate.skills.map(s => `${s.name} (${s.proficiency})`).join(", ")}
EV Credential: ${candidate.evProgramCredential ? "Yes" : "No"}
Plant Scale Experience: ${candidate.plantScaleExperience ? "Yes" : "No"}
Industry Transitions: ${candidate.industryTransitions?.map(t => `${t.from} → ${t.to}`).join(", ") || "None"}

JOB BASELINE:
Title: ${jobProfile.jobTitle}
Original JD Agent Weights: ${JSON.stringify(jdOutput.priorityWeights)}
Core Competencies: ${jdOutput.coreCompetencies.join(", ")}

TASKS:
1. Based ONLY on the scenario description above, derive new competency weights for THIS scenario (must sum to 1.0)
2. Explain each weight change from the JD Agent baseline — what shifted and why
3. Re-score the candidate's fit under these new scenario-specific weights
4. Provide clear reasoning for the adjusted score

IMPORTANT: Before reading the HR suggestions below, you have already reasoned about the scenario from the description above. Now compare your reasoning to the HR team suggestions. If your analysis leads to different weights, USE YOUR OWN WEIGHTS and explain why you deviate from the suggestions. The suggestions are a sanity check, not a directive.

HR TEAM SUGGESTED ADJUSTMENTS (sanity check only — you may override): ${JSON.stringify(scenario.priorityAdjustments)}

IMPORTANT: Keep all text fields CONCISE. Reasoning max 150 words. Weight change reasoning max 150 words.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a Scenario Analysis Agent. You reason about how business scenarios change competency priorities. You derive weights through analysis, not by reading pre-stored values. You can override HR team suggestions with clear justification. Keep all text fields concise (under 150 words each).",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 2000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "scenario_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            adjustedFitScore: { type: "number", description: "Adjusted fit score for the scenario (0-100)" },
            derivedWeights: {
              type: "object",
              additionalProperties: { type: "number" },
              description: "Scenario-specific competency weights derived through reasoning (sum to 1.0)",
            },
            weightChangeReasoning: {
              type: "string",
              description: "Detailed explanation of each weight change from JD baseline, including which scenario factors drove the change",
            },
            weightDeviationExplanation: {
              type: "string",
              description: "Explain whether you agreed with, modified, or overrode the HR team's suggested weights and why. If you fully agreed, state that explicitly.",
            },
            reasoning: { type: "string", description: "Overall scenario-adjusted evaluation" },
          },
          required: ["adjustedFitScore", "derivedWeights", "weightChangeReasoning", "weightDeviationExplanation", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  return safeParseJSON(content, "Scenario Agent");
}

// ============================================================================
// 4. LEADERSHIP AGENT - Grounded in Real BMW Leader Pairings (Fix 1)
// ============================================================================

export interface LeadershipAgentOutput {
  leadershipStyle: string;
  leadershipScore: number;
  teamDynamicsScore: number;
  culturalFitScore: number;
  leadershipTraits: string[];
  bmwLeaderPairings: Array<{
    bmwLeaderName: string;
    bmwLeaderRole: string;
    compatibilityScore: number;
    dynamicAnalysis: string;
  }>;
  reasoning: string;
}

export async function leadershipAgent(
  candidate: CandidateProfile,
  jobProfile: JobProfile,
  bmwLeaders: BmwLeader[]
): Promise<LeadershipAgentOutput> {
  const bmwLeadersStr = bmwLeaders.map((l) => `
${l.name} (${l.role}, ${l.department}):
  - Leadership Style: ${l.leadershipStyle}
  - Team Size: ${l.teamSize}
  - Decision-Making: ${l.decisionMakingStyle}
  - Communication: ${l.communicationPreference}
  - Priorities: ${l.priorities.join(", ")}
  - Background: ${l.background}`).join("\n");

  const educationStr = candidate.education
    ? candidate.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")
    : "Not specified";

  const prompt = `You are a Leadership Assessment Agent for BMW Group's HR Decision Intelligence system.

CANDIDATE:
Name: ${candidate.firstName} ${candidate.lastName}
Years of Experience: ${candidate.yearsOfExperience}
Current Role: ${candidate.currentRole}
Current Company: ${candidate.currentCompany}
Leadership Style: ${candidate.leadershipStyle || "Not specified"}
Team Size Led: ${candidate.teamSize || "Not specified"}
Education: ${educationStr}
Board Exposure: ${candidate.boardExposure ? "Yes" : "No"}
Cross-Functional Experience: ${candidate.crossFunctionalExperience?.join(", ") || "Not specified"}
Geographic Mobility: ${candidate.geographicMobility?.join(", ") || "Not specified"}
Notable Projects: ${candidate.notableProjects?.join("; ") || "Not specified"}
Achievements: ${candidate.achievements?.join("; ") || "Not specified"}

JOB:
Title: ${jobProfile.jobTitle}
Department: ${jobProfile.department}
Seniority: ${jobProfile.seniority}

CURRENT BMW LEADERSHIP TEAM (the candidate would work alongside these leaders):
${bmwLeadersStr}

CRITICAL INSTRUCTION: You MUST assess compatibility with EACH specific BMW leader listed above. 
For each leader, analyze:
- Style compatibility (e.g., collaborative candidate + directive leader = potential friction OR complementary?)
- Priority alignment (do their priorities overlap or conflict?)
- Communication fit (will they communicate effectively?)
- Likely team dynamics (will this pairing strengthen or weaken the leadership team?)

Provide:
1. Overall leadership score (0-100)
2. Team dynamics score (0-100) — how well they'd integrate with the EXISTING team
3. Cultural fit score (0-100) — alignment with BMW's collaborative engineering culture
4. Specific compatibility analysis for EACH BMW leader (keep each analysis to 1-2 sentences)
5. Key leadership traits (5-7)

IMPORTANT: Keep ALL text fields CONCISE. Dynamic analysis per leader: max 2 sentences. Overall reasoning: max 150 words.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a Leadership Assessment Agent. You assess candidates against SPECIFIC existing BMW leaders, not abstract compatibility scores. Every compatibility assessment must reference the actual leader's name, style, and priorities. Keep dynamic analysis to 1-2 sentences per leader. Keep overall reasoning under 150 words.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 2000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "leadership_assessment",
        strict: true,
        schema: {
          type: "object",
          properties: {
            leadershipStyle: { type: "string", description: "Candidate's leadership style assessment" },
            leadershipScore: { type: "number", description: "Leadership capability score (0-100)" },
            teamDynamicsScore: { type: "number", description: "Team dynamics fit with existing BMW leaders (0-100)" },
            culturalFitScore: { type: "number", description: "BMW cultural alignment score (0-100)" },
            leadershipTraits: {
              type: "array",
              items: { type: "string" },
              description: "Key leadership traits (5-7)",
            },
            bmwLeaderPairings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bmwLeaderName: { type: "string" },
                  bmwLeaderRole: { type: "string" },
                  compatibilityScore: { type: "number", description: "0-100 compatibility with this specific leader" },
                  dynamicAnalysis: { type: "string", description: "How this pairing would work — strengths, risks, dynamics" },
                },
                required: ["bmwLeaderName", "bmwLeaderRole", "compatibilityScore", "dynamicAnalysis"],
                additionalProperties: false,
              },
              description: "Compatibility analysis with each specific BMW leader",
            },
            reasoning: { type: "string", description: "Overall leadership assessment reasoning" },
          },
          required: ["leadershipStyle", "leadershipScore", "teamDynamicsScore", "culturalFitScore", "leadershipTraits", "bmwLeaderPairings", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  return safeParseJSON(content, "Leadership Agent");
}

// ============================================================================
// 5. DECISION AGENT - Final Recommendation with Executive Summary (Fix 5)
// ============================================================================

export interface DecisionAgentOutput {
  recommendedCandidateId: number;
  recommendedCandidateName: string;
  confidenceScore: number;
  executiveSummary: string;
  recommendation: string;
  tradeOffs: Record<string, string>;
  alternativeCandidates: Array<{
    candidateId: number;
    name: string;
    fitScore: number;
    rationale: string;
  }>;
  riskAssessment: string;
  implementationRoadmap: string[];
  reasoning: string;
}

export async function decisionAgent(
  candidates: CandidateProfile[],
  jobProfile: JobProfile,
  jdOutput: JDAgentOutput,
  cvOutputs: Map<number, CVAgentOutput>,
  leadershipOutputs: Map<number, LeadershipAgentOutput>,
  scenarioOutput?: {
    scenario: ScenarioContext;
    outputs: Map<number, ScenarioAgentOutput>;
  }
): Promise<DecisionAgentOutput> {
  const candidateSummaries = candidates
    .map((c) => {
      const cvOut = cvOutputs.get(c.id);
      const leadOut = leadershipOutputs.get(c.id);
      const scenOut = scenarioOutput?.outputs.get(c.id);

      const pairingsStr = leadOut?.bmwLeaderPairings
        ?.map((p) => `  - ${p.bmwLeaderName}: ${p.compatibilityScore}/100`)
        .join("\n") || "  No pairings assessed";

      return `
${c.firstName} ${c.lastName} (${c.currentRole} at ${c.currentCompany}):
- CV Fit Score: ${cvOut?.fitScore || 0}/100
- Experience Match: ${cvOut?.experienceMatch || 0}/100
- Mis-Hire Risk: ${cvOut?.misHireRiskScore || 0}/100 (€${(cvOut?.estimatedMisHireCostEUR || 0).toLocaleString()})
- Quality-of-Hire Projection: ${cvOut?.qualityOfHireProjection || 0}/100
- Leadership Score: ${leadOut?.leadershipScore || 0}/100
- Team Dynamics: ${leadOut?.teamDynamicsScore || 0}/100
- Cultural Fit: ${leadOut?.culturalFitScore || 0}/100
- BMW Leader Compatibility:
${pairingsStr}
${scenOut ? `- Scenario-Adjusted Fit: ${scenOut.adjustedFitScore}/100` : ""}
- Leadership Style: ${leadOut?.leadershipStyle || "Unknown"}
- Key Traits: ${leadOut?.leadershipTraits?.join(", ") || "Unknown"}
- EV Credential: ${c.evProgramCredential ? "Yes" : "No"}
- Plant Scale Experience: ${c.plantScaleExperience ? "Yes" : "No"}
- Board Exposure: ${c.boardExposure ? "Yes" : "No"}`;
    })
    .join("\n");

  const prompt = `You are a Decision Synthesis Agent for BMW Group's HR Decision Intelligence system.

JOB PROFILE:
Title: ${jobProfile.jobTitle}
Department: ${jobProfile.department}
Core Competencies: ${jdOutput.coreCompetencies.join(", ")}

CANDIDATE EVALUATIONS (from CV Agent, Leadership Agent, and KPI derivations):
${candidateSummaries}

${scenarioOutput ? `SCENARIO CONTEXT:
${scenarioOutput.scenario.name}: ${scenarioOutput.scenario.description}` : ""}

YOUR TASKS:
1. Synthesize all agent outputs into a clear recommendation
2. Write an EXECUTIVE SUMMARY (3-4 sentences max) that a CHRO could read and act on immediately. This should sound like a professional HR recommendation brief — not technical JSON. Example tone: "Based on comprehensive multi-agent analysis, we recommend [Name] for the [Role] position with [X]% confidence. [Key reason]. [Key risk and mitigation]. [Timeline recommendation]."
3. Identify trade-offs (what we gain vs. sacrifice with this choice)
4. Rank alternative candidates with rationale
5. Provide risk assessment referencing the derived mis-hire costs (max 100 words)
6. Suggest implementation roadmap (first 90 days, max 3 bullet points)

IMPORTANT: Keep ALL text fields CONCISE. Executive summary: exactly 3-4 sentences. Reasoning: max 200 words. Trade-offs: max 2 sentences each. Alternative rationales: max 1 sentence each.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a Decision Synthesis Agent. You produce CHRO-ready recommendations. Your executive summary should be something a real HR leader would present to the board. Reference specific numbers (mis-hire costs, compatibility scores) to ground your recommendation in data. Keep all text fields concise — executive summary 3-4 sentences, reasoning under 200 words, trade-offs under 2 sentences each.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 3000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "decision_synthesis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            recommendedCandidateName: { type: "string" },
            confidenceScore: { type: "number", description: "Confidence in recommendation (0-100)" },
            executiveSummary: {
              type: "string",
              description: "3-4 sentence CHRO-ready brief. Professional tone. References specific data points. Actionable.",
            },
            recommendation: { type: "string", description: "Detailed recommendation statement" },
            tradeOffs: {
              type: "object",
              additionalProperties: { type: "string" },
              description: "Trade-offs of this decision",
            },
            alternativeCandidates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  fitScore: { type: "number" },
                  rationale: { type: "string" },
                },
                required: ["name", "fitScore", "rationale"],
                additionalProperties: false,
              },
            },
            riskAssessment: {
              type: "string",
              description: "Risk assessment referencing derived mis-hire costs and mitigation strategies",
            },
            implementationRoadmap: {
              type: "array",
              items: { type: "string" },
              description: "First 90 days implementation steps",
            },
            reasoning: { type: "string", description: "Overall decision reasoning" },
          },
          required: ["recommendedCandidateName", "confidenceScore", "executiveSummary", "recommendation", "tradeOffs", "alternativeCandidates", "riskAssessment", "implementationRoadmap", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  const parsed = safeParseJSON(content, "Decision Agent");

  const recommendedCandidate = candidates.find(
    (c) => `${c.firstName} ${c.lastName}` === parsed.recommendedCandidateName
  );

  return {
    recommendedCandidateId: recommendedCandidate?.id || 0,
    recommendedCandidateName: parsed.recommendedCandidateName,
    confidenceScore: parsed.confidenceScore,
    executiveSummary: parsed.executiveSummary,
    recommendation: parsed.recommendation,
    tradeOffs: parsed.tradeOffs,
    alternativeCandidates: parsed.alternativeCandidates.map(
      (alt: { name: string; fitScore: number; rationale: string }) => ({
        candidateId: candidates.find((c) => `${c.firstName} ${c.lastName}` === alt.name)?.id || 0,
        name: alt.name,
        fitScore: alt.fitScore,
        rationale: alt.rationale,
      })
    ),
    riskAssessment: parsed.riskAssessment,
    implementationRoadmap: parsed.implementationRoadmap,
    reasoning: parsed.reasoning,
  };
}

// ============================================================================
// ORCHESTRATION - Execute Full Multi-Agent Pipeline
// ============================================================================

export interface DecisionPipelineResult {
  jdOutput: JDAgentOutput;
  cvOutputs: Map<number, CVAgentOutput>;
  leadershipOutputs: Map<number, LeadershipAgentOutput>;
  scenarioOutputs?: Map<number, ScenarioAgentOutput>;
  decisionOutput: DecisionAgentOutput;
}

export async function executeDecisionPipeline(
  candidates: CandidateProfile[],
  jobProfile: JobProfile,
  bmwLeaders: BmwLeader[],
  scenario?: ScenarioContext,
  jobRequirementId?: number,
): Promise<DecisionPipelineResult> {
  const db = await getDb().catch(() => null);

  // Step 1: JD Agent analyzes job requirements (derives weights from text)
  const jdOutput = await jdAgent(jobProfile);

  // Persist JD Agent output (non-blocking)
  if (db && jobRequirementId) {
    db.insert(jdAgentOutputs).values({
      jobRequirementId,
      coreCompetencies: JSON.stringify(jdOutput.coreCompetencies),
      priorityWeights: JSON.stringify(jdOutput.priorityWeights),
      reasoning: jdOutput.reasoning.substring(0, 2000),
    }).catch(console.error);
  }

  // Step 2: CV Agent scores each candidate (derives KPI metrics)
  const cvOutputs = new Map<number, CVAgentOutput>();
  for (const candidate of candidates) {
    const cvOutput = await cvAgent(candidate, jobProfile, jdOutput);
    cvOutputs.set(candidate.id, cvOutput);

    // Persist CV Agent output (non-blocking)
    if (db && jobRequirementId) {
      db.insert(cvAgentOutputs).values({
        jobRequirementId,
        candidateId: candidate.id,
        fitScore: cvOutput.fitScore,
        skillMatches: JSON.stringify(cvOutput.skillMatches),
        experienceMatch: cvOutput.experienceMatch,
        reasoning: cvOutput.reasoning.substring(0, 2000),
      }).catch(console.error);
    }
  }

  // Step 3: Leadership Agent assesses each candidate against BMW leaders
  const leadershipOutputs = new Map<number, LeadershipAgentOutput>();
  for (const candidate of candidates) {
    const leadOutput = await leadershipAgent(candidate, jobProfile, bmwLeaders);
    leadershipOutputs.set(candidate.id, leadOutput);

    // Persist Leadership Agent output (non-blocking)
    if (db) {
      db.insert(leadershipAgentOutputs).values({
        candidateId: candidate.id,
        leadershipStyle: leadOutput.leadershipStyle.substring(0, 100),
        leadershipScore: leadOutput.leadershipScore,
        teamDynamicsScore: leadOutput.teamDynamicsScore,
        culturalFitScore: leadOutput.culturalFitScore,
        leadershipTraits: JSON.stringify(leadOutput.leadershipTraits),
        teamPairingAnalysis: JSON.stringify(leadOutput.bmwLeaderPairings).substring(0, 2000),
        reasoning: leadOutput.reasoning.substring(0, 2000),
      }).catch(console.error);
    }
  }

  // Step 4: Scenario Agent re-ranks if scenario provided (derives weights through reasoning)
  let scenarioOutputs: Map<number, ScenarioAgentOutput> | undefined;
  if (scenario) {
    scenarioOutputs = new Map<number, ScenarioAgentOutput>();
    for (const candidate of candidates) {
      const cvOutput = cvOutputs.get(candidate.id);
      if (cvOutput) {
        const scenOut = await scenarioAgent(candidate, jobProfile, jdOutput, cvOutput, scenario);
        scenarioOutputs.set(candidate.id, scenOut);

        // Persist Scenario Agent output (non-blocking)
        if (db && jobRequirementId && scenario.id) {
          db.insert(scenarioAgentOutputs).values({
            jobRequirementId,
            scenarioId: scenario.id,
            candidateId: candidate.id,
            adjustedFitScore: scenOut.adjustedFitScore,
            priorityAdjustments: JSON.stringify(scenOut.derivedWeights),
            reasoning: scenOut.reasoning.substring(0, 2000),
          }).catch(console.error);
        }
      }
    }
  }

  // Step 5: Decision Agent synthesizes recommendation (with executive summary)
  const decisionOutput = await decisionAgent(
    candidates,
    jobProfile,
    jdOutput,
    cvOutputs,
    leadershipOutputs,
    scenario && scenarioOutputs ? { scenario, outputs: scenarioOutputs } : undefined
  );

  // Persist Decision Agent output (non-blocking)
  if (db && jobRequirementId) {
    db.insert(decisionAgentOutputs).values({
      jobRequirementId,
      scenarioId: scenario?.id ?? undefined,
      recommendedCandidateId: decisionOutput.recommendedCandidateId,
      confidenceScore: decisionOutput.confidenceScore,
      recommendation: decisionOutput.recommendation.substring(0, 2000),
      tradeOffs: JSON.stringify(decisionOutput.tradeOffs).substring(0, 2000),
      alternativeCandidates: JSON.stringify(decisionOutput.alternativeCandidates).substring(0, 2000),
      reasoning: decisionOutput.reasoning.substring(0, 2000),
    }).catch(console.error);
  }

  return {
    jdOutput,
    cvOutputs,
    leadershipOutputs,
    scenarioOutputs,
    decisionOutput,
  };
}

// ============================================================================
// 6. CV PARSER AGENT - Extract structured profile from raw CV text
// ============================================================================

export interface ParsedAchievement {
  text: string;
  metric: string | null;
  domain: string;
}

export interface CVParserOutput {
  firstName: string;
  lastName: string;
  email: string | null;
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number;
  skills: Array<{ name: string; proficiency: string; years: number }>;
  leadershipStyle: string | null;
  teamSize: number | null;
  achievements: ParsedAchievement[];
  education: Array<{ degree: string; institution: string; year: number }>;
  boardExposure: boolean;
  crossFunctionalExperience: string[];
  geographicMobility: string[];
  industryTransitions: Array<{ from: string; to: string; year: number }>;
  plantScaleExperience: boolean;
  evProgramCredential: boolean;
  notableProjects: string[];
  previousCompanies: Array<{ company: string; role: string; years: number }>;
  careerTrajectory: "ascending" | "lateral" | "specialist";
  rawSummary: string;
  // Confidence metadata — which fields were inferred vs stated
  confidenceIndicators: Record<string, "stated" | "inferred">;
}

export async function cvParserAgent(rawCvText: string): Promise<CVParserOutput> {
  const prompt = `You are a CV Parser Agent for BMW Group's executive-level hiring system.

Your task: Extract structured information from this CV/resume text. You must distinguish between information that is EXPLICITLY STATED in the CV versus information you INFER from context.

CV TEXT:
${rawCvText}

EXTRACTION RULES:
1. Extract all explicitly stated facts: name, current role, company, education, previous companies, skills, team sizes, achievements
2. INFER leadership style from the language used:
   - "drove consensus", "collaborated across", "built partnerships" → collaborative
   - "restructured", "redeployed", "directed transformation" → directive
   - "innovated", "pioneered", "disrupted" → visionary
   - "optimized", "streamlined", "scaled operations" → operational-excellence
3. INFER career trajectory:
   - "ascending" = clear upward progression (analyst → manager → director → VP)
   - "lateral" = moves across functions/industries at similar levels
   - "specialist" = deep expertise in one domain with incremental advancement
4. For skills, estimate proficiency level:
   - "expert" = 8+ years or described as leading/pioneering in the area
   - "advanced" = 4-7 years or significant project leadership
   - "intermediate" = 2-3 years or mentioned as competency
   - "beginner" = mentioned but not emphasized
5. For achievements, extract the METRIC (e.g., "30%", "€2M", "200 people") and DOMAIN (e.g., "cost reduction", "team scaling", "revenue growth")
6. plantScaleExperience = true if CV mentions manufacturing plants, factory operations, or production facilities at scale
7. evProgramCredential = true if CV mentions electric vehicles, EV platforms, battery technology, or electrification programs
8. boardExposure = true if CV mentions board presentations, board advisory, or C-suite reporting
9. rawSummary = 2-3 sentence narrative summarizing the candidate's profile for the Leadership Agent

CONFIDENCE INDICATORS:
For each field, mark whether the value was "stated" (directly in the CV) or "inferred" (your interpretation):
- firstName, lastName, currentRole, currentCompany, email, education, previousCompanies → typically "stated"
- leadershipStyle, careerTrajectory, plantScaleExperience, evProgramCredential → typically "inferred"
- yearsOfExperience → "stated" if explicitly mentioned, "inferred" if calculated from dates
- skills proficiency levels → always "inferred"
- teamSize → "stated" if a number is given, "inferred" if estimated from context`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a CV Parser Agent. You extract structured data from raw CV text, distinguishing between explicitly stated facts and inferred insights. You are precise, honest about uncertainty, and format output for downstream HR decision agents.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "cv_parser_output",
        strict: true,
        schema: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: ["string", "null"], description: "Email if found in CV, null otherwise" },
            currentRole: { type: "string" },
            currentCompany: { type: "string" },
            yearsOfExperience: { type: "number" },
            skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  proficiency: { type: "string", description: "beginner | intermediate | advanced | expert" },
                  years: { type: "number" },
                },
                required: ["name", "proficiency", "years"],
                additionalProperties: false,
              },
            },
            leadershipStyle: { type: ["string", "null"], description: "Inferred: collaborative | directive | visionary | operational-excellence | null if unclear" },
            teamSize: { type: ["number", "null"], description: "Largest team mentioned, null if not found" },
            achievements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string", description: "The achievement description" },
                  metric: { type: ["string", "null"], description: "Quantitative metric if present (e.g., '30%', '€2M')" },
                  domain: { type: "string", description: "Achievement domain (e.g., 'cost reduction', 'team scaling')" },
                },
                required: ["text", "metric", "domain"],
                additionalProperties: false,
              },
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  degree: { type: "string" },
                  institution: { type: "string" },
                  year: { type: "number" },
                },
                required: ["degree", "institution", "year"],
                additionalProperties: false,
              },
            },
            boardExposure: { type: "boolean" },
            crossFunctionalExperience: {
              type: "array",
              items: { type: "string" },
              description: "Functional areas the candidate has worked across",
            },
            geographicMobility: {
              type: "array",
              items: { type: "string" },
              description: "Regions/countries where the candidate has worked",
            },
            industryTransitions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  year: { type: "number" },
                },
                required: ["from", "to", "year"],
                additionalProperties: false,
              },
            },
            plantScaleExperience: { type: "boolean" },
            evProgramCredential: { type: "boolean" },
            notableProjects: {
              type: "array",
              items: { type: "string" },
            },
            previousCompanies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company: { type: "string" },
                  role: { type: "string" },
                  years: { type: "number" },
                },
                required: ["company", "role", "years"],
                additionalProperties: false,
              },
            },
            careerTrajectory: {
              type: "string",
              description: "ascending | lateral | specialist",
            },
            rawSummary: {
              type: "string",
              description: "2-3 sentence narrative summary for the Leadership Agent",
            },
            confidenceIndicators: {
              type: "object",
              additionalProperties: { type: "string" },
              description: "Map of field name → 'stated' or 'inferred'",
            },
          },
          required: [
            "firstName", "lastName", "email", "currentRole", "currentCompany",
            "yearsOfExperience", "skills", "leadershipStyle", "teamSize",
            "achievements", "education", "boardExposure", "crossFunctionalExperience",
            "geographicMobility", "industryTransitions", "plantScaleExperience",
            "evProgramCredential", "notableProjects", "previousCompanies",
            "careerTrajectory", "rawSummary", "confidenceIndicators"
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") {
    throw new Error("Invalid CV Parser Agent response");
  }

  return JSON.parse(content);
}
