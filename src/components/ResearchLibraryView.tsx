import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  Award,
  Sparkles,
  Layers,
  CheckCircle,
  Filter,
  Bookmark,
  Share2,
} from 'lucide-react';
import { ResearchResource } from '../types/index.ts';
import { DEFAULT_RESEARCH_RESOURCES } from '../data/default-research.ts';

interface ResearchLibraryViewProps {
  onUseResourceForGoal?: (resource: ResearchResource) => void;
  onUseResourceForActivity?: (resource: ResearchResource) => void;
}

export const ResearchLibraryView: React.FC<ResearchLibraryViewProps> = ({
  onUseResourceForGoal,
  onUseResourceForActivity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEvidenceLevel, setSelectedEvidenceLevel] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'جميع المراجع العلمية' },
    { id: 'speech_language', label: 'النطق والتخاطب (ASHA)' },
    { id: 'aac_assistive', label: 'التواصل المعزز والبديل (AAC)' },
    { id: 'autism_sel', label: 'التوحد والدعائم البصرية (AFIRM)' },
    { id: 'positive_behavior', label: 'الدعم السلوكي الإيجابي (PBIS)' },
    { id: 'sensory_regulation', label: 'التكامل الحسي والتنظيم الحركي' },
    { id: 'academics_dyslexia', label: 'صعوبات التعلم والدسلكسيا (WWC)' },
    { id: 'executive_function', label: 'الوظائف التنفيذية وضبط الذات' },
    { id: 'cognition', label: 'النمو المعرفي والـ ICF' },
  ];

  const filteredResources = DEFAULT_RESEARCH_RESOURCES.filter((res) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.clinicalApplication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.authorsOrOrg.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || res.category === selectedCategory;

    const matchesEvidence =
      selectedEvidenceLevel === 'all' || res.evidenceLevel === selectedEvidenceLevel;

    return matchesSearch && matchesCategory && matchesEvidence;
  });

  return (
    <div className="space-y-6">
      {/* رأس الصفحة والمقدمة المنهجية */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                المكتبة السريرية للممارسات المبنية على الأدلة (EBP)
              </span>
              <span className="text-[11px] bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full font-bold">
                موثقة بروابط مراكز الأبحاث العالمية
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">أدلة ومراجع التأهيل المعتمدة عالمياً</h2>
            <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              تصفح التوصيات الإكلينيكية الصادرة عن What Works Clearinghouse (WWC)، والجمعية الأمريكية للنطق واللغة والسمع (ASHA)، ومنظمة الصحة العالمية (ICF-CY)، ومراكز السيطرة على الأمراض (CDC)، مع ترجمة مباشرة لتطبيقاتها الميدانية في الجلسات.
            </p>
          </div>
        </div>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في عناوين المراجع، جهات الإصدار، أو التطبيقات السريرية..."
              className="w-full text-xs md:text-sm bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-4 py-2.5 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedEvidenceLevel}
              onChange={(e) => setSelectedEvidenceLevel(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-auto"
            >
              <option value="all">جميع مستويات الدليل العلمي</option>
              <option value="ممارسة مبنية على الأدلة (EBP)">ممارسة مبنية على الأدلة (EBP)</option>
              <option value="دليل ممارسة إرشادي (Practice Guide)">دليل ممارسة إرشادي (Practice Guide)</option>
              <option value="مراجعة منهجية وتوليف علمي">مراجعة منهجية وتوليف علمي</option>
            </select>
          </div>
        </div>

        {/* أزرار التصنيفات النمائية */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* قائمة البطاقات المرجعية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {res.evidenceLevel}
                </span>
                <span className="text-xs text-slate-500 font-bold">{res.year}</span>
              </div>

              <h3 className="font-black text-sm md:text-base text-slate-900 group-hover:text-teal-800 transition-colors mb-1.5 leading-snug">
                {res.title}
              </h3>

              <div className="text-xs text-teal-700 font-bold mb-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>{res.authorsOrOrg}</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 block mb-0.5 font-bold">خلاصة الدليل العلمي:</strong>
                  {res.summary}
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-emerald-950 leading-relaxed">
                  <strong className="text-emerald-900 block mb-0.5 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    التطبيق السريري الميداني في الجلسات:
                  </strong>
                  {res.clinicalApplication}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <a
                href={res.verifiedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group/link"
              >
                <span>الاطلاع على الوثيقة الأصلية (رسمي)</span>
                <ExternalLink className="w-3 h-3 group-hover/link:translate-x-[-2px] transition-transform" />
              </a>

              <div className="flex items-center gap-1.5">
                {onUseResourceForGoal && (
                  <button
                    type="button"
                    onClick={() => onUseResourceForGoal(res)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    استلهام هدف
                  </button>
                )}
                {onUseResourceForActivity && (
                  <button
                    type="button"
                    onClick={() => onUseResourceForActivity(res)}
                    className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    توليد نشاط
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
