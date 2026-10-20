-- 3.
 Update sequence steps with new timings and templates
-- ═══════════════════════════════════════════════════════════════════════════

-- Unverified reminder: 1h, 24h, 3d, 7d
DO $$
DECLARE
  v_seq_id UUID;
BEGIN
  SELECT id INTO v_seq_id FROM public.automation_sequences WHERE type = 'unverified_reminder' LIMIT 1;
  IF v_seq_id IS NOT NULL THEN
    DELETE FROM public.automation_sequence_steps WHERE sequence_id = v_seq_id;
    INSERT INTO public.automation_sequence_steps (sequence_id, step_order, delay_hours, subject, body_html, body_text)
    VALUES
      (v_seq_id, 1, 1, 'Please verify your BTCMiner.online email address',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 28px;text-align:center;"><h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Verify Your Email</h1></td></tr><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Please verify your email address to activate your account and unlock your 10% welcome discount.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{verification_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Verify My Email</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nPlease verify your email address to activate your account and unlock your 10% welcome discount.\n\nVerify: {{verification_link}}'),
      (v_seq_id, 2, 24, 'Reminder: verify your email to unlock your welcome discount',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Your 10% welcome discount is reserved, but you still need to verify your email to activate it.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{verification_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Verify My Email</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nYour 10% welcome discount is reserved. Verify your email to activate it.\n\nVerify: {{verification_link}}'),
      (v_seq_id, 3, 72, 'Final reminder: verify your email to start mining',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">This is a friendly reminder to verify your email and claim your 10% welcome discount before it expires.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{verification_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Verify My Email</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nPlease verify your email and claim your 10% welcome discount before it expires.\n\nVerify: {{verification_link}}'),
      (v_seq_id, 4, 168, 'Your BTCMiner welcome discount is waiting',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">Your 10% welcome discount is still reserved. Verify your email today and start mining with your discount applied automatically.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{verification_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Claim My Discount</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nYour 10% welcome discount is still reserved. Verify your email today.\n\nClaim: {{verification_link}}');
  END IF;
END $$;

-- No deposit: educational sequence (getting started, how cloud mining works, choosing a contract, current opportunities)
DO $$
DECLARE
  v_seq_id UUID;
BEGIN
  SELECT id INTO v_seq_id FROM public.automation_sequences WHERE type = 'no_deposit' LIMIT 1;
  IF v_seq_id IS NOT NULL THEN
    DELETE FROM public.automation_sequence_steps WHERE sequence_id = v_seq_id;
    INSERT INTO public.automation_sequence_steps (sequence_id, step_order, delay_hours, subject, body_html, body_text)
    SELECT v_seq_id, 1, 24, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'getting_started'
    UNION ALL
    SELECT v_seq_id, 2, 72, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'how_cloud_mining_works'
    UNION ALL
    SELECT v_seq_id, 3, 120, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'choosing_contract'
    UNION ALL
    SELECT v_seq_id, 4, 168, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'current_mining_opportunities';
  END IF;
END $$;

-- No contract: deposit reminders (how to buy, available contracts, mining pools, mining farms)
DO $$
DECLARE
  v_seq_id UUID;
BEGIN
  SELECT id INTO v_seq_id FROM public.automation_sequences WHERE type = 'no_contract' LIMIT 1;
  IF v_seq_id IS NOT NULL THEN
    DELETE FROM public.automation_sequence_steps WHERE sequence_id = v_seq_id;
    INSERT INTO public.automation_sequence_steps (sequence_id, step_order, delay_hours, subject, body_html, body_text)
    SELECT v_seq_id, 1, 1, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'how_to_buy_contract'
    UNION ALL
    SELECT v_seq_id, 2, 24, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'available_contracts'
    UNION ALL
    SELECT v_seq_id, 3, 72, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'mining_pools'
    UNION ALL
    SELECT v_seq_id, 4, 168, t.subject, t.html_body, t.text_body
    FROM public.email_templates t WHERE t.slug = 'mining_farms';
  END IF;
END $$;

-- Abandoned purchase: keep existing but update body
DO $$
DECLARE
  v_seq_id UUID;
BEGIN
  SELECT id INTO v_seq_id FROM public.automation_sequences WHERE type = 'abandoned_purchase' LIMIT 1;
  IF v_seq_id IS NOT NULL THEN
    DELETE FROM public.automation_sequence_steps WHERE sequence_id = v_seq_id;
    INSERT INTO public.automation_sequence_steps (sequence_id, step_order, delay_hours, subject, body_html, body_text)
    VALUES
      (v_seq_id, 1, 1, 'You left hashpower in your cart — complete your purchase',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">You left hashpower in your cart. Complete your purchase now and your welcome discount will be applied automatically.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Complete Purchase</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nYou left hashpower in your cart. Complete your purchase and your welcome discount will be applied automatically.\n\nDashboard: {{dashboard_link}}'),
      (v_seq_id, 2, 24, 'Last chance: your contract reservation is about to expire',
       '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;width:100%;"><tr><td style="padding:32px 28px 24px;"><p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi {{first_name}},</p><p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">This is your last reminder to complete your purchase. Your welcome discount will be applied automatically at checkout.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="{{dashboard_link}}" style="display:inline-block;background:#f7931a;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:15px 48px;border-radius:8px;">Complete Purchase</a></td></tr></table></td></tr></table></td></tr></table></body></html>',
       'Hi {{first_name}},\n\nLast reminder to complete your purchase. Your welcome discount will be applied automatically.\n\nDashboard: {{dashboard_link}}');
  END IF;
END $$;
