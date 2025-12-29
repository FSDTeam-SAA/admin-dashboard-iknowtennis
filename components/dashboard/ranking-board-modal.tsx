"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

import { dashboardApi } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

export function RankingBoardModal() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["ranking", page],
    queryFn: () => dashboardApi.getRanking(page, 10),
    enabled: open,
  })

  const pagination = data?.data?.pagination
  const rankings = data?.data?.ranking || []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">Ranking Board</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 bg-white border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            Organizer Ranking Board
          </DialogTitle>
          <DialogClose className="opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <DialogDescription className="sr-only">View the top ranking organizers</DialogDescription>
        <div className="p-0">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-6 text-center w-24">Position</TableHead>
                <TableHead className="px-6 border-l">User Name</TableHead>
                <TableHead className="px-6 border-l">Email</TableHead>
                <TableHead className="px-6 border-l text-center">Mark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6 py-6 text-center">
                        <Skeleton className="h-10 w-10 mx-auto" />
                      </TableCell>
                      <TableCell className="px-6 border-l">
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                      <TableCell className="px-6 border-l">
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                      <TableCell className="px-6 border-l text-center">
                        <Skeleton className="h-10 w-12 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : rankings.map((rank: any) => (
                    <TableRow key={rank.userId} className="border-t">
                      <TableCell className="px-6 py-6 text-center text-xl font-bold">#{rank.position}</TableCell>
                      <TableCell className="px-6 border-l">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={rank.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{rank.fullName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-muted-foreground">{rank.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 border-l text-muted-foreground">{rank.email}</TableCell>
                      <TableCell className="px-6 border-l text-center font-bold text-muted-foreground">
                        {rank.mark}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
        <div className="bg-blue-50/50 p-4 flex items-center justify-between border-t mt-0">
          <p className="text-sm text-muted-foreground">
            {pagination
              ? `Showing ${pagination.showingFrom} to ${pagination.showingTo} of ${pagination.total} results`
              : "Loading..."}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-muted bg-white"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination || page === 1}
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </Button>
            {pagination &&
              Array.from({ length: Math.min(pagination.totalPages, 3) }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  className={`h-9 w-9 ${page === p ? "bg-primary" : "bg-white border-muted"}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            <Button
              className="h-9 w-9 bg-primary"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination || page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6 bg-white border-t flex gap-4">
          <Button className="flex-1 h-12 text-lg bg-primary">Publish</Button>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="flex-1 h-12 text-lg text-primary border-primary hover:bg-primary/5 bg-transparent"
            >
              Cancel
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
