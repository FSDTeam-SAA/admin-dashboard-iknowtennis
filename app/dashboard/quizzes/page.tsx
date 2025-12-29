"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit2, Trash2, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { quizApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QuizDialog } from "@/components/dashboard/quiz-dialog"
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

export default function QuizQuestionsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["quizzes", page],
    queryFn: () => quizApi.getAll(page),
  })

  const deleteMutation = useMutation({
    mutationFn: quizApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Question deleted successfully")
      setDeleteId(null)
    },
    onError: () => toast.error("Failed to delete question"),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quiz Questions</h1>
        <QuizDialog>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add New Question
          </Button>
        </QuizDialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-white border-b">
          <CardTitle className="sr-only">Questions</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search questions..." className="pl-10 h-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-6">Category</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="text-center">Answer</TableHead>
                <TableHead className="text-center">Points</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="px-6 py-4 animate-pulse">
                      <div className="h-10 bg-muted rounded w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No questions found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((quiz: any) => (
                  <TableRow key={quiz._id}>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {quiz.quizCategory?.quizCategoryName}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md font-medium truncate">{quiz.quizQuestion}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                        {quiz.quizAnswer}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-orange-600">{quiz.quizPoint}</TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-2">
                        <QuizDialog quiz={quiz}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </QuizDialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(quiz._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this question from the quiz.</AlertDialogDescription>
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
