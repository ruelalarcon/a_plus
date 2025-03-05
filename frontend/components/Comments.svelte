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

	async function submitComment() {
		if (!newComment.trim()) return;

		try {
			const response = await fetch(`/api/templates/${templateId}/comments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content: newComment })
			});

			if (!response.ok) throw new Error('Failed to submit comment');

			const comment = await response.json();
			comments = [comment, ...comments];
			newComment = '';
		} catch (error) {
			console.error('Error submitting comment:', error);
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