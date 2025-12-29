"use client"

import type React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Plus, X } from "lucide-react"
import { useState } from "react"

import { subscriptionPlanApi, quizCategoryApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

const subscriptionPlanSchema = z.object({
  subscriptionPlanName: z.string().min(1, "Plan name is required"),
  subscriptionMonthlyPlanPrice: z.coerce.number().min(0),
  subscriptionYearlyPlanPrice: z.coerce.number().min(0),
  subscriptionDetailsList: z.array(z.object({ value: z.string().min(1, "Detail cannot be empty") })).min(1),
  allowedQuizCategories: z.array(z.string()).optional(),
})

type SubscriptionPlanForm = z.infer<typeof subscriptionPlanSchema>

export function SubscriptionPlanDialog({ plan, children }: { plan?: any; children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: categoriesData } = useQuery({
    queryKey: ["quiz-categories"],
    queryFn: () => quizCategoryApi.getAll(1),
  })

  const form = useForm<SubscriptionPlanForm>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: {
      subscriptionPlanName: plan?.subscriptionPlanName || "",
      subscriptionMonthlyPlanPrice: plan?.subscriptionMonthlyPlanPrice || 0,
      subscriptionYearlyPlanPrice: plan?.subscriptionYearlyPlanPrice || 0,
      subscriptionDetailsList: plan?.subscriptionDetailsList?.map((d: string) => ({ value: d })) || [{ value: "" }],
      allowedQuizCategories: plan?.allowedQuizCategories || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subscriptionDetailsList",
  })

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        subscriptionDetailsList: data.subscriptionDetailsList.map((item: any) => item.value),
      }
      return plan ? subscriptionPlanApi.update(plan._id, payload) : subscriptionPlanApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] })
      toast.success(plan ? "Plan updated" : "Plan created")
      setOpen(false)
      form.reset()
    },
    onError: () => toast.error("Something went wrong"),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Subscription Plan" : "Create New Subscription Plan"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="subscriptionPlanName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subscriptionMonthlyPlanPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price for Month</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="$0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subscriptionYearlyPlanPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price for Year</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="$0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <FormLabel>Subscription Details</FormLabel>
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`subscriptionDetailsList.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input placeholder="Feature detail" {...field} />
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => remove(index)}
                                className="shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ value: "" })}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Detail
                </Button>
              </div>

              <FormField
                control={form.control}
                name="allowedQuizCategories"
                render={() => (
                  <FormItem>
                    <FormLabel>Choose Your Subscription Plan</FormLabel>
                    <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
                      {categoriesData?.data?.map((category: any) => (
                        <FormField
                          key={category._id}
                          control={form.control}
                          name="allowedQuizCategories"
                          render={({ field }) => (
                            <FormItem key={category._id} className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category._id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), category._id])
                                      : field.onChange(field.value?.filter((value) => value !== category._id))
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">{category.quizCategoryName}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
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
                  {plan ? "Update Plan" : "Create Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
