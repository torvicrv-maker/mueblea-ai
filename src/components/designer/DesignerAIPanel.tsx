"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { FurnitureDimensions } from "@/core/furniture/types";
import { proposeFurnitureDimensions } from "@/core/furniture/promptProposal";
import type { DimensionKey, FurniturePromptProposal } from "@/core/furniture/promptProposal";

type MessageRole = "assistant" | "user";
interface ConversationMessage {
  id: string;
  role: MessageRole;
  text: string;
}

interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike { readonly 0: SpeechRecognitionAlternativeLike }
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorLike extends Event { readonly error?: string }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const DIMENSION_LABELS: Record<DimensionKey, string> = { width: "Ancho", height: "Alto", depth: "Fondo" };
const QUICK_PROMPTS = [
  "Clóset de 2,60 m de ancho, 2,40 m de alto y 70 cm de fondo",
  "2400 x 2300 x 600 mm",
];

export function DesignerAIPanel({
  dimensions,
  proposal,
  onProposalChange,
  onApplyProposal,
}: {
  dimensions: FurnitureDimensions;
  proposal: FurniturePromptProposal | null;
  onProposalChange: (proposal: FurniturePromptProposal | null) => void;
  onApplyProposal: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([
    { id: "welcome", role: "assistant", text: "Hola. Puedo ajustar el ancho, alto y fondo del clóset. Escribe o dicta lo que necesitas." },
  ]);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [dictationStatus, setDictationStatus] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const dictationBaseRef = useRef("");
  const recognitionErrorRef = useRef(false);
  const messageCounterRef = useRef(0);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setSpeechSupported(Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition));
    return () => recognitionRef.current?.abort();
  }, []);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) conversation.scrollTo({ top: conversation.scrollHeight, behavior: "smooth" });
  }, [messages, proposal]);

  function addMessage(role: MessageRole, text: string) {
    messageCounterRef.current += 1;
    const message = { id: `message-${messageCounterRef.current}`, role, text };
    setMessages((current) => [...current, message]);
  }

  function updateDraft(value: string) {
    setDraft(value);
    if (proposal) onProposalChange(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = draft.trim();
    if (!prompt) return;

    const nextProposal = proposeFurnitureDimensions(prompt, dimensions);
    onProposalChange(nextProposal);
    addMessage("user", prompt);
    addMessage(
      "assistant",
      nextProposal.status === "ready"
        ? "Preparé una acción tipada. Revisa la vista previa y confirma para actualizar el modelo."
        : nextProposal.message,
    );
    setDraft("");
  }

  function toggleDictation() {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      setDictationStatus("Dictado detenido. Revisa el texto antes de preparar la propuesta.");
      return;
    }

    const speechWindow = window as SpeechWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDictationStatus("Este navegador no ofrece dictado de voz. Puedes escribir la instrucción.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-EC";
      recognition.continuous = true;
      recognition.interimResults = true;
      dictationBaseRef.current = draft.trim();
      recognitionErrorRef.current = false;
      recognition.onresult = (event) => {
        const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index]?.[0]?.transcript ?? "")
          .filter(Boolean)
          .join(" ")
          .trim();
        setDraft([dictationBaseRef.current, transcript].filter(Boolean).join(" "));
        if (proposal) onProposalChange(null);
      };
      recognition.onerror = (event) => {
        recognitionErrorRef.current = true;
        setDictationStatus(event.error === "not-allowed"
          ? "Permite el micrófono en el navegador para dictar."
          : "No se pudo completar el dictado. Puedes seguir escribiendo.");
        setIsDictating(false);
      };
      recognition.onend = () => {
        setIsDictating(false);
        recognitionRef.current = null;
        if (!recognitionErrorRef.current) setDictationStatus("Dictado terminado. Revisa el texto y envíalo cuando quieras.");
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsDictating(true);
      setDictationStatus("Te escucho. El dictado no se envía automáticamente.");
    } catch {
      recognitionRef.current = null;
      setIsDictating(false);
      setDictationStatus("No se pudo iniciar el micrófono. Revisa los permisos del navegador.");
    }
  }

  function applyProposal() {
    if (proposal?.status !== "ready") return;
    onApplyProposal();
    addMessage("assistant", "Medidas aplicadas al modelo. Puedes describir el siguiente ajuste.");
  }

  function discardProposal() {
    onProposalChange(null);
    addMessage("assistant", "Descarté la propuesta; el diseño sigue igual.");
  }

  return (
    <div className="panelContent assistantContent designerAIPanel">
      <div className="parameterTitle">
        <div><span className="panelEyebrow">DISEÑADOR IA</span><h2>Describe tu mueble</h2></div>
        <span className="parameterIcon assistantIcon" aria-hidden="true">✦</span>
      </div>
      <p className="panelDescription">Pide cambios con palabras sencillas. El modelo solo cambia cuando confirmas.</p>

      <div className="designerAIBadge"><span /> Prototipo · texto y dictado</div>

      <div className="assistantConversation" ref={conversationRef} role="log" aria-live="polite" aria-label="Conversación con Diseñador IA">
        {messages.map((message) => (
          <article className={`assistantMessage ${message.role === "user" ? "userMessage" : "designerMessage"}`} key={message.id}>
            <span>{message.role === "user" ? "TÚ" : "DISEÑADOR IA"}</span>
            <p>{message.text}</p>
          </article>
        ))}
      </div>

      {!draft && !proposal ? (
        <div className="assistantQuickPrompts" aria-label="Ejemplos de instrucciones">
          {QUICK_PROMPTS.map((prompt) => (
            <button className="assistantPromptChip" type="button" key={prompt} onClick={() => setDraft(prompt)}>{prompt}</button>
          ))}
        </div>
      ) : null}

      <form className="assistantForm designerAIForm" onSubmit={handleSubmit}>
        <label htmlFor="assistant-prompt">Instrucción</label>
        <textarea
          id="assistant-prompt"
          rows={3}
          value={draft}
          onChange={(event) => updateDraft(event.target.value)}
          placeholder="Ej.: Hazlo de 2,40 m de ancho, 2,30 m de alto y 60 cm de fondo"
        />
        <div className="assistantComposerActions">
          <button
            className={isDictating ? "voiceButton isListening" : "voiceButton"}
            type="button"
            onClick={toggleDictation}
            disabled={!speechSupported && !isDictating}
            aria-label={isDictating ? "Detener dictado" : "Dictar instrucción"}
            title={speechSupported ? (isDictating ? "Detener dictado" : "Dictar instrucción") : "Dictado no disponible en este navegador"}
          >
            <span aria-hidden="true">{isDictating ? "■" : "♩"}</span>{isDictating ? "Detener" : "Dictar"}
          </button>
          <button className="analyzeButton" type="submit" disabled={!draft.trim()}><span aria-hidden="true">✦</span> Preparar propuesta</button>
        </div>
        <p className="dictationStatus" role="status">{dictationStatus || "Puedes escribir o dictar; nada se aplica al modelo sin tu confirmación."}</p>
      </form>

      {proposal ? (
        <section className={proposal.status === "ready" ? "proposalCard" : "proposalCard proposalError"} aria-labelledby="proposal-title">
          <span className="panelEyebrow">{proposal.status === "ready" ? "VISTA PREVIA DE LA ACCIÓN" : "REVISAR INSTRUCCIÓN"}</span>
          <p id="proposal-title" className="proposalMessage">{proposal.message}</p>
          {proposal.status === "ready" ? (
            <>
              <span className="typedActionBadge">Acción tipada · {proposal.action.type}</span>
              {proposal.changedKeys.length > 0 ? (
                <div className="proposalDimensions">
                  {proposal.changedKeys.map((key) => <div key={key}><span>{DIMENSION_LABELS[key]}</span><strong>{dimensions[key]} <i>→</i> {proposal.action.payload[key]} mm</strong></div>)}
                </div>
              ) : null}
              <p className="proposalPreviewHint">El centro muestra el mueble propuesto; las medidas actuales no cambian todavía.</p>
            </>
          ) : null}
          {proposal.warnings.map((warning) => <p className="proposalWarning" key={warning}>{warning}</p>)}
          <div className="proposalActions">
            {proposal.status === "ready" ? <button type="button" className="applyProposalButton" onClick={applyProposal}>Confirmar y aplicar</button> : null}
            <button type="button" className="discardProposalButton" onClick={discardProposal}>Descartar</button>
          </div>
        </section>
      ) : null}

      <div className="assistantRoadmapNote">
        <strong>Alcance de esta versión</strong>
        <p>Interpreta medidas generales. El diseño de cajones, puertas, fotos y planos se habilitará al conectar la IA generativa en un servidor seguro.</p>
      </div>
    </div>
  );
}
