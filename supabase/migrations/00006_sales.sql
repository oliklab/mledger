--
-- Table: sales
-- Description: The parent record for a single sale or order.
--
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Consolidated Customer Details
    customer_details TEXT, -- A single text field for all customer info (e.g., Name, Email, Address).

    -- Sale Details
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Draft', -- e.g., Draft, Completed, Cancelled
    total_amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--
-- Table: sale_items
-- Description: The individual product line items for each sale.
--
CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity NUMERIC NOT NULL,
    price_per_unit NUMERIC NOT NULL, -- Price at the time of sale
    cost_per_unit_at_sale NUMERIC NOT NULL, -- COGS at the time of sale
    subtotal NUMERIC GENERATED ALWAYS AS (quantity * price_per_unit) STORED
);

-- Indexes for performance
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);

-- RLS Policies
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sales" ON public.sales FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage items for their own sales" ON public.sale_items FOR ALL USING (auth.uid() = user_id);


--------------------------------------------------------------------------------
--                      TRANSACTIONAL SQL FUNCTIONS                           --
--------------------------------------------------------------------------------

--
-- Function: complete_sale_and_update_stock
--
CREATE OR REPLACE FUNCTION complete_sale_and_update_stock(p_sale_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_sale RECORD;
    item RECORD;
BEGIN
    SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id AND user_id = v_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found or permission denied.'; END IF;
    IF v_sale.status = 'Completed' THEN RAISE EXCEPTION 'This sale has already been completed.'; END IF;
    FOR item IN SELECT si.quantity, p.id AS product_id, p.name, p.current_stock FROM public.sale_items si JOIN public.products p ON si.product_id = p.id WHERE si.sale_id = p_sale_id
    LOOP
        IF item.current_stock < item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product "%". Required: %, Available: %', item.name, item.quantity, item.current_stock;
        END IF;
    END LOOP;
    FOR item IN SELECT si.quantity, si.product_id FROM public.sale_items si WHERE si.sale_id = p_sale_id
    LOOP
        UPDATE public.products SET current_stock = current_stock - item.quantity WHERE id = item.product_id;
    END LOOP;
    UPDATE public.sales SET status = 'Completed', updated_at = now() WHERE id = p_sale_id;
END;
$$;


--
-- Function: revert_completed_sale
--
CREATE OR REPLACE FUNCTION revert_completed_sale(p_sale_id UUID, p_new_status TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_sale RECORD;
    item RECORD;
BEGIN
    SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id AND user_id = v_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found or permission denied.'; END IF;
    IF v_sale.status != 'Completed' THEN RAISE EXCEPTION 'Only a completed sale can be reverted.'; END IF;
    IF p_new_status = 'Completed' THEN RAISE EXCEPTION 'New status must be different from Completed.'; END IF;
    FOR item IN SELECT si.quantity, si.product_id FROM public.sale_items si WHERE si.sale_id = p_sale_id
    LOOP
        UPDATE public.products SET current_stock = current_stock + item.quantity WHERE id = item.product_id;
    END LOOP;
    UPDATE public.sales SET status = p_new_status, updated_at = now() WHERE id = p_sale_id;
END;
$$;

-- This function creates a new sale and its line items, checks for sufficient
-- stock, and immediately deducts the stock, all within a single transaction.
CREATE OR REPLACE FUNCTION create_and_complete_sale(
    p_sale_details JSONB, -- { "customer_details": "...", "sale_date": "...", "notes": "..." }
    p_items JSONB -- [{ "product_id": "...", "quantity": ..., "price_per_unit": ..., "cost_per_unit_at_sale": ... }]
)
RETURNS UUID -- Returns the ID of the new sale
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_total_amount NUMERIC;
    v_new_sale_id UUID;
    item RECORD;
    product_info RECORD;
BEGIN
    -- Step 1: Check stock for all items BEFORE creating any records
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity NUMERIC)
    LOOP
        SELECT name, current_stock INTO product_info FROM public.products WHERE id = item.product_id;
        IF product_info.current_stock < item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product "%". Required: %, Available: %',
                product_info.name, item.quantity, product_info.current_stock;
        END IF;
    END LOOP;

    -- Step 2: Calculate total amount
    SELECT SUM((i->>'quantity')::NUMERIC * (i->>'price_per_unit')::NUMERIC)
    INTO v_total_amount
    FROM jsonb_array_elements(p_items) AS i;

    -- Step 3: Insert the parent 'sales' record with 'Completed' status
    INSERT INTO public.sales (user_id, customer_details, sale_date, notes, status, total_amount)
    VALUES (
        v_user_id,
        p_sale_details->>'customer_details',
        (p_sale_details->>'sale_date')::DATE,
        p_sale_details->>'notes',
        'Completed',
        v_total_amount
    ) RETURNING id INTO v_new_sale_id;

    -- Step 4: Insert line items and deduct stock
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity NUMERIC, price_per_unit NUMERIC, cost_per_unit_at_sale NUMERIC)
    LOOP
        -- Insert the line item
        INSERT INTO public.sale_items (user_id, sale_id, product_id, quantity, price_per_unit, cost_per_unit_at_sale)
        VALUES (v_user_id, v_new_sale_id, item.product_id, item.quantity, item.price_per_unit, item.cost_per_unit_at_sale);

        -- Deduct stock from the product
        UPDATE public.products
        SET current_stock = current_stock - item.quantity
        WHERE id = item.product_id;
    END LOOP;

    RETURN v_new_sale_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_product_sales_history(p_product_id UUID)
RETURNS TABLE (
    sale_id UUID,
    sale_date DATE,
    customer_details TEXT,
    quantity_sold NUMERIC,
    price_per_unit NUMERIC,
    subtotal NUMERIC
)
LANGUAGE sql
STABLE
AS $$
SELECT
    s.id AS sale_id,
    s.sale_date,
    s.customer_details,
    si.quantity AS quantity_sold,
    si.price_per_unit,
    si.subtotal
FROM
    public.sale_items si
JOIN
    public.sales s ON si.sale_id = s.id
WHERE
    si.product_id = p_product_id
    AND s.status = 'Completed' -- Only count completed sales
    AND si.user_id = auth.uid()
ORDER BY
    s.sale_date DESC;
$$;