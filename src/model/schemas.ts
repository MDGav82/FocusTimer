import { z } from "zod";
import { PeriodType } from "@/model/Period.ts";
import { TaskStatus } from "@/model/Task.ts";

/**
 * These schemas describe what the API actually sends over the wire — not the
 * full BaseEntity. `updatedAt`/`_syncStatus` are local sync bookkeeping the
 * server never tracks; Api*Repository stamps them in after validation.
 */

const SyncStatus = ['synced', 'pending', 'conflict'] as const

export const ParametersSchema = z.object({
    id: z.string(),
    autoStartWork: z.boolean(),
    autoStartRest: z.boolean(),
    autoRestartCycle: z.boolean(),
    notificationsOn: z.boolean(),
    updatedAt: z.number(),
    _syncStatus: z.enum(SyncStatus),
});

export const UserSchema = z.object({
    id: z.string(),
    email: z.string(),
    parameters: ParametersSchema,
    updatedAt: z.number(),
    _syncStatus: z.enum(SyncStatus),
});

export const PeriodSchema = z.object({
    id: z.string(),
    cycle_id: z.string(),
    time: z.number(),
    index: z.number(),
    typePeriode: z.enum(PeriodType).meta({ description: "PeriodType enum: 0 = WORK, 1 = REST" }),
    updatedAt: z.number(),
    _syncStatus: z.enum(SyncStatus),
});

export const CycleSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    name: z.string(),
    updatedAt: z.number(),
    _syncStatus: z.enum(SyncStatus),
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
    status: z.enum(TaskStatus).meta({ description: "Status enum: 0 = PENDING, 1 = PROGRESS, 2 = FINISHED" }),
    updatedAt: z.number(),
    _syncStatus: z.enum(SyncStatus),
});

/**
 * Request body schemas (API inputs). Kept next to the response schemas above so
 * the documented request shapes are generated from Zod too (see
 * src/backend/zodOpenApi.ts) instead of being hand-written in the OpenAPI spec.
 * Field names/types mirror what the routes actually read from `body`.
 */

export const AuthCredentialsSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
    updatedAt: z.number(),
    _syncStatus: z.enum(SyncStatus),
});

export const UserUpdateSchema = z.object({
    email: z.email().optional(),
    password: z.string().min(1).optional(),
});

export const ParametersUpdateSchema = z.object({
    autoStartWork: z.boolean().optional(),
    autoStartRest: z.boolean().optional(),
    autoRestartCycle: z.boolean().optional(),
    notificationsOn: z.boolean().optional(),
});

export const TaskCreateSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    estimatedTime: z.number().optional(),
});

export const TaskUpdateSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(TaskStatus).meta({ description: "Status enum: 0 = pending, 1 = progress, 2 = finished" }).optional(),
    estimatedTime: z.number().optional(),
    progress: z.number().optional(),
    timeSpent: z.number().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
});

export const PeriodInputSchema = z.object({
    typePeriode: z.enum(PeriodType).meta({ description: "PeriodType enum: 0 = work, 1 = break" }),
    time: z.number().meta({ description: "Duration in seconds" }),
    index: z.number().meta({ description: "Order within the cycle" }),
});

export const CycleCreateSchema = z.object({
    name: z.string(),
    periods: z.array(PeriodInputSchema).optional(),
});

export const CycleUpdateSchema = z.object({
    name: z.string().optional(),
    periods: z.array(PeriodInputSchema).meta({ description: "Replaces all existing periods when provided" }).optional(),
});
