'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, FolderKanban, Users, LogOut } from 'lucide-react';
import { canAccessMode, useAuth } from '@/app/auth';

type ModeType = 'FHWA' | 'FRA' | 'FTA' | 'MARAD';

const projectRoundGroups = [
  { category: 'BUILD Rounds', items: ['B6-2026', 'B5-2-2025', 'B3-2020', 'B2-2019', 'B1-2018'] },
  { category: 'RAISE Rounds', items: ['R5-1-2025', 'R4-2024', 'R3-2023', 'R2-2022', 'R1-2021'] },
  { category: 'TIGER Rounds', items: ['T9-2017', 'T8-2016', 'T7-2015', 'T6-2014', 'T5-2013', 'T4-2012', 'T3-2011', 'T2-2010', 'T1-2009'] },
];

export default function LandingPage() {
  const { currentUser, logout } = useAuth();
  const [selectedMode, setSelectedMode] = useState<ModeType>('FHWA');

  const modes: { code: ModeType; name: string; desc: string }[] = [
    { code: 'FHWA', name: 'FHWA Projects', desc: 'Federal Highway Administration grant projects' },
    { code: 'FRA', name: 'FRA Projects', desc: 'Federal Railroad Administration grant projects' },
    { code: 'FTA', name: 'FTA Projects', desc: 'Federal Transit Administration grant projects' },
    { code: 'MARAD', name: 'MARAD Projects', desc: 'Maritime Administration grant projects' },
  ];

  const accessibleModes = modes.filter((mode) => canAccessMode(currentUser, mode.code));
  const activeMode = accessibleModes.some((mode) => mode.code === selectedMode)
    ? selectedMode
    : accessibleModes[0]?.code ?? 'FHWA';
  const isSuperAdmin = currentUser?.role === 'super-admin';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-[#005a9c] text-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tracking & Monitoring System</h1>
            <p className="text-sm text-blue-100 mt-0.5">USDOT Discretionary Grant Program Management</p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-right text-xs">
              <span className="block font-semibold">{currentUser?.username}</span>
              <span className="text-blue-100">{currentUser?.role.replace('-', ' ')}</span>
            </span>
            {isSuperAdmin && (
              <Link
                href="/admin/users"
                className="bg-white text-[#005a9c] hover:bg-blue-50 px-4 py-2 rounded text-xs font-bold flex items-center space-x-1.5 shadow transition"
              >
                <Shield className="w-4 h-4 text-[#005a9c]" />
                <span>Manage Users</span>
              </Link>
            )}
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded border border-white/40 px-3 py-2 text-xs font-semibold hover:bg-white/10">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {isSuperAdmin && (
          <div className="bg-gradient-to-r from-blue-900 to-[#005a9c] text-white p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-sm">Super Admin: all transportation modes and access controls</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${activeMode}/B6-2026`}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition border border-white/20"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Open projects</span>
              </Link>
              <Link
                href="/admin/users"
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition border border-white/20"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage user access</span>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {accessibleModes.map((m) => {
            const isSelected = activeMode === m.code;
            return (
              <div
                key={m.code}
                onClick={() => setSelectedMode(m.code)}
                className={`cursor-pointer bg-white rounded-lg p-6 border-2 transition-all shadow-sm hover:shadow-md ${
                  isSelected ? 'border-[#005a9c] ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <h2 className="text-xl font-bold text-gray-900">{m.name}</h2>
                <p className="text-sm text-gray-600 mt-2 mb-4 leading-relaxed">{m.desc}</p>
                <span className={`text-sm font-semibold flex items-center ${isSelected ? 'text-[#005a9c]' : 'text-blue-600'}`}>
                  View Rounds & Years &rarr;
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Mode - Rounds & Years Grid */}
        <div className="bg-white shadow border border-gray-200 rounded-lg p-6">
          <div className="bg-[#0f62fe] text-white text-center py-3 rounded font-bold text-lg mb-6 shadow-sm">
            {activeMode} Projects - Rounds & Years
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projectRoundGroups.map((group) => (
              <div key={group.category} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                <div className="bg-[#d0e1fd] text-[#003a8c] font-bold text-center py-2.5 rounded mb-4">
                  {group.category}
                </div>
                <div className="flex flex-col space-y-2.5">
                  {group.items.map((roundYear) => (
                    <Link
                      key={roundYear}
                      href={`/${activeMode}/${roundYear}`}
                      className="bg-white border border-gray-300 hover:border-blue-500 rounded py-2.5 text-center font-medium text-gray-800 hover:bg-blue-50 transition-colors"
                    >
                      {roundYear}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}