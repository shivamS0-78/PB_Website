"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Calendar } from "lucide-react";
import Image from "next/image";
import { Lexend_Tera } from "next/font/google";

const lexendTera = Lexend_Tera({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default function SihBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="group relative w-full rounded-2xl p-[2px] bg-gradient-to-br from-[rgba(0,255,0,0.25)] via-[rgba(0,204,68,0.25)] to-[rgba(0,255,0,0.25)] hover:from-[#00ff00] hover:via-[#00cc44] hover:to-[#00ff00] hover:shadow-[0_0_16px_rgba(0,255,0,0.15)] transition-all duration-300"
    >
      {/* ─── Content Container ─── */}
      <div className="relative w-full h-full rounded-[14px] bg-black overflow-hidden">
        {/* ─── Content ─── */}
        <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-8 sm:px-8 sm:py-10 text-center">

        {/* ══ Logos ══ */}
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16">
            <Image
              src="/images/icons/sih-icon.png"
              alt="SIH Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="self-stretch w-px bg-pbgreen/20" />
          <div className="relative h-14 w-14 sm:h-16 sm:w-16">
            <Image
              src="/images/icons/DSCElogo.svg"
              alt="DSCE Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* ══ Title ══ */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-sm sm:text-base uppercase tracking-widest text-pbgreen">
            Internal Hackathon For
          </span>
          <h3
            className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-[-0.1em] ${lexendTera.className}`}
          >
            <span className="bg-linear-to-b from-[#e07c24] to-[#b85d1a] bg-clip-text text-transparent">Smart India</span>{" "}
            <span className="bg-linear-to-b from-[#e07c24] to-[#b85d1a] bg-clip-text text-transparent">Hackathon</span>
          </h3>
          <span
            className="text-lg sm:text-xl font-bold text-pbgreen/70"
          >
            2026
          </span>
        </div>

        {/* ══ Date strips ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <div className="flex items-center gap-2.5 rounded-md border border-pbgreen/40 px-5 py-4">
            <Calendar className="h-5 w-5 shrink-0 text-pbgreen" />
            <div className="text-left">
              <span className="block text-[10px] uppercase tracking-wider text-pbtext/50">
                Event Date
              </span>
              <span className="block text-sm font-semibold text-white leading-tight">
                5th Sept 2026
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-md border border-pbgreen/40 px-5 py-4">
            <Calendar className="h-5 w-5 shrink-0 text-pbgreen" />
            <div className="text-left">
              <span className="block text-[10px] uppercase tracking-wider text-pbtext/50">
                Problem Statements On
              </span>
              <span className="block text-sm font-semibold text-white leading-tight">
                24th Aug – 11:59 PM
              </span>
            </div>
          </div>
        </div>

        {/* ══ CTA ══ */}
        <a
          href="https://sih.dsce.in"
          target="_blank"
          rel="noopener noreferrer"
          className="group/btn flex items-center justify-center gap-2 rounded-md bg-pbgreen px-6 py-3 font-semibold text-black transition-all duration-300 hover:brightness-110"
        >
          Register Now
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </a>
      </div>
      </div>
    </motion.div>
  );
}
