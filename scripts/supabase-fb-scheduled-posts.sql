-- Facebook-Redaktionsplan als Warteschlange.
--
-- Der Plan wird in marketing/fb-plan-<monat>/plan.json geschrieben (dort ist er
-- reviewbar und versioniert) und mit scripts/fb-plan-import.mjs in diese
-- Tabelle gespielt. /api/cron/fb-post holt stuendlich die faelligen Zeilen und
-- postet sie ueber die Graph API auf die Seite.
--
-- Warum eine Tabelle und nicht die JSON-Datei direkt: der Cron braucht einen
-- Ort, an dem er "schon gepostet" festhalten kann. Ohne den wuerde jeder Lauf
-- denselben Post erneut veroeffentlichen.

create table if not exists fb_scheduled_posts (
  id            uuid primary key default gen_random_uuid(),
  -- Stabiler Schluessel aus dem Plan. Upsert laeuft darueber, damit ein
  -- zweiter Import nichts dupliziert.
  slug          text not null unique,
  -- Wann der Post raus soll. In UTC gespeichert, im Plan in Bangkok-Zeit
  -- geschrieben und beim Import umgerechnet.
  scheduled_at  timestamptz not null,
  -- Der Text, wie er auf Facebook steht (zweisprachig, EN + TH).
  message       text not null,
  -- Entweder link (Link-Post, Facebook zieht die OG-Karte der Seite)
  -- oder image_url (Foto-Post mit message als Bildunterschrift).
  link          text,
  image_url     text,
  -- helpers | families | proof — nur zur Auswertung, nicht fuer die Logik.
  audience      text,
  status        text not null default 'pending'
                  check (status in ('pending', 'posted', 'failed', 'skipped')),
  fb_post_id    text,
  attempts      int  not null default 0,
  last_error    text,
  posted_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Der Cron fragt genau danach: faellig und noch nicht raus.
create index if not exists fb_scheduled_posts_due_idx
  on fb_scheduled_posts (scheduled_at)
  where status = 'pending';

alter table fb_scheduled_posts enable row level security;

-- Deny by default wie ueberall sonst: nur der Service-Role-Key kommt ran,
-- und der umgeht RLS. Es gibt bewusst keine Policy fuer anon.
