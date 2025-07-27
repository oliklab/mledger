-- Table: recipes
-- Description: Stores the main recipe information. The total_cost has been removed
-- and should be calculated on the fly by summing the costs of its materials.
--
CREATE TABLE public.recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  notes text,
  yield_quantity numeric NOT NULL DEFAULT 1,
  yield_unit text,
  -- REMOVED: total_cost numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recipes_pkey PRIMARY KEY (id),
  CONSTRAINT recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT unique_recipe_name_per_user UNIQUE (user_id, name)
);

--
-- Table: recipe_materials
-- Description: Stores the ingredients for each recipe. The static 'cost' column
-- has been removed. The cost for an ingredient will be calculated as:
-- (this.quantity * material.avg_cost).
--
CREATE TABLE public.recipe_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  recipe_id uuid NOT NULL,
  material_id uuid,
  quantity numeric NOT NULL,
  details text DEFAULT ''::text,
  CONSTRAINT recipe_materials_pkey PRIMARY KEY (id),
  CONSTRAINT recipe_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id),
  CONSTRAINT recipe_materials_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id)
);

-- Add an index for faster lookups of a recipe's materials.
CREATE INDEX idx_recipe_materials_recipe_id ON public.recipe_materials(recipe_id);


--
-- ROW LEVEL SECURITY (RLS) POLICIES
--

-- Enable RLS for the 'recipes' table
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can perform all actions (SELECT, INSERT, UPDATE, DELETE) on their own recipes.
CREATE POLICY "Users can manage their own recipes"
ON public.recipes
FOR ALL
TO authenticated
USING ( auth.uid() = user_id );


-- Enable RLS for the 'recipe_materials' table
ALTER TABLE public.recipe_materials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage line items only for recipes that they own.
-- This works by checking the user_id on the parent 'recipes' table.
CREATE POLICY "Users can manage items for their own recipes"
ON public.recipe_materials
FOR ALL
TO authenticated
USING ( (SELECT user_id FROM public.recipes WHERE id = recipe_materials.recipe_id) = auth.uid() );

CREATE POLICY "Users can manage their own recipes materials"
ON public.recipe_materials
FOR ALL
TO authenticated
USING ( auth.uid() = user_id );
