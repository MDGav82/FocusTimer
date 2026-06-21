import { z } from "zod";
import { PeriodType } from "@/model/Period.ts";
import { Status } from "@/model/Task.ts";

/**
 * These schemas describe what the API actually sends over the wire — not the
 * full BaseEntity. `updatedAt`/`_syncStatus` are local sync bookkeeping the
 * server never tracks; Api*Repository stamps them in after validation.
 */

export const ParametersSchema = z.object({
    id: z.string(),
    autoStartWork: z.boolean(),
    autoStartRest: z.boolean(),
    autoRestartCycle: z.boolean(),
    notificationsOn: z.boolean(),
});

export const UserSchema = z.object({
    id: z.string(),
    email: z.string(),
    parameters: ParametersSchema,
});

export const PeriodSchema = z.object({
    id: z.string(),
    cycle_id: z.string(),
    time: z.number(),
    index: z.number(),
    typePeriode: z.enum(PeriodType),
});

export const CycleSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    name: z.string(),
    periods: z.array(PeriodSchema),
});

export const TaskSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    title: z.string(),
    description: z.string(),
    estimatedTime: z.number(),
    progress: z.number(),
    timeSpent: z.number(),
    creationDate: z.coerce.date(),
    startDate: z.coerce.date().nullable().transform(v => v ?? undefined),
    endDate: z.coerce.date().nullable().transform(v => v ?? undefined),
    status: z.enum(Status),
});
