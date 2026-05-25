import { DesmosCalculator } from "../../../components/DesmosCalculator";
import { Navigation } from "../../../components/Navigation/Navigation";
import "./Tests.css";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_URL, AI_URL, authFetch } from "../../../api";
import { jwtDecode } from "jwt-decode";

export const MathTest = () => {
  const [activeAiQuestionId, setActiveAiQuestionId] = useState(null);
  const [chatHistory, setChatHistory] = useState({});
  const [userMessage, setUserMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleSendToAi = async (q) => {
    if (!userMessage.trim() || aiLoading) return;

    const currentHistory = chatHistory[q.id] || [];
    const newMessage = { role: "user", content: userMessage };

    setChatHistory((prev) => ({
      ...prev,
      [q.id]: [...currentHistory, newMessage],
    }));
    setUserMessage("");
    setAiLoading(true);

    try {
      const res = await fetch(`${AI_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_text: q.text,
          option_a: q.options[0],
          option_b: q.options[1],
          option_c: q.options[2],
          option_d: q.options[3],
          answer: q.answer,
          user_message: newMessage.content,
          history: currentHistory,
        }),
      });

      if (!res.ok) throw new Error("Не удалось получить ответ ИИ");

      const data = await res.json();

      setChatHistory((prev) => ({
        ...prev,
        [q.id]: [...prev[q.id], { role: "assistant", content: data.reply }],
      }));
    } catch (err) {
      console.error("Ошибка ИИ:", err);
      setChatHistory((prev) => ({
        ...prev,
        [q.id]: [
          ...prev[q.id],
          {
            role: "assistant",
            content: "⚠️ Ошибка: Не удалось связаться с ИИ-тьютором.",
          },
        ],
      }));
    } finally {
      setAiLoading(false);
    }
  };

  const { t } = useTranslation();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    answer: "a",
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(0);
  const [openModal, setOpenModal] = useState(false);

  // ===== FETCH =====
  useEffect(() => {
    const token = localStorage.getItem("jwt");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.email === "adinai@gmail.com") {
          setTimeout(() => setIsAdmin(true), 1000);
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetch(`${API_URL}/api/questions?type=math`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((q) => q.type === "math");
        const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 5);
        const formatted = shuffled.map((q) => ({
          id: q.id,
          text: q.question,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          answer: {
            a: q.option_a,
            b: q.option_b,
            c: q.option_c,
            d: q.option_d,
          }[q.answer],
        }));

        setQuestions(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // ===== ANSWERS =====
  const choose = (id, option) => {
    if (submitted) return;

    setSelected((prev) => ({
      ...prev,
      [id]: option,
    }));
  };

  const allAnswered = questions.every((q) => selected[q.id]);

  const submit = () => {
    if (!allAnswered) return;

    let score = 0;

    questions.forEach((q) => {
      if (selected[q.id] === q.answer) score++;
    });

    setResult(score);
    setSubmitted(true);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelected({});
    setSubmitted(false);
    setResult(0);
  };

  const getResultColor = () => {
    if (result <= 2) return "bad";
    if (result <= 4) return "medium";
    return "good";
  };

  // ===== ADD QUESTION =====
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (
      !newQuestion.question ||
      !newQuestion.option_a ||
      !newQuestion.option_b ||
      !newQuestion.option_c ||
      !newQuestion.option_d
    ) {
      setFormError("Пожалуйста, заполните все поля вопроса");
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/api/questions`, {
        method: "POST",
        body: JSON.stringify({ ...newQuestion, type: "math" }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Не удалось сохранить вопрос");
        } else {
          throw new Error(
            `Сервер вернул ошибку со статусом ${res.status}. Проверьте логи бэкенда.`,
          );
        }
      }

      const data = await res.json();

      setQuestions((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          dbId: data.id,
          text: data.question,
          options: [data.option_a, data.option_b, data.option_c, data.option_d],
          answer: {
            a: data.option_a,
            b: data.option_b,
            c: data.option_c,
            d: data.option_d,
          }[data.answer],
        },
      ]);
      setSelected({});
      setFormSuccess("Вопрос успешно добавлен в банк вопросов!");
      setNewQuestion({
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        answer: "a",
        type: "math",
      });
    } catch (err) {
      setFormError(err.message);
    }
  };
  // ===== DELETE =====
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Удалить?")) return;

    const res = await authFetch(`${API_URL}/api/questions/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      window.location.reload();

      setQuestions((prev) => prev.filter((q) => q.id !== id));
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading...</p>;
  }

  return (
    <>
      <Navigation />

      <section className="mathTestPage">
        {isAdmin && (
          <div className="adminFormContainer">
            <form onSubmit={handleAddQuestion} className="adminForm">
              <h3>Добавить вопрос в общую базу (Админ)</h3>

              {formError && <p className="formErrorText">{formError}</p>}
              {formSuccess && <p className="formSuccessText">{formSuccess}</p>}

              <div className="formGroup">
                <input
                  type="text"
                  placeholder="Текст вопроса"
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
                />
              </div>

              <div className="formGridInputs">
                <input
                  type="text"
                  placeholder="Вариант A"
                  value={newQuestion.option_a}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, option_a: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Вариант B"
                  value={newQuestion.option_b}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, option_b: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Вариант C"
                  value={newQuestion.option_c}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, option_c: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Вариант D"
                  value={newQuestion.option_d}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, option_d: e.target.value })
                  }
                />
              </div>

              <div className="formGroupSelect">
                <label>Правильный ответ: </label>
                <select
                  value={newQuestion.answer}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, answer: e.target.value })
                  }
                >
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>

              <button type="submit" className="adminSubmitBtn">
                Сохранить вопрос
              </button>
            </form>
          </div>
        )}

        <h2>{t("mathTest.title")}</h2>

        <div className="flexbox">
          <div className="left">
            <DesmosCalculator />
          </div>

          <div className="right">
            <div className="testWrapper">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className={`questionCard ${
                    submitted && selected[q.id] === q.answer
                      ? "correct"
                      : submitted
                        ? "wrong"
                        : ""
                  }`}
                >
                  <div className="cover">
                    <div className="aiTutorSection">
                      <button
                        className="aiTutorBtn"
                        onClick={() => {
                          setActiveAiQuestionId(
                            activeAiQuestionId === q.id ? null : q.id,
                          );
                        }}
                      >
                        {activeAiQuestionId === q.id ? "❌" : "🤖 Спросить ИИ"}
                      </button>

                      {activeAiQuestionId === q.id && (
                        <div className="aiChatBox">
                          <div className="aiChatMessages">
                            <div className="aiMessage assistant">
                              <strong>🤖 SAT Coach:</strong> Привет! Я помогу
                              разобраться с этим вопросом с помощью быстрых
                              техник. Что именно тебе непонятно? Учти,
                              правильный ответ здесь: {q.answer}.
                            </div>

                            {(chatHistory[q.id] || []).map((msg, i) => (
                              <div key={i} className={`aiMessage ${msg.role}`}>
                                <strong>
                                  {msg.role === "user"
                                    ? "👤 Вы:"
                                    : "🤖 SAT Coach:"}
                                </strong>
                                {/* Используем whiteSpace для красивого отображения списков ИИ */}
                                <p style={{ whiteSpace: "pre-line" }}>
                                  {msg.content}
                                </p>
                              </div>
                            ))}

                            {aiLoading && (
                              <div className="aiMessage assistant loading">
                                <em>🤖 Думаю над техникой...</em>
                              </div>
                            )}
                          </div>

                          <div className="aiChatInputGroup">
                            <input
                              type="text"
                              placeholder="Например: 'Почему тут не подходит вариант B?' или 'Объясни правило'"
                              value={userMessage}
                              onChange={(e) => setUserMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSendToAi(q);
                              }}
                            />
                            <button
                              onClick={() => handleSendToAi(q)}
                              disabled={aiLoading || !userMessage.trim()}
                            >
                              Отправить
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        className="deleteQuestionBtn"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p className="questionText">
                    {index + 1}. {q.text}
                  </p>

                  <div className="options">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => choose(q.id, opt)}
                        className={`optionBtn ${
                          selected[q.id] === opt ? "active" : ""
                        } ${submitted && opt === q.answer ? "showCorrect" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                className={`submitBtn ${!allAnswered ? "disabled" : ""}`}
                onClick={submit}
                disabled={!allAnswered}
              >
                {t("mathTest.submit")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {openModal && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("mathTest.result")}</h3>

            <div className={`resultScore ${getResultColor()}`}>
              {result} / {questions.length}
            </div>

            <p className="resultText">
              {result <= 2 && t("mathTest.tryAgain")}
              {result === 3 || result === 4 ? t("mathTest.notBad") : ""}
              {result === 5 ? t("mathTest.great") : ""}
            </p>

            <button onClick={closeModal}>{t("mathTest.close")}</button>
          </div>
        </div>
      )}
    </>
  );
};

