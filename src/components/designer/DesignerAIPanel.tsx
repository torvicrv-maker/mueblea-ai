"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import NextImage from "next/image";
import type { FurnitureDimensions, WardrobeLayout, WardrobeSection } from "@/core/furniture/types";
import { proposeFurnitureDimensions } from "@/core/furniture/promptProposal";
import type { DimensionKey, FurniturePromptProposal } from "@/core/furniture/promptProposal";
import { buildDictationText, buildSpeechRecognitionTranscript, type SpeechRecognitionResultLike } from "@/core/assistant/dictationTranscript";
import { MAX_PHOTO_DATA_URI_BYTES } from "@/core/photoImage";
import { parsePhotoDesignProposal, type PhotoDesignProposal } from "@/core/furniture/photoProposal";
import { normalizeWardrobeLayout } from "@/core/furniture/wardrobeLayout";

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
  photoProposal,
  onPhotoProposalChange,
  onApplyPhotoProposal,
}: {
  dimensions: FurnitureDimensions;
  proposal: FurniturePromptProposal | null;
  onProposalChange: (proposal: FurniturePromptProposal | null) => void;
  onApplyProposal: () => void;
  photoProposal: PhotoDesignProposal | null;
  onPhotoProposalChange: (proposal: PhotoDesignProposal | null) => void;
  onApplyPhotoProposal: (proposal: PhotoDesignProposal) => void;
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
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
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
  }, [messages, proposal, photoProposal]);

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
    onPhotoProposalChange(null);
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
    onPhotoProposalChange(null);
    onApplyProposal();
    addMessage("assistant", "Medidas aplicadas al modelo. Puedes describir el siguiente ajuste.");
  }

  function discardProposal() {
    onProposalChange(null);
    addMessage("assistant", "Descarté la propuesta; el diseño sigue igual.");
  }

  function updatePhotoProposalLayout(layout: WardrobeLayout) {
    if (!photoProposal?.supported) return;
    const normalized = normalizeWardrobeLayout(layout);
    if (!normalized) return;
    const nextProposal = { ...photoProposal, layout: normalized };
    onPhotoProposalChange(nextProposal);
  }

  function updateSection(index: number, patch: Partial<WardrobeSection>) {
    if (!photoProposal?.layout) return;
    const sections = photoProposal.layout.sections.map((section, sectionIndex) => {
      if (sectionIndex !== index) return section;
      const next = { ...section, ...patch };
      if (patch.frontStyle && patch.frontStyle !== "drawers") next.drawerCount = 0;
      if (patch.frontStyle === "drawers" && next.drawerCount === 0) next.drawerCount = 3;
      return next;
    });
    updatePhotoProposalLayout({ sections });
  }

  function updateSectionWidth(index: number, nextRatio: number) {
    if (!photoProposal?.layout) return;
    const current = photoProposal.layout.sections;
    const innerWidth = dimensions.width - 36 - (current.length - 1) * 18;
    const minimumRatio = 250 / innerWidth;
    const maximumRatio = 1 - (current.length - 1) * minimumRatio;
    const widthRatio = Math.max(minimumRatio, Math.min(maximumRatio, nextRatio));
    const otherRatioTotal = current.reduce((sum, section, sectionIndex) => sum + (sectionIndex === index ? 0 : section.widthRatio), 0);
    updatePhotoProposalLayout({
      sections: current.map((section, sectionIndex) => ({
        ...section,
        widthRatio: sectionIndex === index
          ? widthRatio
          : (1 - widthRatio) * section.widthRatio / otherRatioTotal,
      })),
    });
  }

  function addSection() {
    if (!photoProposal?.layout || photoProposal.layout.sections.length >= maximumSectionCount) return;
    const count = photoProposal.layout.sections.length + 1;
    const preservedShare = (count - 1) / count;
    updatePhotoProposalLayout({
      sections: [
        ...photoProposal.layout.sections.map((section) => ({ ...section, widthRatio: section.widthRatio * preservedShare })),
        { widthRatio: 1 / count, shelfCount: 1, hanging: false, frontStyle: "open", drawerCount: 0 },
      ],
    });
  }

  function removeSection(index: number) {
    if (!photoProposal?.layout || photoProposal.layout.sections.length <= 1) return;
    updatePhotoProposalLayout({ sections: photoProposal.layout.sections.filter((_, sectionIndex) => sectionIndex !== index) });
  }

  const maximumSectionCount = Math.max(1, Math.min(4, Math.floor((dimensions.width - 18) / 268)));

  function applyPhotoProposal() {
    if (!photoProposal?.supported || !photoProposal.layout) return;
    onApplyPhotoProposal(photoProposal);
    onPhotoProposalChange(null);
    addMessage("assistant", "Distribución aplicada. El modelo 3D, las piezas y el CSV ahora se calculan juntos con las medidas actuales.");
  }

  function discardPhotoProposal() {
    onPhotoProposalChange(null);
    addMessage("assistant", "Descarté la propuesta de la foto; el modelo no cambió.");
  }

  async function handlePhotoSelection(file: File | undefined) {
    if (!file) return;
    setPhotoStatus("");
    setPhotoDataUri(null);
    onPhotoProposalChange(null);
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
        while (dataUri.length * 0.75 > MAX_PHOTO_DATA_URI_BYTES && quality > 0.5) {
          quality -= 0.08;
          dataUri = canvas.toDataURL("image/jpeg", quality);
        }
        if (dataUri.length * 0.75 > MAX_PHOTO_DATA_URI_BYTES) {
          throw new Error("La foto sigue pesando demasiado después de prepararla. Prueba una foto con menos detalle.");
        }

        setPhotoDataUri(dataUri);
        setPhotoStatus("Foto preparada. Al analizarla, la IA usará las medidas que aparecen arriba.");
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      setPhotoStatus(error instanceof Error ? error.message : "No se pudo leer esta foto.");
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  function getPhotoDesignApiUrl() {
    const configuredOrigin = process.env.NEXT_PUBLIC_MUEBLEA_API_ORIGIN?.trim();
    const origin = configuredOrigin || (window.location.hostname.endsWith("github.io") ? "" : window.location.origin);
    if (!origin) throw new Error("El analizador todavía no está conectado a esta versión de la app.");
    return `${origin.replace(/\/$/, "")}/api/design-from-photo`;
  }

  async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const result = await response.json().catch(() => ({})) as T & { error?: string };
    if (!response.ok) throw new Error(result.error || "No se pudo analizar esta foto.");
    return result;
  }

  async function analyzePhoto() {
    if (!photoDataUri || isAnalyzingPhoto) return;
    setIsAnalyzingPhoto(true);
    onProposalChange(null);
    setPhotoStatus("Analizando la distribución visible…");

    try {
      const endpoint = getPhotoDesignApiUrl();
      const result = await requestJson<unknown>(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUri: photoDataUri, dimensions, description: draft.trim() }),
      });
      const parsed = parsePhotoDesignProposal(result);
      if (!parsed?.supported || !parsed.layout) throw new Error("La IA no devolvió una distribución de clóset válida.");
      onPhotoProposalChange(parsed);
      setPhotoStatus("Propuesta lista. Revisa y edita la distribución antes de aplicarla.");
      addMessage("user", `Analizar foto · medidas actuales ${dimensions.width} × ${dimensions.height} × ${dimensions.depth} mm`);
      addMessage("assistant", parsed.summary);
    } catch (error) {
      setPhotoStatus(error instanceof Error ? error.message : "No se pudo analizar la foto.");
    } finally {
      setIsAnalyzingPhoto(false);
    }
  }

  const photoLayout = photoProposal?.layout ?? null;

  return (
    <div className="panelContent assistantContent designerAIPanel">
      <div className="parameterTitle">
        <div><span className="panelEyebrow">DISEÑADOR IA</span><h2>Describe tu mueble</h2></div>
        <span className="parameterIcon assistantIcon" aria-hidden="true">✦</span>
      </div>
      <p className="panelDescription">Pide cambios con palabras sencillas. El modelo solo cambia cuando confirmas.</p>

      <div className="designerAIBadge"><span /> Texto, dictado y diseño desde foto</div>

      <div className="assistantConversation" ref={conversationRef} role="log" aria-live="polite" aria-label="Conversación con Diseñador IA">
        {messages.map((message) => (
          <article className={`assistantMessage ${message.role === "user" ? "userMessage" : "designerMessage"}`} key={message.id}>
            <span>{message.role === "user" ? "TÚ" : "DISEÑADOR IA"}</span>
            <p>{message.text}</p>
          </article>
        ))}
      </div>

      {!draft && !proposal && !photoProposal && !isAnalyzingPhoto ? (
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
        <p className="photoPromptHint">Puedes anotar preferencias para la foto aquí; las medidas del panel son las que se usan.</p>
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
        <div className="imageTo3DHeading"><span className="panelEyebrow">FOTO → MODELO PARAMÉTRICO</span><span aria-hidden="true">◇</span></div>
        <h3 id="photo-to-3d-title">Usa una foto como referencia</h3>
        <p className="imageTo3DDescription">La IA sugiere módulos, repisas, puertas o frentes. El 3D y el despiece se calculan con las medidas que ingresaste.</p>
        <label className={photoDataUri ? "imageUploadArea hasPhoto" : "imageUploadArea"} htmlFor="furniture-photo-input">
          {photoDataUri ? <NextImage src={photoDataUri} alt="Vista previa de la foto de referencia" width={1200} height={800} sizes="(max-width: 760px) 90vw, 320px" unoptimized /> : <span className="imageUploadPlaceholder"><span aria-hidden="true">＋</span><strong>{isPreparingPhoto ? "Preparando foto…" : "Elegir foto"}</strong><small>JPG, PNG o WebP · máximo 20 MB</small></span>}
        </label>
        <input
          id="furniture-photo-input"
          className="visuallyHiddenFileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => { void handlePhotoSelection(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}
          disabled={isPreparingPhoto || isAnalyzingPhoto}
        />
        <div className="imageTo3DActions">
          <button className="imageTo3DButton" type="button" onClick={() => void analyzePhoto()} disabled={!photoDataUri || !photoServiceReady || isPreparingPhoto || isAnalyzingPhoto}>
            {isAnalyzingPhoto ? "Analizando foto…" : "Analizar y preparar diseño"}
          </button>
          {photoDataUri && !isAnalyzingPhoto ? <button className="imageClearButton" type="button" onClick={() => { setPhotoDataUri(null); setPhotoStatus(""); onPhotoProposalChange(null); }}>Quitar foto</button> : null}
        </div>
        <p className={photoStatus && /no pudo|no se pudo|tardando|todavía no está conectado|demasiado|inválida|no cabe|no puedo|no coincide|no está configurado/i.test(photoStatus) ? "imageTo3DStatus error" : "imageTo3DStatus"} role="status" aria-live="polite">
          {photoStatus || (!photoServiceReady
            ? "La conexión con el servidor seguro aún está pendiente. Puedes cargar la foto; el análisis se habilitará al conectarlo."
            : "Al analizar, se envían la foto, las medidas y tu instrucción al servicio de IA configurado por la app.")}
        </p>
        <p className="imageTo3DDisclaimer">La foto no revela medidas ni partes ocultas. Revisa el borrador: solo se aplica cuando confirmas. Cada análisis consume uso de API de la cuenta configurada en el servidor.</p>
      </section>

      {photoProposal && photoLayout ? (
        <section className="proposalCard photoProposalCard" aria-labelledby="photo-proposal-title">
          <span className="panelEyebrow">BORRADOR EDITABLE · FOTO</span>
          <p id="photo-proposal-title" className="proposalMessage">{photoProposal.summary}</p>
          <p className="proposalPreviewHint">El centro ya muestra esta distribución con {dimensions.width} × {dimensions.height} × {dimensions.depth} mm. Ajusta los módulos antes de aplicar.</p>
          <div className="photoSectionList">
            {photoLayout.sections.map((section, index) => (
              <article className="photoSectionEditor" key={`section-${index}`}>
                <div className="photoSectionHeader"><strong>Módulo {index + 1}</strong>{photoLayout.sections.length > 1 ? <button type="button" onClick={() => removeSection(index)} aria-label={`Quitar módulo ${index + 1}`}>Quitar</button> : null}</div>
                <label>Ancho relativo <span>{Math.round(section.widthRatio * 100)}%</span></label>
                <input aria-label={`Ancho relativo del módulo ${index + 1}`} type="range" min={Math.ceil((250 / (dimensions.width - 36 - (photoLayout.sections.length - 1) * 18)) * 100)} max={Math.floor((1 - (photoLayout.sections.length - 1) * (250 / (dimensions.width - 36 - (photoLayout.sections.length - 1) * 18))) * 100)} step="1" value={Math.round(section.widthRatio * 100)} onChange={(event) => updateSectionWidth(index, Number(event.target.value) / 100)} />
                <label htmlFor={`section-shelves-${index}`}>Repisas</label>
                <select id={`section-shelves-${index}`} value={section.shelfCount} onChange={(event) => updateSection(index, { shelfCount: Number(event.target.value) })}>
                  {Array.from({ length: 9 }, (_, count) => <option key={count} value={count}>{count}</option>)}
                </select>
                <label htmlFor={`section-front-${index}`}>Frente</label>
                <select id={`section-front-${index}`} value={section.frontStyle} onChange={(event) => updateSection(index, { frontStyle: event.target.value as WardrobeSection["frontStyle"] })}>
                  <option value="open">Abierto</option><option value="doors">Puertas</option><option value="drawers">Cajones</option>
                </select>
                {section.frontStyle === "drawers" ? <><label htmlFor={`section-drawers-${index}`}>Frentes de cajón</label><select id={`section-drawers-${index}`} value={section.drawerCount} onChange={(event) => updateSection(index, { drawerCount: Number(event.target.value) })}>{Array.from({ length: 6 }, (_, count) => <option key={count + 1} value={count + 1}>{count + 1}</option>)}</select></> : null}
                <label className="hangingOption"><input type="checkbox" checked={section.hanging} onChange={(event) => updateSection(index, { hanging: event.target.checked })} /> Espacio para colgar</label>
              </article>
            ))}
          </div>
          {photoLayout.sections.length < maximumSectionCount ? <button className="addPhotoSectionButton" type="button" onClick={addSection}>＋ Añadir módulo</button> : null}
          {photoProposal.assumptions.length ? <div className="photoAssumptions"><strong>Suposiciones para revisar</strong>{photoProposal.assumptions.map((assumption, index) => <p key={`${index}-${assumption}`}>• {assumption}</p>)}</div> : null}
          <p className="proposalWarning">El despiece incluye tableros y frentes visibles. No incluye cajas completas de cajón, tubos, bisagras ni otros herrajes.</p>
          <div className="proposalActions"><button type="button" className="applyProposalButton" onClick={applyPhotoProposal}>Confirmar diseño</button><button type="button" className="discardProposalButton" onClick={discardPhotoProposal}>Descartar</button></div>
        </section>
      ) : null}

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
        <p>La IA propone una distribución; el motor paramétrico genera el modelo y las piezas. Confirma espesor, cantos, herrajes y uniones antes de fabricar.</p>
      </div>
    </div>
  );
}
