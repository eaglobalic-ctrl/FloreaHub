-- Storage bucket for shop photos and product images uploaded from the
-- dashboard. Uploads happen server-side via the service-role key (see
-- /api/upload), which bypasses storage RLS entirely — this bucket only
-- needs to be public so the resulting URLs are viewable by customers.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-images',
  'shop-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
