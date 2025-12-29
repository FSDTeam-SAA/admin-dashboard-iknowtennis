"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, MoreVertical } from "lucide-react"
import { toast } from "sonner"

import { subscriptionPlanApi } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SubscriptionPlanDialog } from "@/components/dashboard/subscription-plan-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SubscriptionPage() {
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: subscriptionPlanApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: subscriptionPlanApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] })
      toast.success("Plan deleted successfully")
      setDeleteId(null)
    },
    onError: () => toast.error("Failed to delete plan"),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Flexible</span> Plan
          </h1>
          <p className="text-muted-foreground text-sm">Create a plan that works best for you</p>
        </div>
        <SubscriptionPlanDialog>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add New Plan
          </Button>
        </SubscriptionPlanDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-xl" />)
          : data?.data?.map((plan: any, index: number) => {
              const isFree = plan.subscriptionMonthlyPlanPrice === 0 && plan.subscriptionYearlyPlanPrice === 0
              return (
                <Card
                  key={plan._id}
                  className={`overflow-hidden border-none shadow-lg relative ${
                    isFree
                      ? "bg-gradient-to-br from-blue-50 to-blue-100"
                      : "bg-gradient-to-br from-purple-50 to-pink-50"
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-20 bg-primary rounded-b-[50%]" />
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <SubscriptionPlanDialog plan={plan}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                        </SubscriptionPlanDialog>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(plan._id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardContent className="p-6 pt-12 space-y-4">
                    <div className="text-center relative z-10">
                      <h3 className="text-lg font-bold capitalize text-white mb-2">{plan.subscriptionPlanName}</h3>
                    </div>

                    <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-4">
                      {isFree ? (
                        <div className="text-3xl font-bold text-gray-400">
                          $ 00.0<span className="text-lg">/0</span>
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-gray-900">
                            $ {plan.subscriptionYearlyPlanPrice}
                            <span className="text-lg font-medium">/year</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            or ${plan.subscriptionMonthlyPlanPrice}/month
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-2 min-h-[150px]">
                      {plan.subscriptionDetailsList?.map((detail: string, idx: number) => (
                        <div key={idx} className="text-sm text-gray-700 capitalize">
                          {detail}
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {plan.allowedQuizCategories?.length || 0} Quiz Categories Allowed
                    </div>

                    <Button className="w-full" variant={isFree ? "outline" : "default"}>
                      {isFree ? "Save" : "Subscribe"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subscription plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
