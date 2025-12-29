"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

import { quizCategoryApi } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

// <CHANGE> Updated schema to match new API requirements - removed quizCount as it's auto-calculated
const categorySchema = z.object({
  quizCategoryName: z.string().min(3, "Name is required"),
  quizCategoryState: z.string().default("Active"),
  quizPoint: z.coerce.number().min(0),
  quizTotalTime: z.coerce.number().min(0),
  quizCategoryDetails: z.string().min(10, "Details are required"),
  quizCategoryImage: z.any().optional(),
})

export function CategoryDialog({ category, children }: { category?: any; children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(category?.quizCategoryImage || "")

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      quizCategoryName: category?.quizCategoryName || "",
      quizCategoryState: category?.quizCategoryState || "Active",
      quizPoint: category?.quizPoint || 0,
      quizTotalTime: category?.quizTotalTime || 0,
      quizCategoryDetails: category?.quizCategoryDetails || "",
    },
  })

  // <CHANGE> Handle file upload for category image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      // <CHANGE> Create FormData for file upload support
      const data = new FormData()
      data.append("quizCategoryName", formData.quizCategoryName)
      data.append("quizCategoryState", formData.quizCategoryState)
      data.append("quizPoint", formData.quizPoint.toString())
      data.append("quizTotalTime", formData.quizTotalTime.toString())
      data.append("quizCategoryDetails", formData.quizCategoryDetails)
      
      if (imageFile) {
        data.append("quizCategoryImage", imageFile)
      }

      return category ? quizCategoryApi.update(category._id, data) : quizCategoryApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-categories"] })
      toast.success(category ? "Category updated" : "Category created")
      setOpen(false)
      form.reset()
      setImageFile(null)
      setImagePreview("")
    },
    onError: () => toast.error("Something went wrong"),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quizCategoryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quizCategoryState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quizPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Points</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quizTotalTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time (Seconds)</FormLabel>
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
              name="quizCategoryDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter category details..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <CHANGE> Added file upload input for category image */}
            <FormField
              control={form.control}
              name="quizCategoryImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Image</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                      </div>
                      {imagePreview && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
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
                {category ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
