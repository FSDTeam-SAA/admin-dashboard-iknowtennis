"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit2, Trash2, Plus, Search, MoreVertical } from "lucide-react"
import { toast } from "sonner"

import { quizCategoryApi } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CategoryDialog } from "@/components/dashboard/category-dialog"
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

export default function CategoryListPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["quiz-categories", page],
    queryFn: () => quizCategoryApi.getAll(page),
  })

  const deleteMutation = useMutation({
    mutationFn: quizCategoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-categories"] })
      toast.success("Category deleted successfully")
      setDeleteId(null)
    },
    onError: () => toast.error("Failed to delete category"),
  })

  const filteredCategories = data?.data?.filter((category: any) =>
    category.quizCategoryName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Category Management</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your quiz categories</p>
        </div>
        <CategoryDialog>
          <Button className="gap-2 h-11 px-6">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        </CategoryDialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          className="pl-10 h-12 bg-white shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories?.map((category: any) => (
              <Card
                key={category._id}
                className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
                  <img
                    src={category.quizCategoryImage || "/placeholder.svg?height=200&width=400"}
                    alt={category.quizCategoryName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <CategoryDialog category={category}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                        </CategoryDialog>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(category._id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant={category.quizCategoryState === "Active" ? "default" : "secondary"}
                      className="font-medium shadow-sm"
                    >
                      {category.quizCategoryState}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {category.quizCategoryName}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {category.quizCategoryDetails}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Quizzes</span>
                      <span className="text-lg font-bold text-primary">{category.quizCount || 0}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">Points</span>
                      <span className="text-lg font-bold text-orange-500">{category.quizPoint}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">Time</span>
                      <span className="text-lg font-bold text-green-600">{category.quizTotalTime}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!filteredCategories || filteredCategories.length === 0) && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No categories found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or create a new category</p>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
