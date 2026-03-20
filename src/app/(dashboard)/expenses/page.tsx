"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useExpenseStore } from "@/store/expense-store";
import { useAuthStore } from "@/store/auth-store";
import type { Expense, ExpenseCategory } from "@/types";
import { Plus, TrendingDown, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: ExpenseCategory[] = [
  "RENT",
  "SALARY",
  "UTILITIES",
  "SUPPLIES",
  "MAINTENANCE",
  "MARKETING",
  "INSURANCE",
  "MISCELLANEOUS",
];

function categoryLabel(c: ExpenseCategory): string {
  return c.charAt(0) + c.slice(1).toLowerCase().replace(/_/g, " ");
}

export default function ExpensesPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const user = useAuthStore((s) => s.user);
  const currentBranch = useAuthStore((s) => s.currentBranch);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("SUPPLIES");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dateStr, setDateStr] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const columns = useMemo(
    () => [
      {
        key: "date",
        label: "Date",
        sortable: true,
        render: (item: Expense) => (
          <span className="text-muted-foreground">{formatDate(item.date)}</span>
        ),
      },
      {
        key: "category",
        label: "Category",
        sortable: true,
        render: (item: Expense) => (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
            {categoryLabel(item.category)}
          </span>
        ),
      },
      {
        key: "description",
        label: "Description",
        render: (item: Expense) => (
          <span className="font-medium line-clamp-2">{item.description}</span>
        ),
      },
      {
        key: "amount",
        label: "Amount",
        sortable: true,
        render: (item: Expense) => (
          <span className="font-semibold tabular-nums">{formatCurrency(item.amount)}</span>
        ),
      },
      {
        key: "createdByName",
        label: "Recorded by",
        className: "hidden md:table-cell",
        render: (item: Expense) => (
          <span className="text-sm text-muted-foreground">{item.createdByName}</span>
        ),
      },
    ],
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!description.trim() || Number.isNaN(n) || n <= 0) {
      toast.error("Enter a description and a valid amount.");
      return;
    }
    const createdBy = user?.id ?? "usr-001";
    const createdByName = user?.name ?? "User";
    const branchId = currentBranch?.id ?? user?.branchId ?? "br-001";

    addExpense({
      category,
      description: description.trim(),
      amount: n,
      date: dateStr,
      createdBy,
      createdByName,
      branchId,
    });
    toast.success("Expense recorded.");
    setDialogOpen(false);
    setDescription("");
    setAmount("");
    setDateStr(new Date().toISOString().slice(0, 10));
    setCategory("SUPPLIES");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Expenses"
        description="Record branch expenses; totals feed into Reports."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/reports">
                <BarChart3 className="w-4 h-4 mr-2" />
                View in Reports
              </Link>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add expense</DialogTitle>
                  <DialogDescription>
                    Amounts are stored for this branch and appear under Reports → Expense.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={category}
                      onValueChange={(v) => setCategory(v as ExpenseCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {categoryLabel(c)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-desc">Description</Label>
                    <Input
                      id="exp-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What was this for?"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exp-amt">Amount (₹)</Label>
                      <Input
                        id="exp-amt"
                        type="number"
                        min="1"
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exp-date">Date</Label>
                      <Input
                        id="exp-date"
                        type="date"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card>
        <CardContent className="p-5! flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30">
            <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            <p className="text-sm text-muted-foreground">Total recorded expenses</p>
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={expenses}
        columns={columns}
        searchPlaceholder="Search expenses..."
        searchKeys={["description", "category", "createdByName"]}
      />
    </div>
  );
}
