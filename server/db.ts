import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  employees,
  skills,
  performanceRatings,
  trainingRecords,
  compensationData,
  talentAssessments,
  successionPlans,
  alerts,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { ssl: "require" });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: Partial<InsertUser> & { openId: string }): Promise<void> {
  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const isAdmin = user.email === ENV.adminEmail && Boolean(ENV.adminEmail);
    const values: InsertUser = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      passwordHash: user.passwordHash ?? null,
      loginMethod: user.loginMethod ?? null,
      role: isAdmin ? "admin" : (user.role ?? "user"),
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };

    const updateSet: Partial<InsertUser> = {};
    if (user.name !== undefined) updateSet.name = user.name ?? null;
    if (user.email !== undefined) updateSet.email = user.email ?? null;
    if (user.passwordHash !== undefined) updateSet.passwordHash = user.passwordHash ?? null;
    if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod ?? null;
    if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
    if (user.role !== undefined || isAdmin) updateSet.role = isAdmin ? "admin" : (user.role ?? "user");

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Employee queries
 */
export async function getEmployeeById(employeeId: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEmployees() {
  const db = getDb();
  if (!db) return [];
  return await db.select().from(employees);
}

export async function getEmployeesByDepartment(department: string) {
  const db = getDb();
  if (!db) return [];
  return await db
    .select()
    .from(employees)
    .where(eq(employees.department, department));
}

/**
 * Skills queries
 */
export async function getEmployeeSkills(employeeId: number) {
  const db = getDb();
  if (!db) return [];
  return await db
    .select()
    .from(skills)
    .where(eq(skills.employeeId, employeeId));
}

/**
 * Performance queries
 */
export async function getEmployeePerformance(employeeId: number) {
  const db = getDb();
  if (!db) return [];
  return await db
    .select()
    .from(performanceRatings)
    .where(eq(performanceRatings.employeeId, employeeId));
}

/**
 * Training queries
 */
export async function getEmployeeTraining(employeeId: number) {
  const db = getDb();
  if (!db) return [];
  return await db
    .select()
    .from(trainingRecords)
    .where(eq(trainingRecords.employeeId, employeeId));
}

/**
 * Compensation queries
 */
export async function getEmployeeCompensation(employeeId: number, year: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(compensationData)
    .where(
      and(
        eq(compensationData.employeeId, employeeId),
        eq(compensationData.year, year)
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Talent assessment queries
 */
export async function getEmployeeTalentAssessment(employeeId: number) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(talentAssessments)
    .where(eq(talentAssessments.employeeId, employeeId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTopTalents(limit: number = 10) {
  const db = getDb();
  if (!db) return [];
  return await db
    .select()
    .from(talentAssessments)
    .orderBy(desc(talentAssessments.talentScore))
    .limit(limit);
}

/**
 * Succession plan queries
 */
export async function getSuccessionPlan(roleId: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(successionPlans)
    .where(eq(successionPlans.criticalRoleId, roleId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSuccessionPlans() {
  const db = getDb();
  if (!db) return [];
  return await db.select().from(successionPlans);
}

/**
 * Alert queries
 */
export async function getUnreadAlerts() {
  const db = getDb();
  if (!db) return [];
  return await db.select().from(alerts).where(eq(alerts.isRead, false));
}

export async function getAllAlerts() {
  const db = getDb();
  if (!db) return [];
  return await db.select().from(alerts);
}
