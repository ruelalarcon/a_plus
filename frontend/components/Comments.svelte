<div class="comments-section">
	<h3>Comments</h3>

	<div class="new-comment">
		<textarea
			bind:value={newComment}
			placeholder="Add a comment..."
			rows="3"
		></textarea>
		<button on:click={addComment}>Post Comment</button>
	</div>

	{#if comments.length > 0}
		<div class="comments-list">
			{#each comments as comment}
				<div class="comment">
					<div class="comment-header">
						<span class="username">{comment.username}</span>
						<span class="date">{new Date(comment.created_at).toLocaleDateString()}</span>
						{#if comment.user_id === $userId}
							<div class="comment-actions">
								{#if editingComment?.id === comment.id}
									<button on:click={() => saveEdit(comment)}>Save</button>
									<button on:click={cancelEdit}>Cancel</button>
								{:else}
									<button on:click={() => startEdit(comment)}>Edit</button>
									<button on:click={() => deleteComment(comment.id)}>Delete</button>
								{/if}
							</div>
						{/if}
					</div>
					{#if editingComment?.id === comment.id}
						<textarea
							bind:value={editingComment.content}
							rows="3"
						></textarea>
					{:else}
						<p class="comment-content">{comment.content}</p>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p class="no-comments">No comments yet. Be the first to comment!</p>
	{/if}
</div>

<script>
	import { userId } from '../lib/stores.js';

	export let templateId;

	let comments = [];
	let newComment = '';
	let editingComment = null;

	async function loadComments() {
		const response = await fetch(`/api/templates/${templateId}/comments`);
		if (response.ok) {
			comments = await response.json();
		}
	}

	async function addComment() {
		if (!newComment.trim()) return;

		const response = await fetch(`/api/templates/${templateId}/comments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: newComment })
		});

		if (response.ok) {
			const comment = await response.json();
			comments = [...comments, comment];
			newComment = '';
		}
	}

	async function deleteComment(commentId) {
		if (!confirm('Are you sure you want to delete this comment?')) return;

		const response = await fetch(`/api/templates/${templateId}/comments/${commentId}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			comments = comments.filter(c => c.id !== commentId);
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

		const response = await fetch(`/api/templates/${templateId}/comments/${comment.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: editingComment.content })
		});

		if (response.ok) {
			const updatedComment = await response.json();
			comments = comments.map(c =>
				c.id === comment.id ? updatedComment : c
			);
			editingComment = null;
		}
	}

	// Load comments when component mounts
	loadComments();
</script>

<style>
	.comments-section {
		padding: 20px;
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.new-comment {
		margin: 20px 0;
	}

	textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 10px;
		margin-bottom: 10px;
		border: 1px solid #ccc;
		resize: vertical;
	}

	.comment {
		padding: 15px 0;
		border-bottom: 1px solid #eee;
	}

	.comment:last-child {
		border-bottom: none;
	}

	.comment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.username {
		font-weight: bold;
	}

	.date {
		color: #666;
		font-size: 0.9em;
	}

	.comment-actions {
		display: flex;
		gap: 10px;
	}

	.comment-content {
		margin: 0;
		white-space: pre-wrap;
	}

	.no-comments {
		text-align: center;
		color: #666;
		margin: 20px 0;
	}
</style>