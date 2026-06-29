
-- ── platform_stats ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_stats (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '0',
  label      TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read platform_stats" ON public.platform_stats FOR SELECT TO public USING (true);
CREATE POLICY "Admin full platform_stats"  ON public.platform_stats FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

INSERT INTO public.platform_stats (key, value, label) VALUES
  ('active_miners',       '21630',   'Active Miners'),
  ('total_hashrate_eh',   '892',     'Total Hashrate (EH/s)'),
  ('total_btc_mined',     '46514.4', 'Total BTC Mined'),
  ('total_withdrawals',   '183200',  'Total Withdrawals Processed'),
  ('platform_uptime',     '99.7',    'Platform Uptime (%)'),
  ('active_contracts',    '58400',   'Active Mining Contracts')
ON CONFLICT (key) DO NOTHING;

-- ── reviews ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name    TEXT NOT NULL,
  author_country TEXT,
  avatar_url     TEXT,
  rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  verified       BOOLEAN DEFAULT false,
  featured       BOOLEAN DEFAULT false,
  visible        BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read visible reviews" ON public.reviews FOR SELECT TO public USING (visible = true);
CREATE POLICY "Admin full reviews"          ON public.reviews FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "User insert own review"      ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

INSERT INTO public.reviews (author_name, author_country, rating, title, body, verified, featured, visible) VALUES
  ('James H.',  'United States', 5, 'Consistent daily payouts',         'Been mining for 8 months. Payouts hit my wallet every day without fail. Hashrate is exactly what was contracted.', true, true, true),
  ('Elena M.',  'Germany',       5, 'Best cloud mining platform',        'Tried three other platforms before BTCMiner. The transparency center and live dashboard data make all the difference.', true, true, true),
  ('David K.',  'Australia',     4, 'Solid ROI on my 365-day plan',      'Started with 100 TH/s. After 4 months I have already covered 60% of cost. Very satisfied.', true, true, true),
  ('Priya S.',  'India',         5, 'Professional support team',         'Had a question about my deposit and support responded within 2 hours. Smooth process.', true, false, true),
  ('Marcus T.', 'Canada',        5, 'Real mining, real rewards',         'Unlike other platforms, you can verify payouts on the blockchain. That gives me confidence.', true, false, true),
  ('Yuki N.',   'Japan',         4, 'Good interface, reliable earnings', 'The dashboard is very clean. I can see daily rewards and compare with network data.', false, false, true);

-- ── faq_items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faq_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category   TEXT NOT NULL DEFAULT 'General',
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  visible    BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read visible faq" ON public.faq_items FOR SELECT TO public USING (visible = true);
CREATE POLICY "Admin full faq"          ON public.faq_items FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

INSERT INTO public.faq_items (category, question, answer, sort_order) VALUES
  ('How Mining Works',  'How does cloud mining work?',                    'Cloud mining lets you purchase hashrate from our industrial mining facilities without owning hardware. Your contracted hashrate contributes to our pool, and rewards are calculated daily based on your share.', 1),
  ('How Mining Works',  'When are mining rewards credited?',              'Rewards are calculated and credited to your wallet every day at 00:00 UTC based on the previous day''s mining output. Rewards depend on BTC price, network difficulty, and your hashrate.', 2),
  ('Hashrate Packages', 'What is a hashrate package?',                    'A hashrate package gives you a fixed amount of mining power (TH/s) for a specified duration. You pay once and receive daily BTC rewards for the entire contract period.', 3),
  ('Hashrate Packages', 'What happens after my contract expires?',        'When your contract expires, your hashrate is released. Any earned rewards remain in your wallet. You can purchase a new contract at any time.', 4),
  ('Withdrawals',       'How do I withdraw my Bitcoin?',                  'Go to Dashboard → Wallet → Withdraw. Enter your Bitcoin address and amount. Withdrawals require email verification and are processed within 24 hours after admin review.', 5),
  ('Withdrawals',       'What is the minimum withdrawal amount?',         'The minimum BTC withdrawal is 0.001 BTC. A small network fee covers on-chain transaction costs.', 6),
  ('Marketplace',       'What is the Hashrate Marketplace?',              'The Marketplace lets you buy and sell active hashrate contracts between users. Purchase contracts at discounted rates or sell your existing contracts before they expire.', 7),
  ('Profitability',     'How are profits calculated?',                    'Daily profit = (Your Hashrate / Total Network Hashrate) × 144 Blocks × Block Reward minus maintenance fee. The homepage calculator uses live network data.', 8),
  ('Security',          'How is my account secured?',                     'We use AES-256 encryption, two-factor authentication, IP-based login alerts, and cold storage for platform funds. All transactions require email confirmation.', 9),
  ('KYC',               'Is identity verification required?',             'KYC is required for withdrawals above $1,000 USD equivalent. Basic features are available without KYC. Verification takes 1-3 business days.', 10),
  ('Cryptocurrencies',  'Which cryptocurrencies can I mine?',             'We support Bitcoin (BTC) via SHA-256, Litecoin (LTC) via Scrypt, and Dogecoin (DOGE) via merged mining. BTC is the primary option.', 11),
  ('Cryptocurrencies',  'Can I mine multiple coins simultaneously?',      'Yes. You can hold multiple contracts for different coins. Each contract runs independently and rewards are credited to respective coin wallets.', 12);

-- ── blog_posts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  excerpt          TEXT,
  body             TEXT,
  category         TEXT NOT NULL DEFAULT 'Mining',
  tags             TEXT[] DEFAULT '{}',
  author_name      TEXT DEFAULT 'BTCMiner Team',
  author_avatar    TEXT,
  featured_image   TEXT,
  featured         BOOLEAN DEFAULT false,
  published        BOOLEAN DEFAULT true,
  meta_title       TEXT,
  meta_description TEXT,
  read_time_min    INT DEFAULT 5,
  view_count       INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published blog" ON public.blog_posts FOR SELECT TO public USING (published = true);
CREATE POLICY "Admin full blog"            ON public.blog_posts FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

INSERT INTO public.blog_posts (slug, title, excerpt, category, tags, featured, read_time_min, meta_title, meta_description) VALUES
  ('bitcoin-mining-difficulty-explained',   'Bitcoin Mining Difficulty Explained',       'Learn how Bitcoin''s difficulty adjustment algorithm works and why it matters for mining profitability.',              'Education',  ARRAY['bitcoin','difficulty','mining'],        true,  6, 'Bitcoin Mining Difficulty Explained | BTCMiner',          'Understand how Bitcoin network difficulty works, adjusts every 2016 blocks, and what it means for cloud mining profitability.'),
  ('what-is-hashrate',                      'What Is Hashrate?',                         'Hashrate is the fundamental measure of mining power. This guide explains TH/s, EH/s, and why higher hashrate earns more rewards.', 'Education',  ARRAY['hashrate','bitcoin','mining'],          true,  5, 'What Is Hashrate? Complete Guide | BTCMiner',             'Hashrate explained simply: what TH/s means, why it matters for Bitcoin mining, and how to pick the right hashrate package.'),
  ('best-asic-miners-2026',                 'Best ASIC Miners 2026',                     'Top-performing ASIC miners of 2026 including efficiency ratings and ROI projections.',                                  'Hardware',   ARRAY['asic','hardware','antminer'],           true,  8, 'Best ASIC Miners 2026 | BTCMiner Hardware Guide',         'Compare the best ASIC miners of 2026 by hashrate, power consumption, and efficiency. Full spec sheets and ROI analysis.'),
  ('cloud-mining-vs-hardware-mining',       'Cloud Mining vs Hardware Mining',           'A comprehensive comparison of cloud mining contracts versus buying and running your own ASIC hardware.',              'Comparison', ARRAY['cloud mining','hardware','comparison'], false, 7, 'Cloud Mining vs Hardware Mining: Which Is Better?',      'Compare cloud mining vs owning ASIC hardware. Cost analysis, maintenance, electricity, and ROI breakdown for 2026.'),
  ('bitcoin-profitability-calculator-guide','Bitcoin Profitability Calculator Guide',    'How to use a Bitcoin mining profitability calculator to estimate earnings, break-even, and ROI.',                  'Guides',     ARRAY['calculator','profitability','roi'],     false, 5, 'Bitcoin Mining Profitability Calculator Guide | BTCMiner','Step-by-step guide to using a Bitcoin mining calculator. Hashrate, difficulty, and daily reward estimation.'),
  ('sha256-mining-explained',               'SHA-256 Mining Explained',                  'SHA-256 is the cryptographic algorithm powering Bitcoin mining. Everything you need to know.',                        'Education',  ARRAY['sha256','algorithm','bitcoin'],         false, 6, 'SHA-256 Mining Algorithm Explained | BTCMiner',           'Complete explanation of the SHA-256 hashing algorithm used in Bitcoin proof-of-work. How it works and why it matters.');

-- ── payout_proofs column on transactions ──────────────────────────────────
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS show_as_proof BOOLEAN DEFAULT false;
