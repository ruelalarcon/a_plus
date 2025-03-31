<script>
  import { userId } from "../lib/stores.js";
  import { Button } from "$lib/components/ui/button";
  import { Textarea } from "$lib/components/ui/textarea";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";

  // Icons
  import MessageSquare from "lucide-svelte/icons/message-square";
  import Calendar from "lucide-svelte/icons/calendar";

  export let comment;
  export let onEdit = null;
  export let onDelete = null;
  export let showTemplate = false;
  export let isEditing = false;
  export let editContent = "";
  export let isSubmitting = false;

  // Auto-initialize edit content if we're in edit mode
  $: if (isEditing && !editContent && comment) {
    editContent = comment.content;
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function handleSaveEdit() {
    if (onEdit) onEdit(comment, editContent);
  }

  function handleCancelEdit() {
    if (onEdit) onEdit(null);
  }

  function handleDelete() {
    if (onDelete) onDelete(comment);
  }
</script>

<Card class="w-full hover:shadow-md transition-all duration-200">
  <CardHeader>
    <CardTitle class="text-base flex items-start gap-2">
      <MessageSquare class="h-4 w-4 mt-1 text-primary" />
      <div>
        {#if showTemplate && comment.template}
          Comment on <a
            href={`/template/${comment.template.id}`}
            class="text-primary hover:underline">{comment.template.name}</a
          >
        {:else}
          <span class="flex items-center gap-2">
            {#if comment.author?.username}
              <div
                class="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium"
              >
                {comment.author.username.charAt(0).toUpperCase()}
              </div>
            {:else}
              <div
                class="bg-muted text-muted-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium"
              >
                ?
              </div>
            {/if}
            {#if comment.author?.id}
              <a
                href={`/user/${comment.author.id}`}
                class="hover:text-primary hover:underline"
              >
                {comment.author.username}
              </a>
            {:else}
              {comment.author?.username || "User"}
            {/if}
          </span>
        {/if}
      </div>
    </CardTitle>
    <CardDescription class="flex items-center gap-1">
      <Calendar class="h-3.5 w-3.5" />
      <span>{formatDate(comment.created_at || comment.updated_at)}</span>
    </CardDescription>
  </CardHeader>
  <CardContent>
    {#if isEditing}
      <div class="space-y-2">
        <Textarea bind:value={editContent} rows="3" disabled={isSubmitting} />
        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            on:click={handleCancelEdit}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isSubmitting ||
              !editContent.trim() ||
              editContent === comment.content}
            on:click={handleSaveEdit}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    {:else}
      <p class="whitespace-pre-wrap">{comment.content}</p>

      {#if comment.author && comment.author.id === $userId && (onEdit || onDelete)}
        <div class="mt-4 flex justify-end gap-2">
          {#if onEdit}
            <Button
              variant="outline"
              size="sm"
              on:click={() => onEdit(comment)}
            >
              Edit
            </Button>
          {/if}
          {#if onDelete}
            <Button variant="destructive" size="sm" on:click={handleDelete}>
              Delete
            </Button>
          {/if}
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
