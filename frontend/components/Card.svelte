<script>
    export let title;
    export let details = [];
    export let showActions = true;
    export let extraContent = null;
</script>

<article class="card">
    <header>
        <h3>{title}</h3>
    </header>
    <div class="card-details">
        {#each details as detail}
            <p>{detail}</p>
        {/each}
        {#if showActions}
            <nav class="card-actions">
                <slot name="actions"></slot>
            </nav>
        {/if}
    </div>
    {#if extraContent}
        <footer class="extra-content">
            <slot name="extra"></slot>
        </footer>
    {/if}
</article>

<style>
    .card {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
    }

    .card-details {
        margin: 10px 0;
    }

    .card-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .extra-content {
        margin-top: 10px;
        border-top: 1px solid black;
        padding-top: 10px;
    }
</style>