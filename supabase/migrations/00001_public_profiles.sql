CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  phone_number text,
  location text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

--- Add Support for MFA
create schema if not exists "authenticative";

set
  check_function_bodies = off;

CREATE
OR REPLACE FUNCTION authenticative.is_user_authenticated() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $ function $
SELECT
  array [(select auth.jwt()->>'aal')] < @ (
    SELECT
      CASE
        WHEN count(id) > 0 THEN array ['aal2']
        ELSE array ['aal1', 'aal2']
      END as aal
    FROM
      auth.mfa_factors
    WHERE
      (auth.uid() = user_id)
      AND status = 'verified'
  );

$ function $;

--- Function to Trigger when auth.user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  -- Variables are declared here, BEFORE the main logic begins.
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- This is the main logic block.

  -- Check if the user signed up with an OAuth provider that gives a 'full_name'
  IF NEW.raw_user_meta_data ->> 'full_name' IS NOT NULL THEN
    -- If 'full_name' exists, split it into first and last names.
    first_name_val := split_part(NEW.raw_user_meta_data ->> 'full_name', ' ', 1);
    last_name_val := substring(NEW.raw_user_meta_data ->> 'full_name' FROM position(' ' IN NEW.raw_user_meta_data ->> 'full_name') + 1);
  ELSE
    -- For regular email signups, 'full_name' will be null. Set names to NULL.
    -- This is safer than assuming 'first_name' exists in the metadata.
    first_name_val := NULL;
    last_name_val := NULL;
  END IF;

  -- Insert the new row into the public.profiles table.
  -- This will safely insert NULL if phone or location aren't provided by the auth provider.
  INSERT INTO public.profiles (id, first_name, last_name, phone_number, location)
  VALUES (
    NEW.id,
    first_name_val,
    last_name_val,
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'location'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--- Table Policy.
CREATE POLICY "Users can update own profile" ON profiles FOR
SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE
  USING (auth.uid() = id);

--- FUnction for Material Purchase Management
CREATE
OR REPLACE FUNCTION manage_material_purchase(
  p_operation_type TEXT,
  -- 'CREATE', 'UPDATE', or 'DELETE'
  p_purchase_id UUID,
  -- Required for UPDATE and DELETE
  p_material_id UUID,
  -- Required for CREATE
  p_purchase_date DATE,
  p_total_cost NUMERIC,
  p_total_quantity NUMERIC,
  p_supplier_name TEXT,
  p_supplier_contact TEXT
) RETURNS UUID -- Returns the ID of the affected purchase record
LANGUAGE plpgsql SECURITY DEFINER AS $ $ DECLARE v_user_id UUID := auth.uid();

v_old_purchase RECORD;

v_material_to_update RECORD;

v_final_total_cost NUMERIC;

v_final_total_quantity NUMERIC;

v_new_avg_cost NUMERIC;

v_affected_purchase_id UUID;

BEGIN -- CREATE operation
IF p_operation_type = 'CREATE' THEN IF p_material_id IS NULL THEN RAISE EXCEPTION 'Material ID is required for CREATE operation.';

END IF;

-- Insert the new purchase and get its ID
INSERT INTO
  public.material_purchases (
    user_id,
    material_id,
    purchase_date,
    total_cost,
    total_quantity,
    supplier_name,
    supplier_contact
  )
VALUES
  (
    v_user_id,
    p_material_id,
    p_purchase_date,
    p_total_cost,
    p_total_quantity,
    p_supplier_name,
    p_supplier_contact
  ) RETURNING id INTO v_affected_purchase_id;

-- Update the parent material by adding the new values
UPDATE
  public.materials
SET
  current_stock = current_stock + p_total_quantity,
  total_quantity = total_quantity + p_total_quantity,
  total_cost = total_cost + p_total_cost,
  -- Recalculate average cost based on the new totals
  avg_cost = (total_cost + p_total_cost) / (total_quantity + p_total_quantity),
  updated_at = now()
WHERE
  id = p_material_id
  AND user_id = v_user_id;

RETURN v_affected_purchase_id;

-- UPDATE operation
ELSIF p_operation_type = 'UPDATE' THEN IF p_purchase_id IS NULL THEN RAISE EXCEPTION 'Purchase ID is required for UPDATE operation.';

END IF;

-- Get the old purchase values before updating
SELECT
  * INTO v_old_purchase
FROM
  public.material_purchases
WHERE
  id = p_purchase_id
  AND user_id = v_user_id;

IF NOT FOUND THEN RAISE EXCEPTION 'Purchase not found or permission denied.';

END IF;

-- Get the current material state
SELECT
  * INTO v_material_to_update
FROM
  public.materials
WHERE
  id = v_old_purchase.material_id;

-- Calculate the final totals by first reverting the old purchase, then adding the new one.
v_final_total_cost := v_material_to_update.total_cost - v_old_purchase.total_cost + p_total_cost;

v_final_total_quantity := v_material_to_update.total_quantity - v_old_purchase.total_quantity + p_total_quantity;

-- Calculate new average cost, safely handling division by zero.
IF v_final_total_quantity > 0 THEN v_new_avg_cost := v_final_total_cost / v_final_total_quantity;

ELSE v_new_avg_cost := 0;

END IF;

-- Update the parent material with the recalculated values
UPDATE
  public.materials
SET
  current_stock = current_stock - v_old_purchase.total_quantity + p_total_quantity,
  total_quantity = v_final_total_quantity,
  total_cost = v_final_total_cost,
  avg_cost = v_new_avg_cost,
  updated_at = now()
WHERE
  id = v_old_purchase.material_id
  AND user_id = v_user_id;

-- Finally, update the purchase record itself
UPDATE
  public.material_purchases
SET
  purchase_date = p_purchase_date,
  total_cost = p_total_cost,
  total_quantity = p_total_quantity,
  avg_cost = p_total_cost / p_total_quantity,
  supplier_name = p_supplier_name,
  supplier_contact = p_supplier_contact,
  updated_at = now()
WHERE
  id = p_purchase_id;

RETURN p_purchase_id;

-- DELETE operation
ELSIF p_operation_type = 'DELETE' THEN IF p_purchase_id IS NULL THEN RAISE EXCEPTION 'Purchase ID is required for DELETE operation.';

END IF;

-- Delete the purchase record and capture its old values
DELETE FROM
  public.material_purchases
WHERE
  id = p_purchase_id
  AND user_id = v_user_id RETURNING * INTO v_old_purchase;

IF NOT FOUND THEN RAISE EXCEPTION 'Purchase not found or permission denied.';

END IF;

-- Get the current material state
SELECT
  * INTO v_material_to_update
FROM
  public.materials
WHERE
  id = v_old_purchase.material_id;

-- Calculate final totals by subtracting the deleted purchase
v_final_total_cost := v_material_to_update.total_cost - v_old_purchase.total_cost;

v_final_total_quantity := v_material_to_update.total_quantity - v_old_purchase.total_quantity;

-- Safely recalculate the average cost
IF v_final_total_quantity > 0 THEN v_new_avg_cost := v_final_total_cost / v_final_total_quantity;

ELSE v_new_avg_cost := 0;

END IF;

-- Update the parent material by reverting the deleted purchase's values
UPDATE
  public.materials
SET
  current_stock = current_stock - v_old_purchase.total_quantity,
  total_quantity = v_final_total_quantity,
  total_cost = v_final_total_cost,
  avg_cost = v_new_avg_cost,
  updated_at = now()
WHERE
  id = v_old_purchase.material_id
  AND user_id = v_user_id;

RETURN v_old_purchase.id;

ELSE RAISE EXCEPTION 'Invalid operation type: %',
p_operation_type;

END IF;

END;

CREATE OR REPLACE FUNCTION get_user_dashboard_counts()
RETURNS JSONB -- It will return a single JSON object with all the counts.
AS $$
DECLARE
  materials_count INT;
  material_purchases_count INT;
  recipes_count INT;
BEGIN
  -- Securely get the count for each table, filtering by the currently logged-in user.
  -- The auth.uid() function gets the user's ID from their session token.
  SELECT count(*) INTO materials_count FROM public.materials WHERE user_id = auth.uid();
  SELECT count(*) INTO material_purchases_count FROM public.material_purchases WHERE user_id = auth.uid();
  SELECT count(*) INTO recipes_count FROM public.recipes WHERE user_id = auth.uid();

  -- Combine all the counts into a single JSON object and return it.
  RETURN jsonb_build_object(
    'materials', materials_count,
    'purchases', material_purchases_count,
    'recipes', recipes_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


