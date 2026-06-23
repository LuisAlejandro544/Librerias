'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Star, GitFork, Code2, Layers, Github } from 'lucide-react';
import Image from 'next/image';

interface GithubRepoStats {
  stars: number;
  forks: number;
  avatarUrl: string | null;
  isLoading: boolean;
}

export default function Header() {
  const [stats, setStats] = useState<GithubRepoStats>({
    stars: 1, // Fallback realista por si falla la API
    forks: 0,
    avatarUrl: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;
    fetch('https://api.github.com/repos/LuisAlejandro544/Librerias')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Github API rate limit or error');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setStats({
            stars: data.stargazers_count ?? 1,
            forks: data.forks_count ?? 0,
            avatarUrl: data.owner?.avatar_url ?? null,
            isLoading: false,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          // Fallback elegante
          setStats((prev) => ({ ...prev, isLoading: false }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="border-b border-[#27272A] bg-[#09090B]/90 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo y Titular */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Code2 className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                Dev Library Hub
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-medium">
                  PORTFOLIO v2.5
                </span>
              </h1>
              <p className="text-xs text-[#A1A1AA] font-medium">
                Catálogo de utilidades de alto rendimiento en el ecosistema Kotlite.
              </p>
            </div>
          </div>

          {/* Estadísticas en Vivo desde GitHub */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            
            {/* Repo Stars */}
            <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <div>
                <span className="text-[9px] text-[#71717A] block font-sans uppercase">GitHub Stars</span>
                <span className="font-bold text-[#FAFAFA]">
                  {stats.isLoading ? '...' : stats.stars}
                </span>
              </div>
            </div>

            {/* Repo Forks */}
            <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2">
              <GitFork className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <span className="text-[9px] text-[#71717A] block font-sans uppercase">GitHub Forks</span>
                <span className="font-bold text-[#FAFAFA]">
                  {stats.isLoading ? '...' : stats.forks}
                </span>
              </div>
            </div>

            {/* Total Libraries */}
            <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <span className="text-[9px] text-[#71717A] block font-sans uppercase">Módulos</span>
                <span className="font-bold text-[#FAFAFA]">1 Activo + 1 Propuesta</span>
              </div>
            </div>

            {/* Github Profile Link */}
            <a
              href="https://github.com/LuisAlejandro544/Librerias"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all duration-350 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2 cursor-pointer"
            >
              {stats.avatarUrl ? (
                <div className="relative w-4 h-4 rounded-full overflow-hidden border border-white/20">
                  <Image
                    src={stats.avatarUrl}
                    alt="LuisAlejandro544"
                    fill
                    sizes="16px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <Github className="w-3.5 h-3.5" />
              )}
              <span>@LuisAlejandro544</span>
            </a>

          </div>

        </div>
      </div>
    </header>
  );
}
