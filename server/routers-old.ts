import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
});

export type AppRouter = typeof appRouter;
