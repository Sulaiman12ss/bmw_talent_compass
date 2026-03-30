CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`yearsOfExperience` int NOT NULL,
	`currentRole` varchar(100) NOT NULL,
	`currentCompany` varchar(100) NOT NULL,
	`skills` text NOT NULL,
	`leadershipStyle` varchar(100),
	`teamSize` int,
	`achievements` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cvAgentOutputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobRequirementId` int NOT NULL,
	`candidateId` int NOT NULL,
	`fitScore` int NOT NULL,
	`skillMatches` text NOT NULL,
	`experienceMatch` int NOT NULL,
	`reasoning` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cvAgentOutputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decisionAgentOutputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobRequirementId` int NOT NULL,
	`scenarioId` int,
	`recommendedCandidateId` int NOT NULL,
	`confidenceScore` int NOT NULL,
	`recommendation` text NOT NULL,
	`tradeOffs` text NOT NULL,
	`alternativeCandidates` text NOT NULL,
	`reasoning` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decisionAgentOutputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jdAgentOutputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobRequirementId` int NOT NULL,
	`coreCompetencies` text NOT NULL,
	`priorityWeights` text NOT NULL,
	`reasoning` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jdAgentOutputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobTitle` varchar(200) NOT NULL,
	`department` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`requiredSkills` text NOT NULL,
	`preferredSkills` text,
	`experienceYearsRequired` int NOT NULL,
	`seniority` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobRequirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadershipAgentOutputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`leadershipStyle` varchar(100) NOT NULL,
	`leadershipScore` int NOT NULL,
	`teamDynamicsScore` int NOT NULL,
	`culturalFitScore` int NOT NULL,
	`leadershipTraits` text NOT NULL,
	`teamPairingAnalysis` text,
	`reasoning` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadershipAgentOutputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarioAgentOutputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobRequirementId` int NOT NULL,
	`scenarioId` int NOT NULL,
	`candidateId` int NOT NULL,
	`adjustedFitScore` int NOT NULL,
	`priorityAdjustments` text NOT NULL,
	`reasoning` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenarioAgentOutputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`context` varchar(100) NOT NULL,
	`priorityAdjustments` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
