"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";
import { findUser } from "@/lib/users";

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = findUser(email, password);
  if (!user) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id, user.name, user.role);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
