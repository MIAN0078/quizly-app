
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Student = {
  id: string;
  full_name: string;
  email: string;
  student_code: string | null;
  course: string | null;
  status: "active" | "inactive";
};

type ManageStudentsProps = {
  schoolId: string;
};

function ManageStudents({ schoolId }: ManageStudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  async function loadStudents() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("school_students")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setStudents((data || []) as Student[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (schoolId) {
      loadStudents();
    }
  }, [schoolId]);

  function resetForm() {
    setEditingId(null);
    setFullName("");
    setEmail("");
    setStudentCode("");
    setCourse("");
    setStatus("active");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim()) {
      setError("Please enter student name and email.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from("school_students")
        .update({
          full_name: fullName.trim(),
          email: email.trim(),
          student_code: studentCode.trim() || null,
          course: course.trim() || null,
          status,
        })
        .eq("id", editingId)
        .eq("school_id", schoolId);

      if (error) {
        setError(error.message);
      } else {
        resetForm();
        await loadStudents();
      }
    } else {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("Please login again before adding a student.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("school_students")
        .insert({
          school_id: schoolId,
          created_by: userData.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          student_code: studentCode.trim() || null,
          course: course.trim() || null,
          status,
        });

      if (error) {
        setError(error.message);
      } else {
        resetForm();
        await loadStudents();
      }
    }

    setSaving(false);
  }

  function handleEdit(student: Student) {
    setEditingId(student.id);
    setFullName(student.full_name);
    setEmail(student.email);
    setStudentCode(student.student_code || "");
    setCourse(student.course || "");
    setStatus(student.status);
    setError("");
  }

  async function handleDelete(studentId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("school_students")
      .delete()
      .eq("id", studentId)
      .eq("school_id", schoolId);

    if (error) {
      setError(error.message);
    } else {
      await loadStudents();
    }
  }

  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <span className="section-tag">SCHOOL ADMINISTRATION</span>
          <h1>Manage Students</h1>
          <p>Add, update and manage your school students.</p>
        </div>
      </div>

      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <h2>{editingId ? "Edit Student" : "Add New Student"}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
            <label>
              Student Name
              <input
                style={{ width: "100%", padding: "12px", marginTop: "7px" }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter student name"
                required
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                style={{ width: "100%", padding: "12px", marginTop: "7px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
              />
            </label>

            <label>
              Student ID
              <input
                style={{ width: "100%", padding: "12px", marginTop: "7px" }}
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="Optional student ID"
              />
            </label>

            <label>
              Course / Class
              <input
                style={{ width: "100%", padding: "12px", marginTop: "7px" }}
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Enter course or class"
              />
            </label>

            <label>
              Status
              <select
                style={{ width: "100%", padding: "12px", marginTop: "7px" }}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "active" | "inactive")
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          {error && (
            <p style={{ color: "#dc2626", marginTop: "15px" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Student"
                  : "Add Student"}
            </button>

            {editingId && (
              <button
                className="secondary-button"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: "24px" }}>
        <h2>Students List ({students.length})</h2>

        {loading ? (
          <p>Loading students...</p>
        ) : students.length === 0 ? (
          <p>No students added yet. Add your first student above.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "12px" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "12px" }}>Student ID</th>
                  <th style={{ textAlign: "left", padding: "12px" }}>Course</th>
                  <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={{ padding: "12px" }}>{student.full_name}</td>
                    <td style={{ padding: "12px" }}>{student.email}</td>
                    <td style={{ padding: "12px" }}>{student.student_code || "-"}</td>
                    <td style={{ padding: "12px" }}>{student.course || "-"}</td>
                    <td style={{ padding: "12px" }}>{student.status}</td>
                    <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                      <button
                        className="secondary-button"
                        onClick={() => handleEdit(student)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        className="secondary-button"
                        onClick={() => handleDelete(student.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default ManageStudents;
