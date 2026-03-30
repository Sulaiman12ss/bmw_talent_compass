import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { decisionRouter } from "./decision-router";

export const appRouter = router({
  system: systemRouter,
  decision: decisionRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const { getUserByEmail, upsertUser } = await import("./db");
        const user = await getUserByEmail(input.email);

        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        await upsertUser({ openId: user.openId, lastSignedIn: new Date() });

        const token = await sdk.createSessionToken(user.openId, {
          email: user.email ?? "",
          name: user.name ?? "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(8, "Password must be at least 8 characters"),
          name: z.string().min(1, "Name is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { getUserByEmail, upsertUser, getUserByOpenId } = await import("./db");

        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }

        const passwordHash = await bcrypt.hash(input.password, 12);
        const openId = nanoid();

        await upsertUser({
          openId,
          email: input.email,
          name: input.name,
          passwordHash,
          loginMethod: "email",
        });

        const user = await getUserByOpenId(openId);
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }

        const token = await sdk.createSessionToken(user.openId, {
          email: user.email ?? "",
          name: user.name ?? "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
  }),

  employees: router({
    list: publicProcedure.query(async () => {
      const { getAllEmployees } = await import("./db");
      return getAllEmployees();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const { getEmployeeById, getEmployeeSkills, getEmployeePerformance, getEmployeeTraining, getEmployeeTalentAssessment } = await import("./db");
      const employee = await getEmployeeById(input.id);
      if (!employee) return null;
      const [skills, performance, training, talentAssessment] = await Promise.all([
        getEmployeeSkills(input.id),
        getEmployeePerformance(input.id),
        getEmployeeTraining(input.id),
        getEmployeeTalentAssessment(input.id),
      ]);
      return { employee, skills, performance, training, talentAssessment };
    }),
    getByDepartment: publicProcedure.input(z.object({ department: z.string() })).query(async ({ input }) => {
      const { getEmployeesByDepartment } = await import("./db");
      return getEmployeesByDepartment(input.department);
    }),
  }),

  talent: router({
    getTopTalents: publicProcedure.input(z.object({ limit: z.number().default(10) })).query(async ({ input }) => {
      const { getTopTalents } = await import("./db");
      return getTopTalents(input.limit);
    }),
    getTalentAssessment: publicProcedure.input(z.object({ employeeId: z.number() })).query(async ({ input }) => {
      const { getEmployeeTalentAssessment } = await import("./db");
      return getEmployeeTalentAssessment(input.employeeId);
    }),
  }),

  succession: router({
    getPlans: publicProcedure.query(async () => {
      const { getAllSuccessionPlans } = await import("./db");
      return getAllSuccessionPlans();
    }),
    getPlan: publicProcedure.input(z.object({ roleId: z.string() })).query(async ({ input }) => {
      const { getSuccessionPlan } = await import("./db");
      return getSuccessionPlan(input.roleId);
    }),
  }),

  alerts: router({
    getUnread: publicProcedure.query(async () => {
      const { getUnreadAlerts } = await import("./db");
      return getUnreadAlerts();
    }),
    getAll: publicProcedure.query(async () => {
      const { getAllAlerts } = await import("./db");
      return getAllAlerts();
    }),
  }),

  insights: router({
    generateTalentAssessment: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .mutation(async ({ input }) => {
        const { getEmployeeById, getEmployeeSkills, getEmployeePerformance, getEmployeeTraining } = await import("./db");
        const { generateTalentAssessmentSummary } = await import("./llm-service");

        const employee = await getEmployeeById(input.employeeId);
        if (!employee) throw new Error("Employee not found");

        const [skills, performance, training] = await Promise.all([
          getEmployeeSkills(input.employeeId),
          getEmployeePerformance(input.employeeId),
          getEmployeeTraining(input.employeeId),
        ]);

        return generateTalentAssessmentSummary(employee, skills, performance, training);
      }),

    generateSuccessionRecommendations: publicProcedure
      .input(z.object({ roleId: z.string() }))
      .mutation(async ({ input }) => {
        const { getSuccessionPlan, getEmployeeById } = await import("./db");
        const { generateSuccessionRecommendations } = await import("./llm-service");

        const plan = await getSuccessionPlan(input.roleId);
        if (!plan) throw new Error("Succession plan not found");

        const currentHolder = plan.currentHolderId ? await getEmployeeById(plan.currentHolderId) : null;
        const primary = plan.primarySuccessor ? await getEmployeeById(plan.primarySuccessor) : null;
        const backup = plan.backupSuccessor ? await getEmployeeById(plan.backupSuccessor) : null;

        const candidates = [primary, backup].filter((e) => e !== null && e !== undefined);
        return generateSuccessionRecommendations(plan.roleName, currentHolder || null, candidates as any);
      }),

    generateCompensationInsights: publicProcedure
      .input(z.object({ department: z.string(), avgSalary: z.number(), marketBenchmark: z.number(), employeeCount: z.number() }))
      .mutation(async ({ input }) => {
        const { generateCompensationInsights2 } = await import("./llm-service");
        return generateCompensationInsights2(input.department, input.avgSalary, input.marketBenchmark, input.employeeCount);
      }),

    generateUpskillPath: publicProcedure
      .input(z.object({ employeeId: z.number(), futureNeeds: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        const { getEmployeeById, getEmployeeSkills } = await import("./db");
        const { generateUpskillRecommendations } = await import("./llm-service");

        const employee = await getEmployeeById(input.employeeId);
        if (!employee) throw new Error("Employee not found");

        const skills = await getEmployeeSkills(input.employeeId);
        return generateUpskillRecommendations(employee, skills, input.futureNeeds);
      }),
  }),
});

export type AppRouter = typeof appRouter;
