import React, { useState } from 'react';
import { ChevronRight, Volume2, ExternalLink, X } from 'lucide-react';

function LearnAndSchemesPage({ t, speakText }) {
  const [activeLesson, setActiveLesson] = useState(null);
  const lessons = [
    {
      num: '01',
      title: 'Know your real profit',
      meta: '4 min · Simple Hindi available',
      content:
        'Total money in your cash box is Sales, not Profit. Subtract the wholesale cost of goods sold, thread/packaging materials, and shop electricity first.',
    },
    {
      num: '02',
      title: 'Price with confidence',
      meta: '6 min · Simple Hindi available',
      content:
        'Never set your selling price by only looking at wholesale fabric cost. Include transport, tailoring time, and a 25%–35% healthy margin.',
    },
    {
      num: '03',
      title: 'Keep your cash moving',
      meta: '5 min · Simple Hindi available',
      content:
        'Keep pending Udhaar under 15% of monthly sales using polite WhatsApp UPI reminders so you always have cash for fast-selling stock.',
    },
  ];

  const schemes = [
    {
      name: 'Pradhan Mantri Mudra Yojana (PMMY)',
      tag: 'Collateral-Free Loan up to ₹10L–₹20L',
      desc: 'Shishu (up to ₹50,000), Kishore (₹50k–₹5L), and Tarun loans for women-led micro enterprises.',
      url: 'https://www.mudra.org.in/',
    },
    {
      name: 'Stand-Up India Scheme',
      tag: '₹10 Lakh to ₹1 Crore Greenfield Loan',
      desc: 'Dedicated bank credit for women entrepreneurs setting up new enterprises.',
      url: 'https://www.standupmitra.in/',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-[38px] font-bold tracking-tight text-[#1E2421]">
          {t('learnTitle')}
        </h1>
        <p className="text-[15px] text-[#6B726E] mt-1.5">{t('learnSub')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#6B3FA0] text-white rounded-2xl p-7 sm:p-8 flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-200">
              {t('startHereEyebrow')}
            </div>
            <h2 className="text-2xl sm:text-[26px] font-bold leading-snug mt-2">
              {t('heroLessonTitle')}
            </h2>
            <p className="text-[14px] text-purple-100/90 mt-2.5 leading-relaxed max-w-md">
              {t('heroLessonSub')}
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setActiveLesson(lessons[0])}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-[#5B328C] text-xs font-bold inline-flex items-center gap-1.5"
            >
              {t('startLessonBtn')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6 flex flex-col justify-center divide-y divide-[#F0EDE6]">
          {lessons.map((lesson) => (
            <button
              key={lesson.num}
              onClick={() => setActiveLesson(lesson)}
              className="py-4 first:pt-1 last:pb-1 flex items-center justify-between text-left hover:bg-[#FAF8F5] px-2 -mx-2 rounded-xl transition"
            >
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-[#C5C9C6] w-7">{lesson.num}</span>
                <div>
                  <div className="font-bold text-[15px] text-[#1E2421]">{lesson.title}</div>
                  <div className="text-xs text-[#7A827E] mt-0.5">{lesson.meta}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E9591]" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6 space-y-4">
        <h3 className="text-lg font-bold text-[#1E2421]">{t('schemesHeading')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schemes.map((sc) => (
            <div key={sc.name} className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EBE7E0] space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#146C43] text-[11px] font-bold">
                {sc.tag}
              </span>
              <h4 className="font-bold text-sm text-[#1E2421]">{sc.name}</h4>
              <p className="text-xs text-[#5B635E]">{sc.desc}</p>
              <a
                href={sc.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#6B3FA0] hover:underline inline-flex items-center gap-1"
              >
                {t('applyPortalLink')} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {activeLesson && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-[#EBE7E0] shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#6B3FA0]">
                {t('lessonWord')} {activeLesson.num}
              </span>
              <button onClick={() => setActiveLesson(null)}>
                <X className="w-5 h-5 text-[#6B726E]" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-[#1E2421]">{activeLesson.title}</h3>
            <p className="text-sm text-[#37413C] leading-relaxed">{activeLesson.content}</p>
            <div className="flex gap-2">
              <button
                onClick={() => speakText(`${activeLesson.title}. ${activeLesson.content}`)}
                className="flex-1 py-2.5 rounded-xl bg-[#6B3FA0] text-white font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-4 h-4" /> {t('listenAudioBtn')}
              </button>
              <button
                onClick={() => setActiveLesson(null)}
                className="px-4 py-2.5 rounded-xl bg-[#F3F0EA] text-xs font-bold"
              >
                {t('doneBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearnAndSchemesPage;
