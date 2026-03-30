import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const levelEnum = pgEnum("level", [
  "junior",
  "mid",
  "senior",
  "lead",
  "manager",
  "director",
  "executive",
]);
export const proficiencyEnum = pgEnum("proficiencyLevel", [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);
export const trainingStatusEnum = pgEnum("trainingStatus", [
  "planned",
  "in_progress",
  "completed",
]);
export const riskLevelEnum = pgEnum("riskLevel", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const alertTypeEnum = pgEnum("alertType", [
  "talent_risk",
  "succession_gap",
  "compensation_trend",
  "skill_gap",
]);
export const alertSeverityEnum = pgEnum("alertSeverity", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const fillStatusEnum = pgEnum("fillStatus", [
  "open",
  "filled",
  "cancelled",
]);
export const retentionStatusEnum = pgEnum("retentionStatus", [
  "active",
  "departed",
  "pending",
]);
export const hireSourceEnum = pgEnum("hireSource", ["internal", "external"]);

// ─── Tables ───────────────────────────────────────────────────────────────────

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Employee table - Core employee information
 */
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  department: varchar("department", { length: 100 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  level: levelEnum("level").notNull(),
  yearsAtCompany: integer("yearsAtCompany").notNull(),
  yearsInRole: integer("yearsInRole").notNull(),
  managerId: integer("managerId"),
  biography: text("biography"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Performance ratings
 */
export const performanceRatings = pgTable("performanceRatings", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  ratingYear: integer("ratingYear").notNull(),
  overallRating: varchar("overallRating", { length: 50 }).notNull(),
  technicalScore: integer("technicalScore").notNull(),
  leadershipScore: integer("leadershipScore").notNull(),
  collaborationScore: integer("collaborationScore").notNull(),
  innovationScore: integer("innovationScore").notNull(),
  comments: text("comments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceRating = typeof performanceRatings.$inferSelect;
export type InsertPerformanceRating = typeof performanceRatings.$inferInsert;

/**
 * Skills
 */
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  skillName: varchar("skillName", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  proficiencyLevel: proficiencyEnum("proficiencyLevel").notNull(),
  yearsOfExperience: integer("yearsOfExperience").notNull(),
  endorsements: integer("endorsements").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

/**
 * Training records
 */
export const trainingRecords = pgTable("trainingRecords", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  trainingName: varchar("trainingName", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  status: trainingStatusEnum("status").notNull(),
  completionDate: timestamp("completionDate"),
  hoursSpent: integer("hoursSpent"),
  certificateUrl: varchar("certificateUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertTrainingRecord = typeof trainingRecords.$inferInsert;

/**
 * Compensation data
 */
export const compensationData = pgTable("compensationData", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  year: integer("year").notNull(),
  baseSalary: integer("baseSalary").notNull(),
  bonus: integer("bonus").default(0),
  stockOptions: integer("stockOptions").default(0),
  benefits: text("benefits"),
  marketBenchmark: integer("marketBenchmark"),
  percentileRank: integer("percentileRank"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompensationData = typeof compensationData.$inferSelect;
export type InsertCompensationData = typeof compensationData.$inferInsert;

/**
 * Talent assessments
 */
export const talentAssessments = pgTable("talentAssessments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  talentScore: integer("talentScore").notNull(),
  potentialScore: integer("potentialScore").notNull(),
  hiddenTalentFlags: text("hiddenTalentFlags"),
  recommendedSkills: text("recommendedSkills"),
  recommendedRoles: text("recommendedRoles"),
  assessmentSummary: text("assessmentSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TalentAssessment = typeof talentAssessments.$inferSelect;
export type InsertTalentAssessment = typeof talentAssessments.$inferInsert;

/**
 * Succession plans
 */
export const successionPlans = pgTable("successionPlans", {
  id: serial("id").primaryKey(),
  criticalRoleId: varchar("criticalRoleId", { length: 100 }).notNull(),
  roleName: varchar("roleName", { length: 100 }).notNull(),
  currentHolderId: integer("currentHolderId"),
  primarySuccessor: integer("primarySuccessor"),
  backupSuccessor: integer("backupSuccessor"),
  readinessScore: integer("readinessScore"),
  riskLevel: riskLevelEnum("riskLevel").notNull(),
  developmentPlan: text("developmentPlan"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SuccessionPlan = typeof successionPlans.$inferSelect;
export type InsertSuccessionPlan = typeof successionPlans.$inferInsert;

/**
 * Alerts
 */
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: alertTypeEnum("type").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  relatedEmployeeIds: text("relatedEmployeeIds"),
  relatedRoleId: varchar("relatedRoleId", { length: 100 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Job requirements
 */
export const jobRequirements = pgTable("jobRequirements", {
  id: serial("id").primaryKey(),
  jobTitle: varchar("jobTitle", { length: 200 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  description: text("description").notNull(),
  requiredSkills: text("requiredSkills").notNull(),
  preferredSkills: text("preferredSkills"),
  experienceYearsRequired: integer("experienceYearsRequired").notNull(),
  seniority: varchar("seniority", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type JobRequirement = typeof jobRequirements.$inferSelect;
export type InsertJobRequirement = typeof jobRequirements.$inferInsert;

/**
 * Candidates
 */
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  yearsOfExperience: integer("yearsOfExperience").notNull(),
  currentRole: varchar("currentRole", { length: 100 }).notNull(),
  currentCompany: varchar("currentCompany", { length: 100 }).notNull(),
  skills: text("skills").notNull(),
  leadershipStyle: varchar("leadershipStyle", { length: 100 }),
  teamSize: integer("teamSize"),
  achievements: text("achievements"),
  education: text("education"),
  boardExposure: boolean("boardExposure").default(false),
  crossFunctionalExperience: text("crossFunctionalExperience"),
  geographicMobility: text("geographicMobility"),
  industryTransitions: text("industryTransitions"),
  plantScaleExperience: boolean("plantScaleExperience").default(false),
  evProgramCredential: boolean("evProgramCredential").default(false),
  notableProjects: text("notableProjects"),
  previousCompanies: text("previousCompanies"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

/**
 * Scenarios
 */
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  context: varchar("context", { length: 100 }).notNull(),
  priorityAdjustments: text("priorityAdjustments").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

/**
 * JD Agent Output
 */
export const jdAgentOutputs = pgTable("jdAgentOutputs", {
  id: serial("id").primaryKey(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  coreCompetencies: text("coreCompetencies").notNull(),
  priorityWeights: text("priorityWeights").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JDAgentOutput = typeof jdAgentOutputs.$inferSelect;
export type InsertJDAgentOutput = typeof jdAgentOutputs.$inferInsert;

/**
 * CV Agent Output
 */
export const cvAgentOutputs = pgTable("cvAgentOutputs", {
  id: serial("id").primaryKey(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  candidateId: integer("candidateId").notNull(),
  fitScore: integer("fitScore").notNull(),
  skillMatches: text("skillMatches").notNull(),
  experienceMatch: integer("experienceMatch").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CVAgentOutput = typeof cvAgentOutputs.$inferSelect;
export type InsertCVAgentOutput = typeof cvAgentOutputs.$inferInsert;

/**
 * Scenario Agent Output
 */
export const scenarioAgentOutputs = pgTable("scenarioAgentOutputs", {
  id: serial("id").primaryKey(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  scenarioId: integer("scenarioId").notNull(),
  candidateId: integer("candidateId").notNull(),
  adjustedFitScore: integer("adjustedFitScore").notNull(),
  priorityAdjustments: text("priorityAdjustments").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScenarioAgentOutput = typeof scenarioAgentOutputs.$inferSelect;
export type InsertScenarioAgentOutput = typeof scenarioAgentOutputs.$inferInsert;

/**
 * Leadership Agent Output
 */
export const leadershipAgentOutputs = pgTable("leadershipAgentOutputs", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidateId").notNull(),
  leadershipStyle: varchar("leadershipStyle", { length: 100 }).notNull(),
  leadershipScore: integer("leadershipScore").notNull(),
  teamDynamicsScore: integer("teamDynamicsScore").notNull(),
  culturalFitScore: integer("culturalFitScore").notNull(),
  leadershipTraits: text("leadershipTraits").notNull(),
  teamPairingAnalysis: text("teamPairingAnalysis"),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadershipAgentOutput = typeof leadershipAgentOutputs.$inferSelect;
export type InsertLeadershipAgentOutput = typeof leadershipAgentOutputs.$inferInsert;

/**
 * Decision Agent Output
 */
export const decisionAgentOutputs = pgTable("decisionAgentOutputs", {
  id: serial("id").primaryKey(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  scenarioId: integer("scenarioId"),
  recommendedCandidateId: integer("recommendedCandidateId").notNull(),
  confidenceScore: integer("confidenceScore").notNull(),
  recommendation: text("recommendation").notNull(),
  tradeOffs: text("tradeOffs").notNull(),
  alternativeCandidates: text("alternativeCandidates").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DecisionAgentOutput = typeof decisionAgentOutputs.$inferSelect;
export type InsertDecisionAgentOutput = typeof decisionAgentOutputs.$inferInsert;

/**
 * KPI 1: Time-to-Fill
 */
export const timeToFillMetrics = pgTable("timeToFillMetrics", {
  id: serial("id").primaryKey(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  requisitionOpenDate: timestamp("requisitionOpenDate").notNull(),
  offerAcceptanceDate: timestamp("offerAcceptanceDate"),
  daysToFill: integer("daysToFill"),
  sourcingChannel: varchar("sourcingChannel", { length: 100 }),
  targetDaysToFill: integer("targetDaysToFill").notNull(),
  status: fillStatusEnum("status").default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimeToFillMetric = typeof timeToFillMetrics.$inferSelect;
export type InsertTimeToFillMetric = typeof timeToFillMetrics.$inferInsert;

/**
 * KPI 2: Quality of Hire
 */
export const qualityOfHireMetrics = pgTable("qualityOfHireMetrics", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidateId").notNull(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  performanceRating12M: integer("performanceRating12M"),
  performanceRating24M: integer("performanceRating24M"),
  goalAchievementRate: integer("goalAchievementRate"),
  retentionStatus: retentionStatusEnum("retentionStatus").default("pending"),
  managerSatisfaction: integer("managerSatisfaction"),
  projectDeliveryScore: integer("projectDeliveryScore"),
  qualityScore: integer("qualityScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type QualityOfHireMetric = typeof qualityOfHireMetrics.$inferSelect;
export type InsertQualityOfHireMetric = typeof qualityOfHireMetrics.$inferInsert;

/**
 * KPI 3: Internal vs. External Hire Ratio
 */
export const internalExternalRatioMetrics = pgTable("internalExternalRatioMetrics", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidateId").notNull(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  hireSource: hireSourceEnum("hireSource").notNull(),
  internalMobilityLevel: varchar("internalMobilityLevel", { length: 50 }),
  successionPlanCoverage: boolean("successionPlanCoverage").default(false),
  benchStrengthRating: integer("benchStrengthRating"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InternalExternalRatioMetric = typeof internalExternalRatioMetrics.$inferSelect;
export type InsertInternalExternalRatioMetric = typeof internalExternalRatioMetrics.$inferInsert;

/**
 * KPI 4: Leadership Combination Compatibility
 */
export const leadershipCompatibilityMetrics = pgTable("leadershipCompatibilityMetrics", {
  id: serial("id").primaryKey(),
  candidateId1: integer("candidateId1").notNull(),
  candidateId2: integer("candidateId2").notNull(),
  compatibilityScore: integer("compatibilityScore").notNull(),
  leadershipStyleMatch: integer("leadershipStyleMatch"),
  collaborationHistory: text("collaborationHistory"),
  conflictResolutionPattern: varchar("conflictResolutionPattern", { length: 100 }),
  teamEngagementImpact: integer("teamEngagementImpact"),
  plantKPIImpact: text("plantKPIImpact"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadershipCompatibilityMetric = typeof leadershipCompatibilityMetrics.$inferSelect;
export type InsertLeadershipCompatibilityMetric = typeof leadershipCompatibilityMetrics.$inferInsert;

/**
 * KPI 5: Scenario-Adjusted Candidate Ranking
 */
export const scenarioRankingMetrics = pgTable("scenarioRankingMetrics", {
  id: serial("id").primaryKey(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  scenarioId: integer("scenarioId").notNull(),
  candidateId: integer("candidateId").notNull(),
  baselineRank: integer("baselineRank"),
  scenarioAdjustedRank: integer("scenarioAdjustedRank"),
  rankingShift: integer("rankingShift"),
  priorityReweighting: text("priorityReweighting"),
  strategicAlignment: integer("strategicAlignment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScenarioRankingMetric = typeof scenarioRankingMetrics.$inferSelect;
export type InsertScenarioRankingMetric = typeof scenarioRankingMetrics.$inferInsert;

/**
 * KPI 6: Cost of Mis-Hire
 */
export const misHireCostMetrics = pgTable("misHireCostMetrics", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidateId").notNull(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  separationCost: integer("separationCost"),
  reRecruitmentCost: integer("reRecruitmentCost"),
  interimLeadershipCost: integer("interimLeadershipCost"),
  projectDelayCost: integer("projectDelayCost"),
  teamTurnoverCost: integer("teamTurnoverCost"),
  totalMisHireCost: integer("totalMisHireCost"),
  misHireRiskScore: integer("misHireRiskScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MisHireCostMetric = typeof misHireCostMetrics.$inferSelect;
export type InsertMisHireCostMetric = typeof misHireCostMetrics.$inferInsert;

/**
 * KPI 7: Skill Gap Index
 */
export const skillGapMetrics = pgTable("skillGapMetrics", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidateId").notNull(),
  jobRequirementId: integer("jobRequirementId").notNull(),
  currentSkills: text("currentSkills").notNull(),
  requiredSkills: text("requiredSkills").notNull(),
  skillGapIndex: integer("skillGapIndex").notNull(),
  criticalSkillGaps: text("criticalSkillGaps"),
  developmentPotential: integer("developmentPotential"),
  trainingRequirements: text("trainingRequirements"),
  emergingSkillDemand: text("emergingSkillDemand"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SkillGapMetric = typeof skillGapMetrics.$inferSelect;
export type InsertSkillGapMetric = typeof skillGapMetrics.$inferInsert;

/**
 * BMW Leadership Team
 */
export const bmwLeadershipTeam = pgTable("bmwLeadershipTeam", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 200 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  leadershipStyle: varchar("leadershipStyle", { length: 100 }).notNull(),
  teamSize: integer("teamSize").notNull(),
  priorities: text("priorities").notNull(),
  background: text("background").notNull(),
  decisionMakingStyle: varchar("decisionMakingStyle", { length: 100 }).notNull(),
  communicationPreference: varchar("communicationPreference", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BmwLeader = typeof bmwLeadershipTeam.$inferSelect;
export type InsertBmwLeader = typeof bmwLeadershipTeam.$inferInsert;
