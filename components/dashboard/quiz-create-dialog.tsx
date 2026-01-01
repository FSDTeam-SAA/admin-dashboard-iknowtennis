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

const createSchema = z.object({
  quizCategoryId: z.string().min(1, "Category is required"),
  quizzes: z
    .array(
      z.object({
        quizQuestion: z.string().min(1, "Question is required"),
        quizPoint: z.coerce.number().min(0, "Point must be 0 or more"),
        quizOptions: z
          .array(z.string().min(1, "Option cannot be empty"))
          .min(2, "At least 2 options are required")
          .max(6, "Maximum 6 options are allowed"),
        quizAnswer: z.string().min(1, "Answer is required"),
        isActive: z.boolean().optional(),
      }).superRefine((val, ctx) => {
        if (val.quizAnswer && !val.quizOptions.includes(val.quizAnswer)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["quizAnswer"],
            message: "Correct answer must match one of the options",
          });
        }
      })
    )
    .min(1, "At least one question is required"),
});

type CreateForm = z.infer<typeof createSchema>;

type BackendBulkPayload = {
  quizCategory: string;
  quizzes: Array<{
    quizQuestion: string;
    quizOptions: string[];
    quizAnswer: string;
    quizPoint: number;
    isActive?: boolean;
  }>;
};

function OptionsEditor({
  control,
  qIndex,
}: {
  control: Control<CreateForm>;
  qIndex: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `quizzes.${qIndex}.quizOptions` as const,
  });

  const options = useWatch({
    control,
    name: `quizzes.${qIndex}.quizOptions` as const,
  });

  return (
    <div className="space-y-3 pt-4 border-t mt-4">
      <FormLabel className="font-semibold">Options</FormLabel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((f, index) => (
          <div key={f.id} className="flex items-center gap-2">
            <FormField
              control={control}
              name={`quizzes.${qIndex}.quizOptions.${index}` as const}
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
          name={`quizzes.${qIndex}.quizAnswer` as const}
          render={({ field }) => (
            <FormItem className="flex-1 min-w-[200px]">
              <FormLabel>Correct Answer</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Which one is correct?" />
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

export function QuizCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ["quiz-categories"],
    queryFn: () => quizCategoryApi.getAll(),
    staleTime: 60_000,
  });

  const defaultValues = useMemo<CreateForm>(
    () => ({
      quizCategoryId: "",
      quizzes: [
        {
          quizQuestion: "",
          quizPoint: 5,
          quizOptions: ["", ""],
          quizAnswer: "",
          isActive: true,
        },
      ],
    }),
    []
  );

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { fields: questions, append, remove } = useFieldArray({
    control: form.control,
    name: "quizzes",
  });

  const mutation = useMutation({
    mutationFn: async (values: CreateForm) => {
      const payload: BackendBulkPayload = {
        quizCategory: values.quizCategoryId,
        quizzes: values.quizzes.map((q) => ({
          quizQuestion: q.quizQuestion,
          quizOptions: q.quizOptions,
          quizAnswer: q.quizAnswer,
          quizPoint: q.quizPoint ?? 0,
          isActive: q.isActive ?? true,
        })),
      };
      return quizApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast.success("Question(s) created successfully");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Create failed");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Create Question(s)</DialogTitle>
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

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Questions</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    append({
                      quizQuestion: "",
                      quizPoint: 5,
                      quizOptions: ["", ""],
                      quizAnswer: "",
                      isActive: true,
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Question
                </Button>
              </div>

              {questions.map((q, qIndex) => (
                <Card key={q.id} className="p-5 border-2">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-primary">Question #{qIndex + 1}</span>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => remove(qIndex)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-9">
                      <FormField
                        control={form.control}
                        name={`quizzes.${qIndex}.quizQuestion`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question</FormLabel>
                            <FormControl>
                              <Input placeholder="Write question..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`quizzes.${qIndex}.quizPoint`}
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

                  <OptionsEditor control={form.control} qIndex={qIndex} />
                </Card>
              ))}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
