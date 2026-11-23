import React from 'react'
import { useLanguage } from '../../context/LanguageContext'

interface LanguageSwitcherProps {
  compact?: boolean
  fullWidth?: boolean
  className?: string
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  fullWidth = false,
  className = '',
}) => {
  const { language, setLanguage } = useLanguage()

  if (fullWidth) {
    return (
      <div className={`flex w-full bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('id')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            language === 'id'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🇮🇩</span>
          <span>Indonesia</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('ms')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            language === 'ms'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🇲🇾</span>
          <span>Malaysia</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200/90 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
          language === 'id'
            ? 'bg-emerald-800 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Bahasa Indonesia"
      >
        <span>🇮🇩</span>
        {!compact && <span>ID</span>}
      </button>

      <button
        type="button"
        onClick={() => setLanguage('ms')}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
          language === 'ms'
            ? 'bg-emerald-800 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Bahasa Melayu (Malaysia)"
      >
        <span>🇲🇾</span>
        {!compact && <span>MY</span>}
      </button>
    </div>
  )
}
