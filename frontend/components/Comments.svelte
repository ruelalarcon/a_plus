<script>
	import { userId } from '../lib/stores.js';
	import * as templateApi from '../lib/api/templates.js';

	export let templateId;

	let comments = [];
	let newComment = '';
	let editingComment = null;

	async function loadComments() {
		try {
			comments = await templateApi.getTemplateComments(templateId);
		} catch (error) {
			console.error('Error loading comments:', error);
		}
	}

	async function submitComment() {
		if (!newComment.trim()) return;

		try {
			const comment = await templateApi.addTemplateComment(templateId, newComment);
			comments = [comment, ...comments];
			newComment = '';
		} catch (error) {
			console.error('Error submitting comment:', error);
			alert('Failed to submit comment');
		}
	}

	async function deleteComment(commentId) {
		if (!confirm('Are you sure you want to delete this comment?')) return;

		try {
			await templateApi.deleteTemplateComment(templateId, commentId);
			comments = comments.filter(c => c.id !== commentId);
		} catch (error) {
			console.error('Error deleting comment:', error);
			alert('Failed to delete comment');
		}
	}

	function startEdit(comment) {
		editingComment = { ...comment };
	}

	function cancelEdit() {
		editingComment = null;
	}

	async function saveEdit(comment) {
		if (!editingComment.content.trim() || editingComment.content === comment.content) {
			cancelEdit();
			return;
		}

		try {
			const updatedComment = await templateApi.updateTemplateComment(templateId, comment.id, editingComment.content);
			comments = comments.map(c =>
				c.id === comment.id ? updatedComment : c
			);
			editingComment = null;
		} catch (error) {
			console.error('Error saving comment:', error);
			alert('Failed to save comment');
		}
	}

	// Load comments when component mounts
	loadComments();
</script>

<section>
	<header>
		<h3>Comments</h3>
	</header>

	<form>
		<textarea
			bind:value={newComment}
			placeholder="Add a comment..."
			rows="3"
		></textarea>
		<footer>
			<button type="button" on:click={submitComment}>Post Comment</button>
		</footer>
	</form>

	{#if comments.length > 0}
		<ul class="comment-list">
			{#each comments as comment}
				<li class="comment">
					<article>
						<header>
							<strong>{comment.username}</strong>
							<time datetime={comment.created_at}>
								{new Date(comment.created_at).toLocaleDateString()}
							</time>
							{#if comment.user_id === $userId}
								<nav>
									{#if editingComment?.id === comment.id}
										<button on:click={() => saveEdit(comment)}>Save</button>
										<button on:click={cancelEdit}>Cancel</button>
									{:else}
										<button on:click={() => startEdit(comment)}>Edit</button>
										<button on:click={() => deleteComment(comment.id)}>Delete</button>
									{/if}
								</nav>
							{/if}
						</header>
						{#if editingComment?.id === comment.id}
							<textarea
								bind:value={editingComment.content}
								rows="3"
							></textarea>
						{:else}
							<p>{comment.content}</p>
						{/if}
					</article>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No comments yet. Be the first to comment!</p>
	{/if}
</section>

<style>
	textarea {
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	.comment {
		border-bottom: 1px solid black;
		margin: 10px 0;
		padding: 10px 0;
	}
</style>