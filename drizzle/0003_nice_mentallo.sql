CREATE TABLE `internalExternalRatioMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobRequirementId` int NOT NULL,
	`hireSource` enum('internal','external') NOT NULL,
	`internalMobilityLevel` varchar(50),
	`successionPlanCoverage` boolean DEFAULT false,
	`benchStrengthRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internalExternalRatioMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadershipCompatibilityMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId1` int NOT NULL,
	`candidateId2` int NOT NULL,
	`compatibilityScore` int NOT NULL,
	`leadershipStyleMatch` int,
	`collaborationHistory` text,
	`conflictResolutionPattern` varchar(100),
	`teamEngagementImpact` int,
	`plantKPIImpact` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadershipCompatibilityMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `misHireCostMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobRequirementId` int NOT NULL,
	`separationCost` int,
	`reRecruitmentCost` int,
	`interimLeadershipCost` int,
	`projectDelayCost` int,
	`teamTurnoverCost` int,
	`totalMisHireCost` int,
	`misHireRiskScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `misHireCostMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qualityOfHireMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobRequirementId` int NOT NULL,
	`performanceRating12M` int,
	`performanceRating24M` int,
	`goalAchievementRate` int,
	`retentionStatus` enum('active','departed','pending') DEFAULT 'pending',
	`managerSatisfaction` int,
	`projectDeliveryScore` int,
	`qualityScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qualityOfHireMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarioRankingMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobRequirementId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`candidateId` int NOT NULL,
	`baselineRank` int,
	`scenarioAdjustedRank` int,
	`rankingShift` int,
	`priorityReweighting` text,
	`strategicAlignment` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenarioRankingMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skillGapMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`jobRequirementId` int NOT NULL,
	`currentSkills` text NOT NULL,
	`requiredSkills` text NOT NULL,
	`skillGapIndex` int NOT NULL,
	`criticalSkillGaps` text,
	`developmentPotential` int,
	`trainingRequirements` text,
	`emergingSkillDemand` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skillGapMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeToFillMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobRequirementId` int NOT NULL,
	`requisitionOpenDate` timestamp NOT NULL,
	`offerAcceptanceDate` timestamp,
	`daysToFill` int,
	`sourcingChannel` varchar(100),
	`targetDaysToFill` int NOT NULL,
	`status` enum('open','filled','cancelled') DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeToFillMetrics_id` PRIMARY KEY(`id`)
);
