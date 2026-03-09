"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Shield } from "lucide-react";

export interface TranscriptInputs {
  path: "transcript";
  transcriptContent: string;
}

interface TranscriptFormProps {
  onSubmit: (inputs: TranscriptInputs) => void;
  isLoading: boolean;
}

const TranscriptForm = ({ onSubmit, isLoading }: TranscriptFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasContent = !!file || pastedText.trim().length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPastedText("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith(".json") || f.name.endsWith(".txt"))) {
      setFile(f);
      setPastedText("");
    }
  };

  const handleSubmit = async () => {
    if (!hasContent || isLoading) return;
    let content = pastedText;
    if (file) {
      content = await file.text();
    }
    onSubmit({ path: "transcript", transcriptContent: content });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold font-heading" style={{ color: "#383838" }}>Drop in a discovery call.</h3>
        <p className="text-sm font-light font-body mt-1" style={{ color: "#888" }}>
          Upload a transcript or paste your notes. We&apos;ll extract the deal context and build your map.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "#F0F0ED" }}>
        <Shield className="w-3.5 h-3.5" style={{ color: "#2A9D8F" }} />
        <span className="font-body" style={{ fontSize: 13, color: "#2A9D8F" }}>
          Your transcript is processed in real-time and never stored.
        </span>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl p-10 text-center cursor-pointer transition-colors"
        style={{ border: "2px dashed #D7DADD", background: "#FAFAF9" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-semibold font-body" style={{ color: "#383838" }}>{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              style={{ color: "#999" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 mx-auto mb-3" style={{ color: "#999" }} />
            <p className="text-sm font-semibold font-body" style={{ color: "#383838" }}>Drag a file here or click to upload</p>
            <p className="text-xs font-body mt-1" style={{ color: "#999" }}>Supports Fireflies, Otter, Fathom, and Gong JSON exports</p>
          </>
        )}
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px" style={{ background: "#E8E7E4" }} />
        <span className="text-sm font-body" style={{ color: "#999" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "#E8E7E4" }} />
      </div>

      {/* Paste box */}
      <Textarea
        rows={5}
        placeholder="Paste your meeting notes or transcript here..."
        value={pastedText}
        onChange={(e) => { setPastedText(e.target.value); if (e.target.value) setFile(null); }}
        disabled={isLoading}
        className="font-body text-sm"
        style={{ border: "1px solid #D7DADD", borderRadius: 8, background: "#FFFFFF" }}
      />

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={!hasContent || isLoading}
        className="w-full font-body font-semibold cursor-pointer transition-all duration-150"
        style={{
          height: 48,
          borderRadius: 8,
          fontSize: 14,
          border: "none",
          background: hasContent && !isLoading ? "#2A9D8F" : "#E8E7E4",
          color: hasContent && !isLoading ? "#FFFFFF" : "#BCBCBC",
          boxShadow: hasContent && !isLoading ? "0 4px 20px rgba(42,157,143,0.3)" : "none",
        }}
      >
        Build my map
      </button>
    </div>
  );
};

export default TranscriptForm;
