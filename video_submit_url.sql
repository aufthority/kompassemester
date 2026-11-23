-- INOVA page where students submit the 2-minute video (shown on the video topic card).
alter table public.courses add column if not exists video_submit_url text;
update public.courses set video_submit_url = case
  when code = 'PHCH 4112' and cohort = 'DPH 52'       then 'https://inova.kpju.edu.my/mod/assign/view.php?id=35423'
  when code = 'PHCH 4123' and cohort = 'DPH 51'       then 'https://inova.kpju.edu.my/mod/assign/view.php?id=35424'
  when code = 'PHIA 4312' and cohort = 'DPH 48'       then 'https://inova.kpju.edu.my/mod/assign/view.php?id=35425'
  when code = 'PHIA 4312' and cohort = 'KPJIC DPH 21' then 'https://inova.kpju.edu.my/mod/assign/view.php?id=35427'
  else video_submit_url end;
