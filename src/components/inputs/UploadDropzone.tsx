import * as React from "react";
import { cn } from "@/lib/utils";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { X, File } from "lucide-react";

/**
 * Upload dropzone component with drag & drop support.
 */
export interface UploadDropzoneProps {
  /** Callback when a file is successfully accepted */
  onFileAccepted: (file: File) => void;
  /** Callback when a file is rejected (invalid type/size) */
  onFileRejected?: (fileRejections: FileRejection[]) => void;
  /** Main label text. Keep it device-neutral — a phone cannot drag. */
  label?: string;
  /** Helper text below label */
  description?: string;
  /** Accepted file types */
  accept?: Accept;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Disable the dropzone */
  disabled?: boolean;
  /** Custom height (default: h-40) */
  height?: string;
  /** Custom width (default: w-full) */
  width?: string;
  /** Show file preview after upload */
  showPreview?: boolean;
  /** Current file (for preview) */
  file?: File | null;
  /** Callback when file is removed */
  onFileRemove?: () => void;
  /** Custom className for wrapper */
  className?: string;
}

/**
 * UploadDropzone - Drag & drop file upload component.
 */
export const UploadDropzone = React.forwardRef<
  HTMLDivElement,
  UploadDropzoneProps
>(
  (
    {
      onFileAccepted,
      onFileRejected,
      label = "Upload a file",
      description,
      accept = { "image/*": [] },
      maxSize = 2 * 1024 * 1024,
      disabled = false,
      height = "h-40",
      width = "w-full",
      showPreview = false,
      file,
      onFileRemove,
      className,
    },
    ref,
  ) => {
    const [preview, setPreview] = React.useState<string | null>(null);
    const [currentFile, setCurrentFile] = React.useState<File | null>(
      file || null,
    );

    React.useEffect(() => {
      if (file) {
        setCurrentFile(file);
        if (showPreview && file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setPreview(null);
        }
      } else {
        setCurrentFile(null);
        setPreview(null);
      }
    }, [file, showPreview]);

    const onDrop = React.useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          onFileAccepted(acceptedFiles[0]);
        }
      },
      [onFileAccepted],
    );

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentFile(null);
      setPreview(null);
      if (onFileRemove) {
        onFileRemove();
      }
    };

    const { getRootProps, getInputProps, isDragActive, isDragReject } =
      useDropzone({
        onDrop,
        onDropRejected: onFileRejected,
        disabled,
        accept,
        maxSize,
        multiple: false,
      });

    const isImage = currentFile?.type.startsWith("image/");

    return (
      <div className={cn("w-full", width)}>
        {showPreview && currentFile ? (
          <div className="relative rounded-xl border-2 border-default overflow-hidden">
            {preview && isImage ? (
              <div className="relative">
                <img
                  src={preview}
                  alt={currentFile.name}
                  className="w-full h-auto max-h-64 object-contain bg-muted"
                />
                {onFileRemove && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-muted transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-muted">
                <File className="size-12 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground truncate max-w-full px-4">
                  {currentFile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(currentFile.size / 1024).toFixed(2)} KB
                </p>
                {onFileRemove && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="mt-4 px-4 py-2 text-sm text-status-danger-text hover:text-status-danger hover:bg-status-danger-soft rounded-lg transition-colors"
                    aria-label="Remove file"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            {...getRootProps()}
            ref={ref}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={label}
            aria-disabled={disabled}
            className={cn(
              "flex flex-col justify-center items-center",
              "rounded-xl border-2 border-dashed",
              "transition-all text-center px-4",
              "bg-white border-default",
              height,
              "hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isDragActive && "border-accent bg-accent-soft",
              isDragReject && "border-status-danger bg-status-danger-soft",
              disabled && "opacity-50 cursor-not-allowed",
              !disabled && "cursor-pointer",
              className,
            )}
          >
            <input {...getInputProps()} aria-label="File upload input" />
            {/* Was `text-accent`, which is a pale wash that measured 1.26:1
                on the white dropzone — the label read as blank space. The
                dashed border and pointer carry the affordance instead. */}
            <p className="font-medium" style={{ color: "var(--heading)" }}>
              {label}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  },
);

UploadDropzone.displayName = "UploadDropzone";
