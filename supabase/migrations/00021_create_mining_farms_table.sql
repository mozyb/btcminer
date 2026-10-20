CREATE TABLE IF NOT EXISTS public.mining_farms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  country         text NOT NULL,
  flag            text NOT NULL DEFAULT '🏳️',
  capacity        numeric(10,2) NOT NULL DEFAULT 0,
  capacity_unit   text NOT NULL DEFAULT 'MW',
  power_source    text NOT NULL DEFAULT '',
  cooling         text NOT NULL DEFAULT '',
  active_miners   integer NOT NULL DEFAULT 0,
  online_miners   integer NOT NULL DEFAULT 0,
  uptime          numeric(5,2) NOT NULL DEFAULT 99.0,
  total_btc_mined numeric(28,8) NOT NULL DEFAULT 0,
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  image_url       text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mining_farms_is_active ON public.mining_farms(is_active);

ALTER TABLE public.mining_farms ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read active farms
CREATE POLICY "public_read_active_farms" ON public.mining_farms
  FOR SELECT USING (is_active = true);

-- Admins: full access
CREATE POLICY "admin_all_farms" ON public.mining_farms
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed data from existing mockData
INSERT INTO public.mining_farms
  (name, country, flag, capacity, power_source, cooling, active_miners, online_miners, uptime, total_btc_mined, latitude, longitude, image_url, is_active)
VALUES
  ('Iceland Arctic Hub', 'Iceland', '🇮🇸', 150, 'Geothermal & Hydro', 'Natural Air + Immersion', 5840, 5798, 99.3, 12847.3, 64.1, -21.9,
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', true),
  ('Texas Mega Campus', 'United States', '🇺🇸', 280, 'Wind + Grid', 'Evaporative + HVAC', 10920, 10741, 98.4, 21453.9, 31.9, -99.9,
   'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800', true),
  ('Kazakhstan Steppe', 'Kazakhstan', '🇰🇿', 80, 'Coal + Hydro', 'Forced Air', 3200, 3105, 97.0, 8234.6, 48.0, 68.0,
   'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800', true),
  ('Norway Fjord Facility', 'Norway', '🇳🇴', 120, '100% Hydro', 'Natural Air + Hydro', 4600, 4551, 98.9, 10981.2, 60.5, 8.5,
   'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', true)
ON CONFLICT DO NOTHING;