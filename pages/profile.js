import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { fetchProfile as fetchProfileApi, updateProfile as updateProfileApi } from '@/lib/api/helpers';
import { logout } from '@/lib/api/auth-client';
import { fetchDocuments, uploadDocument, deleteDocument } from '@/lib/api/documents';
import { fetchReferences, addReference, updateReference, deleteReference } from '@/lib/api/references';
import { fetchConversations, fetchMessages, sendMessage, markAsRead } from '@/lib/api/messages';
import { fetchSettings, updateLanguagePreference } from '@/lib/api/settings';
import ConversationList from '@/components/messaging/ConversationList';
import ConversationDetail from '@/components/messaging/ConversationDetail';

const T = {
  en: {
    page_title: 'Dashboard – ThaiHelper',
    loading: 'Loading your dashboard...',
    logout: 'Log Out',
    // Tabs
    tab_dashboard: 'Dashboard',
    tab_messages: 'Messages',
    tab_profile: 'Profile',
    // Dashboard
    dash_welcome: 'Welcome back',
    dash_status: 'Profile Status',
    dash_status_active: 'Active',
    dash_status_review: 'Under Review',
    dash_views: 'Profile Views',
    dash_messages: 'Messages',
    dash_coming: 'Coming at launch',
    dash_tip_title: 'Complete your profile',
    dash_tip_text: 'Helpers with complete profiles (photo, bio, certificates) get 3x more contact requests from families.',
    dash_tip_btn: 'Edit Profile',
    dash_launch_title: 'Launching April 2026',
    dash_launch_text: 'Your profile is registered and will be visible to families when we launch. We\'ll notify you by email!',
    // Messages
    msg_title: 'Your Messages',
    msg_empty_icon: '💬',
    msg_empty_title: 'No messages yet',
    msg_empty_text: 'When families contact you, their messages will appear here. This feature will be available at launch.',
    msg_coming_title: 'Coming Soon',
    msg_coming_features: [
      'Direct messages from families',
      'Job offers and interview requests',
      'Schedule coordination',
      'Push notifications',
    ],
    // Profile
    verified: 'Verified',
    ref_label: 'Ref',
    edit_btn: 'Edit Profile',
    save_btn: 'Save Changes',
    saving: 'Saving...',
    cancel_btn: 'Cancel',
    saved_msg: 'Profile updated successfully!',
    error_save: 'Failed to save changes. Please try again.',
    section_personal: 'Personal Information',
    section_work: 'Work & Experience',
    section_contact: 'Contact Information',
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
    photo_size_err: 'Photo must be smaller than 5 MB.',
    not_set: 'Not set',
    yes: 'Yes',
    no: 'No',
    chars: 'characters',
    login_required: 'Please log in to view your dashboard.',
    login_btn: 'Go to Login',
    // Documents
    doc_title: 'Documents & Certificates',
    doc_upload: 'Upload Document',
    doc_uploading: 'Uploading...',
    doc_empty: 'Upload certificates, IDs, or reference letters to strengthen your profile.',
    doc_type_certificate: 'Certificate',
    doc_type_id: 'ID Document',
    doc_type_reference: 'Reference Letter',
    doc_type_other: 'Other',
    doc_delete_confirm: 'Delete this document?',
    doc_max_size: 'Max 10 MB · PDF, JPG, PNG, WEBP',
    // References
    ref_title: 'Professional References',
    ref_add: 'Add Reference',
    ref_empty: 'Add references from previous employers to build trust with families.',
    ref_name: 'Name',
    ref_relationship: 'Relationship',
    ref_contact: 'Contact Info',
    ref_text: 'Reference Text',
    ref_rel_employer: 'Employer',
    ref_rel_colleague: 'Colleague',
    ref_rel_trainer: 'Trainer',
    ref_rel_other: 'Other',
    ref_save: 'Save',
    ref_cancel: 'Cancel',
    ref_delete_confirm: 'Delete this reference?',
    // Messaging
    msg_no_conv: 'No conversations yet',
    msg_no_conv_text: 'When families contact you, their messages will appear here.',
    msg_back: 'Back',
    msg_placeholder: 'Type a message...',
    msg_send: 'Send',
    msg_show_original: 'Show original',
    msg_show_translated: 'Show translated',
    msg_unread: 'unread',
    // Settings
    settings_title: 'Language & Settings',
    settings_lang: 'Preferred Language',
    settings_lang_hint: 'Messages from families will be translated to your preferred language.',
    settings_saved: 'Settings saved!',
  },
  th: {
    page_title: 'แดชบอร์ด – ThaiHelper',
    loading: 'กำลังโหลดแดชบอร์ด...',
    logout: 'ออกจากระบบ',
    tab_dashboard: 'แดชบอร์ด',
    tab_messages: 'ข้อความ',
    tab_profile: 'โปรไฟล์',
    dash_welcome: 'ยินดีต้อนรับกลับ',
    dash_status: 'สถานะโปรไฟล์',
    dash_status_active: 'ใช้งาน',
    dash_status_review: 'กำลังตรวจสอบ',
    dash_views: 'การเข้าชมโปรไฟล์',
    dash_messages: 'ข้อความ',
    dash_coming: 'พร้อมเมื่อเปิดตัว',
    dash_tip_title: 'ทำโปรไฟล์ให้สมบูรณ์',
    dash_tip_text: 'ผู้ช่วยที่มีโปรไฟล์สมบูรณ์ (รูปภาพ, เกี่ยวกับตัวเอง, ใบรับรอง) ได้รับการติดต่อจากครอบครัวมากขึ้น 3 เท่า',
    dash_tip_btn: 'แก้ไขโปรไฟล์',
    dash_launch_title: 'เปิดตัวเมษายน 2026',
    dash_launch_text: 'โปรไฟล์ของคุณลงทะเบียนแล้วและจะปรากฏให้ครอบครัวเห็นเมื่อเราเปิดตัว เราจะแจ้งคุณทางอีเมล!',
    msg_title: 'ข้อความของคุณ',
    msg_empty_icon: '💬',
    msg_empty_title: 'ยังไม่มีข้อความ',
    msg_empty_text: 'เมื่อครอบครัวติดต่อคุณ ข้อความจะปรากฏที่นี่ ฟีเจอร์นี้จะพร้อมใช้งานเมื่อเปิดตัว',
    msg_coming_title: 'เร็วๆ นี้',
    msg_coming_features: [
      'ข้อความโดยตรงจากครอบครัว',
      'ข้อเสนองานและคำขอสัมภาษณ์',
      'การนัดหมายตารางเวลา',
      'การแจ้งเตือนแบบพุช',
    ],
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
    photo_size_err: 'รูปภาพต้องมีขนาดไม่เกิน 5 MB',
    not_set: 'ไม่ได้ระบุ',
    yes: 'ใช่',
    no: 'ไม่',
    chars: 'ตัวอักษร',
    login_required: 'กรุณาเข้าสู่ระบบเพื่อดูแดชบอร์ด',
    login_btn: 'ไปหน้าเข้าสู่ระบบ',
    // Documents
    doc_title: 'เอกสารและใบรับรอง',
    doc_upload: 'อัปโหลดเอกสาร',
    doc_uploading: 'กำลังอัปโหลด...',
    doc_empty: 'อัปโหลดใบรับรอง, บัตรประจำตัว หรือจดหมายอ้างอิงเพื่อเสริมโปรไฟล์ของคุณ',
    doc_type_certificate: 'ใบรับรอง',
    doc_type_id: 'เอกสารประจำตัว',
    doc_type_reference: 'จดหมายอ้างอิง',
    doc_type_other: 'อื่นๆ',
    doc_delete_confirm: 'ลบเอกสารนี้?',
    doc_max_size: 'สูงสุด 10 MB · PDF, JPG, PNG, WEBP',
    // References
    ref_title: 'ข้อมูลอ้างอิงจากการทำงาน',
    ref_add: 'เพิ่มข้อมูลอ้างอิง',
    ref_empty: 'เพิ่มข้อมูลอ้างอิงจากนายจ้างเดิมเพื่อสร้างความน่าเชื่อถือ',
    ref_name: 'ชื่อ',
    ref_relationship: 'ความสัมพันธ์',
    ref_contact: 'ข้อมูลติดต่อ',
    ref_text: 'ข้อความอ้างอิง',
    ref_rel_employer: 'นายจ้าง',
    ref_rel_colleague: 'เพื่อนร่วมงาน',
    ref_rel_trainer: 'ผู้ฝึกอบรม',
    ref_rel_other: 'อื่นๆ',
    ref_save: 'บันทึก',
    ref_cancel: 'ยกเลิก',
    ref_delete_confirm: 'ลบข้อมูลอ้างอิงนี้?',
    // Messaging
    msg_no_conv: 'ยังไม่มีการสนทนา',
    msg_no_conv_text: 'เมื่อครอบครัวติดต่อคุณ ข้อความจะปรากฏที่นี่',
    msg_back: 'กลับ',
    msg_placeholder: 'พิมพ์ข้อความ...',
    msg_send: 'ส่ง',
    msg_show_original: 'แสดงต้นฉบับ',
    msg_show_translated: 'แสดงคำแปล',
    msg_unread: 'ยังไม่ได้อ่าน',
    // Settings
    settings_title: 'ภาษาและการตั้งค่า',
    settings_lang: 'ภาษาที่ต้องการ',
    settings_lang_hint: 'ข้อความจากครอบครัวจะถูกแปลเป็นภาษาที่คุณต้องการ',
    settings_saved: 'บันทึกการตั้งค่าแล้ว!',
  },
};

export default function Profile() {
  const router = useRouter();
  const [lang, setLangState] = useState('en');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const [editData, setEditData] = useState({});
  const [photoPreview, setPhotoPreview] = useState('');
  // Documents & References
  const [documents, setDocuments] = useState([]);
  const [references, setReferences] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('certificate');
  const [showRefForm, setShowRefForm] = useState(false);
  const [editingRef, setEditingRef] = useState(null);
  const [refForm, setRefForm] = useState({ reference_name: '', relationship: 'employer', contact_info: '', reference_text: '' });
  const [refInputMode, setRefInputMode] = useState('text'); // 'text' or 'file'
  const [refFile, setRefFile] = useState(null);
  const [uploadingRef, setUploadingRef] = useState(false);
  // Messaging
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  // Settings
  const [prefLang, setPrefLang] = useState('en');
  const [settingsSaved, setSettingsSaved] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('th_lang') || 'en';
    setLangState(saved);
  }, []);

  const changeLang = (l) => { setLangState(l); localStorage.setItem('th_lang', l); };
  const t = T[lang] || T.en;

  useEffect(() => { fetchProfile(); loadSupabaseData(); }, []);

  const loadSupabaseData = async () => {
    try {
      const [docsRes, refsRes, convsRes, settingsRes] = await Promise.allSettled([
        fetchDocuments(),
        fetchReferences(),
        fetchConversations(),
        fetchSettings(),
      ]);
      if (docsRes.status === 'fulfilled') setDocuments(docsRes.value.documents || []);
      if (refsRes.status === 'fulfilled') setReferences(refsRes.value.references || []);
      if (convsRes.status === 'fulfilled') setConversations(convsRes.value.conversations || []);
      if (settingsRes.status === 'fulfilled' && settingsRes.value.preferred_language) {
        setPrefLang(settingsRes.value.preferred_language);
      }
    } catch (err) {
      console.error('Failed to load Supabase data:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await fetchProfileApi();
      if (data.authError) { setAuthError(true); setLoading(false); return; }
      if (data.success) { setProfile(data.profile); } else { setAuthError(true); }
    } catch { setAuthError(true); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const startEditing = () => {
    setEditData({
      firstName: profile.firstName || '', lastName: profile.lastName || '',
      age: profile.age || '', city: profile.city || '', area: profile.area || '',
      experience: profile.experience || '', rate: profile.rate || '',
      education: profile.education || '', certificates: profile.certificates || '',
      bio: profile.bio || '', whatsapp: profile.whatsapp || '',
    });
    setPhotoPreview(''); setEditing(true); setSavedMsg(''); setSaveError('');
  };

  const cancelEditing = () => { setEditing(false); setEditData({}); setPhotoPreview(''); setSaveError(''); };
  const handleFieldChange = (field, value) => { setEditData(prev => ({ ...prev, [field]: value })); };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert(t.photo_size_err); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) { if (w > h) { h = (h / w) * maxSize; w = maxSize; } else { w = (w / h) * maxSize; h = maxSize; } }
        canvas.width = w; canvas.height = h;
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
    setSaving(true); setSaveError('');
    try {
      await updateProfileApi(editData);
      await fetchProfile(); setEditing(false);
      setSavedMsg(t.saved_msg); setTimeout(() => setSavedMsg(''), 4000);
    } catch { setSaveError(t.error_save); }
    finally { setSaving(false); }
  };

  // Document handlers
  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const result = await uploadDocument(file, docType);
      setDocuments(prev => [result.document, ...prev]);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDocDelete = async (id) => {
    if (!confirm(t.doc_delete_confirm)) return;
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Reference handlers
  const resetRefForm = () => {
    setRefForm({ reference_name: '', relationship: 'employer', contact_info: '', reference_text: '' });
    setShowRefForm(false);
    setEditingRef(null);
    setRefInputMode('text');
    setRefFile(null);
    setUploadingRef(false);
  };

  const handleRefSave = async () => {
    if (!refForm.reference_name.trim()) return;
    setUploadingRef(true);
    try {
      // If file mode and a file is selected, upload it first
      let finalForm = { ...refForm };
      if (refInputMode === 'file' && refFile) {
        const uploadResult = await uploadDocument(refFile, 'reference');
        finalForm.reference_text = `[Uploaded: ${refFile.name}]`;
        // Reload documents to show the new reference doc
        fetchDocuments().then(r => setDocuments(r.documents || []));
      }

      if (editingRef) {
        const result = await updateReference(editingRef, finalForm);
        setReferences(prev => prev.map(r => r.id === editingRef ? result.reference : r));
      } else {
        const result = await addReference(finalForm);
        setReferences(prev => [result.reference, ...prev]);
      }
      resetRefForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingRef(false);
    }
  };

  const handleRefEdit = (ref) => {
    setRefForm({
      reference_name: ref.reference_name,
      relationship: ref.relationship || 'other',
      contact_info: ref.contact_info || '',
      reference_text: ref.reference_text || '',
    });
    setEditingRef(ref.id);
    setShowRefForm(true);
  };

  const handleRefDelete = async (id) => {
    if (!confirm(t.ref_delete_confirm)) return;
    try {
      await deleteReference(id);
      setReferences(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Messaging handlers
  const openConversation = async (conv) => {
    setSelectedConv(conv);
    setLoadingMsgs(true);
    try {
      const res = await fetchMessages(conv.id);
      setMessages(res.messages || []);
      if (conv.unread_count > 0) {
        await markAsRead(conv.id);
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedConv) return;
    setSendingMsg(true);
    try {
      const res = await sendMessage(selectedConv.id, msgInput.trim());
      setMessages(prev => [...prev, res.message]);
      setMsgInput('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  // Settings handlers
  const handleLanguageChange = async (newLang) => {
    setPrefLang(newLang);
    changeLang(newLang);
    try {
      await updateLanguagePreference(newLang);
      setSettingsSaved(t.settings_saved);
      setTimeout(() => setSettingsSaved(''), 3000);
    } catch (err) {
      console.error('Failed to save language preference:', err);
    }
  };

  // Check profile completeness
  const getCompleteness = (p) => {
    if (!p) return 0;
    const fields = ['firstName', 'lastName', 'age', 'city', 'category', 'bio', 'whatsapp', 'email', 'photo', 'education', 'certificates'];
    const filled = fields.filter(f => p[f] && p[f].toString().trim()).length;
    return Math.round((filled / fields.length) * 100);
  };

  // ─── AUTH ERROR ─────────────────────────────────────────────────────────────
  if (authError) {
    return (
      <>
        <Head><title>{t.page_title}</title></Head>
        <div className="register-body">
          <nav className="register-nav"><Link href="/" className="brand">Thai<span>Helper</span></Link></nav>
          <div className="register-container" style={{ maxWidth: '480px' }}>
            <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{t.login_required}</h1>
              <Link href="/login" className="btn-next" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>{t.login_btn}</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Head><title>{t.page_title}</title></Head>
        <div className="register-body">
          <nav className="register-nav"><Link href="/" className="brand">Thai<span>Helper</span></Link></nav>
          <div className="register-container" style={{ maxWidth: '600px' }}>
            <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
              <div style={{ margin: '0 auto 16px', width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
  const completeness = getCompleteness(p);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>{t.page_title}</title></Head>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Top Nav */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', background: 'white', borderBottom: '1px solid #e5e7eb',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <Link href="/" style={{ fontSize: '20px', fontWeight: 800, textDecoration: 'none', color: '#1a1a1a' }}>
            Thai<span style={{ color: '#006a62' }}>Helper</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="lang-toggle" style={{ display: 'flex', gap: '2px', background: '#f3f4f6', borderRadius: '8px', padding: '2px' }}>
              <button onClick={() => changeLang('en')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: lang === 'en' ? 'white' : 'transparent', color: lang === 'en' ? '#1a1a1a' : '#999', boxShadow: lang === 'en' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}>EN</button>
              <button onClick={() => changeLang('th')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: lang === 'th' ? 'white' : 'transparent', color: lang === 'th' ? '#1a1a1a' : '#999', boxShadow: lang === 'th' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}>TH</button>
            </div>
            {/* Profile pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px 4px 4px', background: '#f3f4f6', borderRadius: '20px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: '#e6f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #006a62' }}>
                {photoSrc ? <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '14px' }}>👤</span>}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{p.firstName}</span>
            </div>
            <button onClick={handleLogout} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#666', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{t.logout}</button>
          </div>
        </nav>

        {/* Tab Navigation */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px', display: 'flex', gap: '0' }}>
          {[
            { key: 'dashboard', label: t.tab_dashboard, icon: '📊' },
            { key: 'messages', label: t.tab_messages, icon: '💬' },
            { key: 'profile', label: t.tab_profile, icon: '👤' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (tab.key === 'profile' && editing) cancelEditing(); }}
              style={{
                padding: '14px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                border: 'none', background: 'none',
                color: activeTab === tab.key ? '#006a62' : '#999',
                borderBottom: activeTab === tab.key ? '2px solid #006a62' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ marginRight: '6px' }}>{tab.icon}</span>
              {tab.label}
              {tab.key === 'messages' && (
                <span style={{
                  marginLeft: '6px', fontSize: '10px', padding: '1px 6px', borderRadius: '10px',
                  background: totalUnread > 0 ? '#006a62' : '#f3f4f6',
                  color: totalUnread > 0 ? 'white' : '#999',
                  fontWeight: totalUnread > 0 ? 700 : 400,
                }}>{totalUnread}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>

          {/* Success message */}
          {savedMsg && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#059669', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}>
              {savedMsg}
            </div>
          )}

          {/* ─── DASHBOARD TAB ──────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome */}
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '24px' }}>
                {t.dash_welcome}, {p.firstName}! 👋
              </h1>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <StatCard
                  label={t.dash_status}
                  value={t.dash_status_active}
                  icon="✅"
                  color="#059669"
                  bg="#ecfdf5"
                />
                <StatCard
                  label={t.dash_views}
                  value={t.dash_coming}
                  icon="👁"
                  color="#6366f1"
                  bg="#eef2ff"
                />
                <StatCard
                  label={t.dash_messages}
                  value="0"
                  icon="💬"
                  color="#f59e0b"
                  bg="#fffbeb"
                />
              </div>

              {/* Profile completeness */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>{t.dash_tip_title}</h3>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: completeness === 100 ? '#059669' : '#f59e0b' }}>{completeness}%</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ height: '100%', width: `${completeness}%`, background: completeness === 100 ? '#059669' : '#006a62', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>{t.dash_tip_text}</p>
                <button onClick={() => { setActiveTab('profile'); startEditing(); }} style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  background: '#006a62', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>
                  {t.dash_tip_btn}
                </button>
              </div>

              {/* ─── DOCUMENTS SECTION ──────────────────────────────── */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>📄 {t.doc_title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select value={docType} onChange={e => setDocType(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', background: 'white' }}>
                      <option value="certificate">{t.doc_type_certificate}</option>
                      <option value="id">{t.doc_type_id}</option>
                      <option value="reference">{t.doc_type_reference}</option>
                      <option value="other">{t.doc_type_other}</option>
                    </select>
                    <label style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '12px', fontWeight: 600, cursor: uploadingDoc ? 'wait' : 'pointer', opacity: uploadingDoc ? 0.6 : 1 }}>
                      {uploadingDoc ? t.doc_uploading : t.doc_upload}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleDocUpload} disabled={uploadingDoc} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: '#999', margin: '0 0 16px' }}>{t.doc_max_size}</p>

                {documents.length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#999', textAlign: 'center', padding: '24px 0' }}>{t.doc_empty}</p>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {documents.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
                        <span style={{ fontSize: '24px' }}>{doc.mime_type?.includes('pdf') ? '📑' : '🖼️'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            <span style={{ padding: '1px 6px', borderRadius: '4px', background: '#e6f5f3', color: '#006a62', fontWeight: 600, marginRight: '8px' }}>
                              {t[`doc_type_${doc.file_type}`] || doc.file_type}
                            </span>
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ''}
                            {' · '}{new Date(doc.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button onClick={() => handleDocDelete(doc.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' }} title="Delete">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── REFERENCES SECTION ─────────────────────────────── */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>👥 {t.ref_title}</h3>
                  {!showRefForm && (
                    <button onClick={() => { resetRefForm(); setShowRefForm(true); }} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>+ {t.ref_add}</button>
                  )}
                </div>

                {showRefForm && (
                  <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px' }}>{t.ref_name} *</label>
                        <input type="text" value={refForm.reference_name} onChange={e => setRefForm(prev => ({ ...prev, reference_name: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px' }}>{t.ref_relationship}</label>
                        <select value={refForm.relationship} onChange={e => setRefForm(prev => ({ ...prev, relationship: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', background: 'white' }}>
                          <option value="employer">{t.ref_rel_employer}</option>
                          <option value="colleague">{t.ref_rel_colleague}</option>
                          <option value="trainer">{t.ref_rel_trainer}</option>
                          <option value="other">{t.ref_rel_other}</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '4px' }}>{t.ref_contact}</label>
                        <input type="text" value={refForm.contact_info} onChange={e => setRefForm(prev => ({ ...prev, contact_info: e.target.value }))} placeholder="Email or phone" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>{t.ref_text}</label>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          <button
                            type="button"
                            onClick={() => { setRefInputMode('text'); setRefFile(null); }}
                            style={{ padding: '5px 14px', borderRadius: '6px', border: refInputMode === 'text' ? '2px solid #006a62' : '1px solid #e5e7eb', background: refInputMode === 'text' ? '#e6f5f3' : 'white', color: refInputMode === 'text' ? '#006a62' : '#666', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            ✏️ {lang === 'th' ? 'พิมพ์ข้อความ' : 'Type Text'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRefInputMode('file'); setRefForm(prev => ({ ...prev, reference_text: '' })); }}
                            style={{ padding: '5px 14px', borderRadius: '6px', border: refInputMode === 'file' ? '2px solid #006a62' : '1px solid #e5e7eb', background: refInputMode === 'file' ? '#e6f5f3' : 'white', color: refInputMode === 'file' ? '#006a62' : '#666', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            📄 {lang === 'th' ? 'อัปโหลด PDF' : 'Upload PDF'}
                          </button>
                        </div>
                        {refInputMode === 'text' ? (
                          <textarea value={refForm.reference_text} onChange={e => setRefForm(prev => ({ ...prev, reference_text: e.target.value }))} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
                        ) : (
                          <div style={{ border: '2px dashed #e5e7eb', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                            {refFile ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', color: '#333' }}>📄 {refFile.name}</span>
                                <button type="button" onClick={() => setRefFile(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                              </div>
                            ) : (
                              <label style={{ cursor: 'pointer', display: 'block' }}>
                                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📁</div>
                                <span style={{ fontSize: '13px', color: '#006a62', fontWeight: 600 }}>{lang === 'th' ? 'เลือกไฟล์' : 'Choose file'}</span>
                                <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>PDF, JPG, PNG (max 10 MB)</p>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setRefFile(e.target.files[0] || null)} style={{ display: 'none' }} />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <button onClick={resetRefForm} style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#666', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{t.ref_cancel}</button>
                      <button onClick={handleRefSave} disabled={uploadingRef} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '12px', fontWeight: 600, cursor: uploadingRef ? 'wait' : 'pointer', opacity: uploadingRef ? 0.6 : 1 }}>{uploadingRef ? (lang === 'th' ? 'กำลังบันทึก...' : 'Saving...') : t.ref_save}</button>
                    </div>
                  </div>
                )}

                {references.length === 0 && !showRefForm ? (
                  <p style={{ fontSize: '14px', color: '#999', textAlign: 'center', padding: '24px 0' }}>{t.ref_empty}</p>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {references.map(ref => (
                      <div key={ref.id} style={{ padding: '14px', background: '#f9fafb', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{ref.reference_name}</div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                              <span style={{ padding: '1px 6px', borderRadius: '4px', background: '#eef2ff', color: '#6366f1', fontWeight: 600 }}>
                                {t[`ref_rel_${ref.relationship}`] || ref.relationship}
                              </span>
                              {ref.contact_info && <span style={{ marginLeft: '8px' }}>{ref.contact_info}</span>}
                            </div>
                            {ref.reference_text && (
                              <p style={{ fontSize: '13px', color: '#555', margin: '8px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>{ref.reference_text}</p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button onClick={() => handleRefEdit(ref)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}>✏️</button>
                            <button onClick={() => handleRefDelete(ref.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}>✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Launch info */}
              <div style={{ background: 'linear-gradient(135deg, #006a62, #004d47)', borderRadius: '16px', padding: '28px', color: 'white' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>🚀 {t.dash_launch_title}</h3>
                <p style={{ fontSize: '14px', margin: 0, opacity: 0.9, lineHeight: 1.6 }}>{t.dash_launch_text}</p>
              </div>
            </>
          )}

          {/* ─── MESSAGES TAB ───────────────────────────────────────────── */}
          {activeTab === 'messages' && (
            <>
              {!selectedConv ? (
                <>
                  <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '24px' }}>{t.msg_title}</h1>
                  <ConversationList conversations={conversations} onSelect={openConversation} t={t} />
                </>
              ) : (
                <ConversationDetail
                  conversation={selectedConv}
                  messages={messages}
                  loading={loadingMsgs}
                  msgInput={msgInput}
                  setMsgInput={setMsgInput}
                  onSend={handleSendMessage}
                  sending={sendingMsg}
                  onBack={() => { setSelectedConv(null); setMessages([]); }}
                  t={t}
                />
              )}
            </>
          )}

          {/* ─── PROFILE TAB ────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <>
              {/* Profile Header */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: '#e6f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #006a62' }}>
                      {photoSrc ? <img src={photoSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '32px' }}>👤</span>}
                    </div>
                    {editing && (
                      <label style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#006a62', color: 'white', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', border: '2px solid white' }}>
                        📷<input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>{p.firstName} {p.lastName}</h2>
                    <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px' }}>{p.category} &middot; {p.city}{p.area ? ` — ${p.area}` : ''}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: '#ecfdf5', color: '#059669' }}>{t.verified} ✓</span>
                      <span style={{ fontSize: '11px', color: '#bbb', fontFamily: 'monospace' }}>{t.ref_label}: {p.ref}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit / Save buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px' }}>
                {editing ? (
                  <>
                    <button onClick={cancelEditing} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#666', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{t.cancel_btn}</button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? t.saving : t.save_btn}</button>
                  </>
                ) : (
                  <button onClick={startEditing} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>✏️ {t.edit_btn}</button>
                )}
              </div>

              {saveError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: '#dc2626', fontSize: '13px' }}>{saveError}</div>
              )}

              {/* Profile Details */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb' }}>
                {/* Personal */}
                <SectionTitle>{t.section_personal}</SectionTitle>
                {editing ? (
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '28px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <EditField label="First Name" value={editData.firstName} onChange={v => handleFieldChange('firstName', v)} />
                      <EditField label="Last Name" value={editData.lastName} onChange={v => handleFieldChange('lastName', v)} />
                    </div>
                    <EditField label={t.label_age} value={editData.age} onChange={v => handleFieldChange('age', v)} />
                    <EditField label={t.label_city} value={editData.city} onChange={v => handleFieldChange('city', v)} />
                    <EditField label={t.label_area} value={editData.area} onChange={v => handleFieldChange('area', v)} placeholder="e.g. Sukhumvit, Rawai..." />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px', marginBottom: '28px' }}>
                    <ProfileField label={t.label_name} value={`${p.firstName} ${p.lastName}`} t={t} />
                    <ProfileField label={t.label_age} value={p.age} t={t} />
                    <ProfileField label={t.label_city} value={p.city} t={t} />
                    <ProfileField label={t.label_area} value={p.area} t={t} />
                  </div>
                )}

                {/* Work */}
                <SectionTitle>{t.section_work}</SectionTitle>
                {editing ? (
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '28px' }}>
                    <ProfileField label={t.label_category} value={p.category} t={t} />
                    <ProfileField label={t.label_skills} value={p.skills} t={t} />
                    <EditField label={t.label_experience} value={editData.experience} onChange={v => handleFieldChange('experience', v)} />
                    <EditField label={t.label_languages} value={editData.languages || (p.languages || '')} onChange={v => handleFieldChange('languages', v)} />
                    <EditField label={t.label_rate} value={editData.rate} onChange={v => handleFieldChange('rate', v)} />
                    <EditField label={t.label_education} value={editData.education} onChange={v => handleFieldChange('education', v)} placeholder="e.g. Bachelor's Degree..." />
                    <EditField label={t.label_certificates} value={editData.certificates} onChange={v => handleFieldChange('certificates', v)} placeholder="e.g. First Aid, Childcare..." />
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.label_bio}</label>
                      <textarea value={editData.bio} onChange={e => handleFieldChange('bio', e.target.value)} maxLength={500} rows={5} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
                      <div style={{ fontSize: '11px', color: '#bbb', textAlign: 'right' }}>{(editData.bio || '').length} / 500 {t.chars}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px', marginBottom: '28px' }}>
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

                {/* Contact */}
                <SectionTitle>{t.section_contact}</SectionTitle>
                {editing ? (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <EditField label={t.label_phone} value={editData.whatsapp} onChange={v => handleFieldChange('whatsapp', v)} />
                    <ProfileField label={t.label_email} value={p.email} t={t} />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <ProfileField label={t.label_phone} value={p.whatsapp} t={t} />
                    <ProfileField label={t.label_whatsapp} value={p.hasWhatsApp === 'Yes' ? t.yes : t.no} t={t} />
                    <ProfileField label={t.label_email} value={p.email} t={t} />
                  </div>
                )}
              </div>

              {/* ─── LANGUAGE SETTINGS ──────────────────────────────── */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e5e7eb', marginTop: '16px' }}>
                <SectionTitle>{t.settings_title}</SectionTitle>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '8px' }}>{t.settings_lang}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'th', label: 'ภาษาไทย' },
                      { code: 'ru', label: 'Русский' },
                    ].map(l => (
                      <button
                        key={l.code}
                        onClick={() => handleLanguageChange(l.code)}
                        style={{
                          padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          border: prefLang === l.code ? '2px solid #006a62' : '1px solid #e5e7eb',
                          background: prefLang === l.code ? '#e6f5f3' : 'white',
                          color: prefLang === l.code ? '#006a62' : '#666',
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>{t.settings_lang_hint}</p>
                  {settingsSaved && (
                    <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginTop: '8px' }}>{settingsSaved}</p>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#006a62', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px', marginBottom: '14px' }}>
      {children}
    </h3>
  );
}

function ProfileField({ label, value, t, multiline }) {
  return (
    <div style={{ display: 'flex', flexDirection: multiline ? 'column' : 'row', gap: multiline ? '4px' : '0' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '120px', paddingTop: '2px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: value ? '#333' : '#ccc', lineHeight: 1.5, whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value || t.not_set}</span>
    </div>
  );
}

function EditField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', fontFamily: 'inherit' }} />
    </div>
  );
}
