import React, { useState, useRef } from 'react';
import { X, Camera, Upload, CheckCircle, Lock, Users } from 'lucide-react';
import { riskOptions } from '../../utils/constants';

export const ProjectModal = ({
    isOpen,
    onClose,
    form,
    setForm,
    onSave,
    loading,
    teamMembers = [],
    currentUser
}) => {
    const isAdmin = currentUser?.role === 'admin';
    const [hseLeadTempPhoto, setHseLeadTempPhoto] = useState(null);
    const [hseLeadCropPosition, setHseLeadCropPosition] = useState({ x: 0, y: 0, scale: 1 });
    const [showHseLeadPhotoCrop, setShowHseLeadPhotoCrop] = useState(false);

    const hseLeadFileInputRef = useRef(null);
    const hseLeadCameraInputRef = useRef(null);

    if (!isOpen) return null;

    const toggleRisk = (risk) => {
        const current = form.highRisk || [];
        setForm({ ...form, highRisk: current.includes(risk) ? current.filter(r => r !== risk) : [...current, risk] });
    };

    const toggleLead = (userId) => {
        const current = form.assignedLeadIds || [];
        setForm({ ...form, assignedLeadIds: current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId] });
    };

    const handleHseLeadPhotoSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setHseLeadTempPhoto(reader.result);
            setHseLeadCropPosition({ x: 0, y: 0, scale: 1 });
            setShowHseLeadPhotoCrop(true);
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const saveHseLeadCroppedPhoto = () => {
        if (!hseLeadTempPhoto) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            const outputSize = 300;
            canvas.width = outputSize;
            canvas.height = outputSize;

            const imgWidth = img.width;
            const imgHeight = img.height;
            const imgAspect = imgWidth / imgHeight;
            let srcWidth, srcHeight, srcX, srcY;

            if (imgAspect > 1) {
                srcHeight = imgHeight;
                srcWidth = imgHeight;
                srcX = (imgWidth - srcWidth) / 2;
                srcY = 0;
            } else {
                srcWidth = imgWidth;
                srcHeight = imgWidth;
                srcX = 0;
                srcY = (imgHeight - srcHeight) / 2;
            }

            const scale = hseLeadCropPosition.scale;
            const zoomedSize = Math.min(srcWidth, srcHeight) / scale;
            const offsetX = (hseLeadCropPosition.x / 100) * zoomedSize;
            const offsetY = (hseLeadCropPosition.y / 100) * zoomedSize;

            const finalSrcX = srcX + (srcWidth - zoomedSize) / 2 + offsetX;
            const finalSrcY = srcY + (srcHeight - zoomedSize) / 2 + offsetY;

            const clampedSrcX = Math.max(0, Math.min(finalSrcX, imgWidth - zoomedSize));
            const clampedSrcY = Math.max(0, Math.min(finalSrcY, imgHeight - zoomedSize));

            ctx.drawImage(img, clampedSrcX, clampedSrcY, zoomedSize, zoomedSize, 0, 0, outputSize, outputSize);

            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            setForm({ ...form, hseLeadPhoto: croppedBase64 });
            setHseLeadTempPhoto(null);
            setShowHseLeadPhotoCrop(false);
            setHseLeadCropPosition({ x: 0, y: 0, scale: 1 });
        };

        img.src = hseLeadTempPhoto;
    };

    const cancelHseLeadCrop = () => {
        setHseLeadTempPhoto(null);
        setShowHseLeadPhotoCrop(false);
        setHseLeadCropPosition({ x: 0, y: 0, scale: 1 });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border shadow-2xl">
                <div className="flex justify-between items-center p-5 border-b border-border sticky top-0 bg-surface z-10 shadow-sm">
                    <h2 className="text-xl font-bold text-text-main">{form.id ? 'Edit' : 'Add'} Project</h2>
                    <button onClick={onClose} className="p-2 hover:bg-background rounded-lg text-text-body transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Project Name *</label>
                            <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" placeholder="Enter project name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Location *</label>
                            <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" placeholder="Enter location" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-body mb-1">Company Name *</label>
                                <input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" placeholder="Enter company name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-body mb-1">HSE Lead Name *</label>
                                <input value={form.hseLeadName || ''} onChange={e => setForm({ ...form, hseLeadName: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" placeholder="Enter HSE lead name" />
                            </div>
                        </div>
                    </div>


                    {/* HSE Lead Photo Section */}
                    <div>
                        <div className="p-4 bg-background rounded-xl border border-border">
                            <label className="block text-sm font-medium text-text-main mb-3">HSE Lead Photo *</label>
                            {!showHseLeadPhotoCrop ? (
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={form.hseLeadPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.hseLeadName || 'HSE')}&size=150&background=1e3a8a&color=fff`}
                                            alt="HSE Lead"
                                            className="w-20 h-20 rounded-full object-cover border-4 border-surface shadow-md"
                                        />
                                        {form.hseLeadPhoto && form.hseLeadPhoto.startsWith('data:') && (
                                            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 border-2 border-surface shadow-sm">
                                                <CheckCircle size={14} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => hseLeadCameraInputRef.current?.click()}
                                            className="w-full flex items-center justify-center gap-2 bg-primary text-white px-3 py-2 rounded-lg hover:opacity-90 text-sm font-medium transition-all shadow-sm"
                                        >
                                            <Camera size={16} />
                                            {form.hseLeadPhoto && form.hseLeadPhoto.startsWith('data:') ? 'Retake Photo' : 'Take Photo'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => hseLeadFileInputRef.current?.click()}
                                            className="w-full flex items-center justify-center gap-2 bg-surface text-text-main border border-border px-3 py-2 rounded-lg hover:bg-border text-sm font-medium transition-all shadow-sm"
                                        >
                                            <Upload size={16} />
                                            {form.hseLeadPhoto && form.hseLeadPhoto.startsWith('data:') ? 'Change Photo' : 'Upload File'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary bg-black shadow-xl">
                                            <img
                                                src={hseLeadTempPhoto}
                                                alt="Crop Preview"
                                                className="absolute w-full h-full"
                                                style={{
                                                    objectFit: 'cover',
                                                    objectPosition: `${50 + hseLeadCropPosition.x}% ${50 + hseLeadCropPosition.y}%`,
                                                    transform: `scale(${hseLeadCropPosition.scale})`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-medium text-text-body mb-2">
                                                <span>Adjust Position & Zoom</span>
                                                <span>{hseLeadCropPosition.scale.toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="2.5"
                                                step="0.1"
                                                value={hseLeadCropPosition.scale}
                                                onChange={(e) => setHseLeadCropPosition({ ...hseLeadCropPosition, scale: parseFloat(e.target.value) })}
                                                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setHseLeadCropPosition({ x: 0, y: 0, scale: 1 })}
                                                className="flex-1 text-xs text-text-body py-1 hover:text-text-main font-medium border border-border rounded transition-colors"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 p-2 bg-surface border border-border rounded-lg">
                                        <button
                                            type="button"
                                            onClick={saveHseLeadCroppedPhoto}
                                            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-3 py-2 rounded-lg hover:opacity-90 font-bold transition-all"
                                        >
                                            <CheckCircle size={16} />
                                            Keep Photo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelHseLeadCrop}
                                            className="flex-1 text-text-body px-3 py-2 hover:text-text-main border border-border rounded-lg transition-colors font-medium"
                                        >
                                            Try Another
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Hidden Inputs */}
                        <input
                            type="file"
                            ref={hseLeadCameraInputRef}
                            onChange={handleHseLeadPhotoSelect}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                        />
                        <input
                            type="file"
                            ref={hseLeadFileInputRef}
                            onChange={handleHseLeadPhotoSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Manpower</label>
                            <input type="number" value={form.manpower || ''} onChange={e => setForm({ ...form, manpower: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Man-hours</label>
                            <input type="number" value={form.manHours || ''} onChange={e => setForm({ ...form, manHours: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Inductions</label>
                            <input type="number" value={form.newInductions || ''} onChange={e => setForm({ ...form, newInductions: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-2">High-Risk Activities</label>
                        <div className="flex flex-wrap gap-2">
                            {riskOptions.map(r => (
                                <button
                                    key={r.key}
                                    type="button"
                                    onClick={() => toggleRisk(r.key)}
                                    className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 text-sm transition-all ${(form.highRisk || []).includes(r.key)
                                        ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                                        : 'border-border bg-background text-text-body hover:border-text-body/30'}`}
                                >
                                    <r.icon size={16} />{r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-2 flex items-center gap-2">
                                <Users size={16} />
                                Assign Access Control
                            </label>
                            <div className="bg-background rounded-xl border border-border p-3 space-y-2">
                                {teamMembers.filter(u => u.role !== 'admin').length === 0 ? (
                                    <p className="text-[10px] text-text-body/50 text-center py-2 uppercase font-black tracking-widest">No team members to assign</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {teamMembers.filter(u => u.role !== 'admin').map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleLead(user.id)}
                                                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${(form.assignedLeadIds || []).includes(user.id)
                                                    ? 'bg-primary/5 border-primary text-primary'
                                                    : 'bg-surface border-border/50 text-text-body hover:border-border'
                                                    }`}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-[10px] font-bold border shrink-0">
                                                    {user.username[0].toUpperCase()}
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-[10px] font-bold leading-none">{user.full_name || user.username}</p>
                                                    <p className="text-[8px] opacity-50 uppercase font-black">{user.role}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-text-body/60 mt-2 font-medium">Selected Leads will be able to see and manage this specific project.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1 flex items-center gap-2">
                            <Lock size={16} />
                            Delete Protection PIN
                            {form.id && form.deletePin && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">PIN Set</span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={form.deletePin || ''}
                                onChange={e => setForm({ ...form, deletePin: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20 tracking-widest"
                                placeholder={form.id ? "••••" : "Set 4-digit PIN"}
                            />
                        </div>
                        <p className="text-xs text-text-body mt-1">
                            {form.id
                                ? "Leave empty to keep current PIN, or enter new PIN to change it"
                                : "Required - you'll need this to delete the project later"}
                        </p>
                    </div>

                    <button
                        onClick={onSave}
                        disabled={
                            !form.name ||
                            !form.location ||
                            !form.company ||
                            !form.hseLeadName ||
                            (!form.id && !form.deletePin) ||
                            (!form.id && (!form.hseLeadPhoto || !form.hseLeadPhoto.startsWith('data:'))) ||
                            loading
                        }
                        className="w-full bg-primary text-white px-4 py-4 rounded-xl hover:opacity-90 disabled:opacity-50 font-bold transition-all shadow-lg shadow-primary/30"
                    >
                        {loading ? 'Saving Changes...' : (form.id ? 'Update Project' : 'Launch New Project')}
                    </button>

                    {!form.id && (
                        <div className="flex flex-col gap-1 text-[10px] text-center uppercase tracking-wider font-bold">
                            {(!form.hseLeadPhoto || !form.hseLeadPhoto.startsWith('data:')) && <span className="text-error">Missing HSE Lead Photo</span>}
                            {!form.deletePin && <span className="text-error">Missing Security PIN</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
