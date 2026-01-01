"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

import { quizApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { QuizCreateDialog } from "@/components/dashboard/quiz-create-dialog";
import { QuizEditDialog } from "@/components/dashboard/QuizEditDialog";

/** Align with your backend shape */
type QuizCategoryObj = { _id: string; quizCategoryName: string };

export type QuizQuestionDoc = {
  _id: string;
  quizCategory?: QuizCategoryObj | string;
  quizQuestion: string;
  quizOptions?: string[];
  quizAnswer: string;
  quizPoint: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Group = {
  categoryId: string;
  categoryName: string;
  items: QuizQuestionDoc[];
};

function normalizeCategory(q: QuizQuestionDoc) {
  if (!q.quizCategory)
    return { categoryId: "uncategorized", categoryName: "Uncategorized" };

  if (typeof q.quizCategory === "string") {
    return { categoryId: q.quizCategory, categoryName: "Uncategorized" };
  }

  return {
    categoryId: q.quizCategory._id ?? "uncategorized",
    categoryName: q.quizCategory.quizCategoryName ?? "Uncategorized",
  };
}

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function QuizSkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-white p-4">
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
          <div className="mt-3 flex gap-2">
            <div className="h-6 w-24 rounded bg-muted animate-pulse" />
            <div className="h-6 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <Layers className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No questions found</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Try adjusting your search or category filter.
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Question(s)
        </Button>
      </div>
    </div>
  );
}

function QuizCardRow({
  quiz,
  onEdit,
  onDelete,
  dim,
}: {
  quiz: QuizQuestionDoc;
  onEdit: () => void;
  onDelete: () => void;
  dim?: boolean;
}) {
  const options = quiz.quizOptions ?? [];
  const hasOptions = options.length > 0;

  return (
    <details
      className={cx(
        "group rounded-xl border bg-white transition-shadow",
        "hover:shadow-sm",
        dim && "opacity-70"
      )}
    >
      <summary className="list-none cursor-pointer select-none p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium leading-6 truncate">
                {quiz.quizQuestion}
              </p>

              {!!quiz.isActive && (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  Active
                </Badge>
              )}
              {quiz.isActive === false && (
                <Badge
                  variant="outline"
                  className="bg-zinc-50 text-zinc-700 border-zinc-200"
                >
                  Inactive
                </Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                Answer: {quiz.quizAnswer}
              </Badge>

              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200"
              >
                {quiz.quizPoint} pts
              </Badge>

              <span className="text-xs text-muted-foreground">
                {hasOptions ? `${options.length} options` : "No options"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Edit question"
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete question"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="font-medium">Details</span>
            <span className="group-open:hidden">• click to expand</span>
            <span className="hidden group-open:inline">• click to collapse</span>
          </span>
        </div>
      </summary>

      <div className="border-t px-4 pb-4 pt-3">
        {hasOptions ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Options</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {options.map((opt) => {
                const isCorrect = opt === quiz.quizAnswer;
                return (
                  <li
                    key={opt}
                    className={cx(
                      "rounded-lg border p-3 text-sm",
                      isCorrect
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="leading-5">{opt}</span>
                      {isCorrect && (
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                          Correct
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No options provided.</p>
        )}
      </div>
    </details>
  );
}

export default function QuizQuestionsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);

  // ✅ Separate create/edit modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editQuiz, setEditQuiz] = useState<QuizQuestionDoc | null>(null);

  // UX: debounced search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["quizzes", { page, search }],
    queryFn: async () => quizApi.getAll(page, search),
    staleTime: 20_000,
  });

  const quizzes: QuizQuestionDoc[] = data?.data ?? [];
  const totalPages: number =
    data?.meta?.totalPages ?? data?.pagination?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quizApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast.success("Question deleted successfully");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete question"),
  });

  const { groups, categoryStats, totalVisible } = useMemo(() => {
    const grouped = new Map<string, Group>();

    const filtered = quizzes.filter((q) => {
      if (!search) return true;
      const hay = `${q.quizQuestion} ${q.quizAnswer} ${(q.quizOptions ?? []).join(
        " "
      )}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });

    for (const q of filtered) {
      const { categoryId, categoryName } = normalizeCategory(q);
      const g = grouped.get(categoryId) ?? {
        categoryId,
        categoryName,
        items: [],
      };
      g.items.push(q);
      grouped.set(categoryId, g);
    }

    const allGroups = Array.from(grouped.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName)
    );

    // optional sorting inside group
    for (const g of allGroups) {
      g.items.sort((a, b) => (b.quizPoint ?? 0) - (a.quizPoint ?? 0));
    }

    const stats = allGroups
      .map((g) => ({
        categoryId: g.categoryId,
        categoryName: g.categoryName,
        count: g.items.length,
      }))
      .sort(
        (a, b) =>
          b.count - a.count || a.categoryName.localeCompare(b.categoryName)
      );

    const visibleGroups =
      selectedCategoryId === "all"
        ? allGroups
        : allGroups.filter((g) => g.categoryId === selectedCategoryId);

    const visibleCount = visibleGroups.reduce((acc, g) => acc + g.items.length, 0);

    return {
      groups: visibleGroups,
      categoryStats: stats,
      totalVisible: visibleCount,
    };
  }, [quizzes, search, selectedCategoryId]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const openEdit = (quiz: QuizQuestionDoc) => {
    setEditQuiz(quiz);
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quiz Questions</h1>
          <p className="text-sm text-muted-foreground">
            Browse by category, search quickly, and manage questions.
          </p>
        </div>

        <Button
          type="button"
          className="gap-2 self-start sm:self-auto"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add New Question(s)
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="border-none shadow-sm">
        <CardHeader className="bg-white border-b">
          <CardTitle className="sr-only">Toolbar</CardTitle>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search question, options, answer..."
                className="pl-10 h-10"
              />
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">{totalVisible}</span>{" "}
                item{totalVisible === 1 ? "" : "s"}
                {isFetching && <span className="ml-2 text-xs">Updating…</span>}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!canPrev}
                  onClick={() => canPrev && setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-sm text-muted-foreground min-w-[90px] text-center">
                  Page <span className="font-medium text-foreground">{page}</span> /{" "}
                  <span className="font-medium text-foreground">{totalPages}</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!canNext}
                  onClick={() => canNext && setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Category Sidebar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Categories
                </h2>
                <Badge variant="outline" className="bg-muted/40">
                  {categoryStats.length}
                </Badge>
              </div>

              <div className="rounded-2xl border bg-white p-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={cx(
                    "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                    selectedCategoryId === "all"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">All</span>
                    <span
                      className={cx(
                        "text-xs",
                        selectedCategoryId === "all"
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {categoryStats.reduce((a, c) => a + c.count, 0)}
                    </span>
                  </div>
                </button>

                <div className="my-2 h-px bg-border" />

                <div className="max-h-[360px] overflow-auto pr-1">
                  <div className="space-y-1">
                    {categoryStats.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No categories
                      </div>
                    ) : (
                      categoryStats.map((c) => (
                        <button
                          key={c.categoryId}
                          type="button"
                          onClick={() => setSelectedCategoryId(c.categoryId)}
                          className={cx(
                            "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                            selectedCategoryId === c.categoryId
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{c.categoryName}</span>
                            <span
                              className={cx(
                                "shrink-0 text-xs",
                                selectedCategoryId === c.categoryId
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              {c.count}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main List */}
            <div className="space-y-6">
              {isLoading ? (
                <QuizSkeletonList />
              ) : totalVisible === 0 ? (
                <EmptyState onAdd={() => setCreateOpen(true)} />
              ) : (
                <div className="space-y-8">
                  {groups.map((g) => (
                    <section key={g.categoryId} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-base font-semibold truncate">
                            {g.categoryName}
                          </h3>
                          <Badge variant="outline" className="bg-muted/40">
                            {g.items.length}
                          </Badge>
                        </div>

                        {selectedCategoryId !== "all" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCategoryId("all")}
                          >
                            Clear filter
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {g.items.map((quiz) => (
                          <QuizCardRow
                            key={quiz._id}
                            quiz={quiz}
                            dim={isFetching}
                            onEdit={() => openEdit(quiz)}
                            onDelete={() => setDeleteId(quiz._id)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Create Modal */}
      <QuizCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* ✅ Edit Modal */}
      <QuizEditDialog
        open={editOpen}
        quiz={editQuiz}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditQuiz(null);
        }}
      />

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the question from the quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
