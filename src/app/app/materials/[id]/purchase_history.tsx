"use client";

import { MaterialPurchase, MaterialPurchaseStore } from '@/storage/material_purchases';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Edit3,
  Trash2,
  ShoppingCart, // For new section
  Archive,      // For empty state
  MoreVertical, // For actions menu
} from 'lucide-react';
import { FormatCurrency, FormatDate } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const PurchaseHistoryList = ({ purchases, craftingUnit, onEdit, onDelete }: {
  purchases: MaterialPurchase[],
  craftingUnit: string,
  onEdit: (purchase: MaterialPurchase) => void,
  onDelete: (purchase: MaterialPurchase) => void,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShoppingCart className="h-5 w-5" /> Purchase History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Archive className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-medium text-muted-foreground">No purchase history recorded yet.</p>
            <p className="text-sm text-muted-foreground">Log a new purchase to start tracking.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Avg. Cost / Unit</TableHead>
                <TableHead className="text-center w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{FormatDate(purchase.purchase_date)}</TableCell>
                  <TableCell className="font-medium">{purchase.supplier_name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{purchase.total_quantity.toLocaleString()} {craftingUnit}</TableCell>
                  <TableCell className="text-right">{FormatCurrency(purchase.total_cost)}</TableCell>
                  <TableCell className="text-right">{FormatCurrency(purchase.avg_cost)}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(purchase)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(purchase)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};