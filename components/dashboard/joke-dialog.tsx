"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon } from "lucide-react";

import { jokeApi } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export type JokeDoc = {
  _id: string;
  text: string;
  jokeAnswer: string;
  imageUrl: string;
  createdAt?: string;
};

const jokeSchema = z.object({
  text: z.string().min(1, "Joke text is required"),
  jokeAnswer: z.string().min(1, "Joke answer is required"),
});

type JokeForm = z.infer<typeof jokeSchema>;

export function JokeDialog({
  open,
  onOpenChange,
  joke,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  joke?: JokeDoc | null;
}) {
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const defaultValues = useMemo<JokeForm>(
    () => ({
      text: joke?.text ?? "",
      jokeAnswer: joke?.jokeAnswer ?? "",
    }),
    [joke]
  );

  const form = useForm<JokeForm>({
    resolver: zodResolver(jokeSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setImageFile(null);
    }
  }, [open, defaultValues, form]);

  const mutation = useMutation({
    mutationFn: async (values: JokeForm) => {
      const payload = new FormData();
      payload.append("text", values.text);
      payload.append("jokeAnswer", values.jokeAnswer);
      if (imageFile) payload.append("jokeImage", imageFile);

      if (joke?._id) return jokeApi.update(joke._id, payload);
      return jokeApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jokes"] });
      toast.success(joke ? "Joke updated successfully" : "Joke created successfully");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Request failed");
    },
  });

  const onSubmit = (values: JokeForm) => {
    if (!joke && !imageFile) {
      toast.error("Joke image is required");
      return;
    }
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{joke ? "Edit Joke" : "Add New Joke"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Joke</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write the joke..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jokeAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Input placeholder="Joke answer..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Joke Image</FormLabel>
                {joke?.imageUrl && !imageFile && (
                  <span className="text-xs text-muted-foreground">Current image will stay unless replaced</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
                {joke?.imageUrl && !imageFile && (
                  <div className="h-10 w-10 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                    <img src={joke.imageUrl} alt="Joke" className="h-full w-full object-cover" />
                  </div>
                )}
                {imageFile && (
                  <div className="h-10 w-10 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              {!joke && <p className="text-xs text-muted-foreground">Image is required when creating a joke.</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {joke ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
