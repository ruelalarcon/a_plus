<script context="module">
  import { writable } from "svelte/store";

  // Create a store to manage the modal state globally
  export const commentsSheet = writable({
    open: false,
    templateId: null,
  });

  // Helper function to open the sheet with a specific template
  export function openCommentsSheet(id) {
    commentsSheet.set({
      open: true,
      templateId: id,
    });
  }

  // Helper function to close the sheet
  export function closeCommentsSheet() {
    commentsSheet.set({
      open: false,
      templateId: null,
    });
  }
</script>

<script>
  import * as Sheet from "$lib/components/ui/sheet";
  import Comments from "./Comments.svelte";

  // Derived values from the store
  let open = false;
  let templateId = null;

  // Subscribe to changes in the store
  const unsubscribe = commentsSheet.subscribe((state) => {
    open = state.open;
    templateId = state.templateId;
  });

  // Handle sheet state changes
  function handleOpenChange(isOpen) {
    if (!isOpen) {
      closeCommentsSheet();
    }
  }

  // Clean up subscription when component is destroyed
  import { onDestroy } from "svelte";
  onDestroy(unsubscribe);
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange} data-test="comments-sheet">
  <Sheet.Content
    side="right"
    class="w-full max-w-md sm:max-w-lg md:max-w-xl overflow-y-auto"
    data-test="comments-sheet-content"
  >
    <div class="flex flex-col h-full">
      <div
        class="flex items-center p-4 border-b"
        data-test="comments-sheet-header"
      >
        <div>
          <h2 class="text-lg font-semibold" data-test="comments-sheet-title">
            Comments
          </h2>
          <p
            class="text-sm text-muted-foreground"
            data-test="comments-sheet-description"
          >
            View and add comments for this template
          </p>
        </div>
      </div>

      <div class="flex-1 p-4 overflow-y-auto" data-test="comments-sheet-body">
        {#if templateId}
          <Comments {templateId} />
        {/if}
      </div>
    </div>
  </Sheet.Content>
</Sheet.Root>
