
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type SchoolAdminDashboardProps = {
  schoolName: string;
  schoolId: string;
  onNavigate: (page: string) => void;
};

function SchoolAdminDashboard({
  schoolName,
  schoolId,
  onNavigate,
}: SchoolAdminDashboardProps) {
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudentCount() {
      setLoading(true);
      setError("");

      const { count, error } = await supabase
        .from("school_students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId);

      if (error) {
        setError(error.message);
      } else {
        setTotalStudents(count ?? 0);
      }

      setLoading(false);
    }

    if (schoolId) {
      loadStudentCount();
    }
  }, [schoolId]);

  const stats = [
    {
      title: "Total Students",
      value: loading ? "..." : String(totalStudents),
      icon: "👨‍🎓",
      color: "#e9e7ff",
    },
    {
      title: "Total Teachers",
      value: "0",
      icon: "👩‍🏫",
      color: "#e1f5ed",
    },
    {
      title: "Total Quizzes",
      value: "0",
      icon: "📝",
      color: "#fff0df",
    },
    {
      title: "Quiz Attempts",
      value: "0",
      icon: "📊",
      color: "#e1efff",
    },
  ];

  const actions = [
    {
      title: "Manage Students",
      description: "Add and manage school students.",
      icon: "👨‍🎓",
      page: "Manage Students",
      enabled: true,
    },
    {
      title: "Manage Teachers",
      description: "Manage teachers and their access.",
      icon: "👩‍🏫",
      page: "Manage Teachers",
      enabled: false,
    },
    {
      title: "Manage Quizzes",
      description: "Create and manage school quizzes.",
      icon: "📝",
      page: "My Quizzes",
      enabled: true,
    },
    {
      title: "View Results",
      description: "Review student quiz performance.",
      icon: "📊",
      page: "My Results",
      enabled: true,
    },
  ];

  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <span className="section-tag">SCHOOL ADMINISTRATION</span>
          <h1>School Admin Dashboard</h1>
          <p>Welcome to {schoolName}</p>
        </div>
      </div>

      <div
        style={{
          padding: "24px",
          borderRadius: "16px",
          background: "linear-gradient(120deg, #5146c7, #8174e8)",
          color: "#ffffff",
          marginBottom: "25px",
        }}
      >
        <h2 style={{ margin: "0 0 8px" }}>
          Welcome, School Administrator!
        </h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Manage your institution's learning and assessment activities
          from one place.
        </p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card card" key={stat.title}>
            <div className="stat-icon" style={{ background: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p>{stat.title}</p>
              <h2>{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ color: "#dc2626", marginTop: "15px" }}>
          Student count error: {error}
        </p>
      )}

      <div className="section-heading" style={{ marginTop: "30px" }}>
        <div>
          <h2>Institution Management</h2>
          <p>Manage your school from these sections.</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
        }}
      >
        {actions.map((action) => (
          <div className="card" key={action.title} style={{ padding: "22px" }}>
            <div style={{ fontSize: "30px", marginBottom: "12px" }}>
              {action.icon}
            </div>

            <h3>{action.title}</h3>

            <p style={{ color: "#777", minHeight: "42px" }}>
              {action.description}
            </p>

            <button
              className="primary-button"
              disabled={!action.enabled}
              onClick={() => onNavigate(action.page)}
            >
              {action.enabled ? "Open Section →" : "Coming Soon"}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "22px", marginTop: "25px" }}>
        <h3>Institution Information</h3>
        <p><strong>School Name:</strong> {schoolName}</p>
        <p><strong>Account Type:</strong> School Administrator</p>
        <p><strong>Platform:</strong> Quizly</p>
      </div>
    </section>
  );
}

export default SchoolAdminDashboard;
