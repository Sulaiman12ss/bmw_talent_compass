CREATE TABLE `bmwLeadershipTeam` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`role` varchar(200) NOT NULL,
	`department` varchar(100) NOT NULL,
	`leadershipStyle` varchar(100) NOT NULL,
	`teamSize` int NOT NULL,
	`priorities` text NOT NULL,
	`background` text NOT NULL,
	`decisionMakingStyle` varchar(100) NOT NULL,
	`communicationPreference` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bmwLeadershipTeam_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `candidates` ADD `education` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `boardExposure` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `candidates` ADD `crossFunctionalExperience` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `geographicMobility` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `industryTransitions` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `plantScaleExperience` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `candidates` ADD `evProgramCredential` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `candidates` ADD `notableProjects` text;--> statement-breakpoint
ALTER TABLE `candidates` ADD `previousCompanies` text;