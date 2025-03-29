<script>
  import { userId } from "../lib/stores.js";
  import { Button } from "$lib/components/ui/button";
  import { Textarea } from "$lib/components/ui/textarea";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import { query, mutate } from "../lib/graphql/client.js";
  import { TEMPLATE_COMMENTS } from "../lib/graphql/queries.js";
  import {
    ADD_TEMPLATE_COMMENT,
    UPDATE_TEMPLATE_COMMENT,
    DELETE_TEMPLATE_COMMENT,
  } from "../lib/graphql/mutations.js";

  export let templateId;

  let comments = [];
  let newComment = "";
  let editingComment = null;

  async function loadComments() {
    try {
      const data = await query(TEMPLATE_COMMENTS, { templateId });
      comments = data.templateComments;
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  }

  async function submitComment() {
    if (!newComment.trim()) return;

    try {
      const data = await mutate(ADD_TEMPLATE_COMMENT, {
        templateId,
        content: newComment.trim(),
      });

      if (data.addTemplateComment) {
        comments = [data.addTemplateComment, ...comments];
        newComment = "";
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment");
    }
  }

  async function deleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const data = await mutate(DELETE_TEMPLATE_COMMENT, { commentId });
      if (data.deleteTemplateComment) {
        comments = comments.filter((c) => c.id !== commentId);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  }

  function startEdit(comment) {
    editingComment = { ...comment };
  }

  function cancelEdit() {
    editingComment = null;
  }

  async function saveEdit(comment) {
    if (
      !editingComment.content.trim() ||
      editingComment.content === comment.content
    ) {
      cancelEdit();
      return;
    }

    try {
      const data = await mutate(UPDATE_TEMPLATE_COMMENT, {
        commentId: comment.id,
        content: editingComment.content.trim(),
      });

      if (data.updateTemplateComment) {
        comments = comments.map((c) =>
          c.id === comment.id ? data.updateTemplateComment : c
        );
        editingComment = null;
      } else {
        console.error("Error response from API");
        alert("Failed to save comment: Unknown error");
      }
    } catch (error) {
      console.error("Error saving comment:", error);
      alert("Failed to save comment");
    }
  }

  // Load comments when component mounts
  loadComments();
</script>

<Card class="w-full">
  <CardHeader>
    <CardTitle>Comments</CardTitle>
  </CardHeader>

  <CardContent>
    <div class="space-y-4">
      <form class="space-y-4">
        <Textarea
          bind:value={newComment}
          placeholder="Add a comment..."
          rows="3"
        />
        <div class="flex justify-end">
          <Button type="button" on:click={submitComment}>Post Comment</Button>
        </div>
      </form>

      {#if comments.length > 0}
        <div class="space-y-4">
          {#each comments as comment}
            <div class="comment">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <strong>{comment.author.username}</strong>
                  <span class="text-sm text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                {#if comment.author.id === $userId}
                  <div class="flex gap-2">
                    {#if editingComment?.id === comment.id}
                      <Button
                        variant="outline"
                        size="sm"
                        on:click={() => saveEdit(comment)}>Save</Button
                      >
                      <Button variant="outline" size="sm" on:click={cancelEdit}
                        >Cancel</Button
                      >
                    {:else}
                      <Button
                        variant="outline"
                        size="sm"
                        on:click={() => startEdit(comment)}>Edit</Button
                      >
                      <Button
                        variant="destructive"
                        size="sm"
                        on:click={() => deleteComment(comment.id)}
                        >Delete</Button
                      >
                    {/if}
                  </div>
                {/if}
              </div>

              {#if editingComment?.id === comment.id}
                <div class="mt-2">
                  <Textarea bind:value={editingComment.content} rows="3" />
                </div>
              {:else}
                <p class="mt-2">{comment.content}</p>
              {/if}

              <Separator class="mt-4" />
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-center text-muted-foreground">
          No comments yet. Be the first to comment!
        </p>
      {/if}
    </div>
  </CardContent>
</Card>
