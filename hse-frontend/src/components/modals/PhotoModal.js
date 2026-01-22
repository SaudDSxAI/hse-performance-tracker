import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload } from 'lucide-react';

export const PhotoModal = ({
    isOpen,
    onClose,
    currentPhoto,
    currentName,
    onSave,
    loading
}) => {
    const [tempPhoto, setTempPhoto] = useState(null);
    const [cropPosition, setCropPosition] = useState({ x: 0, y: 0, scale: 1 });
    const [processing, setProcessing] = useState(false);

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTempPhoto(null);
            setCropPosition({ x: 0, y: 0, scale: 1 });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePhotoSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setTempPhoto(reader.result);
            setCropPosition({ x: 0, y: 0, scale: 1 });
        };
        reader.readAsDataURL(file);

        // Reset input so same file can be selected again
        event.target.value = '';
    };

    const handleSave = () => {
        if (!tempPhoto) return;
        setProcessing(true);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = tempPhoto;

        img.onload = () => {
            // Output size (square)
            const outputSize = 300;
            canvas.width = outputSize;
            canvas.height = outputSize;

            // Image dimensions
            const imgWidth = img.width;
            const imgHeight = img.height;

            // Calculate the visible area based on object-fit: cover
            const imgAspect = imgWidth / imgHeight;
            let srcWidth, srcHeight, srcX, srcY;

            if (imgAspect > 1) {
                // Landscape image
                srcHeight = imgHeight;
                srcWidth = imgHeight;
                srcX = (imgWidth - srcWidth) / 2;
                srcY = 0;
            } else {
                // Portrait image
                srcWidth = imgWidth;
                srcHeight = imgWidth;
                srcX = 0;
                srcY = (imgHeight - srcHeight) / 2;
            }

            // Apply zoom (scale)
            const scale = cropPosition.scale;
            const zoomedSize = Math.min(srcWidth, srcHeight) / scale;

            // Apply position offset
            const offsetX = (cropPosition.x / 100) * zoomedSize;
            const offsetY = (cropPosition.y / 100) * zoomedSize;

            // Calculate final source rectangle
            const finalSrcX = srcX + (srcWidth - zoomedSize) / 2 + offsetX;
            const finalSrcY = srcY + (srcHeight - zoomedSize) / 2 + offsetY;

            // Clamp to image bounds
            const clampedSrcX = Math.max(0, Math.min(finalSrcX, imgWidth - zoomedSize));
            const clampedSrcY = Math.max(0, Math.min(finalSrcY, imgHeight - zoomedSize));

            // Draw cropped image
            ctx.drawImage(
                img,
                clampedSrcX, clampedSrcY, zoomedSize, zoomedSize,
                0, 0, outputSize, outputSize
            );

            // Convert to base64
            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            onSave(croppedBase64);
            setProcessing(false);
        };
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl w-full max-w-md border border-border shadow-2xl">
                <div className="flex justify-between items-center p-5 border-b border-border">
                    <h2 className="text-xl font-semibold text-text-main">{tempPhoto ? 'Adjust Photo' : 'Update Photo'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-background rounded-lg text-text-body"><X size={20} /></button>
                </div>
                <div className="p-5">
                    {!tempPhoto ? (
                        <>
                            {/* Current Photo */}
                            <div className="flex justify-center mb-4">
                                <img
                                    src={currentPhoto}
                                    alt={currentName}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-surface shadow-lg"
                                />
                            </div>
                            <p className="text-center text-text-main mb-6 font-medium text-lg">{currentName}</p>

                            {/* Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-3 bg-primary text-white px-4 py-3 rounded-lg hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                                >
                                    <Camera size={20} />
                                    Take Photo
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-3 bg-background text-text-main px-4 py-3 rounded-lg hover:bg-border transition-all border border-border"
                                >
                                    <Upload size={20} />
                                    Choose from Gallery
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Photo Preview with Crop */}
                            <div className="flex justify-center mb-6">
                                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary bg-black shadow-2xl">
                                    <img
                                        src={tempPhoto}
                                        alt="Preview"
                                        className="absolute w-full h-full"
                                        style={{
                                            objectFit: 'cover',
                                            objectPosition: `${50 + cropPosition.x}% ${50 + cropPosition.y}%`,
                                            transform: `scale(${cropPosition.scale})`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Adjustment Controls */}
                            <div className="space-y-5 mb-8">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-text-body mb-3 uppercase tracking-wider">
                                        <span>Zoom Level</span>
                                        <span className="text-primary">{cropPosition.scale.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="2.5"
                                        step="0.1"
                                        value={cropPosition.scale}
                                        onChange={(e) => setCropPosition({ ...cropPosition, scale: parseFloat(e.target.value) })}
                                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] font-bold text-text-body mb-2 uppercase tracking-tight">Horizontal Pan</div>
                                        <input
                                            type="range"
                                            min="-50"
                                            max="50"
                                            value={cropPosition.x}
                                            onChange={(e) => setCropPosition({ ...cropPosition, x: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-text-body mb-2 uppercase tracking-tight">Vertical Pan</div>
                                        <input
                                            type="range"
                                            min="-50"
                                            max="50"
                                            value={cropPosition.y}
                                            onChange={(e) => setCropPosition({ ...cropPosition, y: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTempPhoto(null)}
                                    className="flex-1 px-4 py-3 border border-border rounded-xl font-medium text-text-body hover:bg-background transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading || processing}
                                    className="flex-1 bg-primary text-white px-4 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 font-bold transition-all shadow-lg shadow-primary/20"
                                >
                                    {loading || processing ? 'Saving...' : 'Save Photo'}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Hidden Inputs */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoSelect}
                        accept="image/*"
                        className="hidden"
                    />
                    <input
                        type="file"
                        ref={cameraInputRef}
                        onChange={handlePhotoSelect}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                    />
                </div>
            </div>
        </div>
    );
};
