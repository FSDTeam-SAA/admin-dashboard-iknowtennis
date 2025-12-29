"use client"

import type React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { quizApi, quizCategoryApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const quizSchema = z.z.object({
  quizCategory: z.string().min(1, "Category is required"),
  quizQuestion: z.string().min(5, "Question is too short"),
  quizOptions: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
  quizAnswer: z.string().min(1, "Answer is required"),
  quizPoint: z.coerce.number().min(1),
})

export function QuizDialog({ quiz, children }: { quiz?: any; children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ["quiz-categories-list"],
    queryFn: () => quizCategoryApi.getAll(1),
  })

  const form = useForm<z.infer<typeof quizSchema>>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      quizCategory: quiz?.quizCategory?._id || "",
      quizQuestion: quiz?.quizQuestion || "",
      quizOptions: quiz?.quizOptions || ["", "", "", ""],
      quizAnswer: quiz?.quizAnswer || "",
      quizPoint: quiz?.quizPoint || 10,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "quizOptions" as any,
  })

  const mutation = useMutation({
    mutationFn: (data: any) => (quiz ? quizApi.update(quiz._id, data) : quizApi.create(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success(quiz ? "Question updated" : "Question created")
      setOpen(false)
      form.reset()
    },
    onError: () => toast.error("Something went wrong"),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{quiz ? "Edit Question" : "Add New Question"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quizCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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

            <FormField
              control={form.control}
              name="quizQuestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the quiz question..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Options</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`quizOptions.${index}` as any}
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
                        className="h-10 w-10 text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={() => append("")}
                disabled={fields.length >= 6}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Option
              </Button>
            </div>

            <FormField
              control={form.control}
              name="quizAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correct Answer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {form.getValues("quizOptions").map((opt, i) =>
                        opt ? (
                          <SelectItem key={i} value={opt}>
                            {opt}
                          </SelectItem>
                        ) : null,
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {quiz ? "Update Question" : "Create Question"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
