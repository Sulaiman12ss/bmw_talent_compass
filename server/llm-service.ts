import { invokeLLM } from "./_core/llm";
import { Employee, Skill, PerformanceRating, TrainingRecord } from "../drizzle/schema";

/**
 * Generate talent assessment summary using LLM
 */
export async function generateTalentAssessmentSummary(
  employee: Employee,
  skills: Skill[],
  performance: PerformanceRating[],
  training: TrainingRecord[]
): Promise<{
  summary: string;
  hiddenTalentFlags: string[];
  recommendedSkills: string[];
  recommendedRoles: string[];
}> {
  const skillsList = skills.map((s) => `${s.skillName} (${s.proficiencyLevel})`).join(", ");
  const avgPerformance = performance.length > 0
    ? Math.round(performance.reduce((sum, p) => sum + p.technicalScore, 0) / performance.length)
    : 0;
  const trainingList = training.map((t) => `${t.trainingName} (${t.status})`).join(", ");

  const prompt = `You are an expert HR talent analyst. Analyze the following employee profile and provide insights:

Employee: ${employee.firstName} ${employee.lastName}
Position: ${employee.position}
Level: ${employee.level}
Department: ${employee.department}
Years at Company: ${employee.yearsAtCompany}
Years in Role: ${employee.yearsInRole}

Skills: ${skillsList || "No skills recorded"}
Average Performance Score: ${avgPerformance}/5
Training Completed: ${trainingList || "No training records"}

Based on this profile, provide:
1. A brief assessment summary (2-3 sentences)
2. Hidden talent indicators (list 2-3 unique strengths or overlooked capabilities)
3. Recommended skills to develop (list 3-4 skills)
4. Recommended career paths (list 2-3 potential roles)

Format your response as JSON with keys: summary, hiddenTalentFlags (array), recommendedSkills (array), recommendedRoles (array)`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert HR talent analyst specializing in identifying hidden talent and career development.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "talent_assessment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Brief talent assessment summary" },
              hiddenTalentFlags: {
                type: "array",
                items: { type: "string" },
                description: "Hidden talent indicators",
              },
              recommendedSkills: {
                type: "array",
                items: { type: "string" },
                description: "Skills to develop",
              },
              recommendedRoles: {
                type: "array",
                items: { type: "string" },
                description: "Recommended career paths",
              },
            },
            required: ["summary", "hiddenTalentFlags", "recommendedSkills", "recommendedRoles"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") throw new Error("No response from LLM");

    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary,
      hiddenTalentFlags: parsed.hiddenTalentFlags || [],
      recommendedSkills: parsed.recommendedSkills || [],
      recommendedRoles: parsed.recommendedRoles || [],
    };
  } catch (error) {
    console.error("Error generating talent assessment:", error);
    return {
      summary: "Unable to generate AI assessment at this time.",
      hiddenTalentFlags: [],
      recommendedSkills: [],
      recommendedRoles: [],
    };
  }
}

/**
 * Generate succession planning recommendations
 */
export async function generateSuccessionRecommendations(
  roleName: string,
  currentHolder: Employee | null,
  successorCandidates: Employee[]
): Promise<string> {
  const candidatesInfo = successorCandidates
    .map((c) => `- ${c.firstName} ${c.lastName} (${c.position}, Level: ${c.level})`)
    .join("\n");

  const prompt = `You are an expert in leadership succession planning. Analyze the following scenario:

Critical Role: ${roleName}
Current Holder: ${currentHolder ? `${currentHolder.firstName} ${currentHolder.lastName}` : "Vacant"}

Potential Successors:
${candidatesInfo}

Provide a concise succession planning recommendation (2-3 sentences) that includes:
1. Primary successor recommendation
2. Key development areas needed
3. Timeline for transition

Be specific and actionable.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert in leadership succession planning and organizational development.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    return (typeof content === "string" ? content : "Unable to generate recommendations.");
  } catch (error) {
    console.error("Error generating succession recommendations:", error);
    return "Unable to generate recommendations at this time.";
  }
}

/**
 * Generate compensation analysis insights
 */
export async function generateCompensationInsights2(
  department: string,
  avgSalary: number,
  marketBenchmark: number,
  employeeCount: number
): Promise<string> {
  const gap = marketBenchmark - avgSalary;
  const gapPercentage = ((gap / marketBenchmark) * 100).toFixed(1);

  const prompt = `You are a compensation analyst. Analyze this compensation data and provide insights:

Department: ${department}
Average Salary: $${avgSalary.toLocaleString()}
Market Benchmark: $${marketBenchmark.toLocaleString()}
Salary Gap: $${Math.abs(gap).toLocaleString()} (${gap > 0 ? "below" : "above"} market by ${gapPercentage}%)
Employee Count: ${employeeCount}

Provide a brief analysis (2-3 sentences) that includes:
1. Competitiveness assessment
2. Retention risk if applicable
3. Recommended action

Be specific and data-driven.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert compensation analyst specializing in market benchmarking and pay equity.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    return (typeof content === "string" ? content : "Unable to generate analysis.");
  } catch (error) {
    console.error("Error generating compensation insights:", error);
    return "Unable to generate analysis at this time.";
  }
}

/**
 * Generate compensation analysis insights (deprecated - use generateCompensationInsights2)
 */
export async function generateCompensationInsights(
  department: string,
  avgSalary: number,
  marketBenchmark: number,
  employeeCount: number
): Promise<string> {
  const gap = marketBenchmark - avgSalary;
  const gapPercentage = ((gap / marketBenchmark) * 100).toFixed(1);

  const prompt = `You are a compensation analyst. Analyze this compensation data and provide insights:

Department: ${department}
Average Salary: $${avgSalary.toLocaleString()}
Market Benchmark: $${marketBenchmark.toLocaleString()}
Salary Gap: $${Math.abs(gap).toLocaleString()} (${gap > 0 ? "below" : "above"} market by ${gapPercentage}%)
Employee Count: ${employeeCount}

Provide a brief analysis (2-3 sentences) that includes:
1. Competitiveness assessment
2. Retention risk if applicable
3. Recommended action

Be specific and data-driven.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert compensation analyst specializing in market benchmarking and pay equity.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    return (typeof content === "string" ? content : "Unable to generate analysis.");
  } catch (error) {
    console.error("Error generating compensation insights:", error);
    return "Unable to generate analysis at this time.";
  }
}

/**
 * Generate upskilling recommendations
 */
export async function generateUpskillRecommendations(
  employee: Employee,
  currentSkills: Skill[],
  futureNeeds: string[]
): Promise<{
  recommendedPath: string;
  trainingPrograms: string[];
  timeline: string;
}> {
  const skillsList = currentSkills.map((s) => s.skillName).join(", ");
  const futureNeedsList = futureNeeds.join(", ");

  const prompt = `You are an expert in career development and upskilling strategies. Create a personalized upskilling path:

Employee: ${employee.firstName} ${employee.lastName}
Current Position: ${employee.position}
Current Level: ${employee.level}
Current Skills: ${skillsList || "No skills recorded"}
Company Future Needs: ${futureNeedsList}

Provide a JSON response with:
1. recommendedPath: A brief description of the recommended career development path (1-2 sentences)
2. trainingPrograms: List of 3-4 specific training programs or certifications
3. timeline: Estimated timeline for skill development (e.g., "6-12 months")

Format as JSON with keys: recommendedPath, trainingPrograms (array), timeline`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert in career development, upskilling, and organizational learning.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "upskilling_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendedPath: { type: "string" },
              trainingPrograms: {
                type: "array",
                items: { type: "string" },
              },
              timeline: { type: "string" },
            },
            required: ["recommendedPath", "trainingPrograms", "timeline"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") throw new Error("No response from LLM");

    const parsed = JSON.parse(content);
    return {
      recommendedPath: parsed.recommendedPath,
      trainingPrograms: parsed.trainingPrograms || [],
      timeline: parsed.timeline,
    };
  } catch (error) {
    console.error("Error generating upskilling recommendations:", error);
    return {
      recommendedPath: "Unable to generate recommendations at this time.",
      trainingPrograms: [],
      timeline: "N/A",
    };
  }
}

/**
 * Generate talent risk alerts
 */
export async function generateTalentRiskAlert(
  employee: Employee,
  riskFactors: string[]
): Promise<{
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}> {
  const riskList = riskFactors.join(", ");

  const prompt = `You are an HR risk analyst. Assess the following talent risk situation:

Employee: ${employee.firstName} ${employee.lastName}
Position: ${employee.position}
Risk Factors: ${riskList}

Provide a JSON response with:
1. title: A concise alert title (max 10 words)
2. description: Brief description of the risk and recommended action (1-2 sentences)
3. severity: Risk level (low, medium, high, or critical)

Format as JSON with keys: title, description, severity`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert HR risk analyst specializing in talent retention and organizational risks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "talent_risk",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              severity: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
              },
            },
            required: ["title", "description", "severity"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") throw new Error("No response from LLM");

    const parsed = JSON.parse(content);
    return {
      title: parsed.title,
      description: parsed.description,
      severity: parsed.severity,
    };
  } catch (error) {
    console.error("Error generating talent risk alert:", error);
    return {
      title: "Talent Risk Detected",
      description: "Unable to generate detailed analysis at this time.",
      severity: "medium",
    };
  }
}
