"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { jokeApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JokeDialog, JokeDoc } from "@/components/dashboard/joke-dialog";
import Image from "next/image";

function JokeSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-80 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function JokesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editJoke, setEditJoke] = useState<JokeDoc | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["jokes", { page }],
    queryFn: () => jokeApi.getAll(page, 12),
  });

  const deleteMutation = useMutation({
    mutationFn: jokeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jokes"] });
      toast.success("Joke deleted successfully");
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete joke");
    },
  });

  const jokes: JokeDoc[] = data?.data?.jokes ?? [];
  const pagination = data?.data?.pagination;

  const filteredJokes = useMemo(() => {
    if (!search) return jokes;
    const query = search.toLowerCase();
    return jokes.filter((j) =>
      `${j.text} ${j.jokeAnswer}`.toLowerCase().includes(query)
    );
  }, [jokes, search]);

  const openCreate = () => {
    setEditJoke(null);
    setDialogOpen(true);
  };

  const openEdit = (joke: JokeDoc) => {
    setEditJoke(joke);
    setDialogOpen(true);
  };

  const totalPages = pagination?.totalPages ?? 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Jokes</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and manage all jokes in one place</p>
        </div>
        <Button className="gap-2 h-11 px-6" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Joke
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search jokes..."
            className="pl-10 h-12 bg-white shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            Page {page} of {totalPages}
          </Badge>
          <Button variant="outline" size="sm" disabled={!canNext} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      {isLoading ? (
        <JokeSkeletonGrid />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredJokes.map((joke) => (
              <Card
                key={joke._id}
                className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100">
                  <Image
                    src={joke.imageUrl || "/placeholder.svg?height=200&width=400"}
                    alt="Joke"
                    width={500}
                    height={500}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
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
                        <DropdownMenuItem onClick={() => openEdit(joke)}>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(joke._id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {joke.text}
                    </h3>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Answer</p>
                    <p className="text-sm font-medium mt-1 line-clamp-2">{joke.jokeAnswer}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJokes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No jokes found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or add a new joke</p>
            </div>
          )}
        </>
      )}

      <JokeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        joke={editJoke}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this joke?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected joke.
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
  );
}
