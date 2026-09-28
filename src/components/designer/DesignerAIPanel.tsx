"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { FurnitureDimensions } from "@/core/furniture/types";
import { proposeFurnitureDimensions } from "@/core/furniture/promptProposal";
import type { DimensionKey, FurniturePromptProposal } from "@/core/furniture/promptProposal";
import { buildDictationText, buildSpeechRecognitionTranscript, type SpeechRecognitionResultLike } from "@/core/assistant/dictationTranscript";
import { MAX_IMAGE_3D_DATA_URI_BYTES, type Image3DStatusResponse, type Image3DTaskResponse } from "@/core/image3d";

type MessageRole = "assistant" | "user";
interface ConversationMessage {
  id: string;
  role: MessageRole;
  text: string;
}

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
  hasGeneratedModel,
  onGeneratedModel,
  onClearGeneratedModel,
}: {
  dimensions: FurnitureDimensions;
  proposal: FurniturePromptProposal | null;
  onProposalChange: (proposal: FurniturePromptProposal | null) => void;
  onApplyProposal: () => void;
  hasGeneratedModel: boolean;
  onGeneratedModel: (model: Blob) => void;
  onClearGeneratedModel: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([
    { id: "welcome", role: "assistant", text: "Hola. Puedo ajustar el ancho, alto y fondo del clóset. Escribe o dicta lo que necesitas." },
  ]);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [dictationStatus, setDictationStatus] = useState("");
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState("");
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [photoServiceReady, setPhotoServiceReady] = useState(Boolean(process.env.NEXT_PUBLIC_MUEBLEA_API_ORIGIN?.trim()));
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const dictationBaseRef = useRef("");
  const recognitionErrorRef = useRef(false);
  const messageCounterRef = useRef(0);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setSpeechSupported(Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition));
    setPhotoServiceReady(Boolean(process.env.NEXT_PUBLIC_MUEBLEA_API_ORIGIN?.trim()) || !window.location.hostname.endsWith("github.io"));
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
        if (recognitionRef.current !== recognition) return;
        const transcript = buildSpeechRecognitionTranscript(event.results);
        setDraft(buildDictationText(dictationBaseRef.current, transcript));
        if (proposal) onProposalChange(null);
      };
      recognition.onerror = (event) => {
        if (recognitionRef.current !== recognition) return;
        recognitionErrorRef.current = true;
        setDictationStatus(event.error === "not-allowed"
          ? "Permite el micrófono en el navegador para dictar."
          : "No se pudo completar el dictado. Puedes seguir escribiendo.");
        setIsDictating(false);
      };
      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
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

  async function handlePhotoSelection(file: File | undefined) {
    if (!file) return;
    setPhotoStatus("");
    setPhotoDataUri(null);
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoStatus("Elige una foto JPG, PNG o WebP.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setPhotoStatus("La foto supera 20 MB. Elige una imagen más liviana.");
      return;
    }

    setIsPreparingPhoto(true);
    try {
      const imageUrl = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.src = imageUrl;
        await image.decode();
        const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
        const scale = Math.min(1, 1280 / longestSide);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("No pude preparar la imagen en este navegador.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        let quality = 0.84;
        let dataUri = canvas.toDataURL("image/jpeg", quality);
        while (dataUri.length * 0.75 > MAX_IMAGE_3D_DATA_URI_BYTES && quality > 0.5) {
          quality -= 0.08;
          dataUri = canvas.toDataURL("image/jpeg", quality);
        }
        if (dataUri.length * 0.75 > MAX_IMAGE_3D_DATA_URI_BYTES) {
          throw new Error("La foto sigue pesando demasiado después de prepararla. Prueba una foto con menos detalle.");
        }

        setPhotoDataUri(dataUri);
        setPhotoStatus("Foto preparada. Se enviará al crear el modelo 3D.");
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      setPhotoStatus(error instanceof Error ? error.message : "No se pudo leer esta foto.");
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  function getImage3DApiUrl() {
    const configuredOrigin = process.env.NEXT_PUBLIC_MUEBLEA_API_ORIGIN?.trim();
    const origin = configuredOrigin || (window.location.hostname.endsWith("github.io") ? "" : window.location.origin);
    if (!origin) throw new Error("El servicio de fotos todavía no está conectado a esta versión de la app.");
    return `${origin.replace(/\/$/, "")}/api/image-to-3d`;
  }

  async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const result = await response.json().catch(() => ({})) as T & { error?: string };
    if (!response.ok) throw new Error(result.error || "No se pudo comunicar con el servicio 3D.");
    return result;
  }

  async function generateModelFromPhoto() {
    if (!photoDataUri || isGeneratingModel) return;
    setIsGeneratingModel(true);
    setGenerationProgress(0);
    setPhotoStatus("Enviando la foto al generador 3D…");

    try {
      const endpoint = getImage3DApiUrl();
      const created = await requestJson<Image3DTaskResponse>(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUri: photoDataUri }),
      });
      if (!created.taskId) throw new Error("El servicio 3D no devolvió una tarea válida.");

      setPhotoStatus("Modelo en proceso. Puedes dejar esta pestaña abierta.");
      let task: Image3DStatusResponse | null = null;
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        const pollUrl = new URL(endpoint);
        pollUrl.searchParams.set("taskId", created.taskId);
        task = await requestJson<Image3DStatusResponse>(pollUrl.toString());
        setGenerationProgress(task.progress);
        if (task.status === "SUCCEEDED") break;
        if (task.status === "FAILED" || task.status === "CANCELED") {
          throw new Error("El servicio no pudo formar un modelo con esta foto. Prueba con una sola pieza, bien iluminada y desde el frente.");
        }
      }

      if (!task || task.status !== "SUCCEEDED") {
        throw new Error("El modelo está tardando más de lo esperado. Prueba de nuevo más tarde.");
      }

      const downloadUrl = new URL(endpoint);
      downloadUrl.searchParams.set("taskId", created.taskId);
      downloadUrl.searchParams.set("download", "1");
      const response = await fetch(downloadUrl.toString());
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || "No se pudo descargar el modelo generado.");
      }
      const file = await response.blob();
      if (!file.size || file.size > 50 * 1024 * 1024) {
        throw new Error("El archivo 3D no es válido o es demasiado grande para mostrarlo en este dispositivo.");
      }

      onGeneratedModel(new Blob([file], { type: "model/gltf-binary" }));
      setPhotoStatus("Modelo listo. La vista central muestra una referencia 3D aproximada.");
    } catch (error) {
      setPhotoStatus(error instanceof Error ? error.message : "No se pudo generar el modelo 3D.");
    } finally {
      setIsGeneratingModel(false);
    }
  }

  return (
    <div className="panelContent assistantContent designerAIPanel">
      <div className="parameterTitle">
        <div><span className="panelEyebrow">DISEÑADOR IA</span><h2>Describe tu mueble</h2></div>
        <span className="parameterIcon assistantIcon" aria-hidden="true">✦</span>
      </div>
      <p className="panelDescription">Pide cambios con palabras sencillas. El modelo solo cambia cuando confirmas.</p>

      <div className="designerAIBadge"><span /> Texto, dictado y foto a 3D</div>

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

      <section className="imageTo3DCard" aria-labelledby="photo-to-3d-title">
        <div className="imageTo3DHeading"><span className="panelEyebrow">NUEVO · FOTO A 3D</span><span aria-hidden="true">◇</span></div>
        <h3 id="photo-to-3d-title">Parte de una foto</h3>
        <p className="imageTo3DDescription">Sube una imagen frontal y genera un modelo 3D aproximado para explorar su forma.</p>
        <label className={photoDataUri ? "imageUploadArea hasPhoto" : "imageUploadArea"} htmlFor="furniture-photo-input">
          {photoDataUri ? <img src={photoDataUri} alt="Vista previa de la foto para el modelo 3D" /> : <span className="imageUploadPlaceholder"><span aria-hidden="true">＋</span><strong>{isPreparingPhoto ? "Preparando foto…" : "Elegir foto"}</strong><small>JPG, PNG o WebP · máximo 20 MB</small></span>}
        </label>
        <input
          id="furniture-photo-input"
          className="visuallyHiddenFileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => { void handlePhotoSelection(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}
          disabled={isPreparingPhoto || isGeneratingModel}
        />
        <div className="imageTo3DActions">
          <button className="imageTo3DButton" type="button" onClick={() => void generateModelFromPhoto()} disabled={!photoDataUri || !photoServiceReady || isPreparingPhoto || isGeneratingModel}>
            {isGeneratingModel ? `Generando… ${generationProgress}%` : "Generar modelo 3D"}
          </button>
          {photoDataUri && !isGeneratingModel ? <button className="imageClearButton" type="button" onClick={() => { setPhotoDataUri(null); setPhotoStatus(""); }}>Quitar foto</button> : null}
        </div>
        {isGeneratingModel ? <progress className="imageTo3DProgress" max="100" value={generationProgress} aria-label="Avance de generación 3D" /> : null}
        <p className={photoStatus && /no pudo|no se pudo|tardando|todavía no está conectado|demasiado|inválida/i.test(photoStatus) ? "imageTo3DStatus error" : "imageTo3DStatus"} role="status" aria-live="polite">
          {photoStatus || (!photoServiceReady
            ? "La conexión con el servidor seguro aún está pendiente. Puedes cargar la foto; la generación se habilitará al conectarlo."
            : "Al generar, la imagen se enviará a Meshy para crear el modelo.")}
        </p>
        <p className="imageTo3DDisclaimer">Es una referencia visual. Una sola foto no confirma medidas, parte trasera ni detalles constructivos. No se usa para el despiece.</p>
        {hasGeneratedModel ? <button className="removeGeneratedModelButton" type="button" onClick={onClearGeneratedModel}>Quitar modelo generado</button> : null}
      </section>

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
        <p>Las instrucciones de texto proponen medidas; la foto genera solo una referencia visual. Confirma las medidas en el modelo paramétrico antes de fabricar.</p>
      </div>
    </div>
  );
}
