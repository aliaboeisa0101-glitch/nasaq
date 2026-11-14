import React, { useState } from 'react';
import {
  Puzzle,
  Search,
  Plus,
  Copy,
  Edit,
  Trash2,
  X,
  Layers,
  Sparkles,
  ShieldAlert,
  Home,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import { Activity, DatabaseState } from '../types/index.ts';

interface ActivitiesViewProps {
  db: DatabaseState;
  onSaveActivity: (act: Activity) => void;
  onDeleteActivity: (id: string) => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  db,
  onSaveActivity,
  onDeleteActivity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityStatus, setActivityStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [domainId, setDomainId] = useState(db.domains[0]?.id || '');
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [targetLevels, setTargetLevels] = useState('جميع المستويات النمائية بحسب التدرج');
  const [materials, setMaterials] = useState('');
  const [preparation, setPreparation] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [easierVariation, setEasierVariation] = useState('');
  const [harderVariation, setHarderVariation] = useState('');
  const [adaptations, setAdaptations] = useState('');
  const [measurementMethod, setMeasurementMethod] = useState('حساب عدد المحاولات الصحيحة من أصل 5 محاولات');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [homeGeneralization, setHomeGeneralization] = useState('');
  const [source, setSource] = useState('أدلة الممارسة المهنية للتربية الخاصة والتأهيل');

  const openAddModal = () => {
    setEditingActivity(null);
    setFormError(null);
    setTitle('');
    setDomainId(db.domains[0]?.id || '');
    setSkillName('');
    setDescription('');
    setPurpose('');
    setTargetLevels('جميع المستويات النمائية بحسب التدرج');
    setMaterials('');
    setPreparation('');
    setStepsText('1. تقديم نموذج واضح من الأخصائي.\n2. مساعدة موجهة وتوجيه يدوي.\n3. محاولة مستقلة مع تعزيز إيجابي فوري.');
    setEasierVariation('');
    setHarderVariation('');
    setAdaptations('');
    setMeasurementMethod('حساب عدد المحاولات الصحيحة من أصل 5 محاولات');
    setSafetyNotes('');
    setHomeGeneralization('');
    setSource('دليل الممارسة المهنية والتأهيل الوظيفي');
    setIsModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setFormError(null);
    setTitle(act.title);
    setDomainId(act.domainId);
    setSkillName(act.skillName || '');
    setDescription(act.description);
    setPurpose(act.purpose);
    setTargetLevels(act.targetLevels);
    setMaterials(act.materials);
    setPreparation(act.preparation || '');
    setStepsText(act.steps.join('\n'));
    setEasierVariation(act.easierVariation || '');
    setHarderVariation(act.harderVariation || '');
    setAdaptations(act.adaptations);
    setMeasurementMethod(act.measurementMethod);
    setSafetyNotes(act.safetyNotes || '');
    setHomeGeneralization(act.homeGeneralization || '');
    setSource(act.source || '');
    setIsModalOpen(true);
  };

  const handleDuplicate = (act: Activity) => {
    const cloned: Activity = {
      ...act,
      id: `act-${Date.now()}`,
      title: `${act.title} (نسخة معدلة)`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onSaveActivity(cloned);
    setActivityStatus('تم استنساخ النشاط بنجاح ويمكنك تعديله الآن.');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !domainId) {
      setFormError('يرجى ملء اسم النشاط والمجال.');
      return;
    }

    const stepsArray = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const saved: Activity = {
      id: editingActivity ? editingActivity.id : `act-${Date.now()}`,
      title: title.trim(),
      domainId,
      skillName: skillName.trim() || undefined,
      description: description.trim() || title.trim(),
      purpose: purpose.trim() || 'تنمية المهارة المستهدفة',
      targetLevels: targetLevels.trim(),
      materials: materials.trim() || 'خامات البيئة البسيطة',
      preparation: preparation.trim() || undefined,
      steps: stepsArray.length > 0 ? stepsArray : ['تنفيذ خطوات النشاط بالتدرج مع تقديم التعزيز'],
      easierVariation: easierVariation.trim() || undefined,
      harderVariation: harderVariation.trim() || undefined,
      adaptations: adaptations.trim() || 'تعديل البيئة وفق الخصائص الفردية',
      measurementMethod: measurementMethod.trim() || 'الملاحظة المباشرة',
      safetyNotes: safetyNotes.trim() || undefined,
      homeGeneralization: homeGeneralization.trim() || undefined,
      source: source.trim() || undefined,
      createdAt: editingActivity ? editingActivity.createdAt : new Date().toISOString().slice(0, 10),
    };

    onSaveActivity(saved);
    setFormError(null);
    setIsModalOpen(false);
    setActivityStatus(editingActivity ? 'تم تحديث بيانات النشاط بنجاح.' : 'تمت إضافة النشاط الجديد إلى البنك.');
  };

  const filteredActivities = db.activities.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.materials.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.skillName && act.skillName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDomain = selectedDomainFilter === 'all' || act.domainId === selectedDomainFilter;

    return matchesSearch && matchesDomain;
  });

  return (
    <div className="space-y-5">
      {activityStatus && (
        <div
          role="status"
          className="px-4 py-3 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2"
        >
          <span>{activityStatus}</span>
          <button
            type="button"
            onClick={() => setActivityStatus(null)}
            className="text-xs underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}
      {/* رأس الصفحة */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-amber-600" />
              بنك الأنشطة التأهيلية الحقيقية المتدرجة
            </h2>
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
              {filteredActivities.length} نشاط
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            أنشطة تخصصية مدعومة بالخامات، خطوات التنفيذ، البدائل، وتيسيرات الوصول الحسي والحركي.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة نشاط جديد للبنك</span>
        </button>
      </div>

      {/* البحث والفلترة */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم النشاط، المهارة، الأدوات، أو الخامات المتوفرة..."
            className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600 bg-slate-50"
          />
        </div>

        <select
          value={selectedDomainFilter}
          onChange={(e) => setSelectedDomainFilter(e.target.value)}
          className="text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
        >
          <option value="all">جميع المجالات</option>
          {db.domains.map((dom) => (
            <option key={dom.id} value={dom.id}>
              {dom.name}
            </option>
          ))}
        </select>
      </div>

      {/* شبكة بطاقات الأنشطة التفصيلية */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
          <Puzzle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <h3 className="font-bold text-sm text-slate-700">لا توجد أنشطة مطابقة للبحث</h3>
          <p className="text-xs text-slate-400 mt-1">اضغط على زر "إضافة نشاط جديد للبنك" لابتكار نشاط تأهيلي جديد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredActivities.map((act) => {
            const domain = db.domains.find((d) => d.id === act.domainId);
            return (
              <div
                key={act.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-base">{act.title}</span>
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                          {domain ? domain.name : 'عام'}
                        </span>
                      </div>
                      {act.skillName && (
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          المهارة المستهدفة: <strong className="text-teal-700">{act.skillName}</strong>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDuplicate(act)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                        title="استنساخ النشاط"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(act)}
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg cursor-pointer"
                        title="تعديل النشاط"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteActivity(act.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="حذف النشاط"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{act.description}</p>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div className="text-slate-700">
                      <strong className="text-slate-800">الأدوات والمواد المطلوبة:</strong> {act.materials}
                    </div>

                    <div>
                      <strong className="text-slate-800 block mb-1">خطوات التنفيذ بالتسلسل:</strong>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {act.steps.map((st, idx) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ol>
                    </div>

                    {(act.easierVariation || act.harderVariation) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                        {act.easierVariation && (
                          <div>
                            <strong className="text-emerald-700">تدرج للأسهل (عند الصعوبة):</strong> {act.easierVariation}
                          </div>
                        )}
                        {act.harderVariation && (
                          <div>
                            <strong className="text-blue-700">تدرج للأصعب (لرفع التحدي):</strong> {act.harderVariation}
                          </div>
                        )}
                      </div>
                    )}

                    {act.adaptations && (
                      <div className="text-[11px] text-slate-600">
                        <strong className="text-slate-700">تيسيرات الوصول الحسي/الحركي:</strong> {act.adaptations}
                      </div>
                    )}

                    {act.homeGeneralization && (
                      <div className="flex items-start gap-1.5 text-[11px] text-teal-800 bg-teal-50/60 p-2 rounded-lg border border-teal-100">
                        <Home className="w-3.5 h-3.5 shrink-0 mt-0.5 text-teal-600" />
                        <div>
                          <strong>فكرة التعميم بالمنزل:</strong> {act.homeGeneralization}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>طريقة القياس: {act.measurementMethod}</span>
                  {act.source && <span className="truncate max-w-[200px]">المصدر: {act.source}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة إضافة أو تعديل نشاط */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {editingActivity ? 'تعديل النشاط التأهيلي' : 'إضافة نشاط تأهيلي جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
              {formError && (
                <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-2.5 font-bold">
                  {formError}
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم النشاط *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مطابقة الأشكال بالصلصال الحسي"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المجال الرئيسي *</label>
                  <select
                    value={domainId}
                    onChange={(e) => setDomainId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {db.domains.map((dom) => (
                      <option key={dom.id} value={dom.id}>
                        {dom.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المهارة المستهدفة</label>
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="مثال: التآزر البصري الحركي"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف موجز وفكرة النشاط</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر للنشاط وكيفية تنفيذه..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المواد والأدوات المطلوبة *</label>
                  <input
                    type="text"
                    required
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="مثال: كرات ملونة، أوعية، ملاقط، صلصال"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة القياس المقترحة</label>
                  <input
                    type="text"
                    value={measurementMethod}
                    onChange={(e) => setMeasurementMethod(e.target.value)}
                    placeholder="مثال: عدد المحاولات الصحيحة من أصل 5"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  خطوات التنفيذ المتسلسلة (ضع كل خطوة في سطر منفصل) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={stepsText}
                  onChange={(e) => setStepsText(e.target.value)}
                  placeholder="1. تقديم النموذج أمام المتعلم&#10;2. المساعدة الموجهة&#10;3. المحاولة المستقلة والتعزيز"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تعديل للأسهل (عند الصعوبة)</label>
                  <input
                    type="text"
                    value={easierVariation}
                    onChange={(e) => setEasierVariation(e.target.value)}
                    placeholder="مثال: تقليل عدد الخيارات لخيارين فقط"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تعديل للأصعب (لرفع التحدي)</label>
                  <input
                    type="text"
                    value={harderVariation}
                    onChange={(e) => setHarderVariation(e.target.value)}
                    placeholder="مثال: زيادة المسافة أو تقليل حجم المثيرات"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  تيسيرات الوصول الحسي/الحركي والتواصل
                </label>
                <input
                  type="text"
                  value={adaptations}
                  onChange={(e) => setAdaptations(e.target.value)}
                  placeholder="مثال: تثبيت الأوعية بشريط لاصق، تباين لوني عالي"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">فكرة التعميم بالمنزل</label>
                <input
                  type="text"
                  value={homeGeneralization}
                  onChange={(e) => setHomeGeneralization(e.target.value)}
                  placeholder="مثال: مشاركة المهارة أثناء ترتيب أدوات المطبخ مع الأم"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-amber-600 font-black hover:bg-amber-700 cursor-pointer"
                >
                  حفظ النشاط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
