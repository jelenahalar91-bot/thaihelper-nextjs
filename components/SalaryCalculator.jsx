import { useState } from 'react';

const CITIES = [
  { value: 'bangkok', label: 'Bangkok', factor: 1.0 },
  { value: 'phuket', label: 'Phuket', factor: 0.95 },
  { value: 'chiangmai', label: 'Chiang Mai', factor: 0.8 },
  { value: 'pattaya', label: 'Pattaya', factor: 0.88 },
  { value: 'kohsamui', label: 'Koh Samui', factor: 0.9 },
  { value: 'other', label: 'Other Province', factor: 0.75 },
];

const JOB_TYPES = [
  { value: 'nanny', label: 'Nanny / Babysitter', baseLow: 15000, baseHigh: 25000 },
  { value: 'housekeeper', label: 'Housekeeper / Cleaner', baseLow: 12000, baseHigh: 18000 },
  { value: 'cook', label: 'Private Chef / Cook', baseLow: 15000, baseHigh: 22000 },
  { value: 'driver', label: 'Driver / Chauffeur', baseLow: 15000, baseHigh: 20000 },
  { value: 'eldercare', label: 'Elder Care', baseLow: 15000, baseHigh: 25000 },
  { value: 'gardener', label: 'Gardener / Pool Care', baseLow: 10000, baseHigh: 15000 },
];

const EXPERIENCE = [
  { value: 'entry', label: '0-1 years', factor: 0.85 },
  { value: 'mid', label: '2-4 years', factor: 1.0 },
  { value: 'senior', label: '5+ years', factor: 1.25 },
];

const SCHEDULE = [
  { value: 'fulltime', label: 'Full-time (6 days/week)', factor: 1.0 },
  { value: 'parttime', label: 'Part-time (3 days/week)', factor: 0.5 },
  { value: 'livein', label: 'Live-in', factor: 0.9 },
];

export default function SalaryCalculator() {
  const [city, setCity] = useState('bangkok');
  const [jobType, setJobType] = useState('nanny');
  const [experience, setExperience] = useState('mid');
  const [schedule, setSchedule] = useState('fulltime');
  const [englishSpeaking, setEnglishSpeaking] = useState(false);

  const cityData = CITIES.find((c) => c.value === city);
  const jobData = JOB_TYPES.find((j) => j.value === jobType);
  const expData = EXPERIENCE.find((e) => e.value === experience);
  const schedData = SCHEDULE.find((s) => s.value === schedule);

  const langFactor = englishSpeaking ? 1.3 : 1.0;

  const low = Math.round((jobData.baseLow * cityData.factor * expData.factor * schedData.factor * langFactor) / 500) * 500;
  const high = Math.round((jobData.baseHigh * cityData.factor * expData.factor * schedData.factor * langFactor) / 500) * 500;

  const socialSecurity = Math.min(Math.round(high * 0.05), 750);

  return (
    <div className="my-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-1 font-headline">Salary Calculator</h3>
      <p className="text-sm text-gray-500 mb-6">Estimate a fair monthly salary for your helper</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* City */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">City</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border-gray-200 text-sm py-2.5 focus:border-primary focus:ring-primary">
            {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Job Type</label>
          <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full rounded-lg border-gray-200 text-sm py-2.5 focus:border-primary focus:ring-primary">
            {JOB_TYPES.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
          </select>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Experience</label>
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full rounded-lg border-gray-200 text-sm py-2.5 focus:border-primary focus:ring-primary">
            {EXPERIENCE.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Schedule</label>
          <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-full rounded-lg border-gray-200 text-sm py-2.5 focus:border-primary focus:ring-primary">
            {SCHEDULE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* English toggle */}
      <label className="flex items-center gap-2 mb-6 cursor-pointer">
        <input type="checkbox" checked={englishSpeaking} onChange={(e) => setEnglishSpeaking(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
        <span className="text-sm text-gray-700">English-speaking helper (+30% premium)</span>
      </label>

      {/* Result */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-5 text-center">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Estimated Monthly Salary</p>
        <p className="text-3xl sm:text-4xl font-bold text-gray-900 font-headline">
          {low.toLocaleString()} – {high.toLocaleString()} <span className="text-lg font-normal text-gray-500">THB</span>
        </p>
        <p className="text-xs text-gray-500 mt-3">
          + Social Security (employer share): ~{socialSecurity} THB/month
        </p>
      </div>

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
        Estimates based on 2026 market data and provincial minimum wage rates. Actual salaries vary based on specific skills, references, and negotiation. Use as a guideline, not a guarantee.
      </p>
    </div>
  );
}
