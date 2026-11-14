import { ResearchResource } from '../types/index.ts';

export const DEFAULT_RESEARCH_RESOURCES: ResearchResource[] = [
  {
    id: 'res-wwc-reading-foundations',
    title: 'المهارات التأسيسية لدعم الفهم القرائي في الطفولة المبكرة والصفوف الأولى',
    authorsOrOrg: 'What Works Clearinghouse (WWC) - U.S. Department of Education',
    year: '2022',
    category: 'academics_dyslexia',
    evidenceLevel: 'دليل ممارسة إرشادي (Practice Guide)',
    summary:
      'دليل ممارسة إكلينيكي رصين من معهد علوم التربية (IES) يُحدد 4 توصيات مثبتة لتدريس الوعي الفونيمي، والربط بين الرمز الصوتي والمكتوب، وقراءة الكلمات بدقة وسرعة وبناء الطلاقة.',
    clinicalApplication:
      'استخدم التجزئة الصوتية (Segmentation) والدمج (Blending) بالاستعانة بمربعات إلكونين (Elkonin boxes) كنشاط حسي حركي قبل الانتقال للمهام الورقية، مع تدريب المتعلم على التعرف على المقاطع بنسبة دقة لا تقل عن 80%.',
    verifiedUrl: 'https://ies.ed.gov/ncee/wwc/PracticeGuide/21',
  },
  {
    id: 'res-asha-aac-ebp',
    title: 'التواصل المعزز والبديل (AAC) لذوي اضطرابات التواصل النمائية والتوحد',
    authorsOrOrg: 'American Speech-Language-Hearing Association (ASHA)',
    year: '2023',
    category: 'aac_assistive',
    evidenceLevel: 'ممارسة مبنية على الأدلة (EBP)',
    summary:
      'خلاصة أبحاث ASHA المنهجية حول كفاءة أدوات التواصل المعزز والبديل، والتي تثبت قاطعاً أن استخدام أنظمة AAC منخفضة أو عالية التقنية يدعم نمو اللغة المنطوقة ولا يُثبطها مطلقاً.',
    clinicalApplication:
      'تطبيق استراتيجية النمذجة بالمدخلات المعززة (Aided Language Stimulation)؛ حيث يشير الأخصائي إلى رمز الصورة في اللوحة أو الجهاز بالتزامن مع نطقه للكلمة وظيفياً داخل سياق اللعب أو الجلسة.',
    verifiedUrl: 'https://www.asha.org/practice-portal/clinical-topics/augmentative-and-alternative-communication/',
  },
  {
    id: 'res-afirm-visual-supports',
    title: 'الدعائم البصرية وتنظيم البيئة للأشخاص ذوي طيف التوحد',
    authorsOrOrg: 'AFIRM Team, National Professional Development Center on ASD (NPDC)',
    year: '2021',
    category: 'autism_sel',
    evidenceLevel: 'ممارسة مبنية على الأدلة (EBP)',
    summary:
      'ممارسة مثبتة الدلالة إحصائياً للحد من القلق السلوكي وتسهيل الانتقال بين الأنشطة وتعزيز الاستقلالية لدى المتعلمين في البيئات التعليمية والتأهيلية.',
    clinicalApplication:
      'تصميم جدول بصري فردي (First / Then أو جدول الخطوات المتسلسلة) يتوافق مع المستوى البصري للطفل (أشياء مجسمة ➔ صور واقعية ➔ رموز مصورة ➔ نصوص مكتوبة) ومراجعتها قبل كل انتقال.',
    verifiedUrl: 'https://afirm.fpg.unc.edu/visual-supports',
  },
  {
    id: 'res-asha-speech-sound',
    title: 'التدخلات القائمة على الأدلة لاضطرابات النطق والأصوات الكلامية (SSD)',
    authorsOrOrg: 'American Speech-Language-Hearing Association (ASHA)',
    year: '2024',
    category: 'speech_language',
    evidenceLevel: 'مراجعة منهجية وتوليف علمي',
    summary:
      'مقارنة بين مداخل العلاج النمطي، ومداخل الأزواج الصغرى (Minimal Pairs)، ومخارج الحروف الحركية (Motor-based articulation)، مع تحديد معايير اختيار الأصوات المستهدفة.',
    clinicalApplication:
      'اختيار أزواج متقابلة صوتياً للتفريق بين الفونيمات المشوهة، مع تطبيق بروتوكول التدريب العالي الكثافة (أكثر من 50 محاولة نطقية مدعومة بالتغذية الراجعة الصوتية والبصرية في الجلسة الواحدة).',
    verifiedUrl: 'https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/',
  },
  {
    id: 'res-icf-cy-who',
    title: 'التصنيف الدولي للأداء والإعاقة والصحة - نسخة الأطفال والشباب (ICF-CY)',
    authorsOrOrg: 'World Health Organization (WHO) & UNICEF',
    year: '2020',
    category: 'cognition',
    evidenceLevel: 'دليل ممارسة إرشادي (Practice Guide)',
    summary:
      'إطار عالمي موحد يقيم قدرات الطفل من خلال التفاعل بين الوظائف والتركيبات الجسمية، والأنشطة اليومية، ومستوى المشاركة المجتمعية، والعوامل البيئية المحيطة.',
    clinicalApplication:
      'صياغة الأهداف التأهيلية لتركز على "المشاركة الوظيفية الحقيقية" وليس فقط العجز العضوي؛ مثلاً: تحسين مسكة القلم بهدف تمكين الطالب من التوقيع أو رسم أشكال هندسية في الصف مع أقرانه.',
    verifiedUrl: 'https://www.who.int/standards/classifications/international-classification-of-functioning-disability-and-health',
  },
  {
    id: 'res-pbis-tiered-support',
    title: 'الدعم السلوكي الإيجابي متعدد المستويات (PBIS) والتدخلات الوظيفية',
    authorsOrOrg: 'Center on PBIS & OSEP Technical Assistance Center',
    year: '2023',
    category: 'positive_behavior',
    evidenceLevel: 'ممارسة مبنية على الأدلة (EBP)',
    summary:
      'استراتيجيات استباقية للوقاية من السلوكيات التحدّية عبر تحليل الوظيفة السلوكية (FBA)، والتعليم الصريح للتوقعات السلوكية، وإعادة هيكلة المثيرات القبلية (Antecedent interventions).',
    clinicalApplication:
      'استبدال السلوك التحدي (مثل ضرب الطاولة لطلب إيقاف النشاط) بسلوك وظيفي بديل مساوٍ في الجهد وأكثر كفاءة (مثل تسليم بطاقة "استراحة" أو الإشارة لرمز التوقف)، وتعزيزه فورياً.',
    verifiedUrl: 'https://www.pbis.org/topics/tier-3-individual-supports',
  },
  {
    id: 'res-cdc-milestones',
    title: 'المعالم النمائية المحدثة وتتبع التطور للأطفال من عمر شهرين إلى 5 سنوات',
    authorsOrOrg: 'CDC (Centers for Disease Control and Prevention) & AAP',
    year: '2022',
    category: 'cognition',
    evidenceLevel: 'دليل ممارسة إرشادي (Practice Guide)',
    summary:
      'المؤشرات النمائية المحدثة القائمة على معيار (ما يحققه 75% أو أكثر من الأطفال في هذا العمر)، مما يقلل من نهج "الانتظار والترقب" ويساعد على التدخل المبكر الدقيق.',
    clinicalApplication:
      'مقارنة المهارات المعرفية واللغوية والاجتماعية والحركية للمتعلم بخط الأساس النمائي لعمره الزمني لتحديد الفجوة بدقة وتصميم خطة علاجية تبدأ من المستوى النمائي المحقق.',
    verifiedUrl: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
  },
  {
    id: 'res-aota-sensory-motor',
    title: 'التكامل الحسي والتنظيم الذاتي الحركي في بيئات التأهيل والتعليم',
    authorsOrOrg: 'American Occupational Therapy Association (AOTA)',
    year: '2023',
    category: 'sensory_regulation',
    evidenceLevel: 'مراجعة منهجية وتوليف علمي',
    summary:
      'دراسات التكامل الحسي لآيرس (ASI) واستراتيجيات التنظيم الحركي والدهليزي وعميق العضلات والمفاصل (Proprioceptive) لتهيئة الجهاز العصبي قبل المهام الإدراكية والأكاديمية.',
    clinicalApplication:
      'تضمين أنشطة الضغط العميق (Heavy Work) أو الحركات المتزنة قبل الجلسة بـ 5 دقائق للأطفال ذوي فرط الاستثارة، أو تقديم منبهات يقظة للأطفال ذوي الخمول الحسي لتحقيق نافذة التحمل المثلى.',
    verifiedUrl: 'https://www.aota.org/practice/clinical-topics/sensory-integration',
  },
  {
    id: 'res-wwc-executive-function',
    title: 'تطوير مهارات الوظائف التنفيذية وضبط الذات في مرحلة الطفولة والمراهقة',
    authorsOrOrg: 'Harvard Center on the Developing Child & WWC',
    year: '2022',
    category: 'executive_function',
    evidenceLevel: 'دليل ممارسة إرشادي (Practice Guide)',
    summary:
      'طرق ممنهجة لتدريب الذاكرة العاملة (Working Memory)، والمرونة المعرفية (Cognitive Flexibility)، والتحكم التثبيطي (Inhibitory Control) من خلال الألعاب التفاعلية والمهام الموجهة ذاتياً.',
    clinicalApplication:
      'استخدام استراتيجية التحدث الذاتي المسموع أولاً ثم الداخلي (Self-Talk)، مع توفير مفكرات بصرية أو بطاقات تدقيق الخطوات (Self-Monitoring Checklists) ليقوم الطالب بشطب كل خطوة ينجزها بنفسه.',
    verifiedUrl: 'https://developingchild.harvard.edu/resources/activities-guide-enhancing-and-practicing-executive-function-skills-with-children-from-infancy-to-adolescence/',
  },
  {
    id: 'res-ida-structured-literacy',
    title: 'التعليم المنظم للقراءة والكتابة للطلاب ذوي عسر القراءة (الدسلكسيا)',
    authorsOrOrg: 'International Dyslexia Association (IDA)',
    year: '2023',
    category: 'academics_dyslexia',
    evidenceLevel: 'ممارسة مبنية على الأدلة (EBP)',
    summary:
      'منهج متعدد الحواس، صريح، تراكمي ومنظم يدمج بين الفونولوجيا، وعلم الصرف (Morphology)، وعلم التراكيب (Syntax)، والدلالات اللفظية (Semantics) لمساعدة المتعلمين المتعثرين.',
    clinicalApplication:
      'الربط الصريح بين الحرف وصوته وحركته العضلية باليد (كتابة الحرف في الرمل أو المعجون بالتزامن مع النطق)، مع تقديم الحروف بنظام متسلسل من الأكثر تكراراً والأسهل تمايزاً.',
    verifiedUrl: 'https://dyslexiaida.org/structured-literacy-an-introductory-guide/',
  },
];
