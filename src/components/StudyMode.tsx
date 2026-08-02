"use client";

import { useState } from "react";

type StudySet = {
  topic: string;
  summary: string;
  key_concepts: string[];
  notes: string[];
  flashcards: { front: string; back: string }[];
  quiz: { question: string; options: string[]; correct_index: number }[];
};

export default function StudyMode({ data, onClose }: { data: StudySet; onClose: () => void }) {
  const [tab, setTab] = useState<"notes" | "cards" | "quiz">("notes");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(data.quiz.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.filter((a, i) => a === data.quiz[i]?.correct_index).length;

  function selectAnswer(qIndex: number, optIndex: number) {
    if (submitted) return;
    const next = [...answers];
    next[qIndex] = optIndex;
    setAnswers(next);
  }

  function nextCard() {
    setFlipped(false);
    setCardIndex((i) => (i + 1) % data.flashcards.length);
  }
  function prevCard() {
    setFlipped(false);
    setCardIndex((i) => (i - 1 + data.flashcards.length) % data.flashcards.length);
  }

  return (
    <div className="study-overlay">
      <div className="study-panel">
        <div className="study-header">
          <div>
            <div className="study-label">STUDY MODE</div>
            <h2 className="study-title">{data.topic}</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="study-tabs">
          <button className={`study-tab ${tab === "notes" ? "active" : ""}`} onClick={() => setTab("notes")}>Notes</button>
          <button className={`study-tab ${tab === "cards" ? "active" : ""}`} onClick={() => setTab("cards")}>Flashcards</button>
          <button className={`study-tab ${tab === "quiz" ? "active" : ""}`} onClick={() => setTab("quiz")}>Quiz</button>
        </div>

        <div className="study-body">
          {tab === "notes" && (
            <div>
              <p className="study-summary">{data.summary}</p>
              <h3 className="study-subhead">Key Concepts</h3>
              <ul className="study-list">
                {data.key_concepts.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
              <h3 className="study-subhead">Notes</h3>
              <ul className="study-list">
                {data.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}

          {tab === "cards" && data.flashcards.length > 0 && (
            <div className="study-cards">
              <div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
                <div className="flashcard-face flashcard-front">{data.flashcards[cardIndex].front}</div>
                <div className="flashcard-face flashcard-back">{data.flashcards[cardIndex].back}</div>
              </div>
              <div className="flashcard-nav">
                <button onClick={prevCard}>←</button>
                <span>{cardIndex + 1} / {data.flashcards.length}</span>
                <button onClick={nextCard}>→</button>
              </div>
              <p className="flashcard-hint">Tap the card to flip</p>
            </div>
          )}

          {tab === "quiz" && (
            <div className="study-quiz">
              {data.quiz.map((q, qi) => (
                <div key={qi} className="quiz-question">
                  <p className="quiz-q-text">{qi + 1}. {q.question}</p>
                  <div className="quiz-options">
                    {q.options.map((opt, oi) => {
                      const isSelected = answers[qi] === oi;
                      const isCorrect = submitted && oi === q.correct_index;
                      const isWrong = submitted && isSelected && oi !== q.correct_index;
                      return (
                        <button
                          key={oi}
                          className={`quiz-option ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                          onClick={() => selectAnswer(qi, oi)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!submitted ? (
                <button className="quiz-submit" onClick={() => setSubmitted(true)}>Check Answers</button>
              ) : (
                <div className="quiz-score">Score: {score} / {data.quiz.length}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
