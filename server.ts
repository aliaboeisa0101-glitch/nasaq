import express from 'express';
import http from 'http';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const httpServer = http.createServer(app);

function resolvePort(): number {
  const portFlagIndex = process.argv.findIndex(
    (arg) => arg === '--port' || arg.startsWith('--port=')
  );
  if (portFlagIndex !== -1) {
    const rawFlag = process.argv[portFlagIndex];
    const flagVal = rawFlag.includes('=')
      ? rawFlag.split('=')[1]
      : process.argv[portFlagIndex + 1];
    const parsedFlag = Number(flagVal);
    if (Number.isInteger(parsedFlag) && parsedFlag > 0) {
      return parsedFlag;
    }
  }

  const appPort = Number(process.env.APP_PORT || process.env.DEFAULT_APP_PORT);
  if (Number.isInteger(appPort) && appPort > 0) {
    return appPort;
  }

  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT || 8080);
  if (Number.isInteger(envPort) && envPort > 0 && envPort !== nginxPort) {
    return envPort;
  }

  return 3000;
}

const PORT = resolvePort();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'gemini-4-hydrogen').trim() || 'gemini-4-hydrogen';
const AI_ACCESS_CODE = (process.env.AI_ACCESS_CODE || '').trim();
const SESSION_SECRET = crypto.randomBytes(32).toString('hex');

app.use(express.json({ limit: '2mb' }));

// Rate limiter for AI endpoints
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    isAiPowered: false,
    message: 'تم تجاوز الحد المسموح به لطلبات الذكاء الاصطناعي حالياً. يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.',
  },
});

app.use('/api/ai/', aiRateLimiter);

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function issueAiSessionToken(): string {
  const issuedAt = Date.now().toString();
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(issuedAt).digest('hex');
  return `${issuedAt}.${sig}`;
}

function verifyAiSessionToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [issuedAt, sig] = parts;
  const issuedNum = Number(issuedAt);
  if (!Number.isFinite(issuedNum)) return false;
  // Valid for 12 hours
  if (Date.now() - issuedNum > 12 * 60 * 60 * 1000) return false;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(issuedAt).digest('hex');
  return safeCompare(sig, expectedSig);
}

function requireAiAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!AI_ACCESS_CODE) {
    return next();
  }
  const headerToken = String(req.headers['x-ai-access-code'] || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '').trim();
  if (!headerToken) {
    return res.status(401).json({
      error: true,
      authRequired: true,
      isAiPowered: false,
      message: 'الوصول إلى خدمة الذكاء الاصطناعي محمي برمز مرور. يرجى إدخال رمز الوصول.',
    });
  }
  if (safeCompare(headerToken, AI_ACCESS_CODE) || verifyAiSessionToken(headerToken)) {
    return next();
  }
  return res.status(401).json({
    error: true,
    authRequired: true,
    isAiPowered: false,
    message: 'رمز الوصول إلى الذكاء الاصطناعي غير صحيح أو منتهي الصلاحية.',
  });
}

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log(`Gemini AI engine initialized successfully with ${GEMINI_MODEL}.`);
  } catch (err) {
    console.warn('Failed to initialize Gemini AI client:', err);
  }
} else {
  console.log('No GEMINI_API_KEY detected. Running in Offline Clinical Engine mode.');
}

const PostSessionStructuredSchema = z.object({
  sessionSummary: z.string(),
  executedActivities: z.array(z.string()),
  promptLevelsObserved: z.string(),
  successesAndBreakthroughs: z.array(z.string()),
  challengesAndBarriers: z.array(z.string()),
  environmentalAccommodationsUsed: z.array(z.string()),
  clinicianReflections: z.string(),
  nextSessionFocus: z.string(),
  needsReview: z.array(z.string()),
});

// Status endpoint
app.get('/api/ai/status', (_req, res) => {
  res.json({
    available: !!ai,
    model: GEMINI_MODEL,
    mode: ai ? 'online_gemini' : 'offline_clinical_rules',
    authRequired: Boolean(AI_ACCESS_CODE),
    timestamp: new Date().toISOString(),
  });
});

// Optional passcode unlock endpoint
app.post('/api/ai/unlock', (req, res) => {
  if (!AI_ACCESS_CODE) {
    return res.json({ unlocked: true, token: '' });
  }
  const submitted = String(req.body?.code || '').trim();
  if (!submitted || !safeCompare(submitted, AI_ACCESS_CODE)) {
    return res.status(401).json({
      unlocked: false,
      error: true,
      message: 'رمز الوصول غير صحيح.',
    });
  }
  return res.json({
    unlocked: true,
    token: issueAiSessionToken(),
  });
});

// Fallback deterministic clinical templates (NEVER fabricate clinical facts)
function generateOfflineClinicalResponse(taskType: string, body: any): any {
  const beneficiary = body.beneficiary || {};
  const goal = body.goal || {};
  const context = body.context || {};
  const narrative = String(body.narrative || body.prompt || '').trim();

  const alias = beneficiary.nameAlias || beneficiary.code || 'المتعلم';
  const skill = goal.skillName || context.skillName || 'المهارة المستهدفة';

  switch (taskType) {
    case 'smart_goal':
      return {
        text: `[قالب صياغة استرشادي — محرك القواعد المحلي]\nعندما [يُعرض على المتعلم (${alias}) المثير المناسب في بيئة الجلسة]، سيقوم بـ [أداء ${skill} بدقة ووضوح]، بمستوى مساعدة [يُحدد وفق خط الأساس]، بمعيار إتقان [بنسبة نجاح لا تقل عن 80% عبر 3 جلسات متتالية].`,
        suggestedComponents: {
          condition: 'في سياق جلسة التأهيل وبيئة العمل المناسبة',
          behavior: `أداء ${skill} بصورة إجرائية قابلة للملاحظة والقياس`,
          promptLevel: 'verbal',
          criteria: 'بنسبة دقة 80% في 3 جلسات متتالية',
        },
      };

    case 'activity':
      return {
        text: `[قالب نشاط إرشادي عام لمهارة: ${skill}]\n\n` +
          `• الهدف الإجرائي: تنمية ${skill} وفق مستوى أداء المتعلم الفعلي.\n` +
          `• الأدوات المقترحة: بطاقات بصرية، معزز مفضل للمتعلم، أدوات منظمة.\n` +
          `• خطوات التنفيذ القياسية:\n` +
          `  1. التهيئة وجذب الانتباه باستخدام المعزز.\n` +
          `  2. تقديم النموذج العملي الصريح من قبل الأخصائي.\n` +
          `  3. إتاحة الفرصة للمتعلم للمحاولة مع تدرج المساعدة.\n` +
          `  4. تقديم تعزيز إيجابي فوري وتوثيق الاستجابة.\n` +
          `• ملاحظة: يُرجى تكييف الخطوات والمواد بحسب الملاحظة السريرية المباشرة.`,
      };

    case 'activity_variation': {
      const variationType = context.variationType || 'simplify';
      const labels: Record<string, string> = {
        simplify: 'تعديل للأسهل (تبسيط المهام وتجزئة الخطوات)',
        challenge: 'تعديل للأصعب (زيادة التحدي وتعميم الاستجابة)',
        low_cost: 'بديل اقتصادي بمواد منزلية وملموسة متاحة',
        sensory: 'تكييف حسي (مراعاة الحساسية اللمسية أو البصرية)',
        motor: 'تكييف حركي (تعديل المسكات وأحجام الأدوات)',
        home: 'نسخة تعميم للمنزل موجهة لولي الأمر',
        aac_support: 'دعم لوحة تواصل AAC مصاحبة',
        social_dialogue: 'حوار وتبادل أدوار مع الأقران',
      };
      return {
        text: `[قالب تكييف استرشادي: ${labels[variationType] || variationType}]\n\n` +
          `بناءً على نشاط "${context.activityTitle || skill}":\n` +
          `1. ضبط طريقة تقديم المثير بما يتوافق مع ${labels[variationType] || 'احتياجات المتعلم'}.\n` +
          `2. تقسيم المهمة لخطوات واضحة وتوثيق مستوى المساعدة المطلوب.\n` +
          `3. التحقق من الاستجابة في الجلسة دون تجاوز معايير الراحة الحسية.`,
      };
    }

    case 'social_story':
      return {
        text: `[قالب قصة اجتماعية استرشادي — يتطلب تخصيص الموقف من الأخصائي]\n\n` +
          `• جملة وصفية: أحياناً أكون في الجلسة أو الصف وأريد المشاركة في النشاط.\n` +
          `• جملة منظورية: عندما أنتظر دوري بهدوء، يشعر من حولي بالارتياح ونستمتع باللعب معاً.\n` +
          `• جملة توجيهية: سأحاول أن أشير إلى بطاقة دوري أو أرفع يدي بهدوء.\n` +
          `• جملة تأكيدية: أنا أتعلّم المشاركة خطوة بخطوة.`,
      };

    case 'visual_schedule':
      return {
        text: `[قالب جدول بصري استرشادي لنشاط: ${skill}]\n\n` +
          `1. الجلوس وتجهيز مساحة العمل.\n` +
          `2. استكشاف الأدوات المطلوبة.\n` +
          `3. تنفيذ خطوات التدريب المخططة.\n` +
          `4. الحصول على المعزز المفضل.\n` +
          `5. ترتيب الأدوات والانتقال للنشاط التالي.`,
      };

    case 'home_instructions':
      return {
        text: `[قالب إرشادات تعميم منزلي لمهارة: ${skill}]\n` +
          `عزيزي ولي أمر (${alias})، يمكن دعم المهارة في المنزل عبر:\n\n` +
          `1. دمج التمرين في المواقف اليومية الطبيعية.\n` +
          `2. إعطاء وقت انتظار كافٍ (5 ثوانٍ) للمبادرة قبل المساعدة.\n` +
          `3. تقديم التشجيع اللفظي أو المعزز المفضل فور الاستجابة.\n` +
          `4. التوقف فوراً عند ظهور إشارات التعب ومراجعة الأخصائي عند الحاجة.`,
      };

    case 'post_session_organize':
      // CRITICAL: Never fabricate clinical observations or breakthroughs when AI is unavailable.
      return {
        error: true,
        code: 'AI_UNAVAILABLE',
        preserveOriginalNarrative: narrative,
        fallbackReason:
          'خدمة الذكاء الاصطناعي غير متصلة حالياً. حرصاً على النزاهة السريرية وعدم اختلاق أي وقائع غير واردة في ملاحظاتك، تم الإبقاء على نصك الأصلي كما هو دون تعبئة حقول آلية مفترضة.',
      };

    case 'performance_analysis':
      return {
        error: true,
        code: 'AI_UNAVAILABLE',
        fallbackReason:
          'تحليل الأداء السريري الذكي غير متاح في وضع عدم الاتصال حتى لا يتم توليد استنتاجات غير مبنية على قراءة شاملة. يمكنك مراجعة النسب الحسابية الدقيقة من شاشة «التقارير».',
      };

    default:
      return {
        text: `[قالب استرشادي محلي لـ "${skill}"]\nخدمة Gemini غير متصلة حالياً؛ هذه صيغة إرشادية عامة قابلة للتعديل اليدوي بالكامل من قبل الأخصائي.`,
      };
  }
}

// AI generate endpoint (protected by rate limiter + optional access code)
app.post('/api/ai/generate', requireAiAccess, async (req, res) => {
  const { taskType, beneficiary, goal, prompt, context, narrative } = req.body || {};

  if (!taskType || typeof taskType !== 'string') {
    return res.status(400).json({ error: true, message: 'حقل نوع المهمة (taskType) مطلوب.' });
  }

  const rawNarrative = String(narrative || prompt || '').trim();

  const systemInstruction = `
أنت مستشار وخبير أول معتمد في التربية الخاصة والتأهيل الإكلينيكي وتحليل السلوك التطبيقي (BCBA / SLP / Special Education Specialist).
مهامك هي تقديم صياغات إجرائية دقيقة، مبنية على الأدلة العلمية (EBP)، تراعي خصوصية المتعلم، وتلتزم بأعلى معايير الجودة الأكاديمية والمهنية.
التوجيهات الصارمة:
1. استخدم اللغة العربية الفصحى السليمة والمهنية والواضحة والخالية من الحشو.
2. لا تطلب أو تذكر أي بيانات شخصية حساسة أو أسماء حقيقية (استخدم المعرفات الرمزية دائماً).
3. عند تنظيم الملاحظات بعد الجلسة: التزم حرفياً بما ورد في نص الأخصائي فقط، ولا تختلق أبداً أي سلوكيات أو أنشطة أو تشتتات أو أرقام لم يذكرها الأخصائي. إذا لم يُذكر بند ما في النص الأصلي، اترك مصفوفته فارغة [] أو اكتب "لم يُذكر في ملاحظات الجلسة".
4. جميع المخرجات يجب أن توضح أنها [مسودة مقترحة بالذكاء الاصطناعي - تخضع لمراجعة الأخصائي المؤهل].
`;

  if (ai) {
    try {
      let promptText = '';

      if (taskType === 'post_session_organize') {
        if (!rawNarrative) {
          return res.status(400).json({
            error: true,
            isAiPowered: false,
            message: 'يرجى كتابة ملاحظات الجلسة أولاً قبل طلب التنظيم.',
          });
        }
        promptText = `
المطلوب تنظيم الملاحظات الحرة المكتوبة أو المفرغة صوتياً بعد انتهاء جلسة تأهيل، وتحويلها إلى تقرير مهني منظم وفق المعايير السريرية دون أي اختلاق أو إضافة وقائع لم ترد في النص الأصلي.

بيانات المستفيد الرمزية:
- الرمز/اللقب: ${beneficiary?.nameAlias || beneficiary?.code || 'المتعلم'}
- المهارات والاحتياجات: ${beneficiary?.priorityNeeds || 'غير محدد'}
- نمط التواصل: ${beneficiary?.communicationMode || 'غير محدد'}
- التيسيرات الحسية: ${beneficiary?.sensoryNotes || 'غير محدد'}

النص الأصلي لملاحظات الجلسة:
"""
${rawNarrative}
"""

القواعد الإلزامية للاستخراج:
- انقل الحقائق من النص الأصلي فقط ولا تضف أي نشاط أو تحدٍ أو استجابة من خيالك.
- إذا لم ترد بيانات لأحد الحقول المصفوفية فأرجع مصفوفة فارغة [].
- إذا كان النص غامضاً أو يحتاج لتفصيل، أدرجه في needsReview.
`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sessionSummary: { type: Type.STRING },
                executedActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
                promptLevelsObserved: { type: Type.STRING },
                successesAndBreakthroughs: { type: Type.ARRAY, items: { type: Type.STRING } },
                challengesAndBarriers: { type: Type.ARRAY, items: { type: Type.STRING } },
                environmentalAccommodationsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
                clinicianReflections: { type: Type.STRING },
                nextSessionFocus: { type: Type.STRING },
                needsReview: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'sessionSummary',
                'executedActivities',
                'promptLevelsObserved',
                'successesAndBreakthroughs',
                'challengesAndBarriers',
                'environmentalAccommodationsUsed',
                'clinicianReflections',
                'nextSessionFocus',
                'needsReview',
              ],
            },
          },
        });

        const rawText = response.text || '';
        try {
          const parsedRaw = JSON.parse(rawText);
          const validated = PostSessionStructuredSchema.parse(parsedRaw);
          return res.json({
            isAiPowered: true,
            source: GEMINI_MODEL,
            structured: validated,
            rawText,
          });
        } catch (jsonErr) {
          console.warn('Could not parse/validate Gemini structured JSON response:', jsonErr);
          return res.status(502).json({
            error: true,
            isAiPowered: false,
            code: 'JSON_PARSE_FAILED',
            preserveOriginalNarrative: rawNarrative,
            message:
              'تعذر تحليل المخرج المنظم من الذكاء الاصطناعي بصيغة صحيحة؛ تم الحفاظ على نصك الأصلي كما هو دون اختلاق أي بيانات بديلة.',
          });
        }
      } else if (taskType === 'smart_goal') {
        promptText = `
صياغة هدف تربوي فردي ذكي (SMART Goal) قابل للقياس والملاحظة في التربية الخاصة.
المتعلم: ${beneficiary?.nameAlias || beneficiary?.code || 'المتعلم'}
المستوى النمائي: ${beneficiary?.age || 'غير محدد'}
نقاط القوة والمعززات: ${beneficiary?.strengths || 'غير محدد'}
طريقة التواصل: ${beneficiary?.communicationMode || 'غير محدد'}
المهارة المستهدفة: ${goal?.skillName || context?.skillName || prompt}
الملاحظات والإرشادات الإضافية: ${prompt}

المطلوب:
1. صياغة الهدف بالصيغة المعيارية: عندما [الظرف والمثير]، سيقوم [السلوك الإجرائي المستهدف]، بمستوى مساعدة [مستوى المساعدة المحدد]، بمعيار إتقان [معيار الإتقان العددي الدقيق].
2. اقتراح معيار تعميم المهارة.
3. اقتراح معيار المحافظة على المهارة بمرور الوقت.
4. إرشادات سريعة لجمع البيانات.
`;
      } else if (taskType === 'activity_variation') {
        promptText = `
اقتراح تعديل نوعي ونشاط بديل مبني على الأدلة للنشاط التالي:
النشاط الأصلي: ${context?.activityTitle || 'نشاط تأهيلي'}
المهارة المستهدفة: ${context?.skillName || 'مهارة نمائية'}
نوع التعديل المطلوب: ${context?.variationType || 'تعديل ملائم'} (${context?.variationLabel || ''})
ملف المتعلم: ${beneficiary?.nameAlias || 'المتعلم'}، احتياجات حسية: ${beneficiary?.sensoryNotes || 'لا توجد'}، وسيلة التواصل: ${beneficiary?.communicationMode || 'عادية'}.
تفاصيل وطلب الأخصائي: ${prompt}

المطلوب: تقديم التعديل بشكل إجرائي دقيق وجاهز للتطبيق الميداني الفوري.
`;
      } else {
        promptText = `
نوع المهمة: ${taskType}
المستفيد الرمزي: ${beneficiary?.nameAlias || beneficiary?.code || 'المتعلم'}
المهارة المستهدفة: ${goal?.skillName || context?.skillName || 'مهارة نمائية'}
الطلب التفصيلي: ${prompt}
السياق الإضافي: ${JSON.stringify(context || {})}

المطلوب تقديم استجابة إكلينيكية متخصصة ومهنية وشاملة مع مراعاة أعلى معايير التربية الخاصة.
`;
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: promptText,
        config: {
          systemInstruction,
        },
      });

      const rawText = response.text || '';
      return res.json({
        isAiPowered: true,
        source: GEMINI_MODEL,
        text: rawText,
      });
    } catch (apiError: any) {
      console.error('Gemini API call failed:', apiError?.message || apiError);
      if (taskType === 'post_session_organize' || taskType === 'performance_analysis') {
        return res.status(502).json({
          error: true,
          isAiPowered: false,
          code: 'AI_FAILED',
          preserveOriginalNarrative: rawNarrative,
          message:
            'تعذر الاتصال بخدمة Gemini حالياً. تم الحفاظ على نصك الأصلي كما هو دون توليد أو اختلاق أي وقائع سريرية بديلة.',
        });
      }
      const fallback = generateOfflineClinicalResponse(taskType, req.body);
      return res.json({
        isAiPowered: false,
        source: 'offline_clinical_engine',
        fallbackReason:
          'تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً، تم عرض قالب استرشادي من محرك القواعد المحلي.',
        ...fallback,
      });
    }
  }

  // Offline Fallback when GEMINI_API_KEY is not configured
  const fallback = generateOfflineClinicalResponse(taskType, req.body);
  if (fallback.error) {
    return res.status(503).json({
      isAiPowered: false,
      source: 'offline_clinical_engine',
      message: fallback.fallbackReason,
      ...fallback,
    });
  }
  return res.json({
    isAiPowered: false,
    source: 'offline_clinical_engine',
    ...fallback,
  });
});

// Serve frontend in production or via Vite middlewares in development
const isProduction = process.env.NODE_ENV === 'production';

async function setupServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: !disableHmr,
        ws: { server: httpServer },
        watch: disableHmr ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`NASAQ Rehabilitation Platform server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
