import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-2 font-heading">Drop in a discovery call.</h3>
        <p className="text-base font-light text-muted-foreground font-body">
          Upload a transcript or paste your notes. We'll extract the deal context and map your committee.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span className="text-[13px] font-normal text-primary font-body">
          Your transcript is processed in real-time and never stored.
        </span>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
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
            <span className="text-sm font-semibold text-foreground font-body">{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground font-body">Drag a file here or click to upload</p>
            <p className="text-xs text-muted-foreground font-body mt-1">Supports Fireflies, Otter, Fathom, and Gong JSON exports</p>
          </>
        )}
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground font-body">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Paste box */}
      <Textarea
        rows={6}
        placeholder="Paste your meeting notes or transcript here..."
        value={pastedText}
        onChange={(e) => { setPastedText(e.target.value); if (e.target.value) setFile(null); }}
        disabled={isLoading}
        className="border-border rounded-lg font-body text-base"
      />

      <Button
        size="xl"
        onClick={handleSubmit}
        disabled={!hasContent || isLoading}
        className="mt-2 h-[52px]"
      >
        Map this deal
      </Button>
    </div>
  );
};

export default TranscriptForm;
