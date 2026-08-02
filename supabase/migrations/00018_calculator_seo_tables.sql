
-- Calculator content blocks
CREATE TABLE calculator_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text,
  body text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE calculator_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_calculator_content" ON calculator_content FOR SELECT TO anon, authenticated USING (visible = true);
CREATE POLICY "admin_all_calculator_content" ON calculator_content FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Calculator FAQ
CREATE TABLE calculator_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE calculator_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_calculator_faq" ON calculator_faq FOR SELECT TO anon, authenticated USING (visible = true);
CREATE POLICY "admin_all_calculator_faq" ON calculator_faq FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Calculator hardware comparison
CREATE TABLE calculator_hardware (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  manufacturer text,
  hashrate_ths numeric NOT NULL,
  power_watts int NOT NULL,
  efficiency_jth numeric,
  est_daily_usd numeric,
  efficiency_rating text,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true
);
ALTER TABLE calculator_hardware ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_calculator_hardware" ON calculator_hardware FOR SELECT TO anon, authenticated USING (visible = true);
CREATE POLICY "admin_all_calculator_hardware" ON calculator_hardware FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Calculator related links
CREATE TABLE calculator_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_text text NOT NULL,
  target_url text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true
);
ALTER TABLE calculator_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_calculator_links" ON calculator_links FOR SELECT TO anon, authenticated USING (visible = true);
CREATE POLICY "admin_all_calculator_links" ON calculator_links FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed calculator content blocks
INSERT INTO calculator_content (key, title, body, sort_order) VALUES
(
  'intro',
  'What Is a Bitcoin Mining Calculator?',
  E'## What Is a Bitcoin Mining Calculator?\n\nA Bitcoin mining calculator is an estimation tool that lets you forecast your potential earnings from Bitcoin mining before committing capital to hashrate contracts or hardware. By inputting variables such as your allocated hashrate, contract duration, Bitcoin price, and maintenance fees, the calculator applies the actual Bitcoin network mining formula to generate realistic daily, monthly, and total reward projections.\n\nBTCMiner.online''s mining calculator uses live network data fetched directly from public blockchain APIs — including real-time network hashrate, current mining difficulty, and the latest Bitcoin block reward — to ensure estimates reflect actual mining conditions as closely as possible.\n\n## How Mining Profitability Is Estimated\n\nMining profitability is calculated by applying your proportional share of the total network hashrate to the daily block reward output. The core formula is:\n\n**Daily BTC = (Your TH/s ÷ Total Network TH/s) × 144 blocks × Current Block Reward**\n\nFrom this gross figure, daily maintenance fees (covering electricity and infrastructure costs) are deducted to arrive at your net daily earnings. Multiply by your contract duration to get the total projected payout over the life of your contract.\n\n## Factors That Affect Mining Income\n\nSeveral dynamic variables determine how much Bitcoin you actually earn:\n\n- **Network Hashrate**: As more miners join the Bitcoin network, the total hashrate rises, reducing your proportional share and per-unit earnings.\n- **Mining Difficulty**: Bitcoin automatically adjusts difficulty every 2,016 blocks (~2 weeks) to maintain a 10-minute block time. Higher difficulty means each TH/s produces fewer coins.\n- **Bitcoin Price**: USD-denominated earnings scale directly with BTC price. Higher prices mean more dollar value per mined coin.\n- **Block Reward**: Currently 3.125 BTC per block following the April 2024 halving. The next halving reduces this to ~1.5625 BTC.\n- **Maintenance Fees**: Infrastructure costs including power, cooling, and hardware operation reduce gross mining output.\n\n## Why Mining Calculations Matter\n\nAccurate profitability modelling helps miners make informed decisions about which contracts to purchase, which duration offers the best expected return, and when market conditions favor entering or expanding a mining position. Our calculator auto-populates with live network data so you always start from the most accurate available baseline — though remember that network conditions change continuously and actual results may vary.',
  1
),
(
  'factors_hashrate',
  'Hashrate',
  E'Hashrate measures the computational speed of mining hardware — specifically the number of SHA-256 hash computations performed per second. Higher hashrate gives you a larger share of the total block reward pool.\n\nCommon hashrate units:\n- **TH/s (Terahash)**: 1 trillion hashes/second — standard for modern SHA-256 ASICs\n- **PH/s (Petahash)**: 1,000 TH/s — used for large industrial contracts\n- **EH/s (Exahash)**: 1,000,000 TH/s — Bitcoin network total hashrate scale\n\nDoubling your hashrate doubles your gross earnings proportionally, assuming network conditions remain constant.',
  2
),
(
  'factors_difficulty',
  'Network Difficulty',
  E'Bitcoin mining difficulty is an automatically adjusting parameter that controls how hard it is to find a valid block hash. It adjusts every 2,016 blocks (approximately every 14 days) based on how fast the last 2,016 blocks were found.\n\nWhen total network hashrate increases (more miners joining), difficulty rises to maintain the 10-minute average block time. This means each unit of hashrate produces slightly fewer coins per day after a positive difficulty adjustment.\n\nDifficulty adjustments are the primary reason actual mining earnings differ from static estimates. BTCMiner.online''s calculator displays the current live difficulty and recalculates automatically when it updates.',
  3
),
(
  'factors_price',
  'Bitcoin Price',
  E'Bitcoin price directly multiplies your USD-denominated mining revenue. If BTC price increases by 20%, your daily USD earnings increase by 20% for the same hashrate output.\n\nBecause Bitcoin price is highly volatile, the calculator allows you to override the live price and manually enter a conservative, base-case, or optimistic price scenario to model different profitability outcomes. This is particularly useful for evaluating long-duration contracts where you may want to stress-test results at lower price levels.',
  4
),
(
  'factors_maintenance',
  'Maintenance Costs',
  E'Maintenance fees cover the real-world infrastructure costs of running mining hardware on your behalf: electricity, cooling systems, facility rent, security, hardware servicing, and operations staff.\n\nAt BTCMiner.online, maintenance fees are charged per TH/s per day in USD, deducted from your gross daily mining output before rewards are credited to your wallet. Contracts with longer durations or higher hashrate tiers typically carry lower per-unit maintenance rates due to economies of scale.\n\nMaintenance costs are the fixed expense side of mining economics. Net profitability = Gross BTC Output × BTC Price − (Maintenance Rate × Hashrate × Days).',
  5
),
(
  'factors_rewards',
  'Block Rewards',
  E'Bitcoin miners earn rewards in two ways: the block subsidy and transaction fees. The block subsidy is currently 3.125 BTC per block following the April 2024 halving event. Approximately 144 blocks are found per day, generating a daily subsidy pool of ~450 BTC distributed proportionally among all miners.\n\nBitcoin halvings occur every 210,000 blocks (~4 years), cutting the block subsidy in half. The next halving is expected around 2028 and will reduce the block reward to ~1.5625 BTC. Historically, halvings have been followed by significant BTC price appreciation, partially offsetting the reduction in per-block output.',
  6
),
(
  'guide',
  'How To Calculate Bitcoin Mining Profits',
  E'## Revenue Calculation\n\nGross daily revenue = (Your TH/s ÷ Network TH/s) × 144 × Block Reward × BTC Price\n\nExample: 500 TH/s at a network of 850 EH/s (850,000,000 TH/s), block reward 3.125 BTC, BTC price $63,000:\n\n(500 ÷ 850,000,000) × 144 × 3.125 × $63,000 = **~$16.75/day gross**\n\n## Expense Calculation\n\nDaily maintenance cost = Maintenance Rate × Hashrate = $0.0028 × 500 TH/s = **$1.40/day**\n\n## Net Profit Estimate\n\nNet daily profit = $16.75 − $1.40 = **$15.35/day**\nNet 90-day profit = $15.35 × 90 = **~$1,381.50**\n\n## Risk Factors\n\n- **Difficulty increases**: If network hashrate grows 15% in 90 days, earnings decrease proportionally\n- **BTC price decline**: A 20% price drop reduces USD revenue by 20%\n- **Halving events**: The next halving (~2028) will cut gross output in half\n\n## Real-World Mining Scenarios\n\n**Conservative**: BTC flat at $50,000, difficulty +10%/quarter → reduced but still positive net earnings on most contracts\n\n**Base Case**: BTC at $63,000, difficulty +5%/quarter → healthy positive returns on mid-tier contracts\n\n**Optimistic**: BTC at $100,000, difficulty stable → strong returns across all contract tiers',
  7
);

-- Seed calculator FAQ
INSERT INTO calculator_faq (question, answer, sort_order) VALUES
  ('How accurate is the calculator?', 'The calculator uses live Bitcoin network data including real-time network hashrate, difficulty, and block reward. Estimates are as accurate as current conditions allow, but mining profitability changes with every difficulty adjustment (approximately every 2 weeks). Results should be treated as estimates, not guarantees.', 1),
  ('How are mining profits calculated?', 'Daily BTC = (Your TH/s ÷ Total Network TH/s) × 144 blocks × Block Reward. Net profit subtracts daily maintenance fees from gross output. USD value is calculated by multiplying BTC output by the current Bitcoin price.', 2),
  ('Does difficulty affect earnings?', 'Yes. Bitcoin difficulty adjusts every 2,016 blocks (~14 days). When more miners join the network, difficulty increases and each TH/s produces fewer coins. The calculator shows results based on current difficulty, which will change over the life of your contract.', 3),
  ('Are mining rewards guaranteed?', 'No. Mining rewards depend on network difficulty, Bitcoin price, block reward, and hardware availability. These variables change continuously. Mining involves risk and past performance does not guarantee future results. Please review our Risk Disclosure before purchasing any contract.', 4),
  ('What maintenance fees apply?', 'Maintenance fees cover electricity, cooling, and hardware operation costs. The default rate in the calculator is $0.0028/TH/s per day. This may vary by contract tier — premium contracts may have lower per-TH rates. Fees are deducted from gross mining output before rewards are credited.', 5),
  ('Which mining hardware performs best?', 'The most efficient SHA-256 miners currently available are the Bitmain Antminer S21 XP (270 TH/s, 20.8 J/TH) and MicroBT Whatsminer M60S (186 TH/s, 18.5 J/TH). BTCMiner.online''s fleet consists of next-generation ASICs for maximum efficiency and reward output.', 6),
  ('What happens after Bitcoin halving?', 'Bitcoin halving reduces the block subsidy by 50% (currently 3.125 BTC, next halving ~1.5625 BTC). This reduces gross mining output per unit of hashrate. Historically, halvings have been followed by BTC price increases over 12–18 months, often offsetting the reward reduction. Maintenance fees remain the same.', 7),
  ('Can profitability change daily?', 'Yes. Daily profitability can change due to: Bitcoin price movements, network difficulty adjustments, changes in total network hashrate, and hardware efficiency factors. The calculator reflects current conditions; results on day 1 of a contract may differ significantly from day 90.', 8);

-- Seed calculator hardware
INSERT INTO calculator_hardware (model, manufacturer, hashrate_ths, power_watts, efficiency_jth, est_daily_usd, efficiency_rating, sort_order) VALUES
  ('Antminer S21 XP',    'Bitmain', 270.0, 5616,  20.8, 9.08,  'Excellent', 1),
  ('Whatsminer M60S',    'MicroBT', 186.0, 3441,  18.5, 6.26,  'Excellent', 2),
  ('Antminer S21',       'Bitmain', 200.0, 3500,  17.5, 6.73,  'Very Good', 3),
  ('Avalon A1566',       'Canaan',  185.0, 3360,  18.2, 6.22,  'Very Good', 4),
  ('Whatsminer M56S++',  'MicroBT', 230.0, 4370,  19.0, 7.74,  'Excellent', 5),
  ('Antminer S19 XP',    'Bitmain', 140.0, 3010,  21.5, 4.71,  'Good',      6);

-- Seed calculator links
INSERT INTO calculator_links (anchor_text, target_url, description, sort_order) VALUES
  ('Hashrate Marketplace',             '/marketplace', 'Browse and purchase SHA-256 mining contracts',        1),
  ('Mining Plans & Pricing',           '/pricing',     'Compare all available hashrate packages',             2),
  ('Mining Farms',                     '/farms',       'See our enterprise data centers worldwide',           3),
  ('ASIC Hardware Fleet',              '/hardware',    'View the hardware running your contracts',            4),
  ('What Is Hashrate?',                '/blog',        'Complete guide to understanding hashrate',            5),
  ('Bitcoin Mining Difficulty Guide',  '/blog',        'How difficulty affects your mining earnings',         6);
