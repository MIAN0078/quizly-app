
import { useEffect, useState } from "react";

export type QuizCategory = string;

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: QuizCategory;
}

interface QuestionManagerProps {
  subjects: string[];
  onSubjectsChange: (subjects: string[]) => void;
}

function QuestionManager({
  subjects,
  onSubjectsChange,
}: QuestionManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(
    subjects[0] || ""
  );

  const [editingId, setEditingId] = useState<string | null>(null);

  const [newSubject, setNewSubject] = useState("");
  const [editingSubject, setEditingSubject] = useState<string | null>(
    null
  );
  const [editingSubjectName, setEditingSubjectName] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("quizly_questions");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          const formatted: Question[] = parsed.map((item, index) => ({
            id: item.id || `question-${index}`,
            question: item.question || "",
            options: Array.isArray(item.options)
              ? item.options
              : ["", "", "", ""],
            correctAnswer: item.correctAnswer ?? item.answer ?? 0,
            category: item.category || "React",
          }));

          setQuestions(formatted);
        }
      }
    } catch {
      console.error("Questions could not be loaded.");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("quizly_questions", JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    if (!subjects.includes(selectedSubject) && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  const resetForm = () => {
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setEditingId(null);
  };

  const addSubject = () => {
    const name = newSubject.trim();

    if (!name) {
      setMessage("Please enter a subject name.");
      return;
    }

    if (
      subjects.some(
        (subject) => subject.toLowerCase() === name.toLowerCase()
      )
    ) {
      setMessage("This subject already exists.");
      return;
    }

    onSubjectsChange([...subjects, name]);
    setSelectedSubject(name);
    setNewSubject("");
    setMessage("Subject added successfully!");
  };

  const startEditSubject = (subject: string) => {
    setEditingSubject(subject);
    setEditingSubjectName(subject);
  };

  const saveSubjectEdit = () => {
    const newName = editingSubjectName.trim();

    if (!editingSubject || !newName) {
      setMessage("Please enter a valid subject name.");
      return;
    }

    if (
      subjects.some(
        (subject) =>
          subject !== editingSubject &&
          subject.toLowerCase() === newName.toLowerCase()
      )
    ) {
      setMessage("This subject already exists.");
      return;
    }

    const updatedSubjects = subjects.map((subject) =>
      subject === editingSubject ? newName : subject
    );

    const updatedQuestions = questions.map((question) =>
      question.category === editingSubject
        ? { ...question, category: newName }
        : question
    );

    onSubjectsChange(updatedSubjects);
    setQuestions(updatedQuestions);

    if (selectedSubject === editingSubject) {
      setSelectedSubject(newName);
    }

    setEditingSubject(null);
    setEditingSubjectName("");
    setMessage("Subject updated successfully!");
  };

  const deleteSubject = (subject: string) => {
    const subjectQuestions = questions.filter(
      (question) => question.category === subject
    );

    if (subjectQuestions.length > 0) {
      setMessage(
        `Delete or move this subject's ${subjectQuestions.length} questions first.`
      );
      return;
    }

    if (subjects.length <= 1) {
      setMessage("At least one subject must remain.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${subject}?`)) {
      return;
    }

    const updatedSubjects = subjects.filter(
      (item) => item !== subject
    );

    onSubjectsChange(updatedSubjects);
    setSelectedSubject(updatedSubjects[0]);
    setMessage("Subject deleted successfully!");
  };

  const updateOption = (index: number, value: string) => {
    setOptions((previous) =>
      previous.map((option, optionIndex) =>
        optionIndex === index ? value : option
      )
    );
  };

  const saveQuestion = () => {
    if (!questionText.trim()) {
      setMessage("Please enter a question.");
      return;
    }

    if (options.some((option) => !option.trim())) {
      setMessage("Please fill all four answer options.");
      return;
    }

    if (!selectedSubject) {
      setMessage("Please select a subject.");
      return;
    }

    const questionData: Question = {
      id: editingId || crypto.randomUUID(),
      question: questionText.trim(),
      options: options.map((option) => option.trim()),
      correctAnswer,
      category: selectedSubject,
    };

    if (editingId) {
      setQuestions((previous) =>
        previous.map((question) =>
          question.id === editingId ? questionData : question
        )
      );
      setMessage("Question updated successfully!");
    } else {
      setQuestions((previous) => [...previous, questionData]);
      setMessage("Question added successfully!");
    }

    resetForm();
  };

  const editQuestion = (question: Question) => {
    setEditingId(question.id);
    setQuestionText(question.question);
    setOptions([...question.options]);
    setCorrectAnswer(question.correctAnswer);
    setSelectedSubject(question.category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteQuestion = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    setQuestions((previous) =>
      previous.filter((question) => question.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }

    setMessage("Question deleted successfully!");
  };

  const filteredQuestions = questions.filter(
    (question) => question.category === selectedSubject
  );

  return (
    <div className="question-manager">
      <div className="section-heading">
        <div>
          <h2>Manage Subjects</h2>
          <p>Add and organize your quiz subjects.</p>
        </div>
      </div>

      <div className="card" style={{ padding: "24px", marginBottom: "25px" }}>
        <h3>➕ Add New Subject</h3>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Enter subject name e.g. Maths"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addSubject();
            }}
            style={{
              flex: "1",
              minWidth: "200px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />

          <button className="primary-button" onClick={addSubject}>
            Add Subject
          </button>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h3>All Subjects ({subjects.length})</h3>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            {subjects.map((subject) => (
              <div
                key={subject}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  background: "#f3f0ff",
                  borderRadius: "8px",
                }}
              >
                {editingSubject === subject ? (
                  <>
                    <input
                      value={editingSubjectName}
                      onChange={(e) =>
                        setEditingSubjectName(e.target.value)
                      }
                      style={{ width: "120px", padding: "5px" }}
                    />
                    <button onClick={saveSubjectEdit}>Save</button>
                    <button onClick={() => setEditingSubject(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <strong>{subject}</strong>
                    <button
                      title="Rename subject"
                      onClick={() => startEditSubject(subject)}
                    >
                      ✏️
                    </button>
                    <button
                      title="Delete subject"
                      onClick={() => deleteSubject(subject)}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>{editingId ? "Edit Question" : "Add New Question"}</h2>
          <p>Create questions and assign them to a subject.</p>
        </div>
      </div>

      <div className="card" style={{ padding: "24px", marginBottom: "25px" }}>
        <label htmlFor="question-subject">Select Subject</label>

        <select
          id="question-subject"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            margin: "10px 0 20px",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        <label htmlFor="question-text">Question</label>
        <textarea
          id="question-text"
          rows={3}
          placeholder="Write your question here..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            margin: "10px 0 20px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            resize: "vertical",
          }}
        />

        <h3>Answer Options</h3>

        {options.map((option, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              margin: "12px 0",
            }}
          >
            <input
              type="radio"
              name="correct-answer"
              checked={correctAnswer === index}
              onChange={() => setCorrectAnswer(index)}
              title="Set as correct answer"
            />

            <input
              type="text"
              value={option}
              placeholder={`Option ${index + 1}`}
              onChange={(e) => updateOption(index, e.target.value)}
              style={{
                flex: "1",
                minWidth: "0",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />

            {correctAnswer === index && (
              <span style={{ color: "green", fontWeight: "bold" }}>
                Correct
              </span>
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            className="primary-button"
            onClick={saveQuestion}
            disabled={subjects.length === 0}
          >
            {editingId ? "Update Question" : "Save Question"}
          </button>

          {editingId && (
            <button className="secondary-button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        {message && (
          <p style={{ marginTop: "15px", fontWeight: "bold" }}>
            {message}
          </p>
        )}
      </div>

      <div className="section-heading">
        <div>
          <h2>Question List</h2>
          <p>
            {selectedSubject}: {filteredQuestions.length} questions
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="filter-subject">Filter by Subject</label>
          <select
            id="filter-subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          >
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="empty-state">
            <h3>No Questions Found</h3>
            <p>Add your first question for {selectedSubject}.</p>
          </div>
        ) : (
          filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              style={{
                padding: "18px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <strong>
                  {index + 1}. {question.question}
                </strong>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="secondary-button"
                    onClick={() => editQuestion(question)}
                  >
                    Edit
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => deleteQuestion(question.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                {question.options.map((option, optionIndex) => (
                  <p
                    key={optionIndex}
                    style={{
                      margin: "6px 0",
                      color:
                        optionIndex === question.correctAnswer
                          ? "green"
                          : "inherit",
                      fontWeight:
                        optionIndex === question.correctAnswer
                          ? "bold"
                          : "normal",
                    }}
                  >
                    {String.fromCharCode(65 + optionIndex)}. {option}
                    {optionIndex === question.correctAnswer && " ✓ Correct"}
                  </p>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default QuestionManager;
