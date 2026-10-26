import React, { useState } from 'react';
import { 
  X, 
  Save, 
  User, 
  Heart, 
  MapPin, 
  Crosshair, 
  CheckCircle2, 
  Phone, 
  GraduationCap 
} from 'lucide-react';
import { UserProfile, EmergencyContact } from '../../types';
import { userService, SOUTH_AFRICAN_UNIVERSITIES } from '../../services/userService';

interface ProfileEditModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: UserProfile) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [studentNumber, setStudentNumber] = useState(user.studentNumber || '');
  const [university, setUniversity] = useState(user.university);
  const [residenceOrZone, setResidenceOrZone] = useState(user.residenceOrZone);

  // Lifelines
  const motherContact = user.contacts.find(c => c.relationship.includes('Mother') || c.relationship.includes('Guardian')) || user.contacts[0] || {
    id: 'c1', name: 'Mother / Guardian', phone: '', relationship: 'Mother / Guardian', notifySms: true, notifyWhatsapp: true
  };
  const roommateContact = user.contacts.find(c => c.relationship.includes('Roommate') || c.relationship.includes('Friend')) || user.contacts[1] || {
    id: 'c2', name: 'Roommate / Close Friend', phone: '', relationship: 'Roommate / Close Friend', notifySms: true, notifyWhatsapp: true
  };
  const securityContact = user.contacts.find(c => c.isCampusSecurity || c.relationship.includes('Security')) || user.contacts[2] || {
    id: 'c3', name: 'Campus Protection Control Room', phone: '011 559 2555', relationship: 'Campus Security', notifySms: true, notifyWhatsapp: false, isCampusSecurity: true
  };

  const [motherName, setMotherName] = useState(motherContact.name);
  const [motherPhone, setMotherPhone] = useState(motherContact.phone);

  const [roommateName, setRoommateName] = useState(roommateContact.name);
  const [roommatePhone, setRoommatePhone] = useState(roommateContact.phone);

  const [securityName, setSecurityName] = useState(securityContact.name);
  const [securityPhone, setSecurityPhone] = useState(securityContact.phone);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [coords, setCoords] = useState(user.location || {
    lat: -26.1834,
    lng: 28.0007,
    zoneLabel: user.residenceOrZone,
    isLiveGps: false
  });

  const handleDetectLiveLocation = () => {
    if (!('geolocation' in navigator)) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingGps(false);
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          zoneLabel: residenceOrZone,
          isLiveGps: true
        };
        setCoords(newCoords);
      },
      () => {
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedContacts: EmergencyContact[] = [
      {
        ...motherContact,
        name: motherName,
        phone: motherPhone,
      },
      {
        ...roommateContact,
        name: roommateName,
        phone: roommatePhone,
      },
      {
        ...securityContact,
        name: securityName,
        phone: securityPhone,
      }
    ];

    const updated = userService.updateUserProfile({
      fullName,
      phone,
      studentNumber,
      university,
      residenceOrZone,
      contacts: updatedContacts,
      location: coords
    });

    if (updated) {
      onUpdate(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white">Your SafeBand Profile & Lifelines</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile and emergency lifelines updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Personal Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-rose-400" />
              <span>Personal & Student Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Your Mobile Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Student Number</label>
                <input
                  type="text"
                  value={studentNumber}
                  onChange={e => setStudentNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">University / Campus</label>
                <input
                  type="text"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Lifelines */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Assigned Emergency Lifelines</span>
            </h3>

            {/* Mother / Guardian */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-medium text-slate-300 text-[11px] uppercase tracking-wide">
                1. Mother or Guardian
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={motherName}
                  onChange={e => setMotherName(e.target.value)}
                  placeholder="Name"
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                />
                <input
                  type="tel"
                  value={motherPhone}
                  onChange={e => setMotherPhone(e.target.value)}
                  placeholder="Phone"
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Roommate / Close Friend */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-medium text-slate-300 text-[11px] uppercase tracking-wide">
                2. Roommate or Close Friend
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={roommateName}
                  onChange={e => setRoommateName(e.target.value)}
                  placeholder="Name"
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                />
                <input
                  type="tel"
                  value={roommatePhone}
                  onChange={e => setRoommatePhone(e.target.value)}
                  placeholder="Phone"
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Campus Protection */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="font-medium text-slate-300 text-[11px] uppercase tracking-wide">
                3. Campus Protection Control Room
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={securityName}
                  onChange={e => setSecurityName(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                />
                <input
                  type="tel"
                  value={securityPhone}
                  onChange={e => setSecurityPhone(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Default Campus Location</span>
              </h3>
              <button
                type="button"
                onClick={handleDetectLiveLocation}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] flex items-center gap-1 transition"
              >
                <Crosshair className={`w-3 h-3 text-emerald-400 ${detectingGps ? 'animate-spin' : ''}`} />
                <span>{detectingGps ? 'Locating...' : 'Use Live GPS'}</span>
              </button>
            </div>
            <input
              type="text"
              value={residenceOrZone}
              onChange={e => setResidenceOrZone(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
            />
            <div className="text-[10px] text-slate-500 font-mono">
              Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)} ({coords.isLiveGps ? 'Live Device GPS' : 'Campus Reference'})
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-rose-950"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
