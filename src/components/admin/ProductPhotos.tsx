import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { storeRepo } from '../../lib/storage';

interface ProductPhotosProps {
  images: string[];
  onChange: (update: (prev: string[]) => string[]) => void;
  onBusyChange: (busy: boolean) => void;
}

// Product photos: choose or drop files from the computer; they are uploaded to the server straight away.
// The first photo is the main one shown in the shop.
export const ProductPhotos: React.FC<ProductPhotosProps> = ({ images, onChange, onBusyChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const addFiles = async (files: File[]) => {
    const photos = files.filter((f) => f.type.startsWith('image/'));
    if (!photos.length) return setError('Choose JPG, PNG or WebP photos.');
    setError('');
    setPending(photos.length);
    onBusyChange(true);
    for (const file of photos) {
      try {
        const url = await storeRepo.uploadImage(file, 1600);
        onChange((prev) => [...prev, url]);
      } catch (err) {
        setError(`${file.name}: ${(err as Error).message}`);
      }
      setPending((n) => n - 1);
    }
    onBusyChange(false);
  };

  const remove = (i: number) => onChange((prev) => prev.filter((_, j) => j !== i));
  const makeMain = (i: number) => onChange((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);

  return (
    <div>
      <label className="block text-xs text-fg-2 mb-1 font-medium">Photos *</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles([...e.dataTransfer.files]);
        }}
        className={`grid grid-cols-3 sm:grid-cols-5 gap-3 p-3 border border-dashed transition-colors ${dragOver ? 'border-fg bg-surface-3' : 'border-line-strong bg-surface-2'}`}
      >
        {images.map((src, i) => (
          <div key={src + i} className="relative group aspect-[3/4] bg-surface-3 overflow-hidden">
            <img src={src} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-inverse text-on-inverse text-[10px] uppercase tracking-[0.12em]">Main</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {i > 0 && (
                <button type="button" onClick={() => makeMain(i)} title="Make main photo" className="p-1.5 bg-white/90 text-black hover:bg-white cursor-pointer">
                  <Star className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              )}
              <button type="button" onClick={() => remove(i)} title="Remove" className="p-1.5 bg-white/90 text-red-700 hover:bg-white cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: pending }, (_, i) => (
          <div key={`p${i}`} className="aspect-[3/4] bg-surface-3 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-fg-3 animate-spin" strokeWidth={1.5} />
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending > 0}
          className="aspect-[3/4] border border-line-strong hover:border-fg text-fg-3 hover:text-fg flex flex-col items-center justify-center gap-2 text-[11px] uppercase tracking-[0.12em] cursor-pointer disabled:opacity-40 transition-colors"
        >
          <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
          Upload
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          addFiles(files);
        }}
      />
      {error ? (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      ) : (
        <p className="text-xs text-fg-4 mt-1.5">Choose or drop photos from your computer. The first photo is the main one.</p>
      )}
    </div>
  );
};
