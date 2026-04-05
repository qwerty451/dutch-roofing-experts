"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Upload, X, Check, Crop as CropIcon, ImageIcon, Trash2 } from "lucide-react";

interface Props {
  label: string;
  value: string;
  aspect?: number; // e.g. 16/9, 1, undefined = free
  onChange: (url: string) => void;
}

function centerAspectCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
    width,
    height
  );
}

async function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType: string
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );
  return new Promise((resolve, reject) => {
    // Use PNG for lossless quality
    const outputMime = mimeType.includes("png") ? "image/png" : "image/png";
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas empty"))), outputMime, 1.0);
  });
}

export default function ImageUploader({ label, value, aspect, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [srcFile, setSrcFile] = useState<{ url: string; mime: string } | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    
    const reader = new FileReader();
    reader.onload = () => {
      setSrcFile({ url: reader.result as string, mime: file.type });
      setCrop(undefined);
      setCompletedCrop(undefined);
      setModalOpen(true);
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      if (aspect) {
        setCrop(centerAspectCrop(width, height, aspect));
      } else {
        setCrop(centerAspectCrop(width, height, 16 / 9));
      }
    },
    [aspect]
  );

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop || !srcFile) return;
    setUploading(true);
    setError("");
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop, srcFile.mime);
      const form = new FormData();
      // Always use PNG for lossless quality
      form.append("file", blob, "cropped.png");
      
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Upload failed: " + res.status);
      }
      
      if (!data.url) {
        throw new Error("No URL returned from server");
      }
      
      onChange(data.url);
      setModalOpen(false);
      setSrcFile(null);
    } catch (e) {
      setError("Error: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSkipCrop = async () => {
    if (!srcFile) return;
    setUploading(true);
    setError("");
    try {
      const res2 = await fetch(srcFile.url);
      const blob = await res2.blob();
      const form = new FormData();
      const ext = srcFile.mime.split("/")[1] || "jpeg";
      form.append("file", blob, `upload.${ext}`);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload mislukt");
      onChange(data.url);
      setModalOpen(false);
      setSrcFile(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDirectUpload = async () => {
    if (!srcFile) return;
    setUploading(true);
    setError("");
    try {
      const res2 = await fetch(srcFile.url);
      const blob = await res2.blob();
      const form = new FormData();
      const ext = srcFile.mime.split("/")[1] || "jpeg";
      form.append("file", blob, `image.${ext}`);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload mislukt");
      onChange(data.url);
      setModalOpen(false);
      setSrcFile(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setSrcFile(null);
    setError("");
  };

  return (
    <>
      {/* Thumbnail + upload button */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-300">{label}</label>

        <div className="relative">
          <div
            onClick={openPicker}
            className="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-dashed border-gray-700 hover:border-[#d4af37]/60 transition-colors bg-gray-950"
            style={{ minHeight: 140 }}
          >
            {value ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt={label} className="w-full h-36 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-semibold">
                  <CropIcon size={16} />
                  Wijzigen
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-36 gap-2 text-gray-600 group-hover:text-gray-400 transition-colors">
                <Upload size={28} />
                <span className="text-sm">Klik om te uploaden</span>
              </div>
            )}
          </div>

          {/* Remove button — only shown when an image is set */}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              title="Afbeelding verwijderen"
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-red-400 hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/JPEG,image/jpg,image/JPG,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {/* Crop modal */}
      {modalOpen && srcFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2 text-white font-semibold">
                <CropIcon size={18} className="text-[#d4af37]" />
                Afbeelding bijsnijden
              </div>
              <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Crop area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[300px]">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                className="max-w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={srcFile.url}
                  alt="crop preview"
                  onLoad={onImageLoad}
                  onError={() => console.log("Image load error")}
                  style={{ maxHeight: "55vh", maxWidth: "100%", display: "block" }}
                />
              </ReactCrop>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ImageIcon size={14} />
                Sleep om bij te snijden · Hoeken verslepen om formaat aan te passen
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDirectUpload}
                  disabled={uploading}
                  className="px-4 py-2 text-sm border border-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Direct uploaden
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={uploading || !completedCrop}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-[#d4af37] text-white font-bold rounded-lg hover:bg-[#d4af37] transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
