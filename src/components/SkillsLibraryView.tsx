import React, { useState } from 'react';
import {
  Network,
  Search,
  Plus,
  FolderTree,
  ChevronDown,
  ChevronLeft,
  Target,
  Sparkles,
  BookOpen,
  Info,
  Check,
  X,
} from 'lucide-react';
import { Domain, Skill, Subdomain } from '../types/index.ts';

interface SkillsLibraryViewProps {
  domains: Domain[];
  onAddSkill: (domainId: string, subdomainId: string, skill: Skill) => void;
  onAddDomain: (domain: Domain) => void;
  onSelectSkillForGoal?: (domainId: string, skill: Skill) => void;
}

export const SkillsLibraryView: React.FC<SkillsLibraryViewProps> = ({
  domains,
  onAddSkill,
  onAddDomain,
  onSelectSkillForGoal,
}) => {
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubdomains, setExpandedSubdomains] = useState<Record<string, boolean>>({
    'sub-1-1': true,
    'sub-1-2': true,
    'sub-2-1': true,
    'sub-3-1': true,
  });

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [targetDomainId, setTargetDomainId] = useState(domains[0]?.id || '');
  const [targetSubdomainId, setTargetSubdomainId] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillMeasurement, setNewSkillMeasurement] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const toggleSubdomain = (subId: string) => {
    setExpandedSubdomains((prev) => ({ ...prev, [subId]: !prev[subId] }));
  };

  const handleOpenSkillModal = (domainId?: string, subId?: string) => {
    const dId = domainId || domains[0]?.id || '';
    setTargetDomainId(dId);
    const domain = domains.find((d) => d.id === dId);
    setTargetSubdomainId(subId || (domain?.subdomains[0]?.id || ''));
    setNewSkillName('');
    setNewSkillMeasurement('');
    setModalError(null);
    setIsSkillModalOpen(true);
  };

  const handleCreateSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !targetDomainId || !targetSubdomainId) {
      setModalError('يرجى تحديد المجال والفرع واسم المهارة.');
      return;
    }

    const newSkill: Skill = {
      id: `sk-${Date.now()}`,
      name: newSkillName.trim(),
      defaultMeasurement: newSkillMeasurement.trim() || 'نسبة الدقة 80% في 3 جلسات',
    };

    onAddSkill(targetDomainId, targetSubdomainId, newSkill);
    setModalError(null);
    setIsSkillModalOpen(false);
  };

  // Filter domains based on selected pill & search query
  const filteredDomains = domains
    .filter((d) => selectedDomainId === 'all' || d.id === selectedDomainId)
    .map((domain) => {
      if (!searchQuery.trim()) return domain;

      const q = searchQuery.toLowerCase();
      const domainMatches = domain.name.toLowerCase().includes(q);

      const filteredSubdomains = domain.subdomains
        .map((sub) => {
          const subMatches = sub.name.toLowerCase().includes(q);
          const filteredSkills = sub.skills.filter(
            (sk) => sk.name.toLowerCase().includes(q) || (sk.defaultMeasurement && sk.defaultMeasurement.toLowerCase().includes(q))
          );

          if (domainMatches || subMatches || filteredSkills.length > 0) {
            return {
              ...sub,
              skills: filteredSkills.length > 0 ? filteredSkills : sub.skills,
            };
          }
          return null;
        })
        .filter((sub): sub is Subdomain => sub !== null);

      return {
        ...domain,
        subdomains: filteredSubdomains,
      };
    })
    .filter((d) => d.subdomains.length > 0);

  return (
    <div className="space-y-5">
      {/* رأس الصفحة */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-teal-700" />
              مكتبة المهارات والمجالات التأهيلية الهرمية
            </h2>
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-bold">
              11 مجالاً معتمداً
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تصنيف هرمي يبدأ بالمجال الرئيسي ➔ المجال الفرعي ➔ المهارة الإجرائية ➔ طريقة القياس المعيارية.
          </p>
        </div>

        <button
          onClick={() => handleOpenSkillModal()}
          className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مهارة جديدة للمكتبة</span>
        </button>
      </div>

      {/* شريط البحث وتصفية المجالات */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مهارة، مجال، أو طريقة قياس (مثال: نطق، انتباه، PECS، ملاقط، استراحة)..."
            className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50"
          />
        </div>

        {/* أزرار المجالات الأفقية */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-thin">
          <button
            onClick={() => setSelectedDomainId('all')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
              selectedDomainId === 'all'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع المجالات ({domains.length})
          </button>
          {domains.map((dom) => {
            const isSelected = selectedDomainId === dom.id;
            return (
              <button
                key={dom.id}
                onClick={() => setSelectedDomainId(dom.id)}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dom.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* استعراض المجالات والشجرة الهرمية */}
      <div className="space-y-4">
        {filteredDomains.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
            <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">لا توجد مهارات مطابقة للبحث</p>
          </div>
        ) : (
          filteredDomains.map((domain) => (
            <div key={domain.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    {domain.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{domain.description}</p>
                </div>
                <button
                  onClick={() => handleOpenSkillModal(domain.id)}
                  className="text-xs font-bold text-teal-700 hover:bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition cursor-pointer shrink-0"
                >
                  + إضافة مهارة
                </button>
              </div>

              {/* الفروع الفرعية للمجال */}
              <div className="space-y-3">
                {domain.subdomains.map((sub) => {
                  const isExpanded = expandedSubdomains[sub.id] ?? true;
                  return (
                    <div key={sub.id} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                      <div
                        onClick={() => toggleSubdomain(sub.id)}
                        className="p-3 bg-slate-100/70 flex items-center justify-between cursor-pointer hover:bg-slate-200/50 transition"
                      >
                        <div className="flex items-center gap-2 font-black text-xs text-slate-800">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronLeft className="w-4 h-4 text-slate-500" />
                          )}
                          <span>{sub.name}</span>
                          <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-0.2 rounded-full font-bold">
                            {sub.skills.length} مهارة
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-3 space-y-2">
                          {sub.skills.map((skill) => (
                            <div
                              key={skill.id}
                              className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-teal-400 transition"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-slate-900 block">{skill.name}</span>
                                {skill.defaultMeasurement && (
                                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Info className="w-3 h-3 text-teal-600 shrink-0" />
                                    طريقة القياس المقترحة: {skill.defaultMeasurement}
                                  </span>
                                )}
                              </div>

                              {onSelectSkillForGoal && (
                                <button
                                  onClick={() => onSelectSkillForGoal(domain.id, skill)}
                                  className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 self-end sm:self-auto"
                                >
                                  <Target className="w-3.5 h-3.5" />
                                  <span>صياغة هدف SMART</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* نافذة إضافة مهارة جديدة */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">إضافة مهارة جديدة لشجرة المهارات</h3>
              <button
                onClick={() => setIsSkillModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSkillSubmit} className="space-y-3 text-xs">
              {modalError && (
                <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-2.5 font-bold">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-700 mb-1">المجال الرئيسي *</label>
                <select
                  value={targetDomainId}
                  onChange={(e) => {
                    setTargetDomainId(e.target.value);
                    const d = domains.find((dom) => dom.id === e.target.value);
                    setTargetSubdomainId(d?.subdomains[0]?.id || '');
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  {domains.map((dom) => (
                    <option key={dom.id} value={dom.id}>
                      {dom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المجال الفرعي *</label>
                <select
                  value={targetSubdomainId}
                  onChange={(e) => setTargetSubdomainId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  {domains
                    .find((d) => d.id === targetDomainId)
                    ?.subdomains.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المهارة الإجرائية *</label>
                <input
                  type="text"
                  required
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="مثال: نطق صوت السين في وسط الكلمة"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">طريقة ومعيار القياس المقترح</label>
                <input
                  type="text"
                  value={newSkillMeasurement}
                  onChange={(e) => setNewSkillMeasurement(e.target.value)}
                  placeholder="مثال: نسبة الدقة 80% في 5 محاولات متتالية"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-teal-700 font-black hover:bg-teal-800 cursor-pointer"
                >
                  إضافة المهارة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
