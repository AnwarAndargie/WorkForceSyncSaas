import { z } from "zod";
import { User, Tenant, users } from "@/lib/db/schema";
import { db } from "../db/drizzle";
import { redirect } from "next/navigation";
import { getSessionUser, getSessionUserId } from "./session";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message } as T;
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (
    prevState: ActionState,
    formData: FormData,
    request: NextRequest
  ): Promise<T> => {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      throw new Error("User is not authenticated");
    }
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionUser?.id))
      .limit(1);
    if (!user) {
      throw new Error("User is not authenticated");
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message } as T;
    }

    return action(result.data, formData, user[0]);
  };
}
