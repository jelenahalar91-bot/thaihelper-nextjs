/**
 * Reusable legal disclaimer used by wizard results, directory pages,
 * and city info pages. ThaiHelper provides general information only —
 * users must consult qualified professionals for their specific case.
 */
export default function LegalDisclaimer({ lang = 'en', className = '' }) {
  const heading = lang === 'th' ? '⚖️ ข้อจำกัดความรับผิดชอบ' : '⚖️ Disclaimer';
  const text = lang === 'th'
    ? 'ข้อมูลนี้เป็นเพียงข้อมูลทั่วไปเท่านั้น ไม่ใช่คำแนะนำทางกฎหมาย กรุณาปรึกษาผู้เชี่ยวชาญด้านกฎหมายสำหรับสถานการณ์เฉพาะของคุณ ThaiHelper ไม่รับผิดชอบต่อการดำเนินการใดๆ ที่ดำเนินการตามข้อมูลนี้'
    : 'This information is for general guidance only and does not constitute legal advice. Please consult a qualified immigration lawyer or licensed agency for your specific situation. ThaiHelper is not liable for any actions taken based on this information.';

  return (
    <div className={`mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 ${className}`.trim()}>
      <p className="font-medium mb-1">{heading}</p>
      <p>{text}</p>
    </div>
  );
}
