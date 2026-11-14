/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility for exporting HTML elements to PDF with high-fidelity formatting,
 * designed for clinical and parental progress reports.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string
): Promise<{ success: boolean; fallbackUsed: boolean; error?: string }> {
  try {
    // @ts-ignore
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const sanitizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    const opt = {
      margin: 8,
      filename: sanitizedFilename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const,
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
      },
    };

    await html2pdf().set(opt).from(element).save();
    return { success: true, fallbackUsed: false };
  } catch (error: any) {
    console.warn('Direct PDF export failed:', error);
    return {
      success: false,
      fallbackUsed: false,
      error:
        error?.message ||
        'تعذر توليد ملف PDF مباشرة. استخدم زر «طباعة (A4)» واختر «حفظ كـ PDF» للحصول على ملف نصي واضح قابل للتحديد والبحث.',
    };
  }
}
