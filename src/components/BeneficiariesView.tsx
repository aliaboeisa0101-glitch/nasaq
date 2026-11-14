import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Archive,
  CheckCircle,
  Edit3,
  Trash2,
  X,
  Target,
  MessageSquare,
  Sparkles,
  Shield,
  Activity as ActivityIcon,
} from 'lucide-react';
import { Beneficiary, DatabaseState } from '../types/index.ts';

interface BeneficiariesViewProps {
  db: DatabaseState;
  activeBeneficiary: Beneficiary | null;
  onSelectBeneficiary: (b: Beneficiary) => void;
  onSaveBeneficiary: (b: Beneficiary) => void;
  onDeleteBeneficiary: (id: string) => void;
  onArchiveBeneficiary: (id: string) => void;
}

export const BeneficiariesView: React.FC<BeneficiariesViewProps> = ({
  db,
  activeBeneficiary,
  onSelectBeneficiary,
  onSaveBeneficiary,
  onDeleteBeneficiary,
  onArchiveBeneficiary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Beneficiary>>({
    code: '',
    nameAlias: '',
    age: '',
    developmentalLevel: '',
    communicationMode: 'كلام منطوق (لفظي)',
    strengths: '',
    priorityNeeds: '',
    sensoryNotes: '',
    accommodations: '',
    status: 'active',
  });

  const openAddModal = () => {
    setEditingBeneficiary(null);
    setModalError(null);
    setFormData({
      code: '',
      nameAlias: '',
      age: '',
      developmentalLevel: 'ما قبل الأكاديمي',
      communicationMode: 'تواصل معزز وبديل (صور / PECS)',
      strengths: '',
      priorityNeeds: '',
      sensoryNotes: '',
      accommodations: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (b: Beneficiary) => {
    setEditingBeneficiary(b);
    setModalError(null);
    setFormData({ ...b });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.age) {
      setModalError('يرجى ملء الحقول الإلزامية (المعرف الرمزي والعمر).');
      return;
    }

    const newRecord: Beneficiary = {
      id: editingBeneficiary ? editingBeneficiary.id : `ben-${Date.now()}`,
      code: formData.code.trim(),
      nameAlias: formData.nameAlias?.trim() || undefined,
      age: formData.age.trim(),
      developmentalLevel: formData.developmentalLevel?.trim() || 'مستوى نمائي وظيفي',
      communicationMode: formData.communicationMode || 'كلام منطوق (لفظي)',
      strengths: formData.strengths?.trim() || 'اهتمامات عامة',
      priorityNeeds: formData.priorityNeeds?.trim() || 'أهداف الخطة الفردية',
      sensoryNotes: formData.sensoryNotes?.trim() || undefined,
      accommodations: formData.accommodations?.trim() || undefined,
      status: formData.status || 'active',
      createdAt: editingBeneficiary ? editingBeneficiary.createdAt : new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    onSaveBeneficiary(newRecord);
    setIsModalOpen(false);
  };

  const filteredBeneficiaries = db.beneficiaries.filter((b) => {
    const matchesSearch =
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.nameAlias && b.nameAlias.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.communicationMode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.strengths.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* رأس الصفحة وأزرار التحكم */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-700" />
              سجلات وملفات المستفيدين الوظيفية
            </h2>
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-bold">
              {filteredBeneficiaries.length} ملف
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ملفات رقمية مؤمنة تعتمد المعرفات الرمزية لحماية الخصوصية، وتوثق وسيلة التواصل، ونقاط القوة والاحتياجات ذات الأولوية.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة ملف مستفيد جديد</span>
        </button>
      </div>

      {/* شريط البحث وفلاتر الحالة */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالرمز التعريفي، الاسم المستعار، أو وسيلة التواصل..."
            className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer ${
              statusFilter === 'active' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الحالات النشطة ({db.beneficiaries.filter((b) => b.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer ${
              statusFilter === 'archived' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المؤرشفة ({db.beneficiaries.filter((b) => b.status === 'archived').length})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل
          </button>
        </div>
      </div>

      {/* قائمة البطاقات للمستفيدين */}
      {filteredBeneficiaries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <h3 className="font-bold text-sm text-slate-700">لا توجد ملفات مطابقة للبحث</h3>
          <p className="text-xs text-slate-400 mt-1">اضغط على زر "إضافة ملف مستفيد جديد" للبدء في إدراج حالة جديدة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBeneficiaries.map((b) => {
            const isSelected = activeBeneficiary?.id === b.id;
            const studentGoals = db.goals.filter((g) => g.beneficiaryId === b.id);
            const studentSessions = db.sessions.filter((s) => s.beneficiaryId === b.id);
            const studentTrials = db.trials.filter((t) => t.beneficiaryId === b.id);

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between ${
                  isSelected ? 'border-teal-600 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-base">{b.code}</span>
                        {b.nameAlias && (
                          <span className="text-xs text-slate-500 font-bold">({b.nameAlias})</span>
                        )}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            b.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {b.status === 'active' ? 'نشط' : 'مؤرشف'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        العمر: <strong className="text-slate-700">{b.age}</strong> • المستوى: {b.developmentalLevel}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectBeneficiary(b)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-black transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'المحدد حالياً' : 'تحديد للعمل'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div className="flex items-start gap-2 text-slate-700">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">وسيلة التواصل:</strong> {b.communicationMode}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-700">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">نقاط القوة والمعززات:</strong> {b.strengths}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-700">
                      <Target className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">الأولويات التأهيلية:</strong> {b.priorityNeeds}
                      </div>
                    </div>

                    {b.sensoryNotes && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                        <strong className="text-slate-700">ملاحظات حسية وبيئية:</strong> {b.sensoryNotes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span><strong>{studentGoals.length}</strong> أهداف</span>
                    <span>•</span>
                    <span><strong>{studentSessions.length}</strong> جلسات</span>
                    <span>•</span>
                    <span><strong>{studentTrials.length}</strong> محاولة</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="تعديل الملف"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onArchiveBeneficiary(b.id)}
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                      title={b.status === 'active' ? 'أرشفة الملف' : 'استعادة الملف'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBeneficiary(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة منبثقة لإضافة أو تعديل مستفيد */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {editingBeneficiary ? 'تعديل ملف المستفيد' : 'إضافة ملف مستفيد جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              {modalError && (
                <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-2.5 font-bold">
                  {modalError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    المعرف الرمزي (لحماية الخصوصية) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="مثال: طالب (أ.خ) أو CASE-102"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم مستعار اختياري
                  </label>
                  <input
                    type="text"
                    value={formData.nameAlias || ''}
                    onChange={(e) => setFormData({ ...formData, nameAlias: e.target.value })}
                    placeholder="مثال: حالة سامي"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العمر أو المرحلة النمائية *</label>
                  <input
                    type="text"
                    required
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="مثال: 7 سنوات، أو مرحلة مبكرة"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المستوى التعليمي / النمائي</label>
                  <input
                    type="text"
                    value={formData.developmentalLevel || ''}
                    onChange={(e) => setFormData({ ...formData, developmentalLevel: e.target.value })}
                    placeholder="مثال: دمج جزئي، روضة تدخل مبكر"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وسيلة التواصل المفضلة واللغات *</label>
                <select
                  value={formData.communicationMode || 'كلام منطوق (لفظي)'}
                  onChange={(e) => setFormData({ ...formData, communicationMode: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-teal-600"
                >
                  <option value="كلام منطوق (لفظي)">كلام منطوق (لفظي)</option>
                  <option value="تواصل معزز وبديل (صور / PECS)">تواصل معزز وبديل (صور / PECS)</option>
                  <option value="إيماءات وإشارات وتعبيرات جسدية">إيماءات وإشارات وتعبيرات جسدية</option>
                  <option value="تطبيق ناطق على جهاز لوحي (High-Tech AAC)">تطبيق ناطق على جهاز لوحي (High-Tech AAC)</option>
                  <option value="لوحة اختيار وتواصل مصورة بسيطة">لوحة اختيار وتواصل مصورة بسيطة</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  نقاط القوة والاهتمامات والمعززات المحببة
                </label>
                <input
                  type="text"
                  value={formData.strengths || ''}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  placeholder="مثال: يحب السيارات، الأصوات الإيقاعية، التفاعل بالفقاعات"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الأولويات التأهيلية والاحتياجات الوظيفية
                </label>
                <textarea
                  rows={2}
                  value={formData.priorityNeeds || ''}
                  onChange={(e) => setFormData({ ...formData, priorityNeeds: e.target.value })}
                  placeholder="مثال: زيادة زمن الانتباه، طلب الاحتياجات بشكل مستقل، مسك القلم"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الملاحظات الحسية والتنظيمية والتيسيرات البيئية
                </label>
                <textarea
                  rows={2}
                  value={formData.sensoryNotes || ''}
                  onChange={(e) => setFormData({ ...formData, sensoryNotes: e.target.value })}
                  placeholder="مثال: يتشتت بالضوضاء المفاجئة، يحتاج فواصل حركية كل 10 دقائق، استخدام مؤقت بصري"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
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
                  className="px-5 py-2 rounded-xl text-white bg-teal-700 font-black hover:bg-teal-800 cursor-pointer"
                >
                  حفظ الملف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
