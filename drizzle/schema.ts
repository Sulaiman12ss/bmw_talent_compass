import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Employee table - Core employee information
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  department: varchar("department", { length: 100 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  level: mysqlEnum("level", ["junior", "mid", "senior", "lead", "manager", "director", "executive"]).notNull(),
  yearsAtCompany: int("yearsAtCompany").notNull(),
  yearsInRole: int("yearsInRole").notNull(),
  managerId: int("managerId"),
  biography: text("biography"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Performance ratings - Annual/periodic performance evaluations
 */
export const performanceRatings = mysqlTable("performanceRatings", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  ratingYear: int("ratingYear").notNull(),
  overallRating: varchar("overallRating", { length: 50 }).notNull(), // "exceeds", "meets", "below"
  technicalScore: int("technicalScore").notNull(), // 1-5
  leadershipScore: int("leadershipScore").notNull(), // 1-5
  collaborationScore: int("collaborationScore").notNull(), // 1-5
  innovationScore: int("innovationScore").notNull(), // 1-5
  comments: text("comments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceRating = typeof performanceRatings.$inferSelect;
export type InsertPerformanceRating = typeof performanceRatings.$inferInsert;

/**
 * Skills - Employee skills and proficiency levels
 */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  skillName: varchar("skillName", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // "technical", "leadership", "domain"
  proficiencyLevel: mysqlEnum("proficiencyLevel", ["beginner", "intermediate", "advanced", "expert"]).notNull(),
  yearsOfExperience: int("yearsOfExperience").notNull(),
  endorsements: int("endorsements").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

/**
 * Training records - Completed and planned training
 */
export const trainingRecords = mysqlTable("trainingRecords", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  trainingName: varchar("trainingName", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // "EV", "AI", "Leadership", etc.
  status: mysqlEnum("status", ["planned", "in_progress", "completed"]).notNull(),
  completionDate: timestamp("completionDate"),
  hoursSpent: int("hoursSpent"),
  certificateUrl: varchar("certificateUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertTrainingRecord = typeof trainingRecords.$inferInsert;

/**
 * Compensation data - Salary and benefits information
 */
export const compensationData = mysqlTable("compensationData", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  year: int("year").notNull(),
  baseSalary: int("baseSalary").notNull(),
  bonus: int("bonus").default(0),
  stockOptions: int("stockOptions").default(0),
  benefits: text("benefits"), // JSON string
  marketBenchmark: int("marketBenchmark"),
  percentileRank: int("percentileRank"), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompensationData = typeof compensationData.$inferSelect;
export type InsertCompensationData = typeof compensationData.$inferInsert;

/**
 * Talent assessments - AI-generated talent scores and insights
 */
export const talentAssessments = mysqlTable("talentAssessments", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  talentScore: int("talentScore").notNull(), // 0-100
  potentialScore: int("potentialScore").notNull(), // 0-100
  hiddenTalentFlags: text("hiddenTalentFlags"), // JSON array
  recommendedSkills: text("recommendedSkills"), // JSON array
  recommendedRoles: text("recommendedRoles"), // JSON array
  assessmentSummary: text("assessmentSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TalentAssessment = typeof talentAssessments.$inferSelect;
export type InsertTalentAssessment = typeof talentAssessments.$inferInsert;

/**
 * Succession plans - Leadership succession planning data
 */
export const successionPlans = mysqlTable("successionPlans", {
  id: int("id").autoincrement().primaryKey(),
  criticalRoleId: varchar("criticalRoleId", { length: 100 }).notNull(),
  roleName: varchar("roleName", { length: 100 }).notNull(),
  currentHolderId: int("currentHolderId"),
  primarySuccessor: int("primarySuccessor"),
  backupSuccessor: int("backupSuccessor"),
  readinessScore: int("readinessScore"), // 0-100
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).notNull(),
  developmentPlan: text("developmentPlan"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuccessionPlan = typeof successionPlans.$inferSelect;
export type InsertSuccessionPlan = typeof successionPlans.$inferInsert;

/**
 * Alerts - System alerts for HR leadership
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["talent_risk", "succession_gap", "compensation_trend", "skill_gap"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  relatedEmployeeIds: text("relatedEmployeeIds"), // JSON array
  relatedRoleId: varchar("relatedRoleId", { length: 100 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
/**
 * Job requirements - Job descriptions and requirements for decision analysis
 */
export const jobRequirements = mysqlTable("jobRequirements", {
  id: int("id").autoincrement().primaryKey(),
  jobTitle: varchar("jobTitle", { length: 200 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  description: text("description").notNull(),
  requiredSkills: text("requiredSkills").notNull(),
  preferredSkills: text("preferredSkills"),
  experienceYearsRequired: int("experienceYearsRequired").notNull(),
  seniority: varchar("seniority", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JobRequirement = typeof jobRequirements.$inferSelect;
export type InsertJobRequirement = typeof jobRequirements.$inferInsert;

/**
 * Candidates - Candidate profiles for decision analysis
 */
export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  yearsOfExperience: int("yearsOfExperience").notNull(),
  currentRole: varchar("currentRole", { length: 100 }).notNull(),
  currentCompany: varchar("currentCompany", { length: 100 }).notNull(),
  skills: text("skills").notNull(),
  leadershipStyle: varchar("leadershipStyle", { length: 100 }),
  teamSize: int("teamSize"),
  achievements: text("achievements"),
  // Automotive-executive enrichment fields (Fix 6)
  education: text("education"), // JSON: [{degree, institution, year}]
  boardExposure: boolean("boardExposure").default(false),
  crossFunctionalExperience: text("crossFunctionalExperience"), // JSON array of functions
  geographicMobility: text("geographicMobility"), // JSON array of regions worked in
  industryTransitions: text("industryTransitions"), // JSON array: [{from, to, year}]
  plantScaleExperience: boolean("plantScaleExperience").default(false),
  evProgramCredential: boolean("evProgramCredential").default(false),
  notableProjects: text("notableProjects"), // JSON array of project descriptions
  previousCompanies: text("previousCompanies"), // JSON array: [{company, role, years}]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

/**
 * Scenarios - Decision scenarios for multi-agent analysis
 */
export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  context: varchar("context", { length: 100 }).notNull(),
  priorityAdjustments: text("priorityAdjustments").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

/**
 * JD Agent Output - Job description analysis results
 */
export const jdAgentOutputs = mysqlTable("jdAgentOutputs", {
  id: int("id").autoincrement().primaryKey(),
  jobRequirementId: int("jobRequirementId").notNull(),
  coreCompetencies: text("coreCompetencies").notNull(),
  priorityWeights: text("priorityWeights").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JDAgentOutput = typeof jdAgentOutputs.$inferSelect;
export type InsertJDAgentOutput = typeof jdAgentOutputs.$inferInsert;

/**
 * CV Agent Output - Candidate scoring and ranking results
 */
export const cvAgentOutputs = mysqlTable("cvAgentOutputs", {
  id: int("id").autoincrement().primaryKey(),
  jobRequirementId: int("jobRequirementId").notNull(),
  candidateId: int("candidateId").notNull(),
  fitScore: int("fitScore").notNull(),
  skillMatches: text("skillMatches").notNull(),
  experienceMatch: int("experienceMatch").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CVAgentOutput = typeof cvAgentOutputs.$inferSelect;
export type InsertCVAgentOutput = typeof cvAgentOutputs.$inferInsert;

/**
 * Scenario Agent Output - Scenario-based ranking adjustments
 */
export const scenarioAgentOutputs = mysqlTable("scenarioAgentOutputs", {
  id: int("id").autoincrement().primaryKey(),
  jobRequirementId: int("jobRequirementId").notNull(),
  scenarioId: int("scenarioId").notNull(),
  candidateId: int("candidateId").notNull(),
  adjustedFitScore: int("adjustedFitScore").notNull(),
  priorityAdjustments: text("priorityAdjustments").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScenarioAgentOutput = typeof scenarioAgentOutputs.$inferSelect;
export type InsertScenarioAgentOutput = typeof scenarioAgentOutputs.$inferInsert;

/**
 * Leadership Agent Output - Leadership assessment and team dynamics
 */
export const leadershipAgentOutputs = mysqlTable("leadershipAgentOutputs", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  leadershipStyle: varchar("leadershipStyle", { length: 100 }).notNull(),
  leadershipScore: int("leadershipScore").notNull(),
  teamDynamicsScore: int("teamDynamicsScore").notNull(),
  culturalFitScore: int("culturalFitScore").notNull(),
  leadershipTraits: text("leadershipTraits").notNull(),
  teamPairingAnalysis: text("teamPairingAnalysis"),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadershipAgentOutput = typeof leadershipAgentOutputs.$inferSelect;
export type InsertLeadershipAgentOutput = typeof leadershipAgentOutputs.$inferInsert;

/**
 * Decision Agent Output - Final recommendation synthesis
 */
export const decisionAgentOutputs = mysqlTable("decisionAgentOutputs", {
  id: int("id").autoincrement().primaryKey(),
  jobRequirementId: int("jobRequirementId").notNull(),
  scenarioId: int("scenarioId"),
  recommendedCandidateId: int("recommendedCandidateId").notNull(),
  confidenceScore: int("confidenceScore").notNull(),
  recommendation: text("recommendation").notNull(),
  tradeOffs: text("tradeOffs").notNull(),
  alternativeCandidates: text("alternativeCandidates").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DecisionAgentOutput = typeof decisionAgentOutputs.$inferSelect;
export type InsertDecisionAgentOutput = typeof decisionAgentOutputs.$inferInsert;


/**
 * KPI 1: Time-to-Fill (Leadership Roles)
 * Tracks hiring process duration and efficiency
 */
export const timeToFillMetrics = mysqlTable("timeToFillMetrics", {
  id: int("id").autoincrement().primaryKey(),
  jobRequirementId: int("jobRequirementId").notNull(),
  requisitionOpenDate: timestamp("requisitionOpenDate").notNull(),
  offerAcceptanceDate: timestamp("offerAcceptanceDate"),
  daysToFill: int("daysToFill"),
  sourcingChannel: varchar("sourcingChannel", { length: 100 }),
  targetDaysToFill: int("targetDaysToFill").notNull(),
  status: mysqlEnum("status", ["open", "filled", "cancelled"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimeToFillMetric = typeof timeToFillMetrics.$inferSelect;
export type InsertTimeToFillMetric = typeof timeToFillMetrics.$inferInsert;

/**
 * KPI 2: Quality of Hire
 * Composite score of new hire performance and retention
 */
export const qualityOfHireMetrics = mysqlTable("qualityOfHireMetrics", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  jobRequirementId: int("jobRequirementId").notNull(),
  performanceRating12M: int("performanceRating12M"),
  performanceRating24M: int("performanceRating24M"),
  goalAchievementRate: int("goalAchievementRate"),
  retentionStatus: mysqlEnum("retentionStatus", ["active", "departed", "pending"]).default("pending"),
  managerSatisfaction: int("managerSatisfaction"),
  projectDeliveryScore: int("projectDeliveryScore"),
  qualityScore: int("qualityScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QualityOfHireMetric = typeof qualityOfHireMetrics.$inferSelect;
export type InsertQualityOfHireMetric = typeof qualityOfHireMetrics.$inferInsert;

/**
 * KPI 3: Internal vs. External Hire Ratio
 * Tracks internal mobility and external hiring patterns
 */
export const internalExternalRatioMetrics = mysqlTable("internalExternalRatioMetrics", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  jobRequirementId: int("jobRequirementId").notNull(),
  hireSource: mysqlEnum("hireSource", ["internal", "external"]).notNull(),
  internalMobilityLevel: varchar("internalMobilityLevel", { length: 50 }),
  successionPlanCoverage: boolean("successionPlanCoverage").default(false),
  benchStrengthRating: int("benchStrengthRating"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InternalExternalRatioMetric = typeof internalExternalRatioMetrics.$inferSelect;
export type InsertInternalExternalRatioMetric = typeof internalExternalRatioMetrics.$inferInsert;

/**
 * KPI 4: Leadership Combination Compatibility
 * Assesses how well leader pairs work together
 */
export const leadershipCompatibilityMetrics = mysqlTable("leadershipCompatibilityMetrics", {
  id: int("id").autoincrement().primaryKey(),
  candidateId1: int("candidateId1").notNull(),
  candidateId2: int("candidateId2").notNull(),
  compatibilityScore: int("compatibilityScore").notNull(),
  leadershipStyleMatch: int("leadershipStyleMatch"),
  collaborationHistory: text("collaborationHistory"),
  conflictResolutionPattern: varchar("conflictResolutionPattern", { length: 100 }),
  teamEngagementImpact: int("teamEngagementImpact"),
  plantKPIImpact: text("plantKPIImpact"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadershipCompatibilityMetric = typeof leadershipCompatibilityMetrics.$inferSelect;
export type InsertLeadershipCompatibilityMetric = typeof leadershipCompatibilityMetrics.$inferInsert;

/**
 * KPI 5: Scenario-Adjusted Candidate Ranking
 * Tracks how rankings shift with business context changes
 */
export const scenarioRankingMetrics = mysqlTable("scenarioRankingMetrics", {
  id: int("id").autoincrement().primaryKey(),
  jobRequirementId: int("jobRequirementId").notNull(),
  scenarioId: int("scenarioId").notNull(),
  candidateId: int("candidateId").notNull(),
  baselineRank: int("baselineRank"),
  scenarioAdjustedRank: int("scenarioAdjustedRank"),
  rankingShift: int("rankingShift"),
  priorityReweighting: text("priorityReweighting"),
  strategicAlignment: int("strategicAlignment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScenarioRankingMetric = typeof scenarioRankingMetrics.$inferSelect;
export type InsertScenarioRankingMetric = typeof scenarioRankingMetrics.$inferInsert;

/**
 * KPI 6: Cost of Mis-Hire
 * Tracks total cost when a leadership hire fails
 */
export const misHireCostMetrics = mysqlTable("misHireCostMetrics", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  jobRequirementId: int("jobRequirementId").notNull(),
  separationCost: int("separationCost"),
  reRecruitmentCost: int("reRecruitmentCost"),
  interimLeadershipCost: int("interimLeadershipCost"),
  projectDelayCost: int("projectDelayCost"),
  teamTurnoverCost: int("teamTurnoverCost"),
  totalMisHireCost: int("totalMisHireCost"),
  misHireRiskScore: int("misHireRiskScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MisHireCostMetric = typeof misHireCostMetrics.$inferSelect;
export type InsertMisHireCostMetric = typeof misHireCostMetrics.$inferInsert;

/**
 * KPI 7: Skill Gap Index
 * Tracks gap between current and future-required competencies
 */
export const skillGapMetrics = mysqlTable("skillGapMetrics", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  jobRequirementId: int("jobRequirementId").notNull(),
  currentSkills: text("currentSkills").notNull(),
  requiredSkills: text("requiredSkills").notNull(),
  skillGapIndex: int("skillGapIndex").notNull(),
  criticalSkillGaps: text("criticalSkillGaps"),
  developmentPotential: int("developmentPotential"),
  trainingRequirements: text("trainingRequirements"),
  emergingSkillDemand: text("emergingSkillDemand"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SkillGapMetric = typeof skillGapMetrics.$inferSelect;
export type InsertSkillGapMetric = typeof skillGapMetrics.$inferInsert;

/**
 * BMW Leadership Team - Current BMW leaders that candidates would work alongside
 * Grounds leadership compatibility in real pairings instead of floating scores
 */
export const bmwLeadershipTeam = mysqlTable("bmwLeadershipTeam", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 200 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  leadershipStyle: varchar("leadershipStyle", { length: 100 }).notNull(),
  teamSize: int("teamSize").notNull(),
  priorities: text("priorities").notNull(), // JSON array of current priorities
  background: text("background").notNull(), // Brief professional background
  decisionMakingStyle: varchar("decisionMakingStyle", { length: 100 }).notNull(),
  communicationPreference: varchar("communicationPreference", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BmwLeader = typeof bmwLeadershipTeam.$inferSelect;
export type InsertBmwLeader = typeof bmwLeadershipTeam.$inferInsert;
