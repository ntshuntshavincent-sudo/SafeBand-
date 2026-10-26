import React, { useState } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Search, 
  CheckCircle, 
  Shield, 
  AlertCircle, 
  WifiOff, 
  ExternalLink,
  ChevronRight,
  Filter,
  HeartHandshake
} from 'lucide-react';
import { SupportDirectoryItem } from '../../types';
import { VERIFIED_DIRECTORY_ITEMS } from '../../utils/directoryData';

export const SupportDirectoryView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [activeItemDetails, setActiveItemDetails] = useState<SupportDirectoryItem | null>(null);

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'emergency_hotline', label: 'Hotlines & USSD' },
    { id: 'thuthuzela_pep', label: 'PEP & Forensic (72h)' },
    { id: 'shelter', label: 'Verified Shelters' },
    { id: 'campus_security', label: 'Campus Desks' },
    { id: 'legal_aid', label: 'Free Legal Aid' },
  ];

  const provinces = [
    'All Provinces',
    'National',
    'Gauteng',
    'Western Cape',
    'KwaZulu-Natal',
    'Mpumalanga'
  ];

  const filteredItems = VERIFIED_DIRECTORY_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesProvince = selectedProvince === 'all' || selectedProvince === 'All Provinces' || item.province === selectedProvince;
    const matchesQuery = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.servicesOffered.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesProvince && matchesQuery;
  });

  return (
    <div className="space-y-4">
      {/* 72-Hour PEP Medical Urgency Callout */}
      <div className="p-3.5 bg-gradient-to-r from-rose-950/70 to-slate-900 border border-rose-900/60 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-rose-200">
            Emergency Medical Note: The 72-Hour PEP Window
          </h3>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Post-Exposure Prophylaxis (PEP) prevents HIV infection after potential exposure but <strong className="text-white">must be started within 72 hours</strong>. Thuthuzela Care Centres (TCCs) provide free, confidential PEP starters, forensic kits, and trauma medicine 24/7 without requiring payment or medical aid.
          </p>
        </div>
      </div>

      {/* Hero Showcase of Community Support Clinic */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
        <img
          src="/src/assets/images/community_care_clinic_1792066587648.jpg"
          alt="South African Community Healthcare and Crisis Center"
          className="w-full h-36 object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3.5 flex flex-col justify-end">
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>100% Offline Cached Directory</span>
          </div>
          <h2 className="text-sm font-bold text-white">Verified Care Network & Shelters</h2>
        </div>
      </div>

      {/* Search and Province Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shelter, PEP clinic, campus, or service..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Province Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {provinces.map((prov) => (
            <button
              key={prov}
              onClick={() => setSelectedProvince(prov)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs transition ${
                (selectedProvince === prov || (prov === 'All Provinces' && selectedProvince === 'all'))
                  ? 'bg-slate-800 text-white font-medium border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {prov}
            </button>
          ))}
        </div>

        {/* Category Pills / Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs transition ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white font-medium shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Cards List */}
      <div className="space-y-2.5">
        <div className="text-xs text-slate-400 px-1 flex items-center justify-between">
          <span>Found {filteredItems.length} verified safe locations</span>
          <span className="text-[11px] text-emerald-400">Available without mobile data</span>
        </div>

        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold tracking-wider text-rose-400 uppercase">
                    {item.province}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] text-slate-400">{item.city}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-100">{item.name}</h3>
              </div>

              {item.tollFree && (
                <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded text-[10px] font-medium shrink-0">
                  Toll-Free
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {item.address}
            </p>

            {/* Services bullets */}
            <div className="flex flex-wrap gap-1.5">
              {item.servicesOffered.slice(0, 3).map((srv, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-950 text-slate-300 rounded-md border border-slate-800">
                  {srv}
                </span>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <a
                href={`tel:${item.phone.replace(/\s+/g, '')}`}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {item.phone}</span>
              </a>

              {item.ussdCode && (
                <a
                  href={`tel:${encodeURIComponent(item.ussdCode)}`}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-95"
                  title="Free USSD callback string"
                >
                  <span>Free USSD {item.ussdCode}</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Safety Protocol Advisory */}
      <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300">Discreet Calling Safety Tip:</div>
        <p>
          On standard Android and iOS phones, emergency calls appear in your phone dialer history. After placing a call to an emergency helpline, open your Phone app recents and delete the call entry to prevent perpetrator inspection.
        </p>
      </div>
    </div>
  );
};
