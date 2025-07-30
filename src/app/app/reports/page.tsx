"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DateRange } from "react-day-picker";
import { addDays, format } from 'date-fns';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { Material, MaterialStore } from '@/storage/materials';
import { Product, ProductStore, ProductBuild } from '@/storage/products';
import { SaleMetadata, SalesStore } from '@/storage/sales';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';

// UI Components
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Archive } from 'lucide-react';

// Utils and Icons
import { FormatCurrency, FormatDate } from '@/lib/utils';
import {
  Loader2,
  AlertCircle,
  Wallet,
  TrendingUp,
  Package,
  Boxes,
  Hammer,
  ShoppingCart,
  FlaskConical,
  FileDown,
  Calendar as CalendarIcon,
  BarChart,
  FileText
} from 'lucide-react';

type ReportType = 'sales' | 'inventory' | 'manufacturing' | 'profit_loss';

// Enhanced type for products used in reports
type EnhancedProduct = Product & { recipe_cost: number };

export default function ReportsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Data State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [builds, setBuilds] = useState<ProductBuild[]>([]);
  const [sales, setSales] = useState<SaleMetadata[]>([]);

  // Report State
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  // Load all data needed for reports
  const loadData = useCallback(async () => {
    try {
      const supabase = await NewSPASassClient();
      const [materialsData, productsData, buildsData, salesData, recipesData] = await Promise.all([
        new MaterialStore(supabase).ReadAll(),
        new ProductStore(supabase).ReadAll(),
        new ProductStore(supabase).readAllBuilds(),
        new SalesStore(supabase).ReadAllMetadata(),
        new RecipeStore(supabase).ReadAllMetadata()
      ]);

      const materialMap = new Map(materialsData.map(m => [m.id, m]));
      const recipeMap = new Map(recipesData.map(r => [r.recipe.id, r]));

      const enhancedProducts = productsData.map(product => {
        const recipe = recipeMap.get(product.recipe_id);
        const recipe_cost = recipe?.materials.reduce((sum, item) => {
          const material = materialMap.get(item.material_id);
          return material ? sum + (item.quantity * material.avg_cost) : sum;
        }, 0) || 0;
        return { ...product, recipe_cost };
      });

      setMaterials(materialsData);
      setProducts(enhancedProducts);
      setBuilds(buildsData);
      setSales(salesData);
    } catch (err: any) {
      setError("Failed to load necessary data: " + err.message);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Memoized report data generation
  const reportData = useMemo(() => {
    if (!selectedReport || !dateRange?.from || !dateRange?.to) return null;

    const from = new Date(dateRange.from.setHours(0, 0, 0, 0));
    const to = new Date(dateRange.to.setHours(23, 59, 59, 999));
    const productMap = new Map(products.map(p => [p.id, p]));

    switch (selectedReport) {
      case 'sales':
        const filteredSales = sales.filter(s => {
          const saleDate = new Date(s.sale.sale_date);
          return s.sale.status === 'Completed' && saleDate >= from && saleDate <= to;
        });
        const totalRevenue = filteredSales.reduce((sum, s) => sum + s.sale.total_amount, 0);
        const totalCOGS = filteredSales.flatMap(s => s.items).reduce((sum, i) => sum + (i.quantity * i.cost_per_unit_at_sale), 0);
        return {
          title: "Sales Report",
          headers: ["Date", "Customer", "Items", "Revenue", "COGS", "Profit"],
          rows: filteredSales.map(s => {
            const cogs = s.items.reduce((sum, i) => sum + (i.quantity * i.cost_per_unit_at_sale), 0);
            return [FormatDate(s.sale.sale_date), s.sale.customer_details || 'N/A', s.items.length, FormatCurrency(s.sale.total_amount), FormatCurrency(cogs), FormatCurrency(s.sale.total_amount - cogs)];
          }),
          summary: [
            { label: "Total Sales", value: filteredSales.length },
            { label: "Total Revenue", value: FormatCurrency(totalRevenue) },
            { label: "Total COGS", value: FormatCurrency(totalCOGS) },
            { label: "Total Profit", value: FormatCurrency(totalRevenue - totalCOGS) },
          ]
        };

      case 'inventory':
        const totalMaterialValue = materials.filter(m => m.inventoryable).reduce((sum, m) => sum + (m.current_stock * m.avg_cost), 0);
        const totalProductValue = products.reduce((sum, p) => sum + (p.current_stock * p.recipe_cost), 0);
        return {
          title: "Inventory Snapshot Report",
          headers: ["Type", "SKU", "Name", "Available Stock", "Avg. Cost", "Stock Value (COGS)"],
          rows: [
            ...materials.filter(m => m.inventoryable).map(m => ["Material", m.sku || 'N/A', m.name, `${m.current_stock.toLocaleString()} ${m.crafting_unit}`, FormatCurrency(m.avg_cost), FormatCurrency(m.current_stock * m.avg_cost)]),
            ...products.map(p => ["Product", p.sku || 'N/A', p.name, p.current_stock.toLocaleString(), FormatCurrency(p.recipe_cost), FormatCurrency(p.current_stock * p.recipe_cost)])
          ],
          summary: [
            { label: "Total Material Value", value: FormatCurrency(totalMaterialValue) },
            { label: "Total Product Stock Value", value: FormatCurrency(totalProductValue) },
            { label: "Total Inventory Value", value: FormatCurrency(totalMaterialValue + totalProductValue) },
          ]
        };

      case 'manufacturing':
        const filteredBuilds = builds.filter(b => {
          const buildDate = new Date(b.created_at);
          return buildDate >= from && buildDate <= to;
        });
        const totalManufacturingCost = filteredBuilds.reduce((sum, b) => sum + b.total_cost_at_build, 0);
        const totalUnitsBuilt = filteredBuilds.reduce((sum, b) => sum + b.quantity_built, 0);
        return {
          title: "Manufacturing Report",
          headers: ["Date", "Product Built", "Quantity", "Total Cost"],
          rows: filteredBuilds.map(b => [FormatDate(b.created_at), productMap.get(b.product_id)?.name || 'N/A', b.quantity_built.toLocaleString(), FormatCurrency(b.total_cost_at_build)]),
          summary: [
            { label: "Total Batches", value: filteredBuilds.length },
            { label: "Total Units Built", value: totalUnitsBuilt.toLocaleString() },
            { label: "Total Manufacturing Cost", value: FormatCurrency(totalManufacturingCost) },
          ]
        };

      case 'profit_loss':
        const salesForPL = sales.filter(s => {
          const saleDate = new Date(s.sale.sale_date);
          return s.sale.status === 'Completed' && saleDate >= from && saleDate <= to;
        });
        const revenueForPL = salesForPL.reduce((sum, s) => sum + s.sale.total_amount, 0);
        const cogsForPL = salesForPL.flatMap(s => s.items).reduce((sum, i) => sum + (i.quantity * i.cost_per_unit_at_sale), 0);
        const profitForPL = revenueForPL - cogsForPL;
        return {
          title: "Profit & Loss Statement",
          headers: ["Category", "Amount"],
          rows: [
            ["Gross Revenue", FormatCurrency(revenueForPL)],
            ["Cost of Goods Sold (COGS)", `-${FormatCurrency(cogsForPL)}`],
          ],
          summary: [
            { label: "Gross Profit", value: FormatCurrency(profitForPL) }
          ]
        };

      default:
        return null;
    }
  }, [selectedReport, dateRange, sales, materials, products, builds]);

  const handleDownloadPdf = () => {
    if (!reportData || !dateRange?.from || !dateRange?.to) return;

    const doc = new jsPDF();

    doc.text(reportData.title, 14, 16);
    doc.setFontSize(10);
    doc.text(`Date Range: ${format(dateRange.from, "LLL dd, y")} to ${format(dateRange.to, "LLL dd, y")}`, 14, 22);

    autoTable(doc, {
      head: [reportData.headers],
      body: reportData.rows,
      startY: 28,
    });

    if (reportData.summary.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text("Summary:", 14, finalY);
      autoTable(doc, {
        body: reportData.summary.map(s => [s.label, s.value]),
        startY: finalY + 4,
        theme: 'plain'
      });
    }

    doc.save(`${reportData.title.replace(/ /g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (initialLoading) {
    return <div className="p-8"><Skeleton className="h-screen w-full" /></div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reports</h1>
        <p className="mt-1 text-base text-gray-600">Generate and download reports to get insights into your business performance.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold">1. Select a Report Type</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <Button variant={selectedReport === 'sales' ? 'default' : 'outline'} onClick={() => setSelectedReport('sales')} className="h-20"><TrendingUp className="mr-2 h-5 w-5" />Sales Report</Button>
              <Button variant={selectedReport === 'inventory' ? 'default' : 'outline'} onClick={() => setSelectedReport('inventory')} className="h-20"><Boxes className="mr-2 h-5 w-5" />Inventory Report</Button>
              <Button variant={selectedReport === 'manufacturing' ? 'default' : 'outline'} onClick={() => setSelectedReport('manufacturing')} className="h-20"><Hammer className="mr-2 h-5 w-5" />Manufacturing</Button>
              <Button variant={selectedReport === 'profit_loss' ? 'default' : 'outline'} onClick={() => setSelectedReport('profit_loss')} className="h-20"><BarChart className="mr-2 h-5 w-5" />Profit & Loss</Button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">2. Select Date Range</h3>
            <div className="mt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="date" variant="outline" className="w-full md:w-[300px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedReport && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{reportData?.title || 'Report'}</CardTitle>
              <CardDescription>
                {dateRange?.from && dateRange.to ? `Displaying data from ${format(dateRange.from, "LLL dd, y")} to ${format(dateRange.to, "LLL dd, y")}.` : "Select a date range."}
              </CardDescription>
            </div>
            <Button onClick={handleDownloadPdf} disabled={!reportData}>
              <FileDown className="mr-2 h-4 w-4" />Download as PDF
            </Button>
          </CardHeader>
          <CardContent>
            {reportData ? (
              <>
                <Table>
                  <TableHeader><TableRow>{reportData.headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {reportData.rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {reportData.summary.length > 0 && (
                  <div className="mt-6 w-full md:w-1/2 lg:w-1/3 ml-auto">
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <div className="space-y-2 text-sm p-4 border rounded-lg">
                      {reportData.summary.map(s => (
                        <div key={s.label} className="flex justify-between">
                          <p className="text-muted-foreground">{s.label}:</p>
                          <p className="font-medium">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16"><Archive className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-2">No data available for this report and date range.</p></div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}