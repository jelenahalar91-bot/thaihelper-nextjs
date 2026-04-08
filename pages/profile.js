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
    // Nav
    nav_help: 'Help',
    menu_profile: 'Profile',
    menu_settings: 'Settings',
    menu_dashboard: 'Dashboard',
    // Dashboard
    dash_hi_morning: 'Good morning',
    dash_hi_afternoon: 'Good afternoon',
    dash_hi_evening: 'Good evening',
    dash_subtitle_live: 'Your profile is live — families can find you right now.',
    dash_subtitle_incomplete: 'Almost there — finish your profile so families can discover you.',
    dash_status: 'Profile Status',
    dash_status_active: 'Live',
    dash_status_review: 'Under Review',
    dash_stat_messages: 'Messages',
    dash_stat_documents: 'Documents',
    dash_stat_references: 'References',
    dash_stat_unread: 'unread',
    dash_tip_title: 'Profile completeness',
    dash_tip_text: 'Helpers with complete profiles (photo, bio, certificates) get 3× more contact requests from families.',
    dash_tip_btn: 'Edit Profile',
    dash_promo_title: 'Get noticed faster',
    dash_promo_tip1: 'Add a friendly profile photo',
    dash_promo_tip2: 'Write a short bio about yourself',
    dash_promo_tip3: 'Upload certificates & references',
    dash_promo_cta: 'Improve my profile',
    // Messages
    msg_title: 'Your Messages',
    msg_empty_icon: '💬',
    msg_empty_title: 'No messages yet',
    msg_empty_text: 'When families contact you, their messages will appear here.',
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
    doc_type_resume: 'CV / Resume',
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
    msg_translation_failed: 'Message sent, but auto-translation failed. Recipient sees the original text.',
    msg_too_long: 'Message is too long (max {n} characters).',
    msg_send_error: 'Failed to send message. Please try again.',
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
    nav_help: 'ช่วยเหลือ',
    menu_profile: 'โปรไฟล์',
    menu_settings: 'ตั้งค่า',
    menu_dashboard: 'แดชบอร์ด',
    dash_hi_morning: 'อรุณสวัสดิ์',
    dash_hi_afternoon: 'สวัสดีตอนบ่าย',
    dash_hi_evening: 'สวัสดีตอนเย็น',
    dash_subtitle_live: 'โปรไฟล์ของคุณเปิดใช้งานแล้ว — ครอบครัวสามารถค้นหาคุณได้ทันที',
    dash_subtitle_incomplete: 'ใกล้เสร็จแล้ว — ทำโปรไฟล์ให้สมบูรณ์เพื่อให้ครอบครัวค้นพบคุณ',
    dash_status: 'สถานะโปรไฟล์',
    dash_status_active: 'เปิดใช้งาน',
    dash_status_review: 'กำลังตรวจสอบ',
    dash_stat_messages: 'ข้อความ',
    dash_stat_documents: 'เอกสาร',
    dash_stat_references: 'ข้อมูลอ้างอิง',
    dash_stat_unread: 'ยังไม่ได้อ่าน',
    dash_tip_title: 'ความสมบูรณ์ของโปรไฟล์',
    dash_tip_text: 'ผู้ช่วยที่มีโปรไฟล์สมบูรณ์ (รูปภาพ, เกี่ยวกับตัวเอง, ใบรับรอง) ได้รับการติดต่อจากครอบครัวมากขึ้น 3 เท่า',
    dash_tip_btn: 'แก้ไขโปรไฟล์',
    dash_promo_title: 'ทำให้คุณโดดเด่นเร็วขึ้น',
    dash_promo_tip1: 'เพิ่มรูปโปรไฟล์ที่เป็นมิตร',
    dash_promo_tip2: 'เขียนแนะนำตัวสั้นๆ เกี่ยวกับคุณ',
    dash_promo_tip3: 'อัปโหลดใบรับรองและข้อมูลอ้างอิง',
    dash_promo_cta: 'ปรับปรุงโปรไฟล์ของฉัน',
    msg_title: 'ข้อความของคุณ',
    msg_empty_icon: '💬',
    msg_empty_title: 'ยังไม่มีข้อความ',
    msg_empty_text: 'เมื่อครอบครัวติดต่อคุณ ข้อความจะปรากฏที่นี่',
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
    doc_type_resume: 'ประวัติย่อ (CV)',
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
    msg_translation_failed: 'ส่งข้อความแล้ว แต่การแปลอัตโนมัติล้มเหลว ผู้รับจะเห็นข้อความต้นฉบับ',
    msg_too_long: 'ข้อความยาวเกินไป (สูงสุด {n} ตัวอักษร)',
    msg_send_error: 'ส่งข้อความไม่สำเร็จ กรุณาลองอีกครั้ง',
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
  const [msgToast, setMsgToast] = useState(''); // translation-failed / error banner
  // Settings
  const [prefLang, setPrefLang] = useState('en');
  const [settingsSaved, setSettingsSaved] = useState('');
  // Menu dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  // Responsive breakpoint
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('[data-profile-menu]')) setMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert(t.photo_size_err); e.target.value = ''; return; }

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    // Upload to Supabase Storage via API
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/photo', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Photo upload failed');
      }
      const { url } = await res.json();
      setPhotoPreview(url);
      setEditData(prev => ({ ...prev, photo: url }));
    } catch (err) {
      alert(err.message);
      setPhotoPreview('');
    }
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
      if (res.translationFailed) {
        setMsgToast(t.msg_translation_failed || 'Message sent, but auto-translation failed.');
        setTimeout(() => setMsgToast(''), 5000);
      }
    } catch (err) {
      if (err.code === 'message_too_long') {
        setMsgToast(
          (t.msg_too_long || 'Message is too long (max {n} characters).').replace('{n}', err.max || 4000)
        );
      } else {
        setMsgToast(t.msg_send_error || 'Failed to send message.');
      }
      setTimeout(() => setMsgToast(''), 5000);
    } finally {
      setSendingMsg(false);
    }
  };

  // ── Messaging polling ───────────────────────────────────────────────
  // Refresh conversation list every 15s while on Messages tab (and no
  // conversation is open) so new incoming messages appear live.
  useEffect(() => {
    if (activeTab !== 'messages') return;
    if (selectedConv) return;
    const id = setInterval(async () => {
      try {
        const data = await fetchConversations();
        setConversations(data.conversations || []);
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(id);
  }, [activeTab, selectedConv]);

  // Poll the open conversation's messages every 10s for live replies
  useEffect(() => {
    if (!selectedConv) return;
    const id = setInterval(async () => {
      try {
        const res = await fetchMessages(selectedConv.id);
        setMessages(res.messages || []);
      } catch { /* ignore */ }
    }, 10000);
    return () => clearInterval(id);
  }, [selectedConv]);

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
  // Counts core profile fields + at least one uploaded document + at least one
  // reference. WhatsApp is no longer a separate contact channel (on-platform
  // messaging only), and the free-text "certificates" field is replaced by
  // actual document uploads.
  const getCompleteness = (p) => {
    if (!p) return 0;
    const coreFields = ['firstName', 'lastName', 'age', 'city', 'category', 'bio', 'email', 'photo', 'education'];
    const filledCore = coreFields.filter(f => p[f] && p[f].toString().trim()).length;
    const hasDoc = documents.length > 0 ? 1 : 0;
    const hasRef = references.length > 0 ? 1 : 0;
    const total = coreFields.length + 2; // +1 doc, +1 ref
    return Math.round(((filledCore + hasDoc + hasRef) / total) * 100);
  };

  // ─── AUTH ERROR ─────────────────────────────────────────────────────────────
  if (authError) {
    return (
      <>
        <Head><title>{t.page_title}</title><meta name="robots" content="noindex, nofollow" /></Head>
        <div className="register-body">
          <nav className="register-nav"><Link href="/" className="brand">Thai<span>Helper</span></Link></nav>
          <div className="register-container" style={{ maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ marginBottom: '16px', color: '#006a62', display: 'flex', justifyContent: 'center' }}><IconLock /></div>
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
        <Head><title>{t.page_title}</title><meta name="robots" content="noindex, nofollow" /></Head>
        <div className="register-body">
          <nav className="register-nav"><Link href="/" className="brand">Thai<span>Helper</span></Link></nav>
          <div className="register-container" style={{ maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
              <div style={{ margin: '0 auto 16px', width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid #006a62', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
      <Head><title>{t.page_title}</title><meta name="robots" content="noindex, nofollow" /></Head>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Top Nav – Putzperle style */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '14px 18px' : '18px 40px',
          background: 'white', borderBottom: '1px solid #e5e7eb',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button
            onClick={() => { setActiveTab('dashboard'); if (editing) cancelEditing(); }}
            style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', color: '#1a1a1a', padding: 0, letterSpacing: '-0.5px' }}
          >
            Thai<span style={{ color: '#006a62' }}>Helper</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '18px' : '36px' }}>
            {/* Help */}
            <a
              href="mailto:support@thaihelper.app"
              aria-label={t.nav_help}
              style={{ fontSize: '16px', fontWeight: 500, color: '#374151', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <IconHelp />
              {!isMobile && t.nav_help}
            </a>

            {/* Messages */}
            <button
              onClick={() => { setActiveTab('messages'); if (editing) cancelEditing(); }}
              aria-label={t.tab_messages}
              style={{
                position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '16px', fontWeight: 500,
                color: activeTab === 'messages' ? '#006a62' : '#374151',
                display: 'flex', alignItems: 'center', gap: '8px', padding: 0,
              }}
            >
              <IconMessage />
              {!isMobile && t.tab_messages}
              {totalUnread > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: isMobile ? '-8px' : '-12px',
                  minWidth: '18px', height: '18px', borderRadius: '9px',
                  background: '#dc2626', color: 'white',
                  fontSize: '11px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px', border: '2px solid white',
                }}>{totalUnread}</span>
              )}
            </button>

            {/* Profile avatar with dropdown */}
            <div data-profile-menu style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
                style={{
                  width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden',
                  background: '#e6f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #006a62', cursor: 'pointer', padding: 0,
                }}
                aria-label="Profile menu"
              >
                {photoSrc ? (
                  <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#006a62' }}>
                    {(p.firstName || '').charAt(0).toUpperCase()}{(p.lastName || '').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                  minWidth: isMobile ? '260px' : '280px',
                  maxWidth: 'calc(100vw - 32px)',
                  background: 'white',
                  borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
                  border: '1px solid #e5e7eb', overflow: 'hidden', zIndex: 100,
                }}>
                  {/* User info header */}
                  <div style={{ padding: '20px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', background: '#e6f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #006a62', flexShrink: 0 }}>
                      {photoSrc ? (
                        <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#006a62' }}>
                          {(p.firstName || '').charAt(0).toUpperCase()}{(p.lastName || '').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.firstName} {p.lastName}</div>
                      {p.email && <div style={{ fontSize: '13px', color: '#999', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>}
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '8px 0' }}>
                    <MenuItem icon={<IconDashboard />} label={t.menu_dashboard} onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); if (editing) cancelEditing(); }} />
                    <MenuItem icon={<IconUser />} label={t.menu_profile} onClick={() => { setActiveTab('profile'); setMenuOpen(false); }} />
                    <MenuItem icon={<IconSettings />} label={t.menu_settings} onClick={() => { setActiveTab('settings'); setMenuOpen(false); if (editing) cancelEditing(); }} />

                    {/* Language quick switch */}
                    <div style={{ padding: '12px 22px 10px', borderTop: '1px solid #f3f4f6', marginTop: '6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Language</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[{ c: 'en', l: 'EN' }, { c: 'th', l: 'TH' }, { c: 'ru', l: 'RU' }].map(x => (
                          <button
                            key={x.c}
                            onClick={() => changeLang(x.c)}
                            style={{
                              flex: 1, padding: '8px 12px', borderRadius: '8px',
                              border: lang === x.c ? '2px solid #006a62' : '1px solid #e5e7eb',
                              background: lang === x.c ? '#e6f5f3' : 'white',
                              color: lang === x.c ? '#006a62' : '#666',
                              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                            }}
                          >{x.l}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f3f4f6', marginTop: '6px' }}>
                      <MenuItem icon={<IconLogout />} label={t.logout} onClick={handleLogout} danger />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Content */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '18px 14px' : '24px 16px' }}>

          {/* Success message */}
          {savedMsg && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#059669', fontSize: '15px', textAlign: 'center', fontWeight: 600 }}>
              {savedMsg}
            </div>
          )}

          {/* ─── DASHBOARD TAB ──────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <>
              {/* Hero card – gradient with greeting + ring */}
              <div style={{
                position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, #006a62 0%, #00897e 50%, #00b29c 100%)',
                borderRadius: '20px',
                padding: isMobile ? '22px 22px 24px' : '32px 36px',
                marginBottom: '20px',
                color: 'white',
                boxShadow: '0 12px 32px rgba(0, 106, 98, 0.25)',
              }}>
                {/* Decorative blobs */}
                <div aria-hidden style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div aria-hidden style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: isMobile ? '16px' : '28px', flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7dffb0', boxShadow: '0 0 0 3px rgba(125,255,176,0.3)' }} />
                      {t.dash_status_active} · {p.helper_ref || p.ref || ''}
                    </div>
                    <h1 style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
                      {getGreeting(t)}, {p.firstName} 👋
                    </h1>
                    <p style={{ fontSize: isMobile ? '14px' : '15px', margin: 0, opacity: 0.92, lineHeight: 1.5, maxWidth: '460px' }}>
                      {completeness === 100 ? t.dash_subtitle_live : t.dash_subtitle_incomplete}
                    </p>
                  </div>

                  {/* Completeness ring */}
                  <CompletenessRing percent={completeness} />
                </div>
              </div>

              {/* Stats row – real metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? '8px' : '12px', marginBottom: '20px' }}>
                <MiniStat
                  label={t.dash_stat_messages}
                  value={conversations.length}
                  badge={totalUnread > 0 ? `${totalUnread} ${t.dash_stat_unread}` : null}
                  icon={<IconMessage />}
                  accent="#006a62"
                  bg="#e6f5f3"
                  onClick={() => setActiveTab('messages')}
                  isMobile={isMobile}
                />
                <MiniStat
                  label={t.dash_stat_documents}
                  value={documents.length}
                  icon={<IconFile size={20} />}
                  accent="#6366f1"
                  bg="#eef2ff"
                  isMobile={isMobile}
                />
                <MiniStat
                  label={t.dash_stat_references}
                  value={references.length}
                  icon={<IconUser />}
                  accent="#f59e0b"
                  bg="#fef3c7"
                  isMobile={isMobile}
                />
              </div>

              {/* Profile completeness */}
              <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px' : '24px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>{t.dash_tip_title}</h3>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: completeness === 100 ? '#059669' : '#f59e0b' }}>{completeness}%</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ height: '100%', width: `${completeness}%`, background: completeness === 100 ? '#059669' : '#006a62', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>{t.dash_tip_text}</p>
                <button onClick={() => { setActiveTab('profile'); startEditing(); }} style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  background: '#006a62', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>
                  {t.dash_tip_btn}
                </button>
              </div>

              {/* ─── DOCUMENTS SECTION ──────────────────────────────── */}
              <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px' : '24px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>{t.doc_title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', width: '100%' }}>
                  <select value={docType} onChange={e => setDocType(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', background: 'white' }}>
                    <option value="certificate">{t.doc_type_certificate}</option>
                    <option value="resume">{t.doc_type_resume}</option>
                    <option value="id">{t.doc_type_id}</option>
                    <option value="reference">{t.doc_type_reference}</option>
                    <option value="other">{t.doc_type_other}</option>
                  </select>
                  <label style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '14px', fontWeight: 600, cursor: uploadingDoc ? 'wait' : 'pointer', opacity: uploadingDoc ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {uploadingDoc ? t.doc_uploading : t.doc_upload}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleDocUpload} disabled={uploadingDoc} style={{ display: 'none' }} />
                  </label>
                </div>
                <p style={{ fontSize: '12px', color: '#999', margin: '0 0 16px' }}>{t.doc_max_size}</p>

                {documents.length === 0 ? (
                  <p style={{ fontSize: '15px', color: '#999', textAlign: 'center', padding: '24px 0' }}>{t.doc_empty}</p>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {documents.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#f9fafb', borderRadius: '10px' }}>
                        <span style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e6f5f3', color: '#006a62', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {doc.mime_type?.includes('pdf') ? <IconFile size={22} /> : <IconImage size={22} />}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
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
              <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px' : '24px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>{t.ref_title}</h3>
                  {!showRefForm && (
                    <button onClick={() => { resetRefForm(); setShowRefForm(true); }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>+ {t.ref_add}</button>
                  )}
                </div>

                {showRefForm && (
                  <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '4px' }}>{t.ref_name} *</label>
                        <input type="text" value={refForm.reference_name} onChange={e => setRefForm(prev => ({ ...prev, reference_name: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '15px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '4px' }}>{t.ref_relationship}</label>
                        <select value={refForm.relationship} onChange={e => setRefForm(prev => ({ ...prev, relationship: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '15px', background: 'white' }}>
                          <option value="employer">{t.ref_rel_employer}</option>
                          <option value="colleague">{t.ref_rel_colleague}</option>
                          <option value="trainer">{t.ref_rel_trainer}</option>
                          <option value="other">{t.ref_rel_other}</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '4px' }}>{t.ref_contact}</label>
                        <input type="text" value={refForm.contact_info} onChange={e => setRefForm(prev => ({ ...prev, contact_info: e.target.value }))} placeholder="Email or phone" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '15px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>{t.ref_text}</label>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          <button
                            type="button"
                            onClick={() => { setRefInputMode('text'); setRefFile(null); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', border: refInputMode === 'text' ? '2px solid #006a62' : '1px solid #e5e7eb', background: refInputMode === 'text' ? '#e6f5f3' : 'white', color: refInputMode === 'text' ? '#006a62' : '#666', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            <IconType size={14} /> {lang === 'th' ? 'พิมพ์ข้อความ' : 'Type Text'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRefInputMode('file'); setRefForm(prev => ({ ...prev, reference_text: '' })); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', border: refInputMode === 'file' ? '2px solid #006a62' : '1px solid #e5e7eb', background: refInputMode === 'file' ? '#e6f5f3' : 'white', color: refInputMode === 'file' ? '#006a62' : '#666', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            <IconUpload size={14} /> {lang === 'th' ? 'อัปโหลด PDF' : 'Upload PDF'}
                          </button>
                        </div>
                        {refInputMode === 'text' ? (
                          <textarea value={refForm.reference_text} onChange={e => setRefForm(prev => ({ ...prev, reference_text: e.target.value }))} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit' }} />
                        ) : (
                          <div style={{ border: '2px dashed #e5e7eb', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                            {refFile ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#333' }}>
                                <IconFile size={16} />
                                <span style={{ fontSize: '15px' }}>{refFile.name}</span>
                                <button type="button" onClick={() => setRefFile(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', marginLeft: '4px' }}>✕</button>
                              </div>
                            ) : (
                              <label style={{ cursor: 'pointer', display: 'block' }}>
                                <div style={{ color: '#006a62', marginBottom: '6px', display: 'flex', justifyContent: 'center' }}><IconFolderOpen /></div>
                                <span style={{ fontSize: '15px', color: '#006a62', fontWeight: 600 }}>{lang === 'th' ? 'เลือกไฟล์' : 'Choose file'}</span>
                                <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>PDF, JPG, PNG (max 10 MB)</p>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setRefFile(e.target.files[0] || null)} style={{ display: 'none' }} />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <button onClick={resetRefForm} style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#666', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{t.ref_cancel}</button>
                      <button onClick={handleRefSave} disabled={uploadingRef} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '13px', fontWeight: 600, cursor: uploadingRef ? 'wait' : 'pointer', opacity: uploadingRef ? 0.6 : 1 }}>{uploadingRef ? (lang === 'th' ? 'กำลังบันทึก...' : 'Saving...') : t.ref_save}</button>
                    </div>
                  </div>
                )}

                {references.length === 0 && !showRefForm ? (
                  <p style={{ fontSize: '15px', color: '#999', textAlign: 'center', padding: '24px 0' }}>{t.ref_empty}</p>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {references.map(ref => (
                      <div key={ref.id} style={{ padding: '14px', background: '#f9fafb', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#333' }}>{ref.reference_name}</div>
                            <div style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>
                              <span style={{ padding: '1px 6px', borderRadius: '4px', background: '#eef2ff', color: '#6366f1', fontWeight: 600 }}>
                                {t[`ref_rel_${ref.relationship}`] || ref.relationship}
                              </span>
                              {ref.contact_info && <span style={{ marginLeft: '8px' }}>{ref.contact_info}</span>}
                            </div>
                            {ref.reference_text && (
                              <p style={{ fontSize: '14px', color: '#555', margin: '8px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>{ref.reference_text}</p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button onClick={() => handleRefEdit(ref)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#666', display: 'flex', alignItems: 'center' }} title="Edit"><IconEdit size={16} /></button>
                            <button onClick={() => handleRefDelete(ref.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Get noticed faster – tips card */}
              {completeness < 100 && (
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                  borderRadius: '16px',
                  padding: isMobile ? '22px' : '28px',
                  border: '1px solid #fed7aa',
                }}>
                  <div aria-hidden style={{ position: 'absolute', top: '-30px', right: '-30px', fontSize: '120px', opacity: 0.12 }}>✨</div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 14px', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✨</span> {t.dash_promo_title}
                  </h3>
                  <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'grid', gap: '10px' }}>
                    {[t.dash_promo_tip1, t.dash_promo_tip2, t.dash_promo_tip3].map((tip, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#7c2d12' }}>
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>✓</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => { setActiveTab('profile'); startEditing(); }} style={{
                    padding: '10px 22px', borderRadius: '10px', border: 'none',
                    background: '#f97316', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                  }}>
                    {t.dash_promo_cta}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── MESSAGES TAB ───────────────────────────────────────────── */}
          {activeTab === 'messages' && (
            <>
              {msgToast && (
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  color: '#9a3412',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}>
                  <span>{msgToast}</span>
                  <button
                    onClick={() => setMsgToast('')}
                    style={{
                      background: 'none', border: 'none', color: '#9a3412',
                      cursor: 'pointer', fontSize: '18px', padding: 0, lineHeight: 1,
                    }}
                  >×</button>
                </div>
              )}
              {!selectedConv ? (
                <>
                  <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '24px' }}>{t.msg_title}</h1>
                  <ConversationList conversations={conversations} onSelect={openConversation} t={t} />
                </>
              ) : (
                <ConversationDetail
                  conversation={selectedConv}
                  messages={messages}
                  currentRole="helper"
                  canSend={true}
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
              {/* Page title — matches Dashboard h1 scale */}
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '24px' }}>
                {t.tab_profile}
              </h1>

              {/* Profile Header */}
              <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '22px' : '28px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '14px' : '20px' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: isMobile ? '72px' : '88px', height: isMobile ? '72px' : '88px', borderRadius: '50%', overflow: 'hidden', background: '#e6f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #006a62' }}>
                      {photoSrc ? <img src={photoSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 700, color: '#006a62' }}>{(p.firstName || '').charAt(0).toUpperCase()}{(p.lastName || '').charAt(0).toUpperCase()}</span>}
                    </div>
                    {editing && (
                      <label style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#006a62', color: 'white', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '15px', border: '2px solid white' }}>
                        <svg {...iconProps} width="14" height="14"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: isMobile ? '19px' : '22px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px', wordBreak: 'break-word' }}>{p.firstName} {p.lastName}</h2>
                    <p style={{ fontSize: isMobile ? '14px' : '15px', color: '#666', margin: '0 0 10px' }}>{p.category} &middot; {p.city}{p.area ? ` — ${p.area}` : ''}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#ecfdf5', color: '#059669' }}>{t.verified} ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit / Save buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px', gap: '8px' }}>
                {editing ? (
                  <>
                    <button onClick={cancelEditing} style={{ padding: '10px 22px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#666', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{t.cancel_btn}</button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? t.saving : t.save_btn}</button>
                  </>
                ) : (
                  <button onClick={startEditing} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#006a62', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{t.edit_btn}</button>
                )}
              </div>

              {saveError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', color: '#dc2626', fontSize: '15px' }}>{saveError}</div>
              )}

              {/* Profile Details */}
              <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '22px' : '28px', border: '1px solid #e5e7eb' }}>
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
                  <div style={{ display: 'grid', gap: isMobile ? '16px' : '10px', marginBottom: '28px' }}>
                    <ProfileField label={t.label_name} value={`${p.firstName} ${p.lastName}`} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_age} value={p.age} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_city} value={p.city} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_area} value={p.area} t={t} isMobile={isMobile} />
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.label_bio}</label>
                      <textarea value={editData.bio} onChange={e => handleFieldChange('bio', e.target.value)} maxLength={500} rows={5} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                      <div style={{ fontSize: '13px', color: '#bbb', textAlign: 'right', marginTop: '4px' }}>{(editData.bio || '').length} / 500 {t.chars}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: isMobile ? '16px' : '10px', marginBottom: '28px' }}>
                    <ProfileField label={t.label_category} value={p.category} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_skills} value={p.skills} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_experience} value={p.experience} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_languages} value={(() => { const v = Array.isArray(p.languages) ? p.languages.join(', ') : (p.languages || ''); return v.includes('[Ljava.lang') ? '' : v; })()} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_rate} value={p.rate} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_education} value={p.education} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_certificates} value={p.certificates} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_bio} value={p.bio} t={t} multiline isMobile={isMobile} />
                  </div>
                )}

                {/* Contact */}
                <SectionTitle>{t.section_contact}</SectionTitle>
                {editing ? (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <EditField label={t.label_phone} value={editData.whatsapp} onChange={v => handleFieldChange('whatsapp', v)} />
                    <ProfileField label={t.label_email} value={p.email} t={t} isMobile={isMobile} />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: isMobile ? '16px' : '10px' }}>
                    <ProfileField label={t.label_phone} value={p.whatsapp} t={t} isMobile={isMobile} />
                    <ProfileField label={t.label_email} value={p.email} t={t} isMobile={isMobile} />
                  </div>
                )}
              </div>

            </>
          )}

          {/* ─── SETTINGS TAB ───────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '24px' }}>
                {t.settings_title}
              </h1>

              <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '22px' : '28px', border: '1px solid #e5e7eb' }}>
                <SectionTitle>{t.settings_lang}</SectionTitle>
                <p style={{ fontSize: '15px', color: '#666', margin: '0 0 16px', lineHeight: 1.6 }}>{t.settings_lang_hint}</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'th', label: 'ภาษาไทย' },
                    { code: 'ru', label: 'Русский' },
                  ].map(l => (
                    <button
                      key={l.code}
                      onClick={() => handleLanguageChange(l.code)}
                      style={{
                        padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                        border: prefLang === l.code ? '2px solid #006a62' : '1px solid #e5e7eb',
                        background: prefLang === l.code ? '#e6f5f3' : 'white',
                        color: prefLang === l.code ? '#006a62' : '#666',
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                {settingsSaved && (
                  <p style={{ fontSize: '15px', color: '#059669', fontWeight: 600, marginTop: '14px' }}>{settingsSaved}</p>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
        padding: '12px 22px', border: 'none', background: 'none',
        cursor: 'pointer', fontSize: '15px', fontWeight: 500,
        color: danger ? '#dc2626' : '#374151', textAlign: 'left',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
    >
      <span style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: danger ? '#dc2626' : '#4b5563' }}>{icon}</span>
      {label}
    </button>
  );
}

// ─── ICONS (Lucide-style inline SVG) ─────────────────────────────────────────
const iconProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function IconHelp() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconMessage() {
  return (
    <svg {...iconProps}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconDashboard() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg {...iconProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg {...iconProps}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg {...iconProps}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg {...iconProps} width="48" height="48">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconFile({ size = 22 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconImage({ size = 22 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
function IconEdit({ size = 16 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconType({ size = 16 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}
function IconUpload({ size = 16 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function IconFolderOpen() {
  return (
    <svg {...iconProps} width="28" height="28">
      <path d="M6 14l1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// Time-aware greeting (server-rendered safe: defaults to morning, hydrates on client)
function getGreeting(t) {
  if (typeof window === 'undefined') return t.dash_hi_morning;
  const h = new Date().getHours();
  if (h < 12) return t.dash_hi_morning;
  if (h < 18) return t.dash_hi_afternoon;
  return t.dash_hi_evening;
}

function CompletenessRing({ percent }) {
  const size = 96;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.22)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="white" strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{percent}%</div>
        <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.85, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px' }}>complete</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, badge, icon, accent, bg, onClick, isMobile }) {
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        background: 'white', borderRadius: '14px',
        padding: isMobile ? '14px 12px' : '18px 18px',
        border: '1px solid #e5e7eb',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '8px' : '12px' }}>
        <span style={{ width: isMobile ? '32px' : '36px', height: isMobile ? '32px' : '36px', borderRadius: '10px', background: bg, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
        {badge && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', background: '#dc2626', padding: '3px 8px', borderRadius: '999px' }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</span>
      </div>
      <div style={{ fontSize: '13px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '17px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#006a62', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px', marginBottom: '18px' }}>
      {children}
    </h3>
  );
}

function ProfileField({ label, value, t, multiline, isMobile }) {
  const stack = multiline || isMobile;
  return (
    <div style={{ display: 'flex', flexDirection: stack ? 'column' : 'row', gap: stack ? '4px' : '0' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: stack ? 'auto' : '140px', paddingTop: '2px' }}>{label}</span>
      <span style={{ fontSize: '15px', color: value ? '#1a1a1a' : '#ccc', lineHeight: 1.6, whiteSpace: multiline ? 'pre-wrap' : 'normal', wordBreak: 'break-word' }}>{value || t.not_set}</span>
    </div>
  );
}

function EditField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '15px', fontFamily: 'inherit' }} />
    </div>
  );
}
