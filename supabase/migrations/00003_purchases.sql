CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  name text NOT NULL,
  purchase_date date NOT NULL DEFAULT now(),
  total_cost numeric NOT NULL,
  total_quantity numeric NOT NULL,
  status text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.material_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  material_id uuid NOT NULL,
  purchase_date date NOT NULL DEFAULT now(),
  total_cost numeric NOT NULL,
  total_quantity numeric NOT NULL,
  avg_cost numeric NOT NULL DEFAULT (total_cost / total_quantity),
  supplier_name text,
  supplier_contact text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  purchase_id uuid,
  CONSTRAINT material_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT material_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT material_purchases_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id)
  CONSTRAINT material_purchases_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id)
);

CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_material_purchases_user_id ON material_purchases(user_id);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can do all on thier own materials" ON materials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can do all on thier own materials" ON material_purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can do all on thier own purchases" ON purchases FOR ALL USING (auth.uid() = user_id);
---- Material Purchases table should update the Material Costing table.
CREATE OR REPLACE FUNCTION manage_material_purchase(
    p_operation_type TEXT,
    -- 'CREATE', 'UPDATE', or 'DELETE'
    p_purchase_id UUID,
    p_material_id UUID,
    p_purchase_date DATE,
    p_total_cost NUMERIC,
    p_total_quantity NUMERIC,
    p_supplier_name TEXT,
    p_supplier_contact TEXT,
    p_purchase_table_id UUID
  ) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id UUID = auth.uid();
v_old_purchase RECORD;
v_material_to_update RECORD;
v_final_total_cost NUMERIC;
v_final_total_quantity NUMERIC;
v_affected_purchase_id UUID;
BEGIN -- CREATE operation
IF p_operation_type = 'CREATE' THEN IF p_material_id IS NULL THEN RAISE EXCEPTION 'Material ID is required for CREATE operation.';
END IF;
INSERT INTO public.material_purchases (
    user_id,
    material_id,
    purchase_date,
    total_cost,
    total_quantity,
    supplier_name,
    supplier_contact,
    purchase_id
  )
VALUES (
    v_user_id,
    p_material_id,
    p_purchase_date,
    p_total_cost,
    p_total_quantity,
    p_supplier_name,
    p_supplier_contact,
    p_purchase_table_id
  )
RETURNING id INTO v_affected_purchase_id;
UPDATE public.materials
SET current_stock = current_stock + p_total_quantity,
  total_quantity = total_quantity + p_total_quantity,
  total_cost = total_cost + p_total_cost,
  -- REMOVED: The avg_cost calculation is now handled by the database itself.
  updated_at = now()
WHERE id = p_material_id
  AND user_id = v_user_id;
RETURN v_affected_purchase_id;
-- UPDATE operation
ELSIF p_operation_type = 'UPDATE' THEN IF p_purchase_id IS NULL THEN RAISE EXCEPTION 'Purchase ID is required for UPDATE operation.';
END IF;
SELECT * INTO v_old_purchase
FROM public.material_purchases
WHERE id = p_purchase_id
  AND user_id = v_user_id;
IF NOT FOUND THEN RAISE EXCEPTION 'Purchase not found or permission denied.';
END IF;
UPDATE public.materials
SET current_stock = current_stock - v_old_purchase.total_quantity + p_total_quantity,
  total_quantity = total_quantity - v_old_purchase.total_quantity + p_total_quantity,
  total_cost = total_cost - v_old_purchase.total_cost + p_total_cost,
  -- REMOVED: The avg_cost calculation is now handled by the database itself.
  updated_at = now()
WHERE id = v_old_purchase.material_id
  AND user_id = v_user_id;
UPDATE public.material_purchases
SET purchase_date = p_purchase_date,
  total_cost = p_total_cost,
  total_quantity = p_total_quantity,
  -- The avg_cost on the purchase itself is also a generated column.
  supplier_name = p_supplier_name,
  supplier_contact = p_supplier_contact,
  updated_at = now()
WHERE id = p_purchase_id;
RETURN p_purchase_id;
-- DELETE operation
ELSIF p_operation_type = 'DELETE' THEN IF p_purchase_id IS NULL THEN RAISE EXCEPTION 'Purchase ID is required for DELETE operation.';
END IF;
DELETE FROM public.material_purchases
WHERE id = p_purchase_id
  AND user_id = v_user_id
RETURNING * INTO v_old_purchase;
IF NOT FOUND THEN RAISE EXCEPTION 'Purchase not found or permission denied.';
END IF;
UPDATE public.materials
SET current_stock = current_stock - v_old_purchase.total_quantity,
  total_quantity = total_quantity - v_old_purchase.total_quantity,
  total_cost = total_cost - v_old_purchase.total_cost,
  -- REMOVED: The avg_cost calculation is now handled by the database itself.
  updated_at = now()
WHERE id = v_old_purchase.material_id
  AND user_id = v_user_id;
RETURN v_old_purchase.id;
ELSE RAISE EXCEPTION 'Invalid operation type: %',
p_operation_type;
END IF;
END;
$$;


---- Purchase 

CREATE OR REPLACE FUNCTION create_purchase_order_with_items(
    p_name TEXT,
    p_purchase_date DATE,
    p_status TEXT,
    p_notes TEXT,
    p_items JSONB -- The array now expects objects with optional supplier fields
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_total_cost NUMERIC := 0;
    v_new_purchase_id UUID;
    -- UPDATE: The record now includes the optional fields
    item RECORD;
BEGIN
    -- Step 1: Calculate total cost (this logic remains the same)
    SELECT SUM((item_data->>'cost')::NUMERIC)
    INTO v_total_cost
    FROM jsonb_array_elements(p_items) AS item_data;

    -- Step 2: Insert the parent "purchases" record (this logic remains the same)
    INSERT INTO public.purchases (user_id, name, purchase_date, status, notes, total_cost)
    VALUES (v_user_id, p_name, p_purchase_date, p_status, p_notes, v_total_cost)
    RETURNING id INTO v_new_purchase_id;

    -- Step 3: Loop through the items and create each "material_purchases" record
    -- 👇 UPDATE: The record definition now includes the optional supplier fields
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        material_id UUID,
        quantity NUMERIC,
        cost NUMERIC,
        supplier_name TEXT,
        supplier_contact TEXT
    )
    LOOP
        -- 👇 UPDATE: The INSERT statement now includes the supplier fields
        INSERT INTO public.material_purchases (
            user_id,
            purchase_id,
            material_id,
            purchase_date,
            total_cost,
            total_quantity,
            supplier_name,      -- ADDED
            supplier_contact    -- ADDED
        ) VALUES (
            v_user_id,
            v_new_purchase_id,
            item.material_id,
            p_purchase_date,
            item.cost,
            item.quantity,
            item.supplier_name,   -- ADDED
            item.supplier_contact -- ADDED
        );

        -- Atomically update the stock in the main materials table (this logic remains the same)
        UPDATE public.materials
        SET
            current_stock = current_stock + item.quantity,
            total_quantity = total_quantity + item.quantity,
            total_cost = total_cost + item.cost,
            updated_at = now()
        WHERE id = item.material_id;
    END LOOP;

    -- Step 4: Return the ID of the new purchase order (this logic remains the same)
    RETURN v_new_purchase_id;
END;
$$;
CREATE OR REPLACE FUNCTION update_purchase_order_with_items(
    p_purchase_id UUID,
    p_name TEXT,
    p_purchase_date DATE,
    p_status TEXT,
    p_notes TEXT,
    p_new_items JSONB -- The new set of line items from your UI
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_old_item RECORD;
    v_new_item RECORD;
    v_new_total_cost NUMERIC := 0;
BEGIN
    -- Authorization check: Ensure the user owns this purchase order.
    IF NOT EXISTS (SELECT 1 FROM public.purchases WHERE id = p_purchase_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'Purchase order not found or permission denied.';
    END IF;

    -- Step 1: Revert all old line items from the materials table to undo their stock/cost impact.
    FOR v_old_item IN
        SELECT * FROM public.material_purchases WHERE purchase_id = p_purchase_id
    LOOP
        UPDATE public.materials
        SET
            current_stock = current_stock - v_old_item.total_quantity,
            total_quantity = total_quantity - v_old_item.total_quantity,
            total_cost = total_cost - v_old_item.total_cost,
            updated_at = now()
        WHERE id = v_old_item.material_id;
    END LOOP;

    -- Step 2: Delete all old line items associated with the purchase order.
    DELETE FROM public.material_purchases WHERE purchase_id = p_purchase_id;

    -- Step 3: Calculate the new total cost from the new items array.
    SELECT SUM((item_data->>'cost')::NUMERIC)
    INTO v_new_total_cost
    FROM jsonb_array_elements(p_new_items) AS item_data;
    
    -- If there are no new items, the total cost is 0.
    v_new_total_cost := COALESCE(v_new_total_cost, 0);

    -- Step 4: Update the parent "purchases" record with the new details and new total cost.
    UPDATE public.purchases
    SET
        name = p_name,
        purchase_date = p_purchase_date,
        status = p_status,
        notes = p_notes,
        total_cost = v_new_total_cost,
        updated_at = now()
    WHERE id = p_purchase_id;

    -- Step 5: Insert the new set of line items and apply their stock/cost changes.
    FOR v_new_item IN SELECT * FROM jsonb_to_recordset(p_new_items) AS x(
        material_id UUID,
        quantity NUMERIC,
        cost NUMERIC,
        supplier_name TEXT,
        supplier_contact TEXT
    )
    LOOP
        -- Insert the new line item record.
        INSERT INTO public.material_purchases (
            user_id,
            purchase_id,
            material_id,
            purchase_date,
            total_cost,
            total_quantity,
            supplier_name,
            supplier_contact
        ) VALUES (
            v_user_id,
            p_purchase_id, -- Link to the existing parent order
            v_new_item.material_id,
            p_purchase_date,
            v_new_item.cost,
            v_new_item.quantity,
            v_new_item.supplier_name,
            v_new_item.supplier_contact
        );

        -- Apply the new stock and cost changes to the materials table.
        UPDATE public.materials
        SET
            current_stock = current_stock + v_new_item.quantity,
            total_quantity = total_quantity + v_new_item.quantity,
            total_cost = total_cost + v_new_item.cost,
            updated_at = now()
        WHERE id = v_new_item.material_id;
    END LOOP;

END;
$$;
