
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
  schoolId: string;
}

function QuestionManager({
  subjects,
  onSubjectsChange,
  schoolId,
}: QuestionManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || "");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newSubject, setNewSubject] = useState("");
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadQuestions = async () => {
    if (!schoolId) {
      setQuestions([]);
      setLoading(false);
      setMessage("Please select a school first.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id, question, options, correct_answer, category")
      .eq("school_id", schoolId)
      .order("id", { ascending: false });

    if (error) {
      console.error("LOAD QUESTIONS ERROR:", error);
      setMessage("Questions could not be loaded: " + error.message);
      setLoading(false);
      return;
    }

    const formatted: Question[] = (data || []).map((item) => ({
      id: item.id,
      question: item.question || "",
      options: Array.isArray(item.options)
        ? item.options
        : ["", "", "", ""],
      correctAnswer: item.correct_answer ?? 0,
      category: item.category || "General",
    }));

    setQuestions(formatted);
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, [schoolId]);

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

    if (subjects.some((s) => s.toLowerCase() === name.toLowerCase())) {
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

  const saveSubjectEdit = async () => {
    const newName = editingSubjectName.trim();

    if (!editingSubject || !newName) {
      setMessage("Please enter a valid subject name.");
      return;
    }

    if (
      subjects.some(
        (s) =>
          s !== editingSubject &&
          s.toLowerCase() === newName.toLowerCase()
      )
    ) {
      setMessage("This subject already exists.");
      return;
    }

    const { error } = await supabase
      .from("quiz_questions")
      .update({
        subject: newName,
        category: newName,
      })
      .eq("school_id", schoolId)
      .eq("category", editingSubject);

    if (error) {
      console.error("SUBJECT UPDATE ERROR:", error);
      setMessage("Subject update failed: " + error.message);
      return;
    }

    onSubjectsChange(
      subjects.map((s) => (s === editingSubject ? newName : s))
    );

    if (selectedSubject === editingSubject) {
      setSelectedSubject(newName);
    }

    setEditingSubject(null);
    setEditingSubjectName("");
    await loadQuestions();
    setMessage("Subject updated successfully!");
  };

  const deleteSubject = async (subject: string) => {
    const count = questions.filter((q) => q.category === subject).length;

    if (count > 0) {
      setMessage(
        `Delete or move this subject's ${count} questions first.`
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

    const updated = subjects.filter((s) => s !== subject);
    onSubjectsChange(updated);
    setSelectedSubject(updated[0] || "");
    setMessage("Subject deleted successfully!");
  };

  const updateOption = (index: number, value: string) => {
    setOptions((previous) =>
      previous.map((option, i) => (i === index ? value : option))
    );
  };

  const saveQuestion = async () => {
    if (!schoolId) {
      setMessage("Please select a school first.");
      return;
    }

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

    setSaving(true);
    setMessage("");

    const questionData = {
      question: questionText.trim(),
      options: options.map((option) => option.trim()),
      correct_answer: correctAnswer,
      subject: selectedSubject,
      category: selectedSubject,
      school_id: schoolId,
    };

    let error;

    if (editingId) {
      const result = await supabase
        .from("quiz_questions")
        .update(questionData)
        .eq("id", editingId)
        .eq("school_id", schoolId);

      error = result.error;
    } else {
      const result = await supabase
        .from("quiz_questions")
        .insert(questionData);

      error = result.error;
    }

    setSaving(false);

    if (error) {
      console.error("SAVE QUESTION ERROR:", error);
      setMessage("Question save failed: " + error.message);
      return;
    }

    await loadQuestions();
    resetForm();
    setMessage(
      editingId
        ? "Question updated successfully!"
        : "Question added successfully!"
    );
  };

  const editQuestion = (question: Question) => {
    setEditingId(question.id);
    setQuestionText(question.question);
    setOptions([...question.options]);
    setCorrectAnswer(question.correctAnswer);
    setSelectedSubject(question.category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteQuestion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    const { error } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("id", id)
      .eq("school_id", schoolId);

    if (error) {
      console.error("DELETE QUESTION ERROR:", error);
      setMessage("Delete failed: " + error.message);
      return;
    }

    if (editingId === id) resetForm();

    await loadQuestions();
    setMessage("Question deleted successfully!");
  };

  const filteredQuestions = questions.filter(
    (q) => q.category === selectedSubject
  );

  return (
    <div className="question-manager">
      <div className="section-heading">
        <div>
          <h2>Manage Subjects</h2>
          <p>Add and organize your quiz subjects.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 25 }}>
        <h3>➕ Add New Subject</h3>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addSubject();
            }}
            placeholder="Enter subject name e.g. Maths"
            style={{ flex: 1, minWidth: 200, padding: 12 }}
          />
          <button className="primary-button" onClick={addSubject}>
            Add Subject
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <h3>All Subjects ({subjects.length})</h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {subjects.map((subject) => (
              <div
                key={subject}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 10,
                  background: "#f3f0ff",
                  borderRadius: 8,
                }}
              >
                {editingSubject === subject ? (
                  <>
                    <input
                      value={editingSubjectName}
                      onChange={(e) =>
                        setEditingSubjectName(e.target.value)
                      }
                      style={{ width: 120 }}
                    />
                    <button onClick={saveSubjectEdit}>Save</button>
                    <button onClick={() => setEditingSubject(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <strong>{subject}</strong>
                    <button onClick={() => startEditSubject(subject)}>
                      ✏️
                    </button>
                    <button onClick={() => deleteSubject(subject)}>
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

      <div className="card" style={{ padding: 24, marginBottom: 25 }}>
        <label htmlFor="question-subject">Select Subject</label>
        <select
          id="question-subject"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            padding: 12,
            margin: "10px 0 20px",
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
            padding: 12,
            margin: "10px 0 20px",
          }}
        />

        <h3>Answer Options</h3>

        {options.map((option, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "12px 0",
            }}
          >
            <input
              type="radio"
              name="correct-answer"
              checked={correctAnswer === index}
              onChange={() => setCorrectAnswer(index)}
            />
            <input
              type="text"
              value={option}
              placeholder={`Option ${index + 1}`}
              onChange={(e) => updateOption(index, e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 12 }}
            />
            {correctAnswer === index && (
              <span style={{ color: "green", fontWeight: "bold" }}>
                Correct
              </span>
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            className="primary-button"
            onClick={saveQuestion}
            disabled={subjects.length === 0 || saving}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Question"
                : "Save Question"}
          </button>

          {editingId && (
            <button className="secondary-button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        {message && (
          <p style={{ marginTop: 15, fontWeight: "bold" }}>{message}</p>
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

      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="filter-subject">Filter by Subject</label>
          <select
            id="filter-subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              marginTop: 8,
            }}
          >
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading questions...</p>
        ) : filteredQuestions.length === 0 ? (
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
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <strong>
                  {index + 1}. {question.question}
                </strong>

                <div style={{ display: "flex", gap: 8 }}>
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

              <div style={{ marginTop: 12 }}>
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
                    {optionIndex === question.correctAnswer &&
                      " ✓ Correct"}
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
