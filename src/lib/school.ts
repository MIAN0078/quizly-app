
import { supabase } from "./supabase";

export async function createSchool(schoolName: string) {
  const name = schoolName.trim();

  if (!name) {
    throw new Error("Please enter your school name.");
  }

 const { data, error } = await supabase.rpc("create_school", {
  p_school_name: name,
});
  

  if (error) {
  console.error("CREATE SCHOOL ERROR:", error);
  console.error("Error code:", error.code);
  console.error("Error message:", error.message);
  console.error("Error details:", error.details);
  console.error("Error hint:", error.hint);

  throw new Error(
    `${error.message} | Details: ${error.details || "None"} | Hint: ${error.hint || "None"}`
  );
}

  return data;
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
