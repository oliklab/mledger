# Welcome to Maker's Ledger!

**The simple way for makers to track costs and profits.**

Hello, and welcome to your new command center! Maker's Ledger was built for one reason: to take the headache out of the most complicated part of running a craft business. We help you answer the two most important questions: "How much does it *really* cost to make my products?" and "Am I actually making a profit?"

This guide will walk you through every feature of the app, explaining not just *what* to do, but *why* it helps you build a more profitable and sustainable business. Let's get started!

---

## Part 1: Your Dashboard & Navigation

The Dashboard is your home base, designed to give you a quick, at-a-glance overview of your business's health. From the main navigation menu, you can access the five key areas of the app, each designed for a specific purpose:

* **Materials:** Your digital storeroom. This is the foundation where you'll manage every raw supply you own, from bulk wax to the smallest decorative ribbon.
* **Purchases:** Your financial logbook for supplies. Track every supply run and order from your suppliers to maintain an accurate history of your expenses.
* **Recipes:** Your digital cookbook. This is where you define the precise ingredients and quantities needed to create each of your unique products.
* **Products:** Your finished goods inventory. Here you can see the items ready for sale, track your stock levels, and log new manufacturing runs.
* **Sales:** Your order book and profit center. This is where you'll log customer sales, track your revenue, and see your real-time profitability.

---

## Part 2: Managing Your Materials (`/app/materials`)

This is the foundation of everything in Maker's Ledger. Accurately tracking your materials is the absolute key to knowing your true costs and pricing your products with confidence.

### How to Add a New Raw Material

Let's say you're a candle maker and you just bought a 5-kilogram block of soy wax for €40. Here's how you'd add it:

1.  Navigate to the **Materials** section and click the "Add New Material" button.
2.  Fill out the form with care:
    * **Material Name:** `Soy Wax`
    * **SKU:** (Optional but recommended) `WAX-SOY-01`
    * **Purchase Unit:** `kg`. This is crucial because it's how your supplier sells it to you.
    * **Crafting Unit:** `g`. This is even more crucial! It tells the app how you actually *use* the material in your recipes. The conversion is the secret sauce.
    * **Conversion Factor:** `1000`. The app needs to know there are 1000 grams in a kilogram.
    * **Initial Purchase Quantity:** `5000`. You must enter the total quantity in your chosen *crafting unit*.
    * **Total Initial Cost:** `40`. Enter the final price you paid, including any shipping or taxes, to get your true cost.

**The Magic Moment!**
Maker's Ledger automatically does the math for you. It knows that 5kg is 5000g. It then divides the total cost by the total crafting units:

`€40 / 5000g = €0.008 per gram`

This `avg_cost` (average cost) is now stored. It's a "moving average," which means it will automatically and accurately recalculate every time you log a new purchase at a different price. This ensures your product costing is always based on the true, up-to-date value of your inventory.

### Viewing and Managing Your Inventory

In the Materials section, you'll see a list of all your supplies in a compact card format. For each material, you can see at a glance:
* The material name and SKU, which is a clickable link that takes you directly to its **Details Page**.
* The current stock level, always shown in your crafting unit for easy reference.
* The calculated average cost per crafting unit, so you always know your base cost.
* The total wholesale value of your current stock on hand.

### Material Details Page (`/app/materials/[id]`)

Clicking on any material name takes you to its dedicated details page. This is your deep-dive view, where you can find:
* In-depth statistics about its cost, current value, and purchase history over time.
* A complete **Purchase History** table, allowing you to track how the price from your suppliers has changed over time.
* A detailed **Usage History**, showing every single product build that has consumed this material. This helps you identify your most popular and important ingredients.

---

## Part 3: Creating Recipes (`/app/recipes`)

A "Recipe" is the formula for your products. It's simply the list of specific ingredients and their exact quantities that you use to make one finished product or a single batch.

### How to Create a Recipe

Let's create a recipe for a "Lavender Fields Candle".

1.  Navigate to the **Recipes** section and click "New Recipe".
2.  Fill out the recipe details:
    * **Recipe Name:** `Lavender Fields Candle`
    * **Yield Quantity:** `1` (How many sellable items this recipe produces)
    * **Yield Unit:** `Candle`
3.  Click "Add Ingredient" to start adding materials from your inventory.
4.  Select `Soy Wax` from your materials list and enter the precise amount you use for one candle, for example, `200` (in grams, its crafting unit).
5.  Add another ingredient: `Candle Wick`, Quantity: `1`.
6.  Add a final ingredient: `Lavender Oil`, Quantity: `10` (in ml).
7.  Click "Save Recipe".

The app doesn't save a fixed cost on the recipe itself. Instead, it will **dynamically calculate** the recipe's total cost in real-time by fetching the current `avg_cost` of each ingredient from your materials inventory. This is a powerful feature that ensures your product costs are always up-to-date, protecting your profits even when supplier prices fluctuate.

---

## Part 4: Tracking Products & Manufacturing (`/app/products`)

Products are your finished, sellable goods. Each product is created by linking it to a recipe, which serves as its manufacturing blueprint.

### How to Create a New Product

1.  Navigate to the **Products** page and click "New Product".
2.  Fill in the details:
    * **Product Name:** `Large Lavender Candle`
    * **SKU:** `LAV-CAN-LG`
    * **Recipe:** Select "Lavender Fields Candle" from the dropdown. This links the product to its ingredient list and cost.
    * **Selling Price:** Enter the final price you will sell the product for, e.g., `25`.
3.  Click "Save Product".

On the product list, you'll see a **Guide Price** suggestion. This is a helpful benchmark calculated by applying a standard markup (e.g., 2.5x) to your recipe's real-time material cost. It's a great starting point, which you can adjust based on your labor, overhead, and brand positioning.

### Logging a Manufacturing Run

You just spent the afternoon making a batch of 12 Lavender Candles. This is called a "build" or a "manufacturing run."

1.  Go to the **Products** page and find your "Large Lavender Candle".
2.  Click the "Log Build" button, which takes you to the dedicated manufacturing page.
3.  Select the number of batches you made. If your recipe yields 1 candle, you'd select "12 batches". The form will confirm that this action will produce **12 Candles**.
4.  Click "Confirm Build".

The app's transactional SQL function now does two things safely and automatically:
1.  It deducts all required raw materials from your **Materials Inventory** (in this case, 2400g of wax, 12 wicks, etc.).
2.  It adds `12` to your "Large Lavender Candle" **Finished Goods Stock**. Your inventory is now perfectly in sync.

---

## Part 5: Tracking Sales (`/app/sales`)

This is where you see your hard work pay off by turning inventory into revenue.

### Logging a Sale

You sold one of your new candles at a market for €25!

1.  Navigate to the **Sales** page and click "New Sale".
2.  Enter the `Sale Date` and any `Customer Details`.
3.  Add a line item and select "Large Lavender Candle" from your product list.
4.  Enter the `Quantity`: `1`, and confirm the `Price / Unit` is `25`.
5.  Select the **Status**. This is a critical step!
    * **Save as Draft:** This saves the order but **does not** affect your product stock. Use this for quotes, unconfirmed orders, or invoices you're preparing.
    * **Complete Sale:** This will create the sale and **immediately deduct the stock** from your finished product inventory. This is the final step for a confirmed, paid order.
6.  Click "Create & Complete Sale".

### The Profit Moment!

Navigate to the sale's details page by clicking on it from the sales list. You'll see an instant, clear breakdown of this transaction's profitability:
* **Total Revenue:** `€25.00`
* **Cost of Goods Sold (COGS):** The exact material cost of the product *at the time of the sale*, captured for perfect historical accuracy.
* **Profit:** The simple, powerful number showing the difference between your revenue and COGS.
* **Profit Margin:** Your profit expressed as a percentage of revenue, the key indicator of your pricing strategy's success.

Simultaneously, the app deducts `1` from your "Large Lavender Candle" finished goods stock. You now have a perfect, real-time view of your entire business, from raw materials to cash in hand.

---

## Frequently Asked Questions (FAQ)

* **How do I handle shipping costs or packaging materials?**
    * Simply add them as a "Material"! Create a material called "Shipping Box" with a purchase unit and crafting unit of "piece". Add it to your product recipes, and its cost will be included in your COGS.
* **What if I get a discount on a bulk purchase?**
    * Just enter the final price you paid! The app calculates the average cost based on what you actually spent, so discounts are automatically factored in.
* **Is my data safe?**
    * Absolutely. We use industry-standard encryption and security protocols to ensure your business data is kept safe, secure, and private.

---

## Need Help?

If you have any questions or run into any issues, we're here to help. Please don't hesitate to reach out to our support team at **kzirtm@gmail.com**.

Happy making!

- The Maker's Ledger Team