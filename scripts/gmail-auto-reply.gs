/**
 * ThaiHelper — Auto-Antwort auf Agentur-Anfragen im Gmail-Postfach.
 *
 * Läuft als Google Apps Script im Konto jelenahalar91@gmail.com, per
 * Zeit-Trigger alle 10 Minuten. Setup-Anleitung: scripts/gmail-auto-reply.md
 *
 * Zwei Fälle werden erkannt:
 *   FAMILY  — Familie sucht Personal und hält uns für eine Agentur
 *   HELPER  — jemand bewirbt sich per Mail als Nanny/Housekeeper/etc.
 *
 * WICHTIG: DRY_RUN steht auf true. Solange das so ist, wird KEINE Mail
 * versendet — Treffer werden nur gelabelt und geloggt. Erst nach ein paar
 * Tagen Beobachtung auf false stellen.
 */

// ---------------------------------------------------------------- Einstellungen

var DRY_RUN = true;               // true = nur labeln, nichts senden
var MAX_REPLIES_PER_DAY = 10;     // Notbremse gegen Schleifen
var COOLDOWN_DAYS = 30;           // nie 2x an dieselbe Adresse innerhalb X Tagen
var LOOKBACK = 'newer_than:2d';   // wie weit zurück gesucht wird

var LABEL_REPLIED = 'ThaiHelper/auto-beantwortet';
var LABEL_CANDIDATE = 'ThaiHelper/auto-kandidat';   // nur im DRY_RUN
var LABEL_SKIPPED = 'ThaiHelper/auto-uebersprungen';

var SIGNATURE_NAME = 'Jelena';

// Adressen, die nie eine Auto-Antwort bekommen (eigene, Dienste, Bekannte)
var NEVER_REPLY = [
  'jelenahalar91@gmail.com',
  'noreply', 'no-reply', 'donotreply', 'do-not-reply',
  'mailer-daemon', 'postmaster', 'bounce',
  'resend.com', 'supabase.io', 'vercel.com', 'google.com',
  'trustpilot.com', 'twilio.com', 'facebookmail.com', 'stripe.com'
];

// ---------------------------------------------------------------- Erkennung

// Rollen — mindestens eine muss vorkommen
var ROLE_WORDS = [
  'nanny', 'nannies', 'housekeeper', 'housekeeping', 'maid', 'cleaner',
  'cleaning lady', 'driver', 'chef', 'cook', 'caregiver', 'caretaker',
  'babysitter', 'au pair', 'tutor', 'helper', 'domestic', 'house help',
  'แม่บ้าน', 'พี่เลี้ยง', 'คนขับรถ', 'แม่ครัว', 'ผู้ดูแล'
];

// Familie sucht Personal
var FAMILY_WORDS = [
  'looking for', 'in search of', 'do you have', 'have anyone',
  'anyone available', 'anyone suitable', 'can you provide', 'can you find',
  'we need', 'i need', 'we are seeking', 'place someone', 'placement',
  'your agency', 'agency fee', 'agency fees', 'your fees', 'your rates',
  'service fee', 'commission', 'how much do you charge', 'what do you charge',
  'ต้องการหา', 'หาแม่บ้าน', 'ค่าบริการ', 'ค่านายหน้า'
];

// Jemand bewirbt sich
var HELPER_WORDS = [
  'i am looking for a job', 'looking for work', 'looking for a job',
  'apply for', 'my application', 'my cv', 'my resume', 'attached is my',
  'i would like to work', 'i want to work', 'i can work', 'years of experience',
  'i am a nanny', 'i am a housekeeper', 'i am a maid', 'available to start',
  'หางาน', 'สมัครงาน', 'อยากทำงาน', 'ประสบการณ์'
];

// ---------------------------------------------------------------- Hauptlauf

function autoReplyRun() {
  var query = 'in:inbox is:unread ' + LOOKBACK +
              ' -label:' + LABEL_REPLIED.replace(/\//g, '-') +
              ' -label:' + LABEL_SKIPPED.replace(/\//g, '-');

  var threads = GmailApp.search(query, 0, 25);
  var sentToday = getSentToday_();
  var log = [];

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var msgs = thread.getMessages();
    var msg = msgs[0];
    var from = msg.getFrom();
    var addr = extractAddress_(from);

    var decision = classify_(thread, msgs, msg, addr);

    if (decision.action === 'skip') {
      log.push('SKIP  ' + addr + ' — ' + decision.reason);
      continue;
    }

    if (sentToday >= MAX_REPLIES_PER_DAY) {
      log.push('STOP  Tageslimit ' + MAX_REPLIES_PER_DAY + ' erreicht');
      break;
    }

    if (DRY_RUN) {
      label_(thread, LABEL_CANDIDATE);
      log.push('DRY   ' + addr + ' → hätte "' + decision.kind + '" geantwortet');
      continue;
    }

    var body = decision.kind === 'FAMILY' ? familyReply_() : helperReply_();
    msg.reply(body.text, { htmlBody: body.html, name: SIGNATURE_NAME });

    label_(thread, LABEL_REPLIED);
    rememberAddress_(addr);
    sentToday++;
    log.push('SENT  ' + addr + ' — ' + decision.kind);
  }

  setSentToday_(sentToday);
  if (log.length) Logger.log(log.join('\n'));
}

// ---------------------------------------------------------------- Klassifikation

function classify_(thread, msgs, msg, addr) {
  // 1. Absender auf der Nie-Liste
  for (var i = 0; i < NEVER_REPLY.length; i++) {
    if (addr.indexOf(NEVER_REPLY[i]) !== -1) {
      return { action: 'skip', reason: 'Absender auf Nie-Liste' };
    }
  }

  // 2. Automatische Mails / Newsletter — Schleifenschutz
  var raw = msg.getRawContent().slice(0, 4000).toLowerCase();
  if (raw.indexOf('auto-submitted:') !== -1 && raw.indexOf('auto-submitted: no') === -1) {
    return { action: 'skip', reason: 'auto-submitted Header' };
  }
  if (raw.indexOf('list-unsubscribe:') !== -1 || raw.indexOf('precedence: bulk') !== -1) {
    return { action: 'skip', reason: 'Newsletter/Bulk-Header' };
  }

  // 3. Im Thread wurde schon geantwortet — dann läuft ein echtes Gespräch
  if (msgs.length > 1) {
    return { action: 'skip', reason: 'Thread hat schon Antworten' };
  }

  // 4. Dieselbe Adresse hatte kürzlich schon eine Auto-Antwort
  if (repliedRecently_(addr)) {
    return { action: 'skip', reason: 'Cooldown, hatte schon eine Auto-Antwort' };
  }

  // 5. Inhalt prüfen
  var text = (msg.getSubject() + ' ' + msg.getPlainBody()).toLowerCase();

  if (!hasAny_(text, ROLE_WORDS)) {
    return { action: 'skip', reason: 'keine Rolle erkannt' };
  }
  if (hasAny_(text, HELPER_WORDS)) {
    return { action: 'reply', kind: 'HELPER' };
  }
  if (hasAny_(text, FAMILY_WORDS)) {
    return { action: 'reply', kind: 'FAMILY' };
  }
  return { action: 'skip', reason: 'Rolle ja, aber keine klare Absicht' };
}

function hasAny_(text, words) {
  for (var i = 0; i < words.length; i++) {
    if (text.indexOf(words[i]) !== -1) return true;
  }
  return false;
}

// ---------------------------------------------------------------- Antworttexte

function familyReply_() {
  var text =
    'Hello,\n\n' +
    'thank you for reaching out.\n\n' +
    'ThaiHelper is not an agency, so there are no agency fees \u2014 we are a ' +
    'platform where families contact household professionals directly. You ' +
    'create a free family account, filter by city and role, and message the ' +
    'people you are interested in:\n\n' +
    'www.thaihelper.app/employer-register\n' +
    'www.thaihelper.app/helpers\n\n' +
    'If you would rather have an agency handle the hiring for you, you will ' +
    'find agencies listed here: www.thaihelper.app/directory\n\n' +
    'If you have a question about the platform itself, just reply to this email ' +
    'and I will come back to you personally.\n\n' +
    'Best regards\n' + SIGNATURE_NAME + '\nThaiHelper\nwww.thaihelper.app';

  return { text: text, html: toHtml_(text) };
}

function helperReply_() {
  var text =
    'Hello,\n\n' +
    'thank you for your message.\n\n' +
    'We do not place people ourselves — ThaiHelper is a platform where families ' +
    'search for household professionals and contact them directly. So the way ' +
    'to be found is to create your own free profile:\n\n' +
    'www.thaihelper.app/register\n\n' +
    'It takes a few minutes. Add a photo, your experience, the city you work in ' +
    'and your availability — profiles with a photo and a few lines about ' +
    'yourself get contacted much more often. Once your email is confirmed, ' +
    'families can see you and write to you directly.\n\n' +
    'Sending your CV to this address will not reach any families, so please do ' +
    'register on the site instead.\n\n' +
    'Best regards\n' + SIGNATURE_NAME + '\nThaiHelper\nwww.thaihelper.app';

  return { text: text, html: toHtml_(text) };
}

function toHtml_(text) {
  var html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(www\.thaihelper\.app[^\s]*)/g, '<a href="https://$1">$1</a>')
    .replace(/\n/g, '<br>');
  return '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">' +
         html + '</div>';
}

// ---------------------------------------------------------------- Hilfsfunktionen

function extractAddress_(from) {
  var m = from.match(/<(.+?)>/);
  return (m ? m[1] : from).toLowerCase().trim();
}

function label_(thread, name) {
  var label = GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
  thread.addLabel(label);
}

function props_() {
  return PropertiesService.getScriptProperties();
}

function repliedRecently_(addr) {
  var raw = props_().getProperty('replied:' + addr);
  if (!raw) return false;
  var age = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return age < COOLDOWN_DAYS;
}

function rememberAddress_(addr) {
  props_().setProperty('replied:' + addr, String(Date.now()));
}

function todayKey_() {
  return 'count:' + Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
}

function getSentToday_() {
  return Number(props_().getProperty(todayKey_()) || 0);
}

function setSentToday_(n) {
  props_().setProperty(todayKey_(), String(n));
}

/** Einmal manuell ausführen, um den 10-Minuten-Trigger anzulegen. */
function installTrigger() {
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === 'autoReplyRun') {
      ScriptApp.deleteTrigger(existing[i]);
    }
  }
  ScriptApp.newTrigger('autoReplyRun').timeBased().everyMinutes(10).create();
  Logger.log('Trigger angelegt: autoReplyRun alle 10 Minuten');
}
