CREATE TABLE public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL UNIQUE,
  purchase_unit text NOT NULL,
  crafting_unit text NOT NULL,
  conversion_factor numeric NOT NULL,
  total_cost numeric NOT NULL,
  total_quantity numeric NOT NULL,
  avg_cost numeric GENERATED ALWAYS AS (COALESCE(total_cost / NULLIF(total_quantity, 0), 0)) STORED,,
  current_stock numeric DEFAULT 0,
  minimum_threshold numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sku text,
  initial_cost numeric,
  initial_quantity numeric,
  status text,
  category text,
  inventoryable boolean,
  CONSTRAINT materials_pkey PRIMARY KEY (id),
  CONSTRAINT materials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

ALTER TABLE public.materials
  ADD CONSTRAINT unique_sku_per_user UNIQUE (user_id, sku);

CREATE INDEX idx_materials_user_id ON materials(user_id);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can do all on thier own materials" ON materials FOR ALL USING (auth.uid() = user_id);