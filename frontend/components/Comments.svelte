<script>
  import { Button } from "$lib/components/ui/button";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Separator } from "$lib/components/ui/separator";
  import { query, mutate } from "../lib/graphql/client.js";
  import { TEMPLATE_COMMENTS } from "../lib/graphql/queries.js";
  import {
    ADD_TEMPLATE_COMMENT,
    UPDATE_TEMPLATE_COMMENT,
    DELETE_TEMPLATE_COMMENT,
  } from "../lib/graphql/mutations.js";
  import { toast } from "svelte-sonner";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import CommentCard from "./CommentCard.svelte";

  export let templateId;

  // State
  let comments = [];
  let newComment = "";
  let editingComment = null;
  let editContent = "";
  let isLoading = false;
  let isSubmitting = false;
  let isDeleting = false;
  let isDialogOpen = false;
  let commentToDelete = null;

  // Comment loading
  async function loadComments() {
    isLoading = true;
    try {
      const data = await query(TEMPLATE_COMMENTS, { templateId });
      comments = data.templateComments;
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Failed to load comments");
    } finally {
      isLoading = false;
    }
  }

  // Comment creation
  async function submitComment() {
    const content = newComment.trim();
    if (!content) return;

    isSubmitting = true;
    try {
      const data = await mutate(ADD_TEMPLATE_COMMENT, {
        templateId,
        content,
      });

      if (data.addTemplateComment) {
        comments = [data.addTemplateComment, ...comments];
        newComment = "";
        toast.success("Comment added");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to submit comment");
    } finally {
      isSubmitting = false;
    }
  }

  // Comment editing
  function handleEdit(comment, content) {
    if (!comment) {
      // Cancel edit
      editingComment = null;
      editContent = "";
      return;
    }

    if (content) {
      // Save edit
      saveEdit(comment, content);
      return;
    }

    // Start edit
    editingComment = { ...comment };
    editContent = comment.content;
  }

  async function saveEdit(comment, content) {
    if (!content.trim() || content === comment.content) {
      editingComment = null;
      editContent = "";
      return;
    }

    isSubmitting = true;
    try {
      const data = await mutate(UPDATE_TEMPLATE_COMMENT, {
        commentId: comment.id,
        content: content.trim(),
      });

      if (data.updateTemplateComment) {
        comments = comments.map((c) =>
          c.id === comment.id ? data.updateTemplateComment : c
        );
        editingComment = null;
        editContent = "";
        toast.success("Comment updated");
      }
    } catch (error) {
      console.error("Error saving comment:", error);
      toast.error("Failed to update comment");
    } finally {
      isSubmitting = false;
    }
  }

  // Comment deletion
  function handleDelete(comment) {
    commentToDelete = comment;
    isDialogOpen = true;
  }

  async function deleteComment() {
    if (!commentToDelete) return;

    isDeleting = true;
    try {
      const data = await mutate(DELETE_TEMPLATE_COMMENT, {
        commentId: commentToDelete.id,
      });
      if (data.deleteTemplateComment) {
        comments = comments.filter((c) => c.id !== commentToDelete.id);
        toast.success("Comment deleted");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      isDeleting = false;
      isDialogOpen = false;
      commentToDelete = null;
    }
  }

  // Load comments when component mounts
  loadComments();
</script>

<div class="space-y-4" data-test="comments-container">
  {#if isLoading}
    <div
      class="text-center py-4 text-muted-foreground"
      data-test="comments-loading"
    >
      Loading comments...
    </div>
  {:else}
    <form
      class="space-y-4"
      on:submit|preventDefault={submitComment}
      data-test="comment-form"
    >
      <Textarea
        bind:value={newComment}
        placeholder="Add a comment..."
        rows="3"
        disabled={isSubmitting}
        data-test="new-comment-textarea"
      />
      <div class="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          data-test="post-comment-btn"
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>

    {#if comments.length > 0}
      <div class="space-y-4" data-test="comments-list">
        {#each comments as comment}
          <CommentCard
            {comment}
            isEditing={editingComment?.id === comment.id}
            editContent={comment.id === editingComment?.id ? editContent : ""}
            {isSubmitting}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <Separator class="mt-4" />
        {/each}
      </div>
    {:else}
      <p
        class="text-center text-muted-foreground"
        data-test="no-comments-message"
      >
        No comments yet. Be the first to comment!
      </p>
    {/if}
  {/if}
</div>

<AlertDialog.Root
  open={isDialogOpen}
  onOpenChange={(open) => (isDialogOpen = open)}
  data-test="delete-comment-dialog"
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Comment</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete this comment? This action cannot be
        undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel
        disabled={isDeleting}
        data-test="cancel-delete-comment-btn">Cancel</AlertDialog.Cancel
      >
      <AlertDialog.Action
        on:click={deleteComment}
        disabled={isDeleting}
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        data-test="confirm-delete-comment-btn"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
