import { supabase } from "./supabase";

export async function createSchool(
  schoolName: string,
  adminEmail: string
) {
  const name = schoolName.trim();
  const email = adminEmail.trim().toLowerCase();

  if (!name) {
    throw new Error("Please enter your school or university name.");
  }

  if (!email) {
    throw new Error("Please enter the Admin email.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Please login again.");
  }

  const { data, error } = await supabase.functions.invoke(
    "invite-school-admin",
    {
      body: {
        schoolName: name,
        adminEmail: email,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (error) {
    let message = error.message;

    try {
      const context = (error as any).context;
      if (context instanceof Response) {
        const result = await context.json();
        message = result.error || message;
      }
    } catch {
      // Keep the original error message.
    }

    throw new Error(message);
  }

  if (!data?.success || !data?.schoolId) {
    throw new Error(data?.error || "School creation failed.");
  }

  return data.schoolId as string;
}

export async function getMySchools() {
  const { data, error } = await supabase
    .from("school_members")
    .select(`
      school_id,
      role,
      schools (
        id,
        name,
        created_at
      )
    `);

  if (error) {
    throw error;
  }

  return data;
}