import {
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

interface ImageUploaderProps {
  multiple?: boolean;
  onImagesChange?: (
    files: File[]
  ) => void;
}

export default function ImageUploader({
  multiple = false,
  onImagesChange,
}: ImageUploaderProps) {

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [files, setFiles] =
    useState<File[]>([]);

  const [isDragging, setIsDragging] =
    useState(false);

  const handleFiles = (
    selectedFiles: FileList | null
  ) => {
    if (!selectedFiles) return;

    const newFiles =
      Array.from(selectedFiles);

    const updated =
      multiple
        ? [...files, ...newFiles]
        : newFiles.slice(0, 1);

    setFiles(updated);

    onImagesChange?.(updated);
  };

  const removeFile = (index: number) => {
    const updated =
      files.filter(
        (_, i) => i !== index
      );

    setFiles(updated);

    onImagesChange?.(updated);
  };

  return (
    <div className="image-uploader">

      <div
        className={`drop-zone ${
          isDragging
            ? "drop-zone-active"
            : ""
        }`}
        onClick={() =>
          inputRef.current?.click()
        }
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() =>
          setIsDragging(false)
        }
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);

          handleFiles(
            event.dataTransfer.files
          );
        }}
      >

        <div className="upload-icon">
          <Upload size={26} />
        </div>

        <strong>
          Drop your image here
        </strong>

        <p>
          or click to browse
        </p>

        <span>
          JPG, PNG, WEBP
        </span>

      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        hidden
        onChange={(event) =>
          handleFiles(
            event.target.files
          )
        }
      />

      {files.length > 0 && (
        <div className="uploaded-images">

          {files.map(
            (file, index) => (
              <div
                className="uploaded-image"
                key={`${file.name}-${index}`}
              >

                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                />

                <button
                  type="button"
                  onClick={() =>
                    removeFile(index)
                  }
                >
                  <X size={16} />
                </button>

              </div>
            )
          )}

        </div>
      )}

      {files.length === 0 && (
        <div className="upload-hint">
          <ImageIcon size={15} />
          No images selected
        </div>
      )}

    </div>
  );
}