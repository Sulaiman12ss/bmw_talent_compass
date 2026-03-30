import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  jobRequirements,
  candidates,
  scenarios,
} from "./drizzle/schema";

/**
 * Demo Data Seeding Script
 * Creates the "Speed vs. Right Hire" scenario with realistic candidates
 */

async function seedDemoData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL || "");
  const db = drizzle(connection);

  console.log("🌱 Seeding demo data for 'Speed vs. Right Hire' scenario...\n");

  try {
    // 1. Create Job Requirement: VP Engineering - EV Platform
    console.log("📋 Creating job requirement: VP Engineering - EV Platform");
    const jobResult = await db.insert(jobRequirements).values({
      jobTitle: "VP Engineering - EV Platform",
      department: "Engineering",
      description: `Lead BMW's EV platform engineering strategy and team. Responsible for architecting next-generation electric vehicle platforms, managing a team of 50+ engineers, and driving innovation in battery management systems, autonomous driving capabilities, and software-defined vehicles. Must navigate the complex transition from traditional automotive to EV while maintaining production quality and timelines.`,
      requiredSkills: JSON.stringify([
        "EV/Battery Technology",
        "Team Leadership",
        "Software Architecture",
        "Production Management",
        "Automotive Industry Knowledge",
      ]),
      preferredSkills: JSON.stringify([
        "AI/ML Expertise",
        "Supply Chain Management",
        "Agile Transformation",
        "Autonomous Driving",
      ]),
      experienceYearsRequired: 12,
      seniority: "executive",
    });
    console.log("✓ Job created\n");

    // 2. Create 5 Candidates
    console.log("👥 Creating 5 candidates for evaluation\n");

    const candidatesData = [
      {
        firstName: "Alice",
        lastName: "Chen",
        email: "alice.chen@email.com",
        yearsOfExperience: 15,
        currentRole: "Director of EV Engineering",
        currentCompany: "Tesla",
        skills: JSON.stringify([
          { name: "EV/Battery Technology", proficiency: "expert", years: 5 },
          { name: "Team Leadership", proficiency: "advanced", years: 8 },
          { name: "Software Architecture", proficiency: "advanced", years: 10 },
          { name: "Production Management", proficiency: "intermediate", years: 6 },
          { name: "Automotive Industry Knowledge", proficiency: "advanced", years: 12 },
        ]),
        leadershipStyle: "collaborative",
        teamSize: 50,
        achievements: JSON.stringify([
          "Led development of Tesla Model 3 battery management system",
          "Managed team of 50+ engineers across 3 locations",
          "Reduced battery cost by 15% through innovative architecture",
          "Established EV engineering best practices across organization",
        ]),
      },
      {
        firstName: "Bob",
        lastName: "Martinez",
        email: "bob.martinez@email.com",
        yearsOfExperience: 12,
        currentRole: "VP Engineering",
        currentCompany: "Google",
        skills: JSON.stringify([
          { name: "Software Architecture", proficiency: "expert", years: 12 },
          { name: "AI/ML Expertise", proficiency: "expert", years: 8 },
          { name: "Team Leadership", proficiency: "advanced", years: 7 },
          { name: "EV/Battery Technology", proficiency: "beginner", years: 2 },
          { name: "Automotive Industry Knowledge", proficiency: "intermediate", years: 2 },
        ]),
        leadershipStyle: "directive",
        teamSize: 100,
        achievements: JSON.stringify([
          "Led Google's autonomous vehicle project with 100+ engineers",
          "Implemented AI-driven testing framework reducing bugs by 40%",
          "Scaled engineering team from 20 to 100 in 3 years",
          "Published 5 papers on distributed systems architecture",
        ]),
      },
      {
        firstName: "Carol",
        lastName: "Johnson",
        email: "carol.johnson@email.com",
        yearsOfExperience: 10,
        currentRole: "Manufacturing Director",
        currentCompany: "Ford",
        skills: JSON.stringify([
          { name: "Production Management", proficiency: "expert", years: 8 },
          { name: "Team Leadership", proficiency: "advanced", years: 6 },
          { name: "Automotive Industry Knowledge", proficiency: "expert", years: 10 },
          { name: "EV/Battery Technology", proficiency: "beginner", years: 1 },
          { name: "Software Architecture", proficiency: "beginner", years: 0 },
        ]),
        leadershipStyle: "collaborative",
        teamSize: 200,
        achievements: JSON.stringify([
          "Managed production of 500K+ vehicles annually",
          "Reduced manufacturing defects by 25%",
          "Led transition of 3 plants to hybrid production",
          "Implemented lean manufacturing across supply chain",
        ]),
      },
      {
        firstName: "David",
        lastName: "Patel",
        email: "david.patel@email.com",
        yearsOfExperience: 8,
        currentRole: "CTO",
        currentCompany: "Rivian",
        skills: JSON.stringify([
          { name: "EV/Battery Technology", proficiency: "advanced", years: 5 },
          { name: "Software Architecture", proficiency: "advanced", years: 8 },
          { name: "AI/ML Expertise", proficiency: "intermediate", years: 4 },
          { name: "Team Leadership", proficiency: "intermediate", years: 3 },
          { name: "Automotive Industry Knowledge", proficiency: "intermediate", years: 5 },
        ]),
        leadershipStyle: "entrepreneurial",
        teamSize: 30,
        achievements: JSON.stringify([
          "Founded EV startup Rivian and grew to 30-person engineering team",
          "Architected end-to-end EV platform from scratch",
          "Secured $5B in funding based on technical vision",
          "Launched first production vehicle on schedule",
        ]),
      },
      {
        firstName: "Eve",
        lastName: "Schmidt",
        email: "eve.schmidt@email.com",
        yearsOfExperience: 14,
        currentRole: "Senior VP Engineering",
        currentCompany: "BMW",
        skills: JSON.stringify([
          { name: "Automotive Industry Knowledge", proficiency: "expert", years: 14 },
          { name: "Production Management", proficiency: "advanced", years: 10 },
          { name: "Team Leadership", proficiency: "advanced", years: 9 },
          { name: "EV/Battery Technology", proficiency: "intermediate", years: 3 },
          { name: "Software Architecture", proficiency: "intermediate", years: 5 },
        ]),
        leadershipStyle: "collaborative",
        teamSize: 80,
        achievements: JSON.stringify([
          "Led BMW i-series development program",
          "Managed engineering team across 5 countries",
          "Reduced time-to-market by 20%",
          "Established BMW's EV engineering center of excellence",
        ]),
      },
    ];

    for (const candidate of candidatesData) {
      await db.insert(candidates).values(candidate);
      console.log(`✓ ${candidate.firstName} ${candidate.lastName} created`);
    }
    console.log();

    // 3. Create Scenarios
    console.log("🎯 Creating decision scenarios\n");

    const scenariosData = [
      {
        name: "EV Transformation Crisis",
        description:
          "BMW facing urgent EV transition with market pressure. EV expertise becomes critical.",
        context: "transformation",
        priorityAdjustments: JSON.stringify({
          "EV/Battery Technology": 0.4,
          "Team Leadership": 0.25,
          "Software Architecture": 0.15,
          "Production Management": 0.1,
          "Automotive Industry Knowledge": 0.1,
        }),
      },
      {
        name: "Automotive Continuity",
        description:
          "Focus on maintaining traditional automotive excellence while gradually transitioning to EV.",
        context: "continuity",
        priorityAdjustments: JSON.stringify({
          "Automotive Industry Knowledge": 0.35,
          "Production Management": 0.25,
          "Team Leadership": 0.2,
          "EV/Battery Technology": 0.1,
          "Software Architecture": 0.1,
        }),
      },
      {
        name: "Supply Chain Crisis",
        description:
          "Semiconductor shortage and supply chain disruption. Execution speed is paramount.",
        context: "crisis",
        priorityAdjustments: JSON.stringify({
          "Production Management": 0.35,
          "Team Leadership": 0.25,
          "Automotive Industry Knowledge": 0.2,
          "EV/Battery Technology": 0.1,
          "Software Architecture": 0.1,
        }),
      },
    ];

    for (const scenario of scenariosData) {
      await db.insert(scenarios).values(scenario);
      console.log(`✓ ${scenario.name} created`);
    }
    console.log();

    console.log("✅ Demo data seeding complete!\n");
    console.log("📊 Summary:");
    console.log("  - 1 Job: VP Engineering - EV Platform");
    console.log("  - 5 Candidates: Alice, Bob, Carol, David, Eve");
    console.log("  - 3 Scenarios: Transformation, Continuity, Crisis");
    console.log("\n🚀 Ready to test the multi-agent decision pipeline!");
    console.log("   Navigate to /decision to start analyzing...\n");
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the seeding
seedDemoData().catch(console.error);
