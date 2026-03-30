import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/bmw_talent_compass";

async function seedKPIData() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("🌱 Seeding BMW HR KPI data...\n");

  try {
    // Get existing job requirements and candidates
    const jobs = await db.select().from(schema.jobRequirements).limit(1);
    const candidates = await db.select().from(schema.candidates).limit(5);
    const scenarios = await db.select().from(schema.scenarios).limit(3);

    if (!jobs.length || !candidates.length || !scenarios.length) {
      console.error("❌ Missing base data (jobs, candidates, scenarios). Run seed-demo-data.ts first.");
      process.exit(1);
    }

    const jobId = jobs[0]!.id;
    const candidateIds = candidates.map((c) => c.id);
    const scenarioIds = scenarios.map((s) => s.id);

    // ========== KPI 1: Time-to-Fill Metrics ==========
    console.log("📊 Seeding KPI 1: Time-to-Fill Metrics...");
    await db.insert(schema.timeToFillMetrics).values({
      jobRequirementId: jobId,
      requisitionOpenDate: new Date("2026-03-01"),
      offerAcceptanceDate: new Date("2026-04-15"),
      daysToFill: 45,
      sourcingChannel: "Executive Search Firm",
      targetDaysToFill: 60,
      status: "filled",
    });

    // ========== KPI 2: Quality of Hire Metrics ==========
    console.log("📊 Seeding KPI 2: Quality of Hire Metrics...");
    const qualityScores = [85, 78, 72, 88, 65]; // Scores for Alice, Bob, Carol, David, Eve
    for (let i = 0; i < candidateIds.length; i++) {
      await db.insert(schema.qualityOfHireMetrics).values({
        candidateId: candidateIds[i]!,
        jobRequirementId: jobId,
        performanceRating12M: qualityScores[i]! + Math.floor(Math.random() * 10),
        performanceRating24M: qualityScores[i]! + Math.floor(Math.random() * 15),
        goalAchievementRate: 70 + Math.floor(Math.random() * 30),
        retentionStatus: "active",
        managerSatisfaction: 75 + Math.floor(Math.random() * 25),
        projectDeliveryScore: 80 + Math.floor(Math.random() * 20),
        qualityScore: qualityScores[i]!,
      });
    }

    // ========== KPI 3: Internal vs. External Hire Ratio ==========
    console.log("📊 Seeding KPI 3: Internal/External Ratio Metrics...");
    const hireSources = ["external", "external", "external", "external", "internal"]; // Eve is internal
    for (let i = 0; i < candidateIds.length; i++) {
      await db.insert(schema.internalExternalRatioMetrics).values({
        candidateId: candidateIds[i]!,
        jobRequirementId: jobId,
        hireSource: hireSources[i]! as "internal" | "external",
        internalMobilityLevel: hireSources[i] === "internal" ? "High" : "N/A",
        successionPlanCoverage: hireSources[i] === "internal",
        benchStrengthRating: 70 + Math.floor(Math.random() * 30),
      });
    }

    // ========== KPI 4: Leadership Compatibility Metrics ==========
    console.log("📊 Seeding KPI 4: Leadership Compatibility Metrics...");
    // Create compatibility scores between candidate pairs
    const compatibilityPairs = [
      { c1: 0, c2: 1, score: 72 }, // Alice + Bob
      { c1: 0, c2: 2, score: 85 }, // Alice + Carol
      { c1: 0, c2: 3, score: 78 }, // Alice + David
      { c1: 1, c2: 2, score: 65 }, // Bob + Carol
      { c1: 1, c2: 3, score: 88 }, // Bob + David
      { c1: 2, c2: 3, score: 70 }, // Carol + David
    ];

    for (const pair of compatibilityPairs) {
      await db.insert(schema.leadershipCompatibilityMetrics).values({
        candidateId1: candidateIds[pair.c1]!,
        candidateId2: candidateIds[pair.c2]!,
        compatibilityScore: pair.score,
        leadershipStyleMatch: pair.score - 5 + Math.floor(Math.random() * 10),
        collaborationHistory: `Historical collaboration data for candidates ${pair.c1} and ${pair.c2}`,
        conflictResolutionPattern: ["Collaborative", "Assertive", "Compromising"][Math.floor(Math.random() * 3)]!,
        teamEngagementImpact: 70 + Math.floor(Math.random() * 30),
        plantKPIImpact: `Quality improvement: +${5 + Math.floor(Math.random() * 15)}%, Efficiency: +${3 + Math.floor(Math.random() * 12)}%`,
      });
    }

    // ========== KPI 5: Scenario-Adjusted Candidate Ranking ==========
    console.log("📊 Seeding KPI 5: Scenario Ranking Metrics...");
    const baselineRanks = [1, 2, 5, 3, 4]; // Alice, Bob, Carol, David, Eve
    for (let s = 0; s < scenarioIds.length; s++) {
      for (let c = 0; c < candidateIds.length; c++) {
        const baseRank = baselineRanks[c]!;
        const rankShift = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
        const adjustedRank = Math.max(1, baseRank + rankShift);

        await db.insert(schema.scenarioRankingMetrics).values({
          jobRequirementId: jobId,
          scenarioId: scenarioIds[s]!,
          candidateId: candidateIds[c]!,
          baselineRank: baseRank,
          scenarioAdjustedRank: adjustedRank,
          rankingShift: rankShift,
          priorityReweighting: JSON.stringify({
            evExpertise: 30 + Math.floor(Math.random() * 20),
            aiMlCapability: 20 + Math.floor(Math.random() * 20),
            teamLeadership: 25 + Math.floor(Math.random() * 15),
            executionSpeed: 15 + Math.floor(Math.random() * 20),
          }),
          strategicAlignment: 70 + Math.floor(Math.random() * 30),
        });
      }
    }

    // ========== KPI 6: Cost of Mis-Hire ==========
    console.log("📊 Seeding KPI 6: Mis-Hire Cost Metrics...");
    const misHireRiskScores = [15, 25, 55, 20, 35]; // Risk scores for each candidate
    for (let i = 0; i < candidateIds.length; i++) {
      const riskScore = misHireRiskScores[i]!;
      const totalCost = riskScore * 50000; // Base cost multiplier

      await db.insert(schema.misHireCostMetrics).values({
        candidateId: candidateIds[i]!,
        jobRequirementId: jobId,
        separationCost: Math.floor(totalCost * 0.2),
        reRecruitmentCost: Math.floor(totalCost * 0.3),
        interimLeadershipCost: Math.floor(totalCost * 0.15),
        projectDelayCost: Math.floor(totalCost * 0.25),
        teamTurnoverCost: Math.floor(totalCost * 0.1),
        totalMisHireCost: Math.floor(totalCost),
        misHireRiskScore: riskScore,
      });
    }

    // ========== KPI 7: Skill Gap Metrics ==========
    console.log("📊 Seeding KPI 7: Skill Gap Metrics...");
    const skillProfiles = [
      {
        current: ["EV Systems", "Team Leadership", "Automotive Engineering", "Strategic Planning"],
        required: ["EV Systems", "AI/ML", "Team Leadership", "Software Architecture", "Supply Chain"],
        gap: 35,
      },
      {
        current: ["AI/ML", "Software Architecture", "Tech Leadership", "Cloud Systems"],
        required: ["EV Systems", "AI/ML", "Team Leadership", "Software Architecture", "Automotive"],
        gap: 45,
      },
      {
        current: ["Manufacturing", "Quality Control", "Production Management"],
        required: ["EV Systems", "AI/ML", "Team Leadership", "Software Architecture", "Supply Chain"],
        gap: 80,
      },
      {
        current: ["EV Startups", "Battery Systems", "Team Leadership", "Rapid Scaling"],
        required: ["EV Systems", "AI/ML", "Team Leadership", "Software Architecture", "Enterprise Scale"],
        gap: 40,
      },
      {
        current: ["Traditional Automotive", "Manufacturing", "Quality", "Supply Chain"],
        required: ["EV Systems", "AI/ML", "Team Leadership", "Software Architecture", "Supply Chain"],
        gap: 60,
      },
    ];

    for (let i = 0; i < candidateIds.length; i++) {
      const profile = skillProfiles[i]!;
      await db.insert(schema.skillGapMetrics).values({
        candidateId: candidateIds[i]!,
        jobRequirementId: jobId,
        currentSkills: JSON.stringify(profile.current),
        requiredSkills: JSON.stringify(profile.required),
        skillGapIndex: profile.gap,
        criticalSkillGaps: JSON.stringify(
          profile.required.filter((s) => !profile.current.includes(s))
        ),
        developmentPotential: 100 - profile.gap,
        trainingRequirements: `${profile.gap > 60 ? "Intensive" : "Moderate"} training program recommended`,
        emergingSkillDemand: "AI/ML, Battery Technology, Software Architecture, Supply Chain 4.0",
      });
    }

    console.log("\n✅ KPI data seeding complete!");
    console.log("📈 Generated data for:");
    console.log("   • Time-to-Fill: 45 days (target: 60 days)");
    console.log("   • Quality of Hire: Scores 65-88 across candidates");
    console.log("   • Internal/External: 80% external, 20% internal");
    console.log("   • Leadership Compatibility: 6 pairing combinations");
    console.log("   • Scenario Rankings: 3 scenarios × 5 candidates");
    console.log("   • Mis-Hire Costs: Risk scores 15-55 with cost projections");
    console.log("   • Skill Gaps: 35-80 gap index across candidates");
  } catch (error) {
    console.error("❌ Error seeding KPI data:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedKPIData();
