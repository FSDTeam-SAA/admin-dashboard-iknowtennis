"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { quizApi, quizCategoryApi } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type QuizQuestionDoc = {
  _id: string;
  quizCategory?: { _id: string; quizCategoryName: string } | string;
  quizQuestion: string;
  quizOptions?: string[];
  quizAnswer: string;
  quizPoint: number;
  isActive?: boolean;
};

const editSchema = z
  .object({
    quizCategoryId: z.string().min(1, "Category is required"),
    quizQuestion: z.string().min(1, "Question is required"),
    quizPoint: z.coerce.number().min(0, "Point must be 0 or more"),
    quizOptions: z
      .array(z.string().min(1, "Option cannot be empty"))
      .min(2, "At least 2 options are required")
      .max(6, "Maximum 6 options are allowed"),
    quizAnswer: z.string().min(1, "Answer is required"),
    isActive: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.quizAnswer && !val.quizOptions.includes(val.quizAnswer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quizAnswer"],
        message: "Correct answer must match one of the options",
      });
    }
  });

type EditForm = z.infer<typeof editSchema>;

type BackendSingleUpdatePayload = {
  quizCategory: string;
  quizQuestion: string;
  quizOptions: string[];
  quizAnswer: string;
  quizPoint: number;
  isActive?: boolean;
};

function OptionsEditorSingle({ control }: { control: Control<EditForm> }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "quizOptions",
  });

  const options = useWatch({ control, name: "quizOptions" });

  return (
    <div className="space-y-3 pt-4 border-t mt-4">
      <FormLabel className="font-semibold">Options</FormLabel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((f, index) => (
          <div key={f.id} className="flex items-center gap-2">
            <FormField
              control={control}
              name={`quizOptions.${index}` as const}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder={`Option ${index + 1}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {fields.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive h-9 w-9"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append("")}
          disabled={fields.length >= 6}
          className="h-9"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Option
        </Button>

        <FormField
          control={control}
          name="quizAnswer"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-[200px]">
              <FormLabel>Correct Answer</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options?.map((opt, i) =>
                    opt ? (
                      <SelectItem key={`${i}-${opt}`} value={opt}>
                        {opt}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function QuizEditDialog({
  open,
  onOpenChange,
  quiz,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  quiz: QuizQuestionDoc | null;
}) {
  const queryClient = useQueryClient();

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ["quiz-categories"],
    queryFn: () => quizCategoryApi.getAll(),
    staleTime: 60_000,
  });

  const defaultValues = useMemo<EditForm>(() => {
    const categoryId =
      !quiz?.quizCategory
        ? ""
        : typeof quiz.quizCategory === "string"
        ? quiz.quizCategory
        : quiz.quizCategory?._id ?? "";

    return {
      quizCategoryId: categoryId,
      quizQuestion: quiz?.quizQuestion ?? "",
      quizPoint: typeof quiz?.quizPoint === "number" ? quiz.quizPoint : 0,
      quizOptions:
        Array.isArray(quiz?.quizOptions) && (quiz?.quizOptions?.length ?? 0) >= 2
          ? (quiz!.quizOptions as string[])
          : ["", ""],
      quizAnswer: quiz?.quizAnswer ?? "",
      isActive: quiz?.isActive ?? true,
    };
  }, [quiz]);

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultValues]);

  const mutation = useMutation({
    mutationFn: async (values: EditForm) => {
      if (!quiz?._id) throw new Error("Missing question id");

      const payload: BackendSingleUpdatePayload = {
        quizCategory: values.quizCategoryId,
        quizQuestion: values.quizQuestion,
        quizOptions: values.quizOptions,
        quizAnswer: values.quizAnswer,
        quizPoint: values.quizPoint ?? 0,
        isActive: values.isActive ?? true,
      };

      return quizApi.update(quiz._id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast.success("Question updated successfully");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Update failed");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <FormField
                control={form.control}
                name="quizCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={catLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={catLoading ? "Loading..." : "Select category"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.data?.map((cat: any) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.quizCategoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="p-5 border-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-9">
                    <FormField
                      control={form.control}
                      name="quizQuestion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question</FormLabel>
                          <FormControl>
                            <Input placeholder="Edit question..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name="quizPoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <OptionsEditorSingle control={form.control} />
              </Card>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
