-- Table: products
-- Description: Stores the sellable products, linking each to a recipe.
--
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  recipe_id uuid NOT NULL,
  name text NOT NULL,
  sku text,
  current_stock numeric NOT NULL DEFAULT 0,
  selling_price numeric,
  notes text,
  status text DEFAULT 'Active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT products_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE RESTRICT, -- Prevent deleting a recipe if a product uses it
  CONSTRAINT unique_product_sku_per_user UNIQUE (user_id, sku)
);

--
-- Table: product_builds
-- Description: A historical log of every time a product was manufactured.
--
CREATE TABLE public.product_builds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  product_id uuid NOT NULL,
  recipe_id uuid NOT NULL,
  quantity_built numeric NOT NULL,
  total_cost_at_build numeric NOT NULL, -- The cost of materials at the time of the build
  build_date timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  CONSTRAINT product_builds_pkey PRIMARY KEY (id),
  CONSTRAINT product_builds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT product_builds_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT product_builds_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE
);

-- Add a JSONB column to store a snapshot of the materials used for each build.
-- This ensures historical accuracy even if the parent recipe changes later.
ALTER TABLE public.product_builds
ADD COLUMN materials_used JSONB NOT NULL;

-- Optional: Add a comment to the column for clarity in your database schema.
COMMENT ON COLUMN public.product_builds.materials_used IS 'A JSONB array of objects detailing each material used in this build, e.g., [{"material_id": "...", "quantity_used": 10, "cost_at_build": 5.50}]';

--
-- ROW LEVEL SECURITY (RLS) POLICIES
--

-- Enable RLS for 'products' table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own products"
ON public.products FOR ALL TO authenticated
USING ( auth.uid() = user_id );

-- Enable RLS for 'product_builds' table
ALTER TABLE public.product_builds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own product builds"
ON public.product_builds FOR ALL TO authenticated
USING ( auth.uid() = user_id );

-- This function has been updated to create a "snapshot" of the materials
-- used at the time of the build, ensuring historical accuracy.
CREATE OR REPLACE FUNCTION log_product_build(
    p_product_id UUID,
    p_quantity_built NUMERIC,
    p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_product RECORD;
    v_recipe RECORD;
    v_batches_to_build NUMERIC;
    v_materials_snapshot JSONB; -- Variable to hold the snapshot
    item RECORD;
BEGIN
    -- Step 1: Get product and recipe info
    SELECT * INTO v_product FROM public.products WHERE id = p_product_id AND user_id = v_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product not found or permission denied.'; END IF;
    IF v_product.recipe_id IS NULL THEN RAISE EXCEPTION 'Product does not have a recipe linked and cannot be built.'; END IF;
    SELECT * INTO v_recipe FROM public.recipes WHERE id = v_product.recipe_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Recipe for product not found.'; END IF;
    IF v_recipe.yield_quantity <= 0 THEN RAISE EXCEPTION 'Recipe has an invalid yield quantity.'; END IF;

    -- Step 2: Calculate batches
    v_batches_to_build := p_quantity_built / v_recipe.yield_quantity;
    IF v_batches_to_build != floor(v_batches_to_build) THEN RAISE EXCEPTION 'Build quantity must be a multiple of the recipe yield.'; END IF;

    -- Step 3: Create the materials snapshot and perform all checks in one go.
    SELECT jsonb_agg(
        jsonb_build_object(
            'material_id', m.id,
            'material_name', m.name,
            'quantity_used', rm.quantity * v_batches_to_build,
            'cost_at_build', ROUND((rm.quantity * v_batches_to_build * m.avg_cost), 2)
        )
    )
    INTO v_materials_snapshot
    FROM public.recipe_materials rm
    JOIN public.materials m ON rm.material_id = m.id
    WHERE rm.recipe_id = v_recipe.id;

    -- Check for sufficient stock using the created snapshot.
    FOR item IN SELECT * FROM jsonb_to_recordset(v_materials_snapshot) AS x(material_id UUID, material_name TEXT, quantity_used NUMERIC)
    LOOP
        IF (SELECT current_stock FROM public.materials WHERE id = item.material_id) < item.quantity_used THEN
            RAISE EXCEPTION 'Insufficient stock for material "%". Required: %, Available: %',
                item.material_name, 
                ROUND(item.quantity_used, 2), 
                ROUND((SELECT current_stock FROM public.materials WHERE id = item.material_id), 2);
        END IF;
    END LOOP;

    -- Step 4: Deduct materials from inventory using the snapshot data.
    FOR item IN SELECT * FROM jsonb_to_recordset(v_materials_snapshot) AS x(material_id UUID, quantity_used NUMERIC, cost_at_build NUMERIC)
    LOOP
        UPDATE public.materials
        SET
            current_stock = current_stock - item.quantity_used,
            --- total_cost = total_cost - item.cost_at_build,
            updated_at = now()
        WHERE id = item.material_id;
    END LOOP;

    -- Step 5: Update the product's stock.
    UPDATE public.products
    SET current_stock = current_stock + p_quantity_built, updated_at = now()
    WHERE id = p_product_id;

    -- Step 6: Insert the historical build record, including the snapshot.
    INSERT INTO public.product_builds (
        user_id, product_id, recipe_id, quantity_built,
        total_cost_at_build, notes, materials_used
    ) VALUES (
        v_user_id, p_product_id, v_recipe.id, p_quantity_built,
        (SELECT SUM((item_data->>'cost_at_build')::NUMERIC) FROM jsonb_array_elements(v_materials_snapshot) AS item_data),
        p_notes,
        v_materials_snapshot
    );
END;
$$;


--------------------------------------------------------------------------------
--                      DELETE PRODUCT BUILD FUNCTION                         --
--------------------------------------------------------------------------------

-- This function now exclusively uses the 'materials_used' snapshot from the
-- build log to ensure a perfectly accurate inventory reversal.
CREATE OR REPLACE FUNCTION delete_product_build(
    p_build_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_deleted_build RECORD;
    item RECORD;
BEGIN
    -- Step 1: Delete the build record and capture its data, especially the snapshot.
    DELETE FROM public.product_builds
    WHERE id = p_build_id AND user_id = v_user_id
    RETURNING * INTO v_deleted_build;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product build not found or permission denied.';
    END IF;

    -- Step 2: Decrease the product's stock by the amount that was built.
    UPDATE public.products
    SET
        current_stock = current_stock - v_deleted_build.quantity_built,
        updated_at = now()
    WHERE id = v_deleted_build.product_id;

    -- Step 3: Loop through the 'materials_used' snapshot and return the exact
    -- quantities and costs to the respective materials.
    FOR item IN SELECT * FROM jsonb_to_recordset(v_deleted_build.materials_used) AS x(
        material_id UUID,
        quantity_used NUMERIC,
        cost_at_build NUMERIC
    )
    LOOP
        UPDATE public.materials
        SET
            current_stock = current_stock + item.quantity_used,
            --- total_cost = total_cost + item.cost_at_build,
            updated_at = now()
        WHERE id = item.material_id;
    END LOOP;
END;
$$;

--------------------------------------------------------------------------------
--              DELETE PRODUCT AND MANAGE STOCK FUNCTION                      --
--------------------------------------------------------------------------------

-- This function deletes a product and, optionally, reverts its current stock
-- back into the component materials based on its recipe.
CREATE OR REPLACE FUNCTION delete_product_and_manage_stock(
    p_product_id UUID,
    p_return_stock BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_product RECORD;
    v_recipe RECORD;
    ingredient RECORD;
    v_batches_to_return NUMERIC;
    v_quantity_to_return NUMERIC;
BEGIN
    -- Step 1: Find the product to be deleted
    SELECT * INTO v_product FROM public.products
    WHERE id = p_product_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found or permission denied.';
    END IF;

    -- Step 2: If the user chose to return stock to inventory
    IF p_return_stock THEN
        -- Check if there is any stock to return
        IF v_product.current_stock > 0 THEN
            -- Find the associated recipe for the product
            SELECT * INTO v_recipe FROM public.recipes
            WHERE id = v_product.recipe_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Cannot return stock because the associated recipe was not found.';
            END IF;

            IF v_recipe.yield_quantity IS NULL OR v_recipe.yield_quantity <= 0 THEN
                RAISE EXCEPTION 'Cannot return stock because the recipe has an invalid yield quantity.';
            END IF;

            -- Calculate how many "batches" worth of stock are being returned
            v_batches_to_return := v_product.current_stock / v_recipe.yield_quantity;

            -- Return the component materials to the materials table
            FOR ingredient IN
                SELECT rm.material_id, rm.quantity, m.avg_cost
                FROM public.recipe_materials rm
                JOIN public.materials m ON rm.material_id = m.id
                WHERE rm.recipe_id = v_recipe.id
            LOOP
                v_quantity_to_return := ingredient.quantity * v_batches_to_return;
                
                UPDATE public.materials
                SET
                    current_stock = current_stock + v_quantity_to_return,
                    --- total_cost = total_cost + (ingredient.avg_cost * v_quantity_to_return),
                    updated_at = now()
                WHERE id = ingredient.material_id;
            END LOOP;
        END IF;
    END IF;

    -- Step 3: Delete the product record.
    -- The ON DELETE CASCADE rule on the 'product_builds' table will automatically
    -- delete all historical build records associated with this product.
    DELETE FROM public.products WHERE id = p_product_id;

END;
$$;

-- This function efficiently scans the product_builds table to find every time
-- a specific material was used, returning a clean history log.
CREATE OR REPLACE FUNCTION get_material_usage_history(p_material_id UUID)
RETURNS TABLE (
    build_id UUID,
    build_date TIMESTAMPTZ,
    product_id UUID,
    product_name TEXT,
    quantity_used NUMERIC,
    cost_at_build NUMERIC
)
LANGUAGE sql
STABLE -- Indicates the function cannot modify the database
AS $$
SELECT
    pb.id AS build_id,
    pb.build_date,
    pb.product_id,
    p.name AS product_name,
    (item->>'quantity_used')::NUMERIC AS quantity_used,
    (item->>'cost_at_build')::NUMERIC AS cost_at_build
FROM
    public.product_builds pb
CROSS JOIN LATERAL -- Use an explicit lateral join to unnest the JSON
    jsonb_array_elements(pb.materials_used) AS item
JOIN
    public.products p ON pb.product_id = p.id
WHERE
    (item->>'material_id')::UUID = p_material_id
    AND pb.user_id = auth.uid()
ORDER BY
    pb.build_date DESC;
$$;