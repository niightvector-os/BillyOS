"use client";

import { useEffect, useRef, useState } from "react";

export type StudySet = {
  intent: string;
  confidence: number;
  clarification_required: boolean;
  clarification_prompt: string;
  clarification_options: string[];
  topic: string;
  summary: string;
  direct_answer: string;
  key_concepts: string[];
  notes: string[];
  flashcards: { front: string; back: string }[];
  quiz: { question: string; options: string[]; correct_index: number }[];
  next_steps: string[];
};

type StudyView =
  | "home"
  | "explain"
  | "essay"
  | "challenge"
  | "challenge-take"
  | "dashboard"
  | "result";

type StudyModeProps = {
  data?: StudySet | null;
  onClose: () => void;
};

const suggestions = [
  "Explain photosynthesis simply",
  "Help me understand quadratic equations",
  "Explain the causes of World War I",
  "Teach me how chemical bonding works",
];

export default function StudyMode({ data: initialData = null, onClose }: StudyModeProps) {
  const [view, setView] = useState<StudyView>(initialData ? "result" : "home");
  const [data, setData] = useState<StudySet | null>(initialData);
  const [input, setInput] = useState("");
  const [essayChoiceOpen, setEssayChoiceOpen] = useState(false);
  const [essayPrompt, setEssayPrompt] = useState("");
  const [challengeTopic, setChallengeTopic] = useState("");
  const [challengeQuestions, setChallengeQuestions] = useState(10);
  const [challengeDifficulty, setChallengeDifficulty] = useState("Medium");
  const [challengeType, setChallengeType] = useState("Mixed");
  const [challengeQuiz, setChallengeQuiz] = useState<StudySet["quiz"]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeSelected, setChallengeSelected] = useState<number | null>(null);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeFinished, setChallengeFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; text: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [readOpen, setReadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setView("result");
    }
  }, [initialData]);

  function resetInput() {
    setInput("");
    setAttachedFile(null);
    setImagePreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  async function submitStudyWithIntent(intent: string) {
    const topic = data?.topic || input.trim();
    if (!topic || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          preferred_language: "en",
          study_intent: intent,
          material: attachedFile?.text || undefined,
          context: data?.topic
            ? `Previous Study topic: ${data.topic}`
            : undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Study request failed.");
      }

      setData(result);
      setView("result");
    } catch (error) {
      console.error("[STUDY UI]", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitStudyWithIntentAndTopic(
    topicOverride: string,
    intent: string
  ) {
    const topic = topicOverride.trim();
    if (!topic || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          preferred_language: "en",
          study_intent: intent,
          material: attachedFile?.text || undefined,
          context: data?.topic
            ? `Previous Study topic: ${data.topic}`
            : undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Study request failed.");
      }

      setData(result);
      setEssayChoiceOpen(false);
      setView("result");
      setEssayPrompt("");
    } catch (error) {
      console.error("[STUDY UI]", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitStudy(topicOverride?: string) {
    const topic = (topicOverride ?? input).trim();
    if (!topic || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          preferred_language: "en",
          material: attachedFile?.text || undefined,
          context: data?.topic
            ? `Previous Study topic: ${data.topic}`
            : undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Study request failed.");
      }

      setData(result);

      if (result.clarification_required) {
        setView("result");
        return;
      }

      if (result.intent === "CHALLENGE" && Array.isArray(result.quiz) && result.quiz.length > 0) {
        setChallengeQuiz(result.quiz);
        setChallengeIndex(0);
        setChallengeSelected(null);
        setChallengeScore(0);
        setChallengeFinished(false);
        setView("challenge-take");
        resetInput();
        return;
      }

      setView("result");
      resetInput();
    } catch (error) {
      console.error("[STUDY UI]", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePromptSubmit() {
    const value = input.trim();
    if (!value || isSubmitting) return;

    const essayIntent =
      /\bessay\b/i.test(value) ||
      /\bwrite (an|a)\b.*\bessay\b/i.test(value);

    if (essayIntent) {
      setEssayPrompt(value);
      setEssayChoiceOpen(true);
      return;
    }

    submitStudy(value);
  }

  async function handleFile(file: File) {
    setAttachedFile({ name: file.name, text: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result?.extractedText) {
        setAttachedFile({
          name: result.filename || file.name,
          text: result.extractedText,
        });
      }
    } catch (error) {
      console.error("[STUDY FILE]", error);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    e.preventDefault();
    setImagePreview(URL.createObjectURL(file));
  }

  const dashboard = (
    <div className="study-dashboard">
      <div className="study-dashboard-hero">
        <div>
          <div className="study-eyebrow">YOUR LEARNING</div>
          <h2>Keep getting better.</h2>
          <p>
            BillyOS will build your learning picture from the work you complete,
            the questions you answer, and the areas you revisit.
          </p>
        </div>

        <button className="study-soft-button" onClick={() => setView("home")}>
          Back to Study
        </button>
      </div>

      <div className="study-stat-grid">
        <div className="study-stat-card study-stat-large">
          <span>Overall mastery</span>
          <strong>84%</strong>
          <div className="study-progress">
            <span style={{ width: "84%" }} />
          </div>
        </div>

        <div className="study-stat-card">
          <span>Learning streak</span>
          <strong>12</strong>
          <small>days</small>
        </div>

        <div className="study-stat-card">
          <span>Questions answered</span>
          <strong>184</strong>
        </div>

        <div className="study-stat-card">
          <span>Study time</span>
          <strong>8h 42m</strong>
        </div>
      </div>

      <div className="study-dashboard-grid">
        <div className="study-panel-card">
          <div className="study-card-label">STRENGTHS</div>
          <h3>Where you're strong</h3>
          <div className="study-topic-row">
            <span>Biology</span><b>92%</b>
          </div>
          <div className="study-topic-row">
            <span>History</span><b>88%</b>
          </div>
          <div className="study-topic-row">
            <span>French</span><b>84%</b>
          </div>
        </div>

        <div className="study-panel-card">
          <div className="study-card-label">NEEDS ATTENTION</div>
          <h3>Where BillyOS would focus next</h3>
          <div className="study-topic-row">
            <span>Algebra</span><b>48%</b>
          </div>
          <div className="study-topic-row">
            <span>Chemistry</span><b>61%</b>
          </div>
          <div className="study-topic-row">
            <span>Physics</span><b>67%</b>
          </div>
        </div>
      </div>

      <div className="study-panel-card study-continue-card">
        <div>
          <div className="study-card-label">CONTINUE LEARNING?</div>
          <h3>Pick up where you left off.</h3>
          <p>Your recent Study work stays available so you can return without starting over.</p>
        </div>
        <button className="study-primary-button" onClick={() => setView("home")}>
          Continue
        </button>
      </div>
    </div>
  );

  const result = data && (
    <div className="study-result">
      <div className="study-result-topbar">
        <button className="study-back-button" onClick={() => setView("home")}>
          ← Study Home
        </button>

        <div className="study-result-title">
          <span>STUDY</span>
          <strong>{data.topic}</strong>
        </div>

        <button className="study-icon-button" onClick={() => setReadOpen((v) => !v)} aria-label="Read aloud">
          🔊
        </button>
      </div>

      {readOpen && (
        <div className="study-read-popover">
          <strong>Read aloud</strong>
          <span>Voice controls will connect to your selected voice provider.</span>
          <button onClick={() => setReadOpen(false)}>Close</button>
        </div>
      )}

      <div className="study-result-content">
        <section className="study-result-hero">
          {data.clarification_required ? (
            <>
              <div className="study-card-label">LET'S MAKE IT FIT</div>
              <h1>{data.clarification_prompt || "How should I approach this?"}</h1>
              <p>Choose how you want BillyOS to explain this.</p>

              <div className="study-result-actions">
                <button
                  className="study-primary-button"
                  onClick={() => submitStudyWithIntent("PERSONAL_KNOWLEDGE")}
                  disabled={isSubmitting}
                >
                  Personal knowledge
                </button>

                <button
                  className="study-soft-button"
                  onClick={() => submitStudyWithIntent("EXAM_EXPLANATION")}
                  disabled={isSubmitting}
                >
                  Exam / Test explanation
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="study-card-label">UNDERSTAND</div>
              <h1>{data.topic}</h1>
              <p>{data.direct_answer || data.summary}</p>

              <div className="study-result-actions">
                <button className="study-primary-button" onClick={() => setView("challenge")}>
                  Challenge yourself
                </button>
                <button className="study-soft-button" onClick={() => setView("home")}>
                  Ask another question
                </button>
              </div>
            </>
          )}
        </section>

        <section className="study-content-card">
          <div className="study-card-label">KEY CONCEPTS</div>
          <div className="study-concept-grid">
            {data.key_concepts.map((concept, index) => (
              <div className="study-concept" key={`${concept}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{concept}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="study-content-card">
          <div className="study-card-label">NOTES</div>
          <div className="study-notes">
            {data.notes.map((note, index) => (
              <div className="study-note" key={`${note}-${index}`}>
                <span>•</span>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="study-content-card">
          <div className="study-card-label">FLASHCARDS</div>
          <div className="study-flash-preview">
            {data.flashcards.slice(0, 3).map((card, index) => (
              <div className="study-flash-card" key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{card.front}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="study-content-card">
          <div className="study-card-label">QUIZ</div>
          <p className="study-muted">
            {data.quiz.length} questions are ready whenever you want to test yourself.
          </p>
          <button className="study-secondary-button" onClick={() => setView("challenge")}>
            Start challenge
          </button>
        </section>
      </div>
    </div>
  );

  const essay = (
    <div className="study-special-workspace">
      <button className="study-back-button" onClick={() => setView("home")}>
        ← Study Home
      </button>

      <div className="study-special-header">
        <div className="study-card-label">ESSAY STUDIO</div>
        <h1>Build your answer.</h1>
        <p>Start with the question, then let BillyOS help you understand, structure, draft, and improve the response.</p>
      </div>

      <div className="study-essay-flow">
        <div className="study-flow-card">
          <span>01</span>
          <strong>Understand</strong>
          <p>Break down what the question is really asking.</p>
        </div>
        <div className="study-flow-card">
          <span>02</span>
          <strong>Build an argument</strong>
          <p>Explore ideas, evidence, and a logical structure.</p>
        </div>
        <div className="study-flow-card">
          <span>03</span>
          <strong>Draft & improve</strong>
          <p>Work through a draft and refine clarity and structure.</p>
        </div>
      </div>

      <div className="study-special-input-card">
        <textarea
          value={essayPrompt}
          onChange={(e) => setEssayPrompt(e.target.value)}
          placeholder="Paste or write your essay question..."
        />
        <button
          className="study-primary-button"
          onClick={() =>
            submitStudyWithIntentAndTopic(
              essayPrompt,
              "ESSAY"
            )
          }
        >
          Start Essay Studio
        </button>
      </div>
    </div>
  );

  const challengeTake = (
    <div className="study-special-workspace">
      <button
        className="study-back-button"
        onClick={() => setView(data ? "result" : "home")}
      >
        ← Back
      </button>

      {!challengeFinished ? (
        <>
          <div className="study-special-header">
            <div className="study-card-label">CHALLENGE MODE</div>
            <h1>
              Question {challengeIndex + 1} of {challengeQuiz.length}
            </h1>
            <p>Take your time. Your score will appear when you finish.</p>
          </div>

          {challengeQuiz[challengeIndex] && (
            <div className="study-challenge-take-card">
              <div className="study-challenge-question">
                {challengeQuiz[challengeIndex].question}
              </div>

              {challengeQuiz[challengeIndex].options.length > 0 ? (
                <div className="study-challenge-options">
                  {challengeQuiz[challengeIndex].options.map((option, index) => (
                    <button
                      key={`${option}-${index}`}
                      className={
                        challengeSelected === index
                          ? "study-challenge-option selected"
                          : "study-challenge-option"
                      }
                      onClick={() => setChallengeSelected(index)}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      <strong>{option}</strong>
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  className="study-challenge-written"
                  placeholder="Write your answer here..."
                  value={challengeSelected === -1 ? " " : ""}
                  onChange={() => setChallengeSelected(-1)}
                />
              )}

              <button
                className="study-primary-button study-wide-button"
                disabled={
                  challengeQuiz[challengeIndex].options.length > 0 &&
                  challengeSelected === null
                }
                onClick={() => {
                  const current = challengeQuiz[challengeIndex];
                  const isCorrect =
                    current.options.length > 0 &&
                    challengeSelected === current.correct_index;

                  const nextScore = isCorrect
                    ? challengeScore + 1
                    : challengeScore;

                  setChallengeScore(nextScore);

                  if (challengeIndex + 1 >= challengeQuiz.length) {
                    setChallengeFinished(true);
                  } else {
                    setChallengeIndex((value) => value + 1);
                    setChallengeSelected(null);
                  }
                }}
              >
                {challengeIndex + 1 >= challengeQuiz.length ? "Finish challenge" : "Next question"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="study-challenge-finished">
          <div className="study-card-label">CHALLENGE COMPLETE</div>
          <h1>
            {challengeScore} / {challengeQuiz.length}
          </h1>
          <p>
            {challengeQuiz.length
              ? `${Math.round((challengeScore / challengeQuiz.length) * 100)}% correct.`
              : "Challenge complete."}
          </p>

          <div className="study-result-actions">
            <button
              className="study-primary-button"
              onClick={() => {
                setChallengeIndex(0);
                setChallengeSelected(null);
                setChallengeScore(0);
                setChallengeFinished(false);
              }}
            >
              Try again
            </button>

            <button
              className="study-soft-button"
              onClick={() => setView("result")}
            >
              Back to Study
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const challenge = (
    <div className="study-special-workspace">
      <button className="study-back-button" onClick={() => setView(data ? "result" : "home")}>
        ← Back
      </button>

      <div className="study-special-header">
        <div className="study-card-label">CHALLENGE MODE</div>
        <h1>Set your own test.</h1>
        <p>You decide the topic, number of questions, difficulty, and format.</p>
      </div>

      <div className="study-challenge-card">
        <label>
          <span>Topic</span>
          <input
            value={challengeTopic}
            onChange={(e) => setChallengeTopic(e.target.value)}
            placeholder={data?.topic || "What do you want to test yourself on?"}
          />
        </label>

        <label>
          <span>Questions</span>
          <div className="study-stepper">
            <button onClick={() => setChallengeQuestions((v) => Math.max(5, v - 1))}>−</button>
            <strong>{challengeQuestions}</strong>
            <button onClick={() => setChallengeQuestions((v) => Math.min(50, v + 1))}>+</button>
          </div>
        </label>

        <label>
          <span>Difficulty</span>
          <div className="study-choice-row">
            {["Easy", "Medium", "Hard", "Extreme"].map((level) => (
              <button
                key={level}
                className={challengeDifficulty === level ? "selected" : ""}
                onClick={() => setChallengeDifficulty(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </label>

        <label>
          <span>Question type</span>
          <div className="study-choice-row">
            {["Mixed", "Multiple choice", "Written"].map((type) => (
              <button
                key={type}
                className={challengeType === type ? "selected" : ""}
                onClick={() => setChallengeType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </label>

        <button
          className="study-primary-button study-wide-button"
          onClick={() =>
            submitStudy(
              `Create a ${challengeDifficulty.toLowerCase()} ${challengeType.toLowerCase()} test on ${
                challengeTopic || data?.topic || "this topic"
              } with exactly ${challengeQuestions} questions.`
            )
          }
        >
          Generate Challenge
        </button>
      </div>
    </div>
  );

  const home = (
    <div className="study-home">
      <div className="study-home-brand">
        <img src="/favicons/logo-mark-64.png" alt="BillyOS AI" />
        <div>
          <span>BillyOS AI</span>
          <strong>STUDY</strong>
        </div>
      </div>

      <button className="study-home-dashboard" onClick={() => setView("dashboard")}>
        <span>Dashboard</span>
        <b>↗</b>
      </button>

      <div className="study-orbit study-orbit-one" />
      <div className="study-orbit study-orbit-two" />
      <div className="study-glow" />
      <div className="study-floating-dot study-dot-one" />
      <div className="study-floating-dot study-dot-two" />

      <div className="study-home-center">
        <div className="study-home-badge">
          <span />
          Adaptive study workspace
        </div>

        <h1>
          What are you
          <br />
          <em>learning?</em>
        </h1>

        <p>
          Ask BillyOS anything. Explain it, understand it, challenge yourself,
          or bring your own study material.
        </p>

        <div className="study-home-input-wrap">
          <form
            className="study-home-input"
            onSubmit={(e) => {
              e.preventDefault();
              handlePromptSubmit();
            }}
          >
            <button
              type="button"
              className="study-attach"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Add a file"
            >
              +
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
              }}
              onPaste={handlePaste}
              placeholder="Ask anything..."
              rows={1}
              disabled={isSubmitting}
            />

            {isSubmitting ? (
              <div className="study-send-loading">•••</div>
            ) : (
              <button className="study-send" type="submit" aria-label="Start studying">
                ↑
              </button>
            )}
          </form>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.txt,.md,.doc,.docx,.ppt,.pptx,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.currentTarget.value = "";
            }}
          />

          <div className="study-input-tools">
            <button onClick={() => fileInputRef.current?.click()}>＋ Files</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent("billyos:study-voice"))}>
              ◉ Voice
            </button>
          </div>

          {(attachedFile || imagePreview) && (
            <div className="study-attachment-preview">
              {imagePreview && <img src={imagePreview} alt="Pasted study material" />}
              {attachedFile && <span>📎 {attachedFile.name}</span>}
            </div>
          )}
        </div>

        <div className="study-suggestions">
          {suggestions.map((suggestion) => (
            <button key={suggestion} onClick={() => submitStudy(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {essayChoiceOpen && (
        <div className="study-choice-overlay">
          <div className="study-choice-modal">
            <div className="study-card-label">STUDY DETECTED AN ESSAY TASK</div>
            <h2>What should we make?</h2>
            <p>{essayPrompt}</p>

            <button
              className="study-option-button"
              onClick={() => {
                setEssayChoiceOpen(false);
                setView("essay");
              }}
            >
              <span>✍</span>
              <div>
                <strong>Make an essay</strong>
                <small>Open Essay Studio</small>
              </div>
              <b>→</b>
            </button>

            <button
              className="study-option-button"
              onClick={() =>
                submitStudyWithIntentAndTopic(
                  essayPrompt,
                  "SUMMARY"
                )
              }
            >
              <span>≡</span>
              <div>
                <strong>Short summarized answer</strong>
                <small>Send directly to Study</small>
              </div>
              <b>→</b>
            </button>

            <button
              className="study-cancel-button"
              onClick={() => setEssayChoiceOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="study-v2-shell">
      <button
        className="study-v2-close"
        onClick={onClose}
        aria-label="Close Study"
      >
        ×
      </button>

      {view === "home" && home}
      {view === "dashboard" && dashboard}
      {view === "essay" && essay}
      {view === "challenge" && challenge}
      {view === "challenge-take" && challengeTake}
      {view === "result" && result}
      {view === "explain" && home}
    </div>
  );
}
