"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBytes } from "@/lib/format";

const FALLBACK_AUDIO_TYPE = "audio/webm";

function pickMimeType() {
  const supported = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  const found = supported.find((type) => MediaRecorder.isTypeSupported(type));
  return found || FALLBACK_AUDIO_TYPE;
}

export default function PostEditor() {
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);
  const recordedInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recordedAudios, setRecordedAudios] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [recordingError, setRecordingError] = useState("");

  useEffect(() => {
    const dt = new DataTransfer();
    for (const file of recordedAudios) {
      dt.items.add(file);
    }

    if (recordedInputRef.current) {
      recordedInputRef.current.files = dt.files;
    }
  }, [recordedAudios]);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setRecordingError("Tu navegador no soporta grabacion de audio.");
      return;
    }

    try {
      setRecordingError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        const merged = new Blob(chunksRef.current, {
          type: recorder.mimeType || FALLBACK_AUDIO_TYPE,
        });

        if (merged.size > 0) {
          const ext = merged.type.includes("mp4") ? "m4a" : "webm";
          const file = new File([merged], `audio-${Date.now()}.${ext}`, {
            type: merged.type || FALLBACK_AUDIO_TYPE,
          });
          setRecordedAudios((prev) => [...prev, file]);
        }

        chunksRef.current = [];
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.start();
      setIsRecording(true);
    } catch {
      setRecordingError("No se pudo acceder al microfono.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }

  function removeRecordedAudio(index: number) {
    setRecordedAudios((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData(formRef.current);
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(payload.message || "No se pudo crear la publicacion.");
        return;
      }

      setMessage("Publicacion creada.");
      setRecordedAudios([]);
      formRef.current.reset();
      router.refresh();
    } catch {
      setMessage("No se pudo crear la publicacion.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700">
          Titulo
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none transition focus:border-neutral-600 focus:bg-white"
          placeholder="Titulo de la publicacion"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-medium text-neutral-700">
          Contenido
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={7}
          className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none transition focus:border-neutral-600 focus:bg-white"
          placeholder="Subi texto libre, pensamientos, chismes, updates..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="files" className="block text-sm font-medium text-neutral-700">
          Archivos (fotos, audio, PDF, ZIP, etc.)
        </label>
        <input
          id="files"
          name="files"
          type="file"
          multiple
          className="block w-full rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-3 py-3 text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-100 hover:file:bg-neutral-700"
        />
        <input
          ref={recordedInputRef}
          type="file"
          name="files"
          multiple
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isRecording
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-neutral-900 text-neutral-100 hover:bg-neutral-700"
            }`}
          >
            {isRecording ? "Detener grabacion" : "Grabar audio"}
          </button>
          <span className="text-sm text-neutral-600">
            {isRecording ? "Grabando..." : "Agrega notas de voz al post."}
          </span>
        </div>

        {recordingError && <p className="text-sm text-red-600">{recordingError}</p>}

        {recordedAudios.length > 0 && (
          <ul className="space-y-2">
            {recordedAudios.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <span className="truncate text-neutral-700">
                  {file.name} ({formatBytes(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => removeRecordedAudio(index)}
                  className="ml-3 rounded-full border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600 transition hover:border-neutral-500 hover:text-neutral-900"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && <p className="text-sm text-neutral-700">{message}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-500"
      >
        {isSaving ? "Guardando..." : "Publicar"}
      </button>
    </form>
  );
}

