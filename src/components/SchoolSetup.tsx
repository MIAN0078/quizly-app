
import { useEffect, useState } from "react";
import { createSchool, getMySchools } from "../lib/school";

type School = {
  school_id: string;
  role: string;
  schools:
    | {
        id: string;
        name: string;
        created_at: string;
      }
    | {
        id: string;
        name: string;
        created_at: string;
      }[]
    | null;
};

type SchoolSetupProps = {
  onSchoolSelected: (
    schoolId: string,
    schoolName: string,
    role: string
  ) => void;
};

function SchoolSetup({ onSchoolSelected }: SchoolSetupProps) {
  const [schoolName, setSchoolName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMySchools();
      setSchools(data as School[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load schools."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchools();
  }, []);

  const handleCreateSchool = async () => {
    if (!schoolName.trim()) {
      setError("Please enter your school name.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const schoolId = await createSchool(schoolName, adminEmail);

      if (typeof schoolId !== "string") {
        throw new Error("School was created, but its ID was not returned.");
      }

      onSchoolSelected(schoolId, schoolName.trim(), "admin");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create school."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSelectSchool = (school: School) => {
    const schoolInfo = Array.isArray(school.schools)
      ? school.schools[0]
      : school.schools;

    if (!schoolInfo) return;

    onSchoolSelected(
      school.school_id,
      schoolInfo.name,
      school.role
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f5f6fb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          padding: "35px",
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginBottom: "8px", color: "#25234a" }}>
          Welcome to Quizly!
        </h1>

        <p style={{ color: "#777", marginBottom: "28px" }}>
          Create your school or select a school you already belong to.
        </p>

        <h2 style={{ fontSize: "19px", marginBottom: "14px" }}>
          Create a New School
        </h2>

        <input
          type="text"
          value={schoolName}
          onChange={(event) => setSchoolName(event.target.value)}
          placeholder="Enter school or university name"
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid #ddd",
            borderRadius: "9px",
            marginBottom: "12px",
            boxSizing: "border-box",
          }}
        />
        <input
  type="email"
  value={adminEmail}
  onChange={(event) => setAdminEmail(event.target.value)}
  placeholder="Enter School Admin Email"
  style={{
    width: "100%",
    padding: "14px",
    border: "1px solid #ddd",
    borderRadius: "9px",
    marginBottom: "12px",
    boxSizing: "border-box",
  }}
/>

        <button
          onClick={handleCreateSchool}
          disabled={creating}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "9px",
            background: "#6558d3",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {creating ? "Creating School..." : "Create School"}
        </button>

        {error && (
          <p style={{ color: "#d93025", marginTop: "14px" }}>
            {error}
          </p>
        )}

        <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #eee" }} />

        <h2 style={{ fontSize: "19px", marginBottom: "14px" }}>
          Your Schools
        </h2>

        {loading ? (
          <p>Loading your schools...</p>
        ) : schools.length === 0 ? (
          <p style={{ color: "#777" }}>
            You have not joined any school yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {schools.map((school) => {
              const schoolInfo = Array.isArray(school.schools)
                ? school.schools[0]
                : school.schools;

              if (!schoolInfo) return null;

              return (
                <button
                  key={school.school_id}
                  onClick={() => handleSelectSchool(school)}
                  style={{
                    padding: "16px",
                    border: "1px solid #e5e5e5",
                    borderRadius: "10px",
                    background: "#fafaff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ display: "block", color: "#25234a" }}>
                    {schoolInfo.name}
                  </strong>

                  <span style={{ color: "#777", fontSize: "13px" }}>
                    Role: {school.role}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SchoolSetup;
