<script context="module">
  import { writable } from "svelte/store";

  // Create a store to manage the modal state globally
  export const commentsModal = writable({
    open: false,
    templateId: null,
  });

  // Helper function to open the modal with a specific template
  export function openCommentsModal(id) {
    commentsModal.set({
      open: true,
      templateId: id,
    });
  }

  // Helper function to close the modal
  export function closeCommentsModal() {
    commentsModal.set({
      open: false,
      templateId: null,
    });
  }
</script>

<script>
  import * as Sheet from "$lib/components/ui/sheet";
  import { Button } from "$lib/components/ui/button";
  import Comments from "./Comments.svelte";

  // Derived values from the store
  let open = false;
  let templateId = null;

  // Subscribe to changes in the store
  const unsubscribe = commentsModal.subscribe((state) => {
    open = state.open;
    templateId = state.templateId;
  });

  // Handle sheet state changes
  function handleOpenChange(isOpen) {
    if (!isOpen) {
      closeCommentsModal();
    }
  }

  // Clean up subscription when component is destroyed
  import { onDestroy } from "svelte";
  onDestroy(unsubscribe);
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
  <Sheet.Content
    side="right"
    class="w-full max-w-md sm:max-w-lg md:max-w-xl overflow-y-auto"
  >
    <div class="flex flex-col h-full">
      <div class="flex items-center p-4 border-b">
        <div>
          <h2 class="text-lg font-semibold">Comments</h2>
          <p class="text-sm text-muted-foreground">
            View and add comments for this template
          </p>
        </div>
      </div>

      <div class="flex-1 p-4 overflow-y-auto">
        {#if templateId}
          <Comments {templateId} />
        {/if}
      </div>
    </div>
  </Sheet.Content>
</Sheet.Root>
