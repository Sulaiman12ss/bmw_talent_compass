CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('talent_risk','succession_gap','compensation_trend','skill_gap') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`relatedEmployeeIds` text,
	`relatedRoleId` varchar(100),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compensationData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`year` int NOT NULL,
	`baseSalary` int NOT NULL,
	`bonus` int DEFAULT 0,
	`stockOptions` int DEFAULT 0,
	`benefits` text,
	`marketBenchmark` int,
	`percentileRank` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compensationData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`department` varchar(100) NOT NULL,
	`position` varchar(100) NOT NULL,
	`level` enum('junior','mid','senior','lead','manager','director','executive') NOT NULL,
	`yearsAtCompany` int NOT NULL,
	`yearsInRole` int NOT NULL,
	`managerId` int,
	`biography` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `performanceRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`ratingYear` int NOT NULL,
	`overallRating` varchar(50) NOT NULL,
	`technicalScore` int NOT NULL,
	`leadershipScore` int NOT NULL,
	`collaborationScore` int NOT NULL,
	`innovationScore` int NOT NULL,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performanceRatings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`skillName` varchar(100) NOT NULL,
	`category` varchar(50) NOT NULL,
	`proficiencyLevel` enum('beginner','intermediate','advanced','expert') NOT NULL,
	`yearsOfExperience` int NOT NULL,
	`endorsements` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `successionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`criticalRoleId` varchar(100) NOT NULL,
	`roleName` varchar(100) NOT NULL,
	`currentHolderId` int,
	`primarySuccessor` int,
	`backupSuccessor` int,
	`readinessScore` int,
	`riskLevel` enum('low','medium','high','critical') NOT NULL,
	`developmentPlan` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `successionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `talentAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`talentScore` int NOT NULL,
	`potentialScore` int NOT NULL,
	`hiddenTalentFlags` text,
	`recommendedSkills` text,
	`recommendedRoles` text,
	`assessmentSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `talentAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainingRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`trainingName` varchar(200) NOT NULL,
	`category` varchar(100) NOT NULL,
	`status` enum('planned','in_progress','completed') NOT NULL,
	`completionDate` timestamp,
	`hoursSpent` int,
	`certificateUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trainingRecords_id` PRIMARY KEY(`id`)
);
