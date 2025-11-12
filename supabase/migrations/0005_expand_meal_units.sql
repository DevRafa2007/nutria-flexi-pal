-- Expandir unidades aceitas em meal_foods
alter table public.meal_foods
drop constraint if exists meal_foods_unit_check;

alter table public.meal_foods
add constraint meal_foods_unit_check
check (unit in (
  'g', 'kg', 'ml', 'l',
  'colher', 'colher de sopa', 'colher de chá',
  'xícara', 'copo',
  'unidade', 'unidades',
  'filé', 'peito', 'fatia', 'fatias',
  'pote', 'lata', 'pacote',
  'porção', 'porções'
));
