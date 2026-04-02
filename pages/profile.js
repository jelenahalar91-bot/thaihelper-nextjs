import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const T = {
  en: {
    page_title: 'My Profile – ThaiHelper',
    loading: 'Loading your profile...',
    logout: 'Log Out',
    nav_back: '← Back to Home',
    // Profile header
    verified: 'Verified',
    ref_label: 'Ref',
    edit_btn: 'Edit Profile',
    save_btn: 'Save Changes',
    saving: 'Saving...',
    cancel_btn: 'Cancel',
    saved_msg: 'Profile updated successfully!',
    error_save: 'Failed to save changes. Please try again.',
    // Section labels
    section_personal: 'Personal Information',
    section_work: 'Work & Experience',
    section_contact: 'Contact Information',
    // Field labels
    label_name: 'Name',
    label_age: 'Age',
    label_city: 'City',
    label_area: 'Area / District',
    label_category: 'Category',
    label_skills: 'Skills',
    label_experience: 'Experience',
    label_languages: 'Languages',
    label_rate: 'Hourly Rate',
    label_education: 'Education',
    label_certificates: 'Certificates',
    label_bio: 'About Me',
    label_phone: 'Phone',
    label_whatsapp: 'WhatsApp',
    label_email: 'Email',
    label_photo: 'Profile Photo',
    // Photo
    photo_change: 'Change Photo',
    photo_upload: 'Upload Photo',
    photo_hint: 'JPG or PNG, max 5 MB',
    photo_size_err: 'Photo must be smaller than 5 MB.',
    // Misc
    not_set: 'Not set',
    yes: 'Yes',
    no: 'No',
    chars: 'characters',
    login_required: 'Please log in to view your profile.',
    login_btn: 'Go to Login',
  },
  th: {
    page_title: 'โปรไฟล์ของฉัน – ThaiHelper',
    loading: 'กำลังโหลดโปรไฟล์...',
    logout: 'ออกจากระบบ',
    nav_back: '← กลับหน้าหลัก',
    verified: 'ยืนยันแล้ว',
    ref_label: 'อ้างอิง',
    edit_btn: 'แก้ไขโปรไฟล์',
    save_btn: 'บันทึกการเปลี่ยนแปลง',
    saving: 'กำลังบันทึก...',
    cancel_btn: 'ยกเลิก',
    saved_msg: 'อัปเดตโปรไฟล์เรียบร้อย!',
    error_save: 'บันทึกไม่สำเร็จ กรุณาลองใหม่',
    section_personal: 'ข้อมูลส่วนตัว',
    section_work: 'การทำงานและประสบการณ์',
    section_contact: 'ข้อมูลติดต่อ',
    label_name: 'ชื่อ',
    label_age: 'อายุ',
    label_city: 'เมือง',
    label_area: 'ย่าน / เขต',
    label_category: 'ประเภท',
    label_skills: 'ทักษะ',
    label_experience: 'ประสบการณ์',
    label_languages: 'ภาษา',
    label_rate: 'ค่าจ้างต่อชั่วโมง',
    label_education: 'การศึกษา',
    label_certificates: 'ใบรับรอง',
    label_bio: 'เกี่ยวกับฉัน',
    label_phone: 'เบอร์โทร',
    label_whatsapp: 'WhatsApp',
    label_email: 'อีเมล',
    label_photo: 'รูปโปรไฟล์',
    photo_change: 'เปลี่ยนรูป',
    photo_upload: 'อัปโหลดรูป',
    photo_hint: 'JPG หรือ PNG ขนาดไม่เกิน 5 MB',
    photo_size_err: 'รูปภาพต้องมีขนาดไม่เกิน 5 MB',
    not_set: 'ไม่ได้ระบุ',
    yes: 'ใช่',
    no: 'ไม่',
    chars: 'ตัวอักษร',
    login_required: 'กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์',
    login_btn: 'ไปหน้าเข้าสู่ระบบ',
  },
};

export default function Profile() {
  const router = useRouter();
  const [lang, setLangState] = useState('en');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  // Edit form state
  const [editData, setEditData] = useState({});
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('th_lang') || 'en';
    setLangState(saved);
  }, []);

  const changeLang = (l) => {
    setLangState(l);
    localStorage.setItem('th_lang', l);
  };

  const t = T[lang] || T.en;

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        setAuthError(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      } else {
        setAuthError(true);
      }
    } catch {
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  const startEditing = () => {
    setEditData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      age: profile.age || '',
      city: profile.city || '',
      area: profile.area || '',
      experience: profile.experience || '',
      rate: profile.rate || '',
      education: profile.education || '',
      certificates: profile.certificates || '',
      bio: profile.bio || '',
      whatsapp: profile.whatsapp || '',
    });
    setPhotoPreview('');
    setEditing(true);
    setSavedMsg('');
    setSaveError('');
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData({});
    setPhotoPreview('');
    setSaveError('');
  };

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(t.photo_size_err);
      e.target.value = '';
      return;
    }
    // Compress and convert to base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h / w) * maxSize; w = maxSize; }
          else { w = (w / h) * maxSize; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        setPhotoPreview(compressed);
        setEditData(prev => ({ ...prev, photo: compressed }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error();
      // Refresh profile
      await fetchProfile();
      setEditing(false);
      setSavedMsg(t.saved_msg);
      setTimeout(() => setSavedMsg(''), 4000);
    } catch {
      setSaveError(t.error_save);
    } finally {
      setSaving(false);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  // Auth error / not logged in
  if (authError) {
    return (
      <>
        <Head><title>{t.page_title}</title></Head>
        <div className="register-body">
          <nav className="register-nav">
            <Link href="/" className="brand">Thai<span>Helper</span></Link>
          </nav>
          <div className="register-container" style={{ maxWidth: '480px' }}>
            <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{t.login_required}</h1>
              <Link href="/login" className="btn-next" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
                {t.login_btn}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Loading
  if (loading) {
    return (
      <>
        <Head><title>{t.page_title}</title></Head>
        <div className="register-body">
          <nav className="register-nav">
            <Link href="/" className="brand">Thai<span>Helper</span></Link>
          </nav>
          <div className="register-container" style={{ maxWidth: '600px' }}>
            <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px', width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: 'var(--gray-500)' }}>{t.loading}</p>
            </div>
          </div>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </>
    );
  }

  const p = profile;
  const photoSrc = photoPreview || p.photo || null;

  return (
    <>
      <Head><title>{t.page_title}</title></Head>

      <div className="register-body">
        {/* Nav */}
        <nav className="register-nav">
          <Link href="/" className="brand">Thai<span>Helper</span></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="lang-toggle">
              <button className={lang === 'en' ? 'active' : ''} onClick={() => changeLang('en')}>EN</button>
              <button className={lang === 'th' ? 'active' : ''} onClick={() => changeLang('th')}>TH</button>
            </div>
            <button onClick={handleLogout} style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb',
              background: 'white', color: 'var(--gray-600)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
            }}>
              {t.logout}
            </button>
          </div>
        </nav>

        <div className="register-container" style={{ maxWidth: '640px' }}>

          {/* Success message */}
          {savedMsg && (
            <div style={{
              background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px',
              padding: '12px 16px', marginBottom: '16px', color: '#059669', fontSize: '14px',
              textAlign: 'center', fontWeight: 600,
            }}>
              {savedMsg}
            </div>
          )}

          {/* Profile Header Card */}
          <div className="card" style={{ padding: '32px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Photo */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '88px', height: '88px', borderRadius: '50%', overflow: 'hidden',
                  background: 'var(--primary-light, #e6f5f3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '3px solid var(--primary)',
                }}>
                  {photoSrc ? (
                    <img src={photoSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '36px' }}>👤</span>
                  )}
                </div>
                {editing && (
                  <label style={{
                    position: 'absolute', bottom: '-4px', right: '-4px',
                    background: 'var(--primary)', color: 'white', borderRadius: '50%',
                    width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', fontSize: '14px',
                    border: '2px solid white',
                  }}>
                    📷
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              {/* Name & info */}
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 4px' }}>
                  {p.firstName} {p.lastName}
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', margin: '0 0 8px' }}>
                  {p.category} &middot; {p.city}{p.area ? ` — ${p.area}` : ''}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                    background: '#ecfdf5', color: '#059669',
                  }}>
                    {t.verified} ✓
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontFamily: 'monospace' }}>
                    {t.ref_label}: {p.ref}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details Card */}
          <div className="card" style={{ padding: '32px' }}>

            {/* Edit / Save buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '8px' }}>
              {editing ? (
                <>
                  <button onClick={cancelEditing} style={{
                    padding: '8px 20px', borderRadius: '8px', border: '1px solid #e5e7eb',
                    background: 'white', color: 'var(--gray-600)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}>
                    {t.cancel_btn}
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-next" style={{ padding: '8px 20px', fontSize: '13px' }}>
                    {saving ? t.saving : t.save_btn}
                  </button>
                </>
              ) : (
                <button onClick={startEditing} className="btn-next" style={{ padding: '8px 20px', fontSize: '13px' }}>
                  ✏️ {t.edit_btn}
                </button>
              )}
            </div>

            {saveError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
                padding: '10px 14px', marginBottom: '16px', color: '#dc2626', fontSize: '13px',
              }}>
                {saveError}
              </div>
            )}

            {/* Personal Info Section */}
            <SectionTitle>{t.section_personal}</SectionTitle>

            {editing ? (
              <div style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <EditField label={t.label_name.split(' ')[0] || 'First'} value={editData.firstName} onChange={v => handleFieldChange('firstName', v)} />
                  <EditField label="Last" value={editData.lastName} onChange={v => handleFieldChange('lastName', v)} />
                </div>
                <EditField label={t.label_age} value={editData.age} onChange={v => handleFieldChange('age', v)} />
                <EditField label={t.label_city} value={editData.city} onChange={v => handleFieldChange('city', v)} />
                <EditField label={t.label_area} value={editData.area} onChange={v => handleFieldChange('area', v)} placeholder="e.g. Sukhumvit, Rawai..." />
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px', marginBottom: '28px' }}>
                <ProfileField label={t.label_name} value={`${p.firstName} ${p.lastName}`} t={t} />
                <ProfileField label={t.label_age} value={p.age} t={t} />
                <ProfileField label={t.label_city} value={p.city} t={t} />
                <ProfileField label={t.label_area} value={p.area} t={t} />
              </div>
            )}

            {/* Work Section */}
            <SectionTitle>{t.section_work}</SectionTitle>

            {editing ? (
              <div style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
                <ProfileField label={t.label_category} value={p.category} t={t} />
                <ProfileField label={t.label_skills} value={p.skills} t={t} />
                <EditField label={t.label_experience} value={editData.experience} onChange={v => handleFieldChange('experience', v)} />
                <EditField label={t.label_languages} value={editData.languages || (p.languages || '')} onChange={v => handleFieldChange('languages', v)} />
                <EditField label={t.label_rate} value={editData.rate} onChange={v => handleFieldChange('rate', v)} />
                <EditField label={t.label_education} value={editData.education} onChange={v => handleFieldChange('education', v)} placeholder="e.g. Bachelor's Degree..." />
                <EditField label={t.label_certificates} value={editData.certificates} onChange={v => handleFieldChange('certificates', v)} placeholder="e.g. First Aid, Childcare..." />
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.label_bio}
                  </label>
                  <textarea
                    value={editData.bio}
                    onChange={e => handleFieldChange('bio', e.target.value)}
                    maxLength={500}
                    rows={5}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5e7eb',
                      fontSize: '14px', resize: 'vertical', fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)', textAlign: 'right' }}>
                    {(editData.bio || '').length} / 500 {t.chars}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px', marginBottom: '28px' }}>
                <ProfileField label={t.label_category} value={p.category} t={t} />
                <ProfileField label={t.label_skills} value={p.skills} t={t} />
                <ProfileField label={t.label_experience} value={p.experience} t={t} />
                <ProfileField label={t.label_languages} value={Array.isArray(p.languages) ? p.languages.join(', ') : p.languages} t={t} />
                <ProfileField label={t.label_rate} value={p.rate} t={t} />
                <ProfileField label={t.label_education} value={p.education} t={t} />
                <ProfileField label={t.label_certificates} value={p.certificates} t={t} />
                <ProfileField label={t.label_bio} value={p.bio} t={t} multiline />
              </div>
            )}

            {/* Contact Section */}
            <SectionTitle>{t.section_contact}</SectionTitle>

            {editing ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <EditField label={t.label_phone} value={editData.whatsapp} onChange={v => handleFieldChange('whatsapp', v)} />
                <ProfileField label={t.label_email} value={p.email} t={t} />
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                <ProfileField label={t.label_phone} value={p.whatsapp} t={t} />
                <ProfileField label={t.label_whatsapp} value={p.hasWhatsApp === 'Yes' ? t.yes : t.no} t={t} />
                <ProfileField label={t.label_email} value={p.email} t={t} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: '13px', fontWeight: 700, color: 'var(--primary)',
      textTransform: 'uppercase', letterSpacing: '1px',
      borderBottom: '1px solid #f3f4f6', paddingBottom: '8px', marginBottom: '16px',
    }}>
      {children}
    </h2>
  );
}

function ProfileField({ label, value, t, multiline }) {
  return (
    <div style={{ display: 'flex', flexDirection: multiline ? 'column' : 'row', gap: multiline ? '4px' : '0' }}>
      <span style={{
        fontSize: '12px', fontWeight: 600, color: 'var(--gray-400)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        minWidth: '120px', paddingTop: '2px',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '14px', color: value ? 'var(--gray-800)' : 'var(--gray-300)',
        lineHeight: 1.5, whiteSpace: multiline ? 'pre-wrap' : 'normal',
      }}>
        {value || t.not_set}
      </span>
    </div>
  );
}

function EditField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {label}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px',
          border: '1px solid #e5e7eb', fontSize: '14px', fontFamily: 'inherit',
        }}
      />
    </div>
  );
}
