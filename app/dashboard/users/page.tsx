"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

import { dashboardApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { RankingBoardModal } from "@/components/dashboard/ranking-board-modal"

export default function UserListPage() {
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: () => dashboardApi.getUsers(page, limit),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User List</h1>
        <RankingBoardModal />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-white border-b px-6 py-4">
          <CardTitle className="sr-only">Users</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-10 h-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-6 font-semibold">User Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Joined Date</TableHead>
                <TableHead className="font-semibold text-center">Payable</TableHead>
                <TableHead className="font-semibold">Plan Name</TableHead>
                <TableHead className="font-semibold text-right px-6">Actions Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j} className="px-6 py-4">
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.data?.map((user: any) => (
                    <TableRow key={user.userId}>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{format(new Date(user.joinedDate), "d-M-yyyy")}</TableCell>
                      <TableCell className="text-center font-medium">${user.payable.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={user.planName === "premium" ? "default" : "secondary"}>{user.planName}</Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-destructive border-destructive/20 bg-transparent"
                          >
                            Delete
                          </Button>
                          <Badge
                            className={
                              user.status === "Active"
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gray-400 hover:bg-gray-500"
                            }
                          >
                            {user.status}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-6 py-4 bg-white border-t">
            <p className="text-sm text-muted-foreground">
              Showing {data?.pagination?.showingFrom || 0} to {data?.pagination?.showingTo || 0} of{" "}
              {data?.pagination?.total || 0} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-transparent"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: data?.pagination?.totalPages || 0 }).map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    className="h-9 w-9"
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-transparent"
                disabled={page === data?.pagination?.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
