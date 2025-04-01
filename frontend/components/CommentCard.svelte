<script>
  import { userId } from "../lib/stores.js";
  import { Button } from "$lib/components/ui/button";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Card from "$lib/components/ui/card";

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

<Card.Card
  class="w-full hover:shadow-md transition-all duration-200"
  data-test="comment-card"
  data-comment-id={comment.id}
>
  <Card.CardHeader>
    <Card.CardTitle class="text-base flex items-start gap-2">
      <MessageSquare class="h-4 w-4 mt-1 text-primary" />
      <div>
        {#if showTemplate && comment.template}
          <span data-test="comment-template">
            Comment on <a
              href={`/template/${comment.template.id}`}
              class="text-primary hover:underline"
              data-test="comment-template-link">{comment.template.name}</a
            >
          </span>
        {:else}
          <span class="flex items-center gap-2" data-test="comment-author">
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
                data-test="author-profile-link"
              >
                {comment.author.username}
              </a>
            {:else}
              {comment.author?.username || "User"}
            {/if}
          </span>
        {/if}
      </div>
    </Card.CardTitle>
    <Card.CardDescription
      class="flex items-center gap-1"
      data-test="comment-date"
    >
      <Calendar class="h-3.5 w-3.5" />
      <span>{formatDate(comment.created_at || comment.updated_at)}</span>
    </Card.CardDescription>
  </Card.CardHeader>
  <Card.CardContent>
    {#if isEditing}
      <div class="space-y-2" data-test="comment-edit-form">
        <Textarea
          bind:value={editContent}
          rows="3"
          disabled={isSubmitting}
          data-test="comment-edit-textarea"
        />
        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            on:click={handleCancelEdit}
            data-test="cancel-edit-btn"
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
            data-test="save-edit-btn"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    {:else}
      <p class="whitespace-pre-wrap" data-test="comment-content">
        {comment.content}
      </p>

      {#if comment.author && comment.author.id === $userId && (onEdit || onDelete)}
        <div class="mt-4 flex justify-end gap-2" data-test="comment-actions">
          {#if onEdit}
            <Button
              variant="outline"
              size="sm"
              on:click={() => onEdit(comment)}
              data-test="edit-comment-btn"
            >
              Edit
            </Button>
          {/if}
          {#if onDelete}
            <Button
              variant="destructive"
              size="sm"
              on:click={handleDelete}
              data-test="delete-comment-btn"
            >
              Delete
            </Button>
          {/if}
        </div>
      {/if}
    {/if}
  </Card.CardContent>
</Card.Card>
