import React, { useState } from 'react';
import { X, Upload, MapPin, Calendar, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function ReportModal({ isOpen, onClose, initialType = 'LOST', onReportCreated }) {
  if (!isOpen) return null;

  const [reportType, setReportType] = useState(initialType);
  const [category, setCategory] = useState('bags');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [eventDatetime, setEventDatetime] = useState(new Date().toISOString().slice(0, 16));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    { id: 'electronics', label: 'Electronics & Gadgets' },
    { id: 'bags', label: 'Bags, Backpacks & Luggage' },
    { id: 'documents', label: 'Wallets, IDs & Documents' },
    { id: 'jewelry', label: 'Jewelry & Watches' },
    { id: 'keys', label: 'Keys & Access Cards' },
    { id: 'clothing', label: 'Clothing & Footwear' },
    { id: 'other', label: 'Other Items' },
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUsePresetCoords = () => {
    setLatitude('37.621312');
    setLongitude('-122.378955');
    setLocationName('Terminal 2 Gate 3');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('report_type', reportType);
      formData.append('category', category);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('location_name', locationName);
      formData.append('event_datetime', new Date(eventDatetime).toISOString());
      formData.append('reported_by', '1'); // Default demo user

      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);
      if (imageFile) formData.append('image', imageFile);

      const created = await api.createReport(formData);
      onReportCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create report. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Report {reportType === 'LOST' ? 'Lost Item' : 'Found Item'}
            </h3>
            <p className="text-xs text-slate-400">
              Our AI engine will compute embeddings and immediately scan for candidate matches
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setReportType('LOST')}
                className={`py-2 rounded-lg font-semibold text-xs transition ${
                  reportType === 'LOST' 
                    ? 'bg-rose-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lost Item (I lost something)
              </button>
              <button
                type="button"
                onClick={() => setReportType('FOUND')}
                className={`py-2 rounded-lg font-semibold text-xs transition ${
                  reportType === 'FOUND' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Found Item (I found something)
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-sky-500 transition text-xs"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Item Title / Summary
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Black Samsonite laptop bag"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 transition text-xs"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Detailed Description (Used by Sentence-BERT Embeddings)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Include distinctive details: brand, color, scratches, stickers, contents, sleeve type..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 transition text-xs resize-none"
            />
          </div>

          {/* Location & Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Location Name / Area
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Gate 3, Terminal 2"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 transition text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Event Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={eventDatetime}
                onChange={(e) => setEventDatetime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-sky-500 transition text-xs"
              />
            </div>
          </div>

          {/* Optional Coordinates Quick Autofill */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>Precise GPS Geotag:</span>
              <span className="font-mono text-slate-400">
                {latitude ? `${latitude}, ${longitude}` : 'None'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleUsePresetCoords}
              className="text-[11px] font-medium text-sky-400 hover:text-sky-300 underline"
            >
              Autofill SFO Gate 3 GPS
            </button>
          </div>

          {/* Image Upload & Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Item Photo (For CLIP Visual Embedding)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-800/30">
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-300 font-medium">Click to upload photo</span>
                <span className="text-[10px] text-slate-500">PNG, JPG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-black">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white transition flex items-center gap-1.5 shadow-lg shadow-sky-600/20"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Embeddings...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Publish Report & Scan Matches</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
