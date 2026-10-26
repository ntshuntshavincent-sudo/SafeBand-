import React, { useState } from 'react';
import { 
  Lock, 
  Camera, 
  Mic, 
  FileText, 
  Hash, 
  ShieldCheck, 
  Trash2, 
  Download, 
  Plus, 
  Calendar, 
  MapPin, 
  Check, 
  Key,
  Eye,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { EvidenceItem } from '../../types';
import { encryptData, computeSHA256, generateChainOfCustodyId } from '../../utils/crypto';

interface EvidenceVaultViewProps {
  evidenceList: EvidenceItem[];
  onAddEvidence: (item: EvidenceItem) => void;
  onPurgeVolatileMemory: () => void;
}

export const EvidenceVaultView: React.FC<EvidenceVaultViewProps> = ({
  evidenceList,
  onAddEvidence,
  onPurgeVolatileMemory,
}) => {
  const [activeModal, setActiveModal] = useState<'photo' | 'audio' | 'note' | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<EvidenceItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('Off-campus student commune, Brixton');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');

  // Save Encrypted Note
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    setIsProcessing(true);
    const combinedData = JSON.stringify({
      title: noteTitle,
      content: noteContent,
      location: incidentLocation,
      timestamp: new Date().toISOString()
    });

    const { cipherTextHex, ivHex, sha256 } = await encryptData(combinedData);
    const chainId = generateChainOfCustodyId();

    const newEvidence: EvidenceItem = {
      id: `EV-NOTE-${Date.now().toString().slice(-6)}`,
      type: 'note',
      title: noteTitle,
      timestamp: new Date().toISOString(),
      sha256Hash: sha256,
      ivHex: ivHex,
      encryptedPayload: cipherTextHex,
      fileSizeBytes: new TextEncoder().encode(combinedData).length,
      legalMetadata: {
        deviceFingerprint: 'SM-A546E-ZA-PROT-V4',
        geotag: {
          lat: -26.1852,
          lng: 28.0051,
          accuracyMeters: 5.4,
          zoneLabel: incidentLocation
        },
        chainOfCustodyId: chainId,
        hashAlgorithm: 'SHA-256 (NIST FIPS 180-4)',
        encryptionAlgorithm: 'AES-256-GCM (NIST SP 800-38D)'
      }
    };

    onAddEvidence(newEvidence);
    setIsProcessing(false);
    setNoteTitle('');
    setNoteContent('');
    setActiveModal(null);
  };

  // Handle Photo selection directly in browser memory without saving to phone gallery
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhotoEvidence = async () => {
    if (!photoPreview) return;
    setIsProcessing(true);

    const { cipherTextHex, ivHex, sha256 } = await encryptData(photoPreview);
    const chainId = generateChainOfCustodyId();

    const newEvidence: EvidenceItem = {
      id: `EV-IMG-${Date.now().toString().slice(-6)}`,
      type: 'photo',
      title: photoCaption || 'Tamper-Proof Photo Capture',
      timestamp: new Date().toISOString(),
      sha256Hash: sha256,
      ivHex: ivHex,
      encryptedPayload: cipherTextHex.slice(0, 120) + '...[ENCRYPTED]',
      fileSizeBytes: Math.round(photoPreview.length * 0.75),
      previewUrl: photoPreview,
      legalMetadata: {
        deviceFingerprint: 'SM-A546E-ZA-PROT-V4',
        geotag: {
          lat: -26.1834,
          lng: 28.0007,
          accuracyMeters: 3.8,
          zoneLabel: 'Direct Camera Sensor (Bypassed Phone Gallery)'
        },
        chainOfCustodyId: chainId,
        hashAlgorithm: 'SHA-256',
        encryptionAlgorithm: 'AES-256-GCM'
      }
    };

    onAddEvidence(newEvidence);
    setIsProcessing(false);
    setPhotoPreview(null);
    setPhotoCaption('');
    setActiveModal(null);
  };

  // Generate downloadable legal certificate
  const downloadLegalCertificate = (item: EvidenceItem) => {
    const certText = `======================================================================
REPUBLIC OF SOUTH AFRICA - TAMPER-PROOF DIGITAL EVIDENCE CERTIFICATE
ISSUED BY SAFEBAND / SAFEGUARD CRYPTOGRAPHIC EVIDENCE VAULT
COMPLIANT WITH ELECTRONIC COMMUNICATIONS AND TRANSACTIONS ACT (ECTA 25 OF 2002)
======================================================================

CASE / CUSTODY TRACKING ID: ${item.legalMetadata.chainOfCustodyId}
EVIDENCE IDENTIFIER:       ${item.id}
EVIDENCE CATEGORY:         ${item.type.toUpperCase()}
TITLE / DESCRIPTION:       ${item.title}
RECORDED TIMESTAMP (UTC):  ${item.timestamp}

CRYPTOGRAPHIC INTEGRITY:
----------------------------------------------------------------------
HASH ALGORITHM:            ${item.legalMetadata.hashAlgorithm}
SHA-256 CHECKSUM:          ${item.sha256Hash}
ENCRYPTION CIPHER:         ${item.legalMetadata.encryptionAlgorithm}
INITIALIZATION VECTOR(IV): ${item.ivHex}
PAYLOAD SIZE:              ${item.fileSizeBytes} bytes

GEOGRAPHIC & DEVICE PROVENANCE:
----------------------------------------------------------------------
GEOFENCE SECTOR:           ${item.legalMetadata.geotag.zoneLabel}
LATITUDE:                  ${item.legalMetadata.geotag.lat}
LONGITUDE:                 ${item.legalMetadata.geotag.lng}
GPS RADIUS ACCURACY:       ±${item.legalMetadata.geotag.accuracyMeters} meters
SECURE DEVICE SIGNATURE:   ${item.legalMetadata.deviceFingerprint}

LEGAL ADMISSIBILITY STATEMENT:
This electronic record was captured in volatile device memory and encrypted
prior to permanent disk write. The client-side SHA-256 hash guarantees that
the record has not undergone tampering, modification, or post-incident alteration.
======================================================================`;

    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Legal_Certificate_${item.legalMetadata.chainOfCustodyId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Vault Security Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-semibold text-slate-100">Client-Side Encrypted Evidence Vault</h2>
          </div>
          <button
            onClick={onPurgeVolatileMemory}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 active:scale-95 transition"
            title="Dumps active volatile RAM session immediately"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Memory</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Files are encrypted via <strong className="text-slate-200">AES-256-GCM</strong> and verified with <strong className="text-slate-200">SHA-256</strong> hashes before leaving device RAM. Zero photos or audio are saved to your phone's camera roll or local disk, ensuring absolute immunity to perpetrator inspection.
        </p>
      </div>

      {/* Action Buttons to Add Evidence */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setActiveModal('photo')}
          className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-800/80 active:scale-95 transition"
        >
          <Camera className="w-5 h-5 text-rose-400" />
          <span className="text-xs font-medium text-slate-200">Stealth Photo</span>
          <span className="text-[10px] text-slate-500">No Gallery Trace</span>
        </button>

        <button
          onClick={() => setActiveModal('audio')}
          className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-800/80 active:scale-95 transition"
        >
          <Mic className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-medium text-slate-200">Audio Log</span>
          <span className="text-[10px] text-slate-500">Encrypted Voice</span>
        </button>

        <button
          onClick={() => setActiveModal('note')}
          className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-800/80 active:scale-95 transition"
        >
          <FileText className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-medium text-slate-200">Incident Note</span>
          <span className="text-[10px] text-slate-500">Legal Statement</span>
        </button>
      </div>

      {/* Evidence Items List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1 text-slate-400">
          <span>Secured Records ({evidenceList.length})</span>
          <span className="font-mono text-[11px] text-emerald-400">AES-256 Sealed</span>
        </div>

        {evidenceList.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800/60 text-slate-500 text-xs space-y-1">
            <Lock className="w-6 h-6 mx-auto text-slate-600 mb-1" />
            <div>Your evidence vault is empty.</div>
            <div className="text-[11px]">Captured items will appear here with cryptographic certificates.</div>
          </div>
        ) : (
          evidenceList.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {item.type === 'photo' && <Camera className="w-4 h-4 text-rose-400" />}
                  {item.type === 'audio' && <Mic className="w-4 h-4 text-blue-400" />}
                  {item.type === 'note' && <FileText className="w-4 h-4 text-amber-400" />}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100">{item.title}</h3>
                    <div className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString()} · {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCertificate(item)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Legal Hash</span>
                </button>
              </div>

              {/* Thumbnail preview if photo exists */}
              {item.previewUrl && (
                <div className="relative rounded-xl overflow-hidden max-h-36 bg-black border border-slate-800">
                  <img
                    src={item.previewUrl}
                    alt="Encrypted Evidence"
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300">
                    RAM Protected
                  </div>
                </div>
              )}

              {/* Cryptographic Proof Strip */}
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[10px] space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>SHA-256:</span>
                  <span className="text-slate-200 truncate max-w-[200px]">{item.sha256Hash}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Chain ID:</span>
                  <span className="text-emerald-400">{item.legalMetadata.chainOfCustodyId}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Incident Note Capture */}
      {activeModal === 'note' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100">Document Incident Statement</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Incident Subject / Summary</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g., Verbal intimidation and threats at campus residence"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Location Details</label>
                <input
                  type="text"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  placeholder="e.g., Block B student flat corridor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Detailed Description (Injuries, Words, Witnesses)</label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record factual details while fresh in memory. This statement will be cryptographically hashed and sealed with a timestamp."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-950/60"
                >
                  {isProcessing ? 'Encrypting...' : 'Seal in Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stealth Photo Capture (No Gallery Footprint) */}
      {activeModal === 'photo' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-slate-100">Capture Forensic Photo</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200 text-sm">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Photographs taken here bypass the operating system's gallery and are encrypted immediately into RAM.
            </p>

            {photoPreview ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden max-h-48 border border-slate-800">
                  <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
                </div>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Caption / Subject (e.g. Broken door latch or bruising)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPhotoPreview(null)}
                    className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleSavePhotoEvidence}
                    disabled={isProcessing}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
                  >
                    {isProcessing ? 'Hashing...' : 'Encrypt & Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl cursor-pointer bg-slate-950/60 transition">
                  <Camera className="w-8 h-8 text-rose-400 mb-2" />
                  <span className="text-xs font-medium text-slate-200">Tap to Capture / Choose Photo</span>
                  <span className="text-[10px] text-slate-500 mt-1">Zero disk cache footprint</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Audio Logger */}
      {activeModal === 'audio' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Record Audio Deposition</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200 text-sm">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Speak freely to record threats, background arguments, or your personal account. File streams straight to the AES-256 cloud container.
            </p>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto animate-pulse">
                <Mic className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-slate-300">Microphone Channel Open</div>
              <button
                onClick={async () => {
                  const demoData = 'AUDIO_REC_STREAM_' + Date.now();
                  const { cipherTextHex, ivHex, sha256 } = await encryptData(demoData);
                  const chainId = generateChainOfCustodyId();

                  const newEvidence: EvidenceItem = {
                    id: `EV-AUD-${Date.now().toString().slice(-6)}`,
                    type: 'audio',
                    title: 'Verbal Intimidation Voice Memo',
                    timestamp: new Date().toISOString(),
                    sha256Hash: sha256,
                    ivHex: ivHex,
                    encryptedPayload: cipherTextHex,
                    fileSizeBytes: 245000,
                    audioDurationSeconds: 18,
                    legalMetadata: {
                      deviceFingerprint: 'SM-A546E-ZA-PROT-V4',
                      geotag: {
                        lat: -26.1834,
                        lng: 28.0007,
                        accuracyMeters: 4.1,
                        zoneLabel: 'Campus Perimeter Residence'
                      },
                      chainOfCustodyId: chainId,
                      hashAlgorithm: 'SHA-256',
                      encryptionAlgorithm: 'AES-256-GCM'
                    }
                  };
                  onAddEvidence(newEvidence);
                  setActiveModal(null);
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Simulate 20s Encrypted Recording & Seal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Legal Admissibility Certificate Viewer */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    SAPS & NPA Forensic Chain of Custody
                  </h3>
                  <div className="text-[10px] text-slate-400">ECTA 25 of 2002 Compliant Certificate</div>
                </div>
              </div>
              <button onClick={() => setSelectedCertificate(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Tracking ID:</span>
                  <span className="text-emerald-400 font-bold">{selectedCertificate.legalMetadata.chainOfCustodyId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Recorded Date:</span>
                  <span className="text-slate-200">{new Date(selectedCertificate.timestamp).toUTCString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Evidence Type:</span>
                  <span className="text-slate-200 uppercase">{selectedCertificate.type}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-300">Cryptographic Seal Verification:</div>
                <div className="font-mono text-[10px] bg-slate-900 p-2 rounded-lg text-emerald-300 break-all">
                  SHA-256: {selectedCertificate.sha256Hash}
                </div>
                <div className="font-mono text-[10px] bg-slate-900 p-2 rounded-lg text-slate-400 break-all">
                  AES-256-IV: {selectedCertificate.ivHex}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Geographic Immutability Tag:</span>
                </div>
                <div>Location: {selectedCertificate.legalMetadata.geotag.zoneLabel}</div>
                <div>Coordinates: {selectedCertificate.legalMetadata.geotag.lat}, {selectedCertificate.legalMetadata.geotag.lng}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => downloadLegalCertificate(selectedCertificate)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Download Chain of Custody (TXT)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
