import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  employees,
  skills,
  performanceRatings,
  trainingRecords,
  compensationData,
  talentAssessments,
  successionPlans,
  alerts,
} from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function seedDatabase() {
  try {
    const db = drizzle(DATABASE_URL);

    console.log("🌱 Starting database seeding...\n");

    // Create sample users
    console.log("📝 Creating sample users...");
    const sampleUsers = [
      {
        openId: "user-001",
        name: "Alice Johnson",
        email: "alice.johnson@bmw.com",
        loginMethod: "manus",
        role: "admin",
      },
      {
        openId: "user-002",
        name: "Bob Smith",
        email: "bob.smith@bmw.com",
        loginMethod: "manus",
        role: "user",
      },
      {
        openId: "user-003",
        name: "Carol Davis",
        email: "carol.davis@bmw.com",
        loginMethod: "manus",
        role: "user",
      },
    ];

    for (const user of sampleUsers) {
      await db.insert(users).values(user).onDuplicateKeyUpdate({ set: user });
    }
    console.log("✅ Users created\n");

    // Create sample employees
    console.log("📝 Creating sample employees...");
    const sampleEmployees = [
      {
        userId: 1,
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice.johnson@bmw.com",
        department: "Engineering",
        position: "Senior Software Engineer",
        level: "senior",
        yearsAtCompany: 8,
        yearsInRole: 3,
        managerId: null,
        biography: "Expert in cloud architecture and distributed systems",
      },
      {
        userId: 2,
        firstName: "Bob",
        lastName: "Smith",
        email: "bob.smith@bmw.com",
        department: "Product",
        position: "Product Manager",
        level: "lead",
        yearsAtCompany: 5,
        yearsInRole: 2,
        managerId: 1,
        biography: "Passionate about EV technology and user experience",
      },
      {
        userId: 3,
        firstName: "Carol",
        lastName: "Davis",
        email: "carol.davis@bmw.com",
        department: "Engineering",
        position: "Junior Software Engineer",
        level: "junior",
        yearsAtCompany: 2,
        yearsInRole: 1,
        managerId: 1,
        biography: "Enthusiastic learner with strong fundamentals",
      },
      {
        firstName: "David",
        lastName: "Wilson",
        email: "david.wilson@bmw.com",
        department: "Sales",
        position: "Sales Manager",
        level: "manager",
        yearsAtCompany: 10,
        yearsInRole: 4,
        managerId: null,
        biography: "Strategic thinker with 15 years in automotive",
        userId: 4,
      },
      {
        firstName: "Emma",
        lastName: "Brown",
        email: "emma.brown@bmw.com",
        department: "HR",
        position: "HR Specialist",
        level: "mid",
        yearsAtCompany: 4,
        yearsInRole: 2,
        managerId: null,
        biography: "Focused on talent development and retention",
        userId: 5,
      },
    ];

    const employeeIds = [];
    for (const emp of sampleEmployees) {
      const result = await db.insert(employees).values(emp);
      employeeIds.push(result[0]);
    }
    console.log("✅ Employees created\n");

    // Create sample skills
    console.log("📝 Creating sample skills...");
    const skillsData = [
      { employeeId: 1, skillName: "Cloud Architecture", category: "technical", proficiencyLevel: "expert", yearsOfExperience: 6 },
      { employeeId: 1, skillName: "Python", category: "technical", proficiencyLevel: "expert", yearsOfExperience: 8 },
      { employeeId: 1, skillName: "Team Leadership", category: "leadership", proficiencyLevel: "advanced", yearsOfExperience: 3 },
      { employeeId: 2, skillName: "Product Strategy", category: "domain", proficiencyLevel: "advanced", yearsOfExperience: 5 },
      { employeeId: 2, skillName: "EV Technology", category: "domain", proficiencyLevel: "advanced", yearsOfExperience: 4 },
      { employeeId: 3, skillName: "JavaScript", category: "technical", proficiencyLevel: "intermediate", yearsOfExperience: 1 },
      { employeeId: 3, skillName: "React", category: "technical", proficiencyLevel: "intermediate", yearsOfExperience: 1 },
      { employeeId: 4, skillName: "Sales Strategy", category: "domain", proficiencyLevel: "expert", yearsOfExperience: 10 },
      { employeeId: 4, skillName: "Team Management", category: "leadership", proficiencyLevel: "advanced", yearsOfExperience: 6 },
      { employeeId: 5, skillName: "Talent Management", category: "domain", proficiencyLevel: "advanced", yearsOfExperience: 4 },
    ];

    for (const skill of skillsData) {
      await db.insert(skills).values(skill);
    }
    console.log("✅ Skills created\n");

    // Create sample performance ratings
    console.log("📝 Creating sample performance ratings...");
    const performanceData = [
      {
        employeeId: 1,
        ratingYear: 2025,
        overallRating: "exceeds",
        technicalScore: 5,
        leadershipScore: 4,
        collaborationScore: 5,
        innovationScore: 5,
        comments: "Outstanding technical contributor and mentor",
      },
      {
        employeeId: 2,
        ratingYear: 2025,
        overallRating: "exceeds",
        technicalScore: 4,
        leadershipScore: 5,
        collaborationScore: 5,
        innovationScore: 4,
        comments: "Excellent product vision and execution",
      },
      {
        employeeId: 3,
        ratingYear: 2025,
        overallRating: "meets",
        technicalScore: 3,
        leadershipScore: 2,
        collaborationScore: 4,
        innovationScore: 3,
        comments: "Good progress, needs more experience",
      },
    ];

    for (const perf of performanceData) {
      await db.insert(performanceRatings).values(perf);
    }
    console.log("✅ Performance ratings created\n");

    // Create sample training records
    console.log("📝 Creating sample training records...");
    const trainingData = [
      {
        employeeId: 1,
        trainingName: "Advanced Kubernetes",
        category: "technical",
        status: "completed",
        hoursSpent: 40,
        completionDate: new Date("2025-01-15"),
      },
      {
        employeeId: 2,
        trainingName: "EV Technology Deep Dive",
        category: "EV",
        status: "completed",
        hoursSpent: 30,
        completionDate: new Date("2024-12-20"),
      },
      {
        employeeId: 3,
        trainingName: "React Fundamentals",
        category: "technical",
        status: "in_progress",
        hoursSpent: 15,
      },
      {
        employeeId: 3,
        trainingName: "AI/ML Basics",
        category: "AI",
        status: "planned",
      },
    ];

    for (const training of trainingData) {
      await db.insert(trainingRecords).values(training);
    }
    console.log("✅ Training records created\n");

    // Create sample compensation data
    console.log("📝 Creating sample compensation data...");
    const compensationDataSample = [
      {
        employeeId: 1,
        year: 2025,
        baseSalary: 150000,
        bonus: 30000,
        stockOptions: 50000,
        marketBenchmark: 155000,
        percentileRank: 75,
      },
      {
        employeeId: 2,
        year: 2025,
        baseSalary: 135000,
        bonus: 25000,
        stockOptions: 40000,
        marketBenchmark: 140000,
        percentileRank: 70,
      },
      {
        employeeId: 3,
        year: 2025,
        baseSalary: 85000,
        bonus: 10000,
        stockOptions: 20000,
        marketBenchmark: 88000,
        percentileRank: 60,
      },
    ];

    for (const comp of compensationDataSample) {
      await db.insert(compensationData).values(comp);
    }
    console.log("✅ Compensation data created\n");

    // Create sample talent assessments
    console.log("📝 Creating sample talent assessments...");
    const talentAssessmentData = [
      {
        employeeId: 1,
        talentScore: 92,
        potentialScore: 95,
        hiddenTalentFlags: JSON.stringify(["Strategic thinker", "Mentorship capability", "Innovation driver"]),
        recommendedSkills: JSON.stringify(["Executive leadership", "AI/ML fundamentals", "Strategic planning"]),
        recommendedRoles: JSON.stringify(["Engineering Manager", "Technical Director", "VP Engineering"]),
        assessmentSummary:
          "Alice is a top-tier technical talent with strong leadership potential. She demonstrates exceptional problem-solving skills and has mentored multiple junior engineers. Recommended for fast-track leadership development program.",
      },
      {
        employeeId: 2,
        talentScore: 88,
        potentialScore: 92,
        hiddenTalentFlags: JSON.stringify(["Strategic vision", "Cross-functional collaboration", "Market insight"]),
        recommendedSkills: JSON.stringify(["Business strategy", "AI product integration", "Executive communication"]),
        recommendedRoles: JSON.stringify(["Senior Product Manager", "Head of Product", "Chief Product Officer"]),
        assessmentSummary:
          "Bob demonstrates exceptional product thinking and strategic vision. Strong alignment with BMW's EV strategy. Ready for senior product leadership roles.",
      },
      {
        employeeId: 3,
        talentScore: 72,
        potentialScore: 85,
        hiddenTalentFlags: JSON.stringify(["Quick learner", "Collaborative spirit", "Technical foundation"]),
        recommendedSkills: JSON.stringify(["Advanced software design", "System architecture", "Leadership fundamentals"]),
        recommendedRoles: JSON.stringify(["Senior Software Engineer", "Tech Lead", "Engineering Manager"]),
        assessmentSummary:
          "Carol shows strong potential for growth. With targeted upskilling in architecture and leadership, she can advance to senior roles within 3-5 years.",
      },
    ];

    for (const assessment of talentAssessmentData) {
      await db.insert(talentAssessments).values(assessment);
    }
    console.log("✅ Talent assessments created\n");

    // Create sample succession plans
    console.log("📝 Creating sample succession plans...");
    const successionPlansData = [
      {
        criticalRoleId: "VP-ENG",
        roleName: "VP of Engineering",
        currentHolderId: 1,
        primarySuccessor: 2,
        backupSuccessor: 4,
        readinessScore: 75,
        riskLevel: "medium",
        developmentPlan: "Enroll in executive leadership program, mentor under current VP for 6 months",
      },
      {
        criticalRoleId: "PROD-HEAD",
        roleName: "Head of Product",
        currentHolderId: 2,
        primarySuccessor: 1,
        backupSuccessor: null,
        readinessScore: 60,
        riskLevel: "high",
        developmentPlan: "Cross-functional rotation in product, business strategy training needed",
      },
    ];

    for (const plan of successionPlansData) {
      await db.insert(successionPlans).values(plan);
    }
    console.log("✅ Succession plans created\n");

    // Create sample alerts
    console.log("📝 Creating sample alerts...");
    const alertsData = [
      {
        type: "talent_risk",
        severity: "high",
        title: "High Performer Retention Risk",
        description: "Alice Johnson (Senior Engineer) has been identified as flight risk based on market compensation analysis. Recommend immediate retention discussion.",
        relatedEmployeeIds: JSON.stringify([1]),
        relatedRoleId: "VP-ENG",
      },
      {
        type: "succession_gap",
        severity: "critical",
        title: "Critical Succession Gap",
        description: "Head of Product role has high readiness gap. Only one identified successor with 60% readiness score. Urgent action needed.",
        relatedEmployeeIds: JSON.stringify([2, 1]),
        relatedRoleId: "PROD-HEAD",
      },
      {
        type: "compensation_trend",
        severity: "medium",
        title: "Market Compensation Shift",
        description: "AI/ML expertise commands 15% premium in market. Consider salary adjustments for employees with these skills.",
        relatedEmployeeIds: JSON.stringify([1, 2]),
      },
    ];

    for (const alert of alertsData) {
      await db.insert(alerts).values(alert);
    }
    console.log("✅ Alerts created\n");

    console.log("✨ Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log("   - Users: 3");
    console.log("   - Employees: 5");
    console.log("   - Skills: 10");
    console.log("   - Performance Ratings: 3");
    console.log("   - Training Records: 4");
    console.log("   - Compensation Data: 3");
    console.log("   - Talent Assessments: 3");
    console.log("   - Succession Plans: 2");
    console.log("   - Alerts: 3\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
