import { supabase } from "./lib/supabase";

import ManageStudents from "./components/ManageStudents";

import SchoolAdminDashboard from "./components/SchoolAdminDashboard";

import Login from "./components/Login";

import { useEffect, useState } from "react";

import "./App.css";

import QuestionManager, {
  type QuizCategory,
} from "./components/QuestionManager";

import SchoolSetup from "./components/SchoolSetup";

type Question = {
  id?: string;
  question: string;
  options: string[];
  answer: number;
  category: QuizCategory;
};

type ReviewItem = {
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer: number;
};

type Page =
  | "Dashboard"
  | "My Quizzes"
  | "Manage Questions"
  | "Manage Students"
  | "My Results"
  | "Leaderboard"
  | "Settings"
  | "My Schools";

type QuizResult = {
  id: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  durationMinutes: number;
  category?: QuizCategory;
  review?: ReviewItem[];
};

const DEFAULT_SUBJECTS = [
  "React",
  "JavaScript",
  "TypeScript",
  "HTML & CSS",
];

function loadSubjects(): string[] {
  try {
    const saved = localStorage.getItem("quizly_subjects");
    if (!saved) return DEFAULT_SUBJECTS;

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return DEFAULT_SUBJECTS;

    const customSubjects = parsed
      .filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
      .map((item) => item.trim());

    return Array.from(new Set([...DEFAULT_SUBJECTS, ...customSubjects]));
  } catch {
    return DEFAULT_SUBJECTS;
  }
}

const defaultQuestions: Question[] = [
  {
    question: "What is React?",
    options: [
      "A programming language",
      "A JavaScript library",
      "A database",
      "An operating system",
    ],
    answer: 1,
    category: "React",
  },
  {
    question: "Which hook is used to manage state in React?",
    options: ["useEffect", "useRef", "useState", "useMemo"],
    answer: 2,
    category: "React",
  },
  {
    question: "What does JSX stand for?",
    options: [
      "JavaScript XML",
      "Java Syntax Extension",
      "JavaScript Extra",
      "JSON XML",
    ],
    answer: 0,
    category: "React",
  },
  {
    question: "Which command starts a Vite development server?",
    options: [
      "npm start",
      "npm run build",
      "npm run dev",
      "npm install",
    ],
    answer: 2,
    category: "React",
  },
  {
    question: "Which method is used to render a list in React?",
    options: [".filter()", ".map()", ".find()", ".reduce()"],
    answer: 1,
    category: "React",
  },
];

function loadSavedQuestions(): Question[] {
  try {
    const saved = localStorage.getItem("quizly_questions");

    if (saved !== null) {
      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => ({
          id: item.id || `question-${index}`,
          question: item.question || "",
          options: Array.isArray(item.options) ? item.options : [],
          answer: item.correctAnswer ?? item.answer ?? 0,
          category:
            typeof item.category === "string" && item.category.trim()
              ? item.category
              : "React",
        }));
      }
    }
  } catch {
    console.error("Could not load saved questions.");
  }

  return defaultQuestions;
}

function App() {
  const [subjects, setSubjects] = useState<string[]>(loadSubjects);

  useEffect(() => {
    localStorage.setItem("quizly_subjects", JSON.stringify(subjects));
  }, [subjects]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [loggedInName, setLoggedInName] = useState(
    () => localStorage.getItem("quizly_profile_name") || "Student"
  );

  const [profileName, setProfileName] = useState(
    () => localStorage.getItem("quizly_profile_name") || "Student"
  );

  const [profileEmail, setProfileEmail] = useState(
    () => localStorage.getItem("quizly_profile_email") || ""
  );

  const [page, setPage] = useState<Page>("Dashboard");

  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [schoolRole, setSchoolRole] = useState("");

  const [questions, setQuestions] =
    useState<Question[]>(loadSavedQuestions);

  const [selectedCategory, setSelectedCategory] =
    useState<QuizCategory>("React");

  const [activeQuizQuestions, setActiveQuizQuestions] =
    useState<Question[]>([]);

  const [quizMinutes, setQuizMinutes] = useState(10);
  const [customMinutes, setCustomMinutes] = useState("10");
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const [reviewResult, setReviewResult] =
    useState<QuizResult | null>(null);

  const [results, setResults] = useState<QuizResult[]>(() => {
    try {
      const saved = localStorage.getItem("quizly_results");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const question = activeQuizQuestions[currentQuestion];

  const score = answers.reduce(
    (total, answer, index) =>
      total + (answer === activeQuizQuestions[index]?.answer ? 1 : 0),
    0
  );

  const correctAnswers = answers.filter(
    (answer, index) => answer === activeQuizQuestions[index]?.answer
  ).length;

  const progress =
    activeQuizQuestions.length > 0
      ? ((currentQuestion + 1) / activeQuizQuestions.length) * 100
      : 0;

  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce((total, result) => total + result.percentage, 0) /
            results.length
        )
      : 0;

  const leaderboard = [...results].sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }

    return b.score - a.score;
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  useEffect(() => {
    localStorage.setItem("quizly_results", JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem(
      "quizly_questions",
      JSON.stringify(
        questions.map((item, index) => ({
          id: item.id || `question-${index}`,
          question: item.question,
          options: item.options,
          correctAnswer: item.answer,
          category: item.category || "React",
        }))
      )
    );
  }, [questions]);

  const finishQuiz = (finalAnswers: number[]) => {
    const finalScore = finalAnswers.reduce(
      (total, answer, index) =>
        total + (answer === activeQuizQuestions[index]?.answer ? 1 : 0),
      0
    );

    const totalQuestions = activeQuizQuestions.length;

    const percentage =
      totalQuestions > 0
        ? Math.round((finalScore / totalQuestions) * 100)
        : 0;

    const elapsedSeconds = quizMinutes * 60 - timeLeft;
    const durationMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));

    const newResult: QuizResult = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      score: finalScore,
      total: totalQuestions,
      percentage,
      durationMinutes,
      category: selectedCategory,
      review: activeQuizQuestions.map((item, index) => ({
        question: item.question,
        options: [...item.options],
        correctAnswer: item.answer,
        selectedAnswer: finalAnswers[index] ?? -1,
      })),
    };

    setAnswers(finalAnswers);
    setResults((previous) => [newResult, ...previous]);
    setReviewResult(newResult);
    setShowReview(false);
    setQuizStarted(false);
    setShowResult(true);
  };

  useEffect(() => {
    if (!quizStarted || showResult) return;

    if (timeLeft <= 1) {
      const finalAnswers = [...answers];

      if (selectedAnswer !== null) {
        finalAnswers[currentQuestion] = selectedAnswer;
      }

      while (finalAnswers.length < activeQuizQuestions.length) {
        finalAnswers.push(-1);
      }

      finishQuiz(finalAnswers);

      setTimeLeft(0);

      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    quizStarted,
    showResult,
    timeLeft,
    answers,
    selectedAnswer,
    currentQuestion,
    activeQuizQuestions,
  ]);

  const startQuiz = (category: QuizCategory = selectedCategory) => {
    const latestQuestions = loadSavedQuestions();
    setQuestions(latestQuestions);

    const categoryQuestions = latestQuestions.filter(
      (item) => item.category === category
    );

    if (categoryQuestions.length === 0) {
      alert(
        schoolRole === "admin"
          ? `There are no ${category} questions yet. Please add questions in Manage Questions.`
          : `There are no ${category} questions yet. Please ask your school admin to add questions.`
      );

      setPage(schoolRole === "admin" ? "Manage Questions" : "My Quizzes");

      return;
    }

    setSelectedCategory(category);
    setActiveQuizQuestions(categoryQuestions);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setShowReview(false);
    setReviewResult(null);
    setTimeLeft(quizMinutes * 60);
    setQuizStarted(true);
    setPage("My Quizzes");
  };

  const nextQuestion = () => {
    if (selectedAnswer === null) return;

    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = selectedAnswer;

    if (currentQuestion < activeQuizQuestions.length - 1) {
      setAnswers(updatedAnswers);
      setCurrentQuestion((previous) => previous + 1);
      setSelectedAnswer(null);
    } else {
      finishQuiz(updatedAnswers);
    }
  };

  const openPage = (nextPage: Page) => {
    if (
      (nextPage === "Manage Questions" || nextPage === "Manage Students") &&
      schoolRole !== "admin"
    ) {
      alert("Only school admins can access this page.");
      setPage("Dashboard");
      return;
    }

    if (nextPage !== "My Quizzes") {
      setQuizStarted(false);
    }

    setQuestions(loadSavedQuestions());

    setShowResult(false);
    setShowReview(false);
    setReviewResult(null);
    setPage(nextPage);
  };

  const handleSaveProfile = () => {
    const name = profileName.trim();
    const email = profileEmail.trim();

    if (!name) {
      alert("Please enter your name.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    setProfileName(name);
    setLoggedInName(name);

    localStorage.setItem("quizly_profile_name", name);
    localStorage.setItem("quizly_profile_email", email);

    alert("Profile updated successfully!");
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        alert("Could not logout. Please try again.");
        return;
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Could not logout. Please try again.");
      return;
    }

    setQuizStarted(false);
    setShowResult(false);
    setShowReview(false);
    setReviewResult(null);
    setTimeLeft(0);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setActiveQuizQuestions([]);
    setSelectedSchoolId("");
    setSelectedSchoolName("");
    setSchoolRole("");
    setPage("Dashboard");
    setIsLoggedIn(false);
  };

  const navigation: { name: Page; icon: string }[] = [
    { name: "Dashboard", icon: "⌂" },
    { name: "My Quizzes", icon: "▤" },
    ...(schoolRole === "admin"
      ? [
          { name: "Manage Questions" as Page, icon: "✎" },
          { name: "Manage Students" as Page, icon: "👨‍🎓" },
        ]
      : []),
    { name: "My Results", icon: "▥" },
    { name: "Leaderboard", icon: "🏆" },
    { name: "My Schools", icon: "🏫" },
    { name: "Settings", icon: "⚙" },
  ];

  const renderReview = (result: QuizResult) => (
    <div className="review-section">
      <div className="review-heading">
        <div>
          <h2>Quiz Answer Review</h2>
          <p>Check your answers and learn from your mistakes.</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => {
            setShowReview(false);
            setReviewResult(null);
          }}
        >
          Close Review
        </button>
      </div>

      {result.review?.map((item, index) => (
        <div className="review-question-card" key={index}>
          <h3>
            Question {index + 1}: {item.question}
                      </h3>

          <div className="review-options">
            {item.options.map((option, optionIndex) => {
              const isCorrect = optionIndex === item.correctAnswer;
              const isSelected = optionIndex === item.selectedAnswer;

              return (
                <div
                  key={optionIndex}
                  className={`review-option ${
                    isCorrect
                      ? "review-correct"
                      : isSelected
                      ? "review-incorrect"
                      : ""
                  }`}
                >
                  <span>
                    {String.fromCharCode(65 + optionIndex)}. {option}
                  </span>
                  {isCorrect && <strong>✓ Correct Answer</strong>}
                  {isSelected && !isCorrect && (
                    <strong>✕ Your Answer</strong>
                  )}
                </div>
              );
            })}
          </div>

          {item.selectedAnswer === -1 && (
            <p className="review-unanswered">
              You did not answer this question.
            </p>
          )}
        </div>
      ))}
    </div>
  );

  // Student and Admin Login

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={async (name) => {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error("User not found:", userError);
            alert("User session not found. Please login again.");
            return;
          }

          const savedName = localStorage.getItem("quizly_profile_name");

          const accountName =
            savedName ||
            user.user_metadata?.full_name ||
            name ||
            user.email?.split("@")[0] ||
            "User";

          setLoggedInName(accountName);
          setProfileName(accountName);
          setProfileEmail(user.email || "");

          // First check school membership and role
          const { data: membership, error: membershipError } =
            await supabase
              .from("school_members")
              .select("school_id, role")
              .eq("user_id", user.id)
              .limit(1)
              .maybeSingle();

          if (membershipError) {
            console.error("Membership lookup error:", membershipError);
            alert("Could not check your school role. Please try again.");
            return;
          }

          if (membership) {
            const { data: school, error: schoolError } = await supabase
              .from("schools")
              .select("name")
              .eq("id", membership.school_id)
              .maybeSingle();

            if (schoolError) {
              console.error("School lookup error:", schoolError);
            }

            setSelectedSchoolId(membership.school_id);
            setSelectedSchoolName(school?.name || "");
            setSchoolRole(membership.role);
          } else {
            // If no school membership, check student account
            const { data: student, error: studentError } = await supabase
              .from("school_students")
              .select("school_id, full_name, email")
              .eq("user_id", user.id)
              .limit(1)
              .maybeSingle();

            if (studentError) {
              console.error("Student lookup error:", studentError);
              alert("Could not check your student account. Please try again.");
              return;
            }

            if (student) {
              const { data: school, error: schoolError } = await supabase
                .from("schools")
                .select("name")
                .eq("id", student.school_id)
                .maybeSingle();

              if (schoolError) {
                console.error("School lookup error:", schoolError);
              }

              setSelectedSchoolId(student.school_id);
              setSelectedSchoolName(school?.name || "");
              setSchoolRole("student");
              setLoggedInName(student.full_name);
              setProfileName(student.full_name);
              setProfileEmail(student.email);

              localStorage.setItem(
                "quizly_profile_name",
                student.full_name
              );

              localStorage.setItem(
                "quizly_profile_email",
                student.email
              );
            } else {
              setSchoolRole("student");
              setSelectedSchoolId("");
              setSelectedSchoolName("");
            }
          }

          setIsLoggedIn(true);
          setPage("Dashboard");
        }}
      />
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">Q</div>
          <span>
            Quiz<span className="logo-light">ly</span>
          </span>
        </div>

        <div className="sidebar-label">MENU</div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                page === item.name ? "nav-active" : ""
              }`}
              onClick={() => openPage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              {item.name === "My Quizzes" && (
                <span className="nav-count">
                  {String(questions.length).padStart(2, "0")}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-promo">
          <div className="promo-star">✦</div>
          <h3>Keep Learning!</h3>
          <p>Practice daily and improve your knowledge.</p>
          <button onClick={() => startQuiz(selectedCategory)}>
            Start Learning →
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {loggedInName.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{loggedInName}</strong>
            <span>{schoolRole || "Free Account"}</span>
          </div>
          <span className="user-more">•••</span>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <span>↪</span>
          Logout
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Pages</span>
            <b>/</b>
            <strong>{page}</strong>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <span>⌕</span>
              <input placeholder="Search anything..." />
              <kbd>⌘ K</kbd>
            </div>

            <button className="notification">
              ♧<i />
            </button>

            <div className="top-profile">
              <div className="user-avatar small">
                {loggedInName.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{loggedInName}</strong>
                <span>{schoolRole || "Student"}</span>
              </div>
              <span>⌄</span>
            </div>
          </div>
        </header>
                {quizStarted && !showResult && question ? (
          <section className="content quiz-content">
            <div className="page-heading">
              <div>
                <span className="section-tag">
                  YOUR LEARNING JOURNEY
                </span>
                <h1>{selectedCategory} Quiz</h1>
                <p>Take your time and choose the best answer.</p>
              </div>
              <div className="quiz-header-actions">
                <div className="quiz-timer">
                  <span>⏱</span>
                  <strong>{formatTime(timeLeft)}</strong>
                  <small>Time Left</small>
                </div>
                <button
                  className="back-button"
                  onClick={() => {
                    setQuizStarted(false);
                    setPage("Dashboard");
                  }}
                >
                  ← Dashboard
                </button>
              </div>
            </div>
            <div className="exam-layout">
              <div className="exam-main card">
                <div className="exam-header">
                  <div>
                    <span className="exam-chip">{selectedCategory}</span>
                    <h2>Knowledge Assessment</h2>
                  </div>
                  <div className="exam-number">
                    Question <strong>{currentQuestion + 1}</strong> /{" "}
                    {activeQuizQuestions.length}
                  </div>
                </div>
                <div className="progress-info">
                  <span>Quiz Progress</span>
                  <strong>{Math.round(progress)}%</strong>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="exam-question">
                  <span>
                    QUESTION {String(currentQuestion + 1).padStart(2, "0")}
                  </span>
                  <h2>{question.question}</h2>
                  <p>
                    Select one correct answer from the following options.
                  </p>
                </div>
                <div className="answer-list">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      className={`answer-option ${
                        selectedAnswer === index ? "answer-selected" : ""
                      }`}
                    >
                      <span className="answer-letter">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                      <span className="answer-radio">
                        {selectedAnswer === index ? "✓" : ""}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="exam-footer">
                  <span>
                    ✦ Your progress is saved during this session
                  </span>
                  <button
                    className="primary-button"
                    onClick={nextQuestion}
                    disabled={selectedAnswer === null}
                  >
                    {currentQuestion === activeQuizQuestions.length - 1
                      ? "Submit Quiz"
                      : "Next Question"}
                    <span>→</span>
                  </button>
                </div>
              </div>
              <aside className="exam-sidebar card">
                <h3>Question Overview</h3>
                <p>Track your progress</p>
                <div className="question-grid">
                  {activeQuizQuestions.map((_, index) => (
                    <div
                      key={index}
                      className={`question-dot ${
                        currentQuestion === index ? "dot-current" : ""
                      } ${
                        answers[index] !== undefined ? "dot-done" : ""
                      }`}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
                <div className="legend">
                  <span>
                    <i className="legend-current" /> Current
                  </span>
                  <span>
                    <i className="legend-done" /> Answered
                  </span>
                  <span>
                    <i className="legend-empty" /> Upcoming
                  </span>
                </div>
                <div className="exam-tip">
                  <span>💡</span>
                  <strong>Quick Tip</strong>
                  <p>
                    Read every option carefully before selecting your answer.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        ) : showResult ? (
          <section className="content">
            <div className="result-card card">
              <div className="result-trophy">🏆</div>
              <span className="section-tag">ASSESSMENT COMPLETED</span>
              <h1>Congratulations!</h1>
              <p>
                You have successfully completed your {selectedCategory} quiz.
              </p>
              <div className="result-score">
                <strong>
                  {activeQuizQuestions.length > 0
                    ? Math.round((score / activeQuizQuestions.length) * 100)
                    : 0}
                  %
                </strong>
                <span>YOUR FINAL SCORE</span>
              </div>
              <div className="result-summary">
                <div>
                  <strong>{correctAnswers}</strong>
                  <span>Correct Answers</span>
                </div>
                <div>
                  <strong>{activeQuizQuestions.length - correctAnswers}</strong>
                  <span>Incorrect Answers</span>
                </div>
                <div>
                  <strong>{activeQuizQuestions.length}</strong>
                  <span>Total Questions</span>
                </div>
              </div>
              <div className="result-message">
                {score >= activeQuizQuestions.length * 0.8
                  ? "Excellent work! You have a strong understanding."
                  : score >= activeQuizQuestions.length * 0.5
                  ? "Good effort! Keep practicing to improve your score."
                  : "Keep learning! Review the topics and try again."}
              </div>
              <div className="result-actions">
                <button
                  className="primary-button"
                  onClick={() => startQuiz(selectedCategory)}
                >
                  ↻ Try Again
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setShowResult(false);
                    setShowReview(false);
                    setPage("Dashboard");
                  }}
                >
                  Back to Dashboard
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setShowReview((previous) => !previous)}
                >
                  {showReview ? "Hide Answers" : "Review Answers"}
                </button>
              </div>
            </div>
            {showReview && reviewResult?.review && renderReview(reviewResult)}
          </section>
        ) : page === "My Schools" ? (
          <SchoolSetup
            onSchoolSelected={(schoolId, schoolName, role) => {
              setSelectedSchoolId(schoolId);
              setSelectedSchoolName(schoolName);
              setSchoolRole(role);
              setPage("Dashboard");
            }}
          />
        ) : page === "Manage Questions" && schoolRole === "admin" ? (
          <section className="content">
            <div className="page-heading">
              <div>
                <span className="section-tag">ADMIN CONTROL CENTER</span>
                <h1>Manage Questions</h1>
                <p>
                  Create and manage questions for each quiz category.
                </p>
              </div>
            </div>
            <QuestionManager
              subjects={subjects}
              onSubjectsChange={setSubjects}
              schoolId={selectedSchoolId}
            />
          </section>
        ) : page === "Dashboard" && schoolRole === "admin" ? (
          <SchoolAdminDashboard
            schoolName={selectedSchoolName}
            schoolId={selectedSchoolId}
            onNavigate={(nextPage) => setPage(nextPage as Page)}
          />
        ) : page === "Manage Students" && schoolRole === "admin" ? (
          <ManageStudents schoolId={selectedSchoolId} />
        ) : page === "Dashboard" ? (
          <section className="content">
            <div className="welcome-banner">
              <div className="welcome-text">
                <span>YOUR PERSONAL LEARNING SPACE</span>
                <h1>Welcome back, {loggedInName}! 👋</h1>
                <p>
                  Ready to challenge yourself and learn something new today?
                </p>
                <button onClick={() => openPage("My Quizzes")}>
                  Explore Quizzes <span>→</span>
                </button>
              </div>
              <div className="banner-art">
                <div className="art-circle">✦</div>
                <div className="art-book">📚</div>
                <div className="art-star">✧</div>
                <div className="art-small">✦</div>
              </div>
            </div>
            {selectedSchoolName && (
              <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                <strong>Selected School:</strong> {selectedSchoolName}
                <span style={{ marginLeft: 12 }}>
                  ({schoolRole || "Member"})
                </span>
              </div>
            )}
            <div className="section-heading">
              <div>
                <h2>Your Learning Overview</h2>
                <p>Track your learning progress and achievements.</p>
              </div>
              <button
                className="outline-button"
                onClick={() => openPage("My Results")}
              >
                View Reports →
              </button>
            </div>
            <div className="stats-grid">
              <div className="stat-card card">
                <div className="stat-top">
                  <span className="stat-icon purple">▤</span>
                  <span className="stat-trend">Available</span>
                </div>
                <span className="stat-label">Quiz Questions</span>
                <strong>{questions.length}</strong>
                <small>Questions ready to explore</small>
              </div>
              <div className="stat-card card">
                <div className="stat-top">
                  <span className="stat-icon orange">◷</span>
                  <span className="stat-trend">All time</span>
                </div>
                <span className="stat-label">Completed Quizzes</span>
                <strong>{results.length}</strong>
                <small>Your completed assessments</small>
              </div>
              <div className="stat-card card">
                <div className="stat-top">
                  <span className="stat-icon green">♧</span>
                  <span className="stat-trend">Performance</span>
                </div>
                <span className="stat-label">Average Score</span>
                <strong>{results.length ? `${averageScore}%` : "--"}</strong>
                <small>Your overall performance</small>
              </div>
              <div className="stat-card card">
                <div className="stat-top">
                  <span className="stat-icon blue">⚡</span>
                  <span className="stat-trend">Your setting</span>
                </div>
                <span className="stat-label">Quiz Time Limit</span>
                <strong>
                  {quizMinutes} <small>Min</small>
                </strong>
                <small>Your selected quiz duration</small>
              </div>
            </div>
            <div className="dashboard-columns">
              <div className="left-column">
                <div className="section-heading">
                  <div>
                    <h2>Recommended Quizzes</h2>
                    <p>Pick a category and test your knowledge.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => openPage("My Quizzes")}
                  >
                    View All →
                  </button>
                </div>
                <div className="quiz-card-list">
                  {subjects.map((category) => {
                    const count = questions.filter(
                      (item) => item.category === category
                    ).length;
                    return (
                      <div className="learning-card card" key={category}>
                        <div className="learning-card-top">
                          <div className="course-icon violet">✦</div>
                          <span className="level-tag">QUIZ CATEGORY</span>
                        </div>
                        <span className="course-category">YOUR QUESTIONS</span>
                        <h3>{category}</h3>
                        <p>
                          Practice your {category} knowledge with a category
                          based assessment.
                        </p>
                        <div className="course-meta">
                          <span>▤ {count} Questions</span>
                          <span>◷ {quizMinutes} Minutes</span>
                        </div>
                        <button
                          onClick={() => startQuiz(category)}
                          disabled={count === 0}
                        >
                          {count === 0 ? "Add Questions First" : "Start Quiz"}
                          <span>→</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="section-heading activity-heading">
                  <div>
                    <h2>Recent Activity</h2>
                    <p>Your latest learning activities.</p>
                  </div>
                </div>
                {results.length > 0 ? (
                  <div className="activity-card card">
                    <div className="activity-icon">✦</div>
                    <div>
                      <strong>Quiz completed</strong>
                      <span>
                        Latest score: {results[0].percentage}% (
                        {results[0].score}/{results[0].total})
                      </span>
                    </div>
                    <span className="activity-time">Recent</span>
                  </div>
                ) : (
                  <div className="activity-card card">
                    <div className="activity-icon">✦</div>
                    <div>
                      <strong>Welcome to Quizly!</strong>
                      <span>
                        Start your first quiz to see your activity here.
                      </span>
                    </div>
                    <span className="activity-time">Today</span>
                  </div>
                )}
              </div>
              <aside className="right-column">
                <div className="section-heading">
                  <div>
                    <h2>Quiz Settings</h2>
                    <p>Choose your time limit.</p>
                  </div>
                </div>
                <div className="quest-card card timer-settings">
                  <div className="quest-icon">⏱</div>
                  <h3>Set Quiz Duration</h3>
                  <p>
                    Choose how much time students will get for the quiz.
                  </p>
                  <label htmlFor="quiz-duration">Time limit</label>
                  <select
                    id="quiz-duration"
                    value={quizMinutes}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setQuizMinutes(value);
                      setCustomMinutes(String(value));
                    }}
                  >
                    <option value={1}>1 Minute</option>
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                  <label htmlFor="custom-duration">
                    Or enter custom minutes
                  </label>
                  <input
                    id="custom-duration"
                    type="number"
                    min="1"
                    max="180"
                    value={customMinutes}
                    onChange={(e) => {
                      setCustomMinutes(e.target.value);
                      const value = Number(e.target.value);
                      if (value >= 1 && value <= 180) {
                        setQuizMinutes(value);
                      }
                    }}
                  />
                  <small>Choose between 1 and 180 minutes.</small>
                </div>
                <div className="section-heading event-heading">
                  <div>
                    <h2>Learning Goal</h2>
                    <p>Small steps, big progress.</p>
                  </div>
                </div>
                <div className="quest-card card">
                  <div className="quest-icon">🎯</div>
                  <h3>Today's Learning Goal</h3>
                  <p>
                    Complete one quiz today to improve your knowledge.
                  </p>
                  <button onClick={() => startQuiz(selectedCategory)}>
                    Start Learning →
                  </button>
                </div>
              </aside>
            </div>
          </section>
                  ) : page === "My Quizzes" ? (
          <section className="content">
            <div className="page-heading">
              <div>
                <span className="section-tag">YOUR LEARNING LIBRARY</span>
                <h1>My Quizzes</h1>
                <p>Choose a category and test your knowledge.</p>
              </div>
            </div>

            <div className="quiz-library card">
              <div className="library-details">
                <span className="course-category">SELECT CATEGORY</span>
                <h2>Choose Your Quiz</h2>
                <p>
                  Select one of the categories below to start its quiz.
                </p>

                <label htmlFor="category-select">Quiz Category</label>
                <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as QuizCategory)
                  }
                >
                  {subjects.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <div className="course-meta">
                  <span>
                    {
                      questions.filter(
                        (item) => item.category === selectedCategory
                      ).length
                    }{" "}
                    Questions
                  </span>
                  <span>{quizMinutes} Minutes</span>
                  <span>{selectedCategory}</span>
                </div>
              </div>

              <button
                className="primary-button"
                onClick={() => startQuiz(selectedCategory)}
                disabled={
                  questions.filter(
                    (item) => item.category === selectedCategory
                  ).length === 0
                }
              >
                Start Quiz →
              </button>
            </div>

            <div className="quiz-card-list">
              {subjects.map((category) => {
                const count = questions.filter(
                  (item) => item.category === category
                ).length;

                return (
                  <div className="learning-card card" key={category}>
                    <div className="learning-card-top">
                      <div className="course-icon violet">✦</div>
                      <span className="level-tag">CATEGORY QUIZ</span>
                    </div>
                    <span className="course-category">QUIZ CATEGORY</span>
                    <h3>{category}</h3>
                    <p>Questions available in this category.</p>

                    <div className="course-meta">
                      <span>▤ {count} Questions</span>
                      <span>◷ {quizMinutes} Minutes</span>
                    </div>

                    <button
                      onClick={() => startQuiz(category)}
                      disabled={count === 0}
                    >
                      {count === 0 ? "No Questions Yet" : "Start Quiz"}
                      <span>→</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="timer-settings card">
              <h3>⏱ Quiz Time Management</h3>
              <p>Set the time limit before starting the quiz.</p>

              <label htmlFor="quiz-duration-page">
                Select time limit
              </label>
              <select
                id="quiz-duration-page"
                value={quizMinutes}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setQuizMinutes(value);
                  setCustomMinutes(String(value));
                }}
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>

              <label htmlFor="custom-duration-page">
                Custom time in minutes
              </label>
              <input
                id="custom-duration-page"
                type="number"
                min="1"
                max="180"
                value={customMinutes}
                onChange={(e) => {
                  setCustomMinutes(e.target.value);
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= 180) {
                    setQuizMinutes(value);
                  }
                }}
              />
              <small>
                Minimum 1 minute and maximum 180 minutes.
              </small>
            </div>
          </section>
        ) : page === "My Results" ? (
          <section className="content">
            <div className="page-heading">
              <div>
                <span className="section-tag">YOUR PERFORMANCE</span>
                <h1>My Results</h1>
                <p>Review your quiz performance and progress.</p>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="empty-results card">
                <div>📊</div>
                <h2>No results yet</h2>
                <p>
                  Complete your first quiz and your results will appear here.
                </p>
                <button
                  className="primary-button"
                  onClick={() => startQuiz(selectedCategory)}
                >
                  Take Your First Quiz →
                </button>
              </div>
            ) : (
              <div className="results-history card">
                <h2>Quiz History</h2>
                <div className="results-table-wrap">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Time Allowed</th>
                        <th>Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={result.id}>
                          <td>{index + 1}</td>
                          <td>{result.category || "React"}</td>
                          <td>{result.date}</td>
                          <td>
                            {result.score} / {result.total}
                          </td>
                          <td>{result.percentage}%</td>
                          <td>{result.durationMinutes} min</td>
                          <td>
                            {result.review ? (
                              <button
                                className="review-table-button"
                                onClick={() => {
                                  setReviewResult(result);
                                  setShowReview(true);
                                }}
                              >
                                Review
                              </button>
                            ) : (
                              <span>Unavailable</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {showReview && reviewResult?.review &&
                  renderReview(reviewResult)}
              </div>
            )}
          </section>
        ) : page === "Leaderboard" ? (
          <section className="content">
            <div className="page-heading">
              <div>
                <span className="section-tag">TOP PERFORMERS</span>
                <h1>Leaderboard 🏆</h1>
                <p>See the highest scoring quiz attempts.</p>
              </div>
            </div>

            <div className="leaderboard-card card">
              <div className="leaderboard-heading">
                <div>
                  <h2>Top Rankings</h2>
                  <p>Ranked by percentage and score.</p>
                </div>
                <span className="leaderboard-total">
                  {leaderboard.length} Attempts
                </span>
              </div>

              {leaderboard.length === 0 ? (
                <div className="leaderboard-empty">
                  <div>🏆</div>
                  <h3>No rankings yet</h3>
                  <p>
                    Complete a quiz to appear on the leaderboard.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => startQuiz(selectedCategory)}
                  >
                    Start a Quiz →
                  </button>
                </div>
              ) : (
                <div className="leaderboard-table-wrap">
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student</th>
                        <th>Category</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((result, index) => (
                        <tr key={result.id}>
                          <td>
                            <span
                              className={`leaderboard-rank rank-${index + 1}`}
                            >
                              {index === 0
                                ? "🥇 1"
                                : index === 1
                                ? "🥈 2"
                                : index === 2
                                ? "🥉 3"
                                : `#${index + 1}`}
                            </span>
                          </td>
                          <td>
                            <div className="leaderboard-student">
                              <span className="leaderboard-avatar">
                                {loggedInName.charAt(0).toUpperCase()}
                              </span>
                              <strong>{loggedInName}</strong>
                            </div>
                          </td>
                          <td>{result.category || "React"}</td>
                          <td>
                            {result.score} / {result.total}
                          </td>
                          <td>
                            <strong className="leaderboard-percentage">
                              {result.percentage}%
                            </strong>
                          </td>
                          <td>{result.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="content">
            <div className="page-heading">
              <div>
                <span className="section-tag">
                  PERSONAL PREFERENCES
                </span>
                <h1>Settings</h1>
                <p>Manage your personal profile information.</p>
              </div>
            </div>

            <div className="profile-settings-card card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {profileName.charAt(0).toUpperCase() || "S"}
                </div>
                <div>
                  <h2>{loggedInName}</h2>
                  <p>Quizly learner account</p>
                  <span className="profile-status">
                    ● Active Account
                  </span>
                </div>
              </div>

              <div className="profile-divider" />

              <div className="profile-form">
                <div className="profile-form-heading">
                  <h3>Personal Information</h3>
                  <p>Update your account details below.</p>
                </div>

                <div className="profile-input-group">
                  <label htmlFor="profile-name">Full Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>

                <div className="profile-input-group">
                  <label htmlFor="profile-email">Email Address</label>
                  <input
                    id="profile-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                  />
                </div>

                <div className="profile-save-area">
                  <button
                    className="primary-button"
                    onClick={handleSaveProfile}
                  >
                    Save Changes →
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="footer">
          <span>© 2026 Quizly. All rights reserved.</span>
          <span>Made for curious minds ✦</span>
        </footer>
      </main>
    </div>
  );
}

export default App;