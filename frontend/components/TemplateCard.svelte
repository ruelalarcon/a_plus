<script>
  import { Link } from "svelte-routing";
  import VoteButtons from "./VoteButtons.svelte";
  import { openCommentsModal } from "./CommentsModal.svelte";
  import { mutate } from "../lib/graphql/client.js";
  import { USE_TEMPLATE } from "../lib/graphql/mutations.js";
  import { navigate } from "svelte-routing";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Separator } from "$lib/components/ui/separator";
  import { toast } from "svelte-sonner";

  // Icons
  import Link2 from "lucide-svelte/icons/link-2";
  import ScanEye from "lucide-svelte/icons/scan-eye";
  import ExternalLink from "lucide-svelte/icons/external-link";
  import MessageSquare from "lucide-svelte/icons/message-square";
  import FileText from "lucide-svelte/icons/file-text";
  import Building2 from "lucide-svelte/icons/building-2";
  import Calendar from "lucide-svelte/icons/calendar";
  import User from "lucide-svelte/icons/user";
  import Copy from "lucide-svelte/icons/copy";
  import Check from "lucide-svelte/icons/check";

  // Props
  export let template;
  export let showActions = true;
  export let onDelete = (id) => {
    toast.success("Template deleted");
  };

  let copiedToClipboard = false;

  /**
   * Creates a new calculator from this template
   */
  async function useTemplate(templateId) {
    try {
      const data = await mutate(USE_TEMPLATE, { templateId });
      if (data.useTemplate) {
        toast.success("Template applied successfully");
        navigate(`/calculator/${data.useTemplate.id}`);
      } else {
        toast.error("Failed to use template");
      }
    } catch (error) {
      console.error("Error using template:", error);
      toast.error("Failed to use template");
    }
  }

  /**
   * Copies template share link to clipboard
   */
  function copyShareLink(templateId) {
    const url = `${window.location.origin}/template/${templateId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        copiedToClipboard = true;
        toast.success("Share link copied to clipboard!");
        setTimeout(() => (copiedToClipboard = false), 2000);
      })
      .catch(() => toast.error("Failed to copy link"));
  }
</script>

<Card.Root
  class="w-full h-full flex flex-col transition-all duration-200 border-muted/60 hover:shadow-md hover:border-primary/20"
>
  <Card.Header class="pb-3">
    <div class="flex justify-between items-start">
      <div class="space-y-1">
        <div class="flex items-center gap-2 group">
          <FileText class="h-5 w-5 text-primary" />
          <Card.Title
            class="text-xl font-bold group-hover:text-primary transition-colors duration-200"
          >
            {template.name}
          </Card.Title>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 rounded-full transition-all opacity-0 group-hover:opacity-80 hover:opacity-100"
            on:click={() => copyShareLink(template.id)}
          >
            {#if copiedToClipboard}
              <Check class="h-3.5 w-3.5 text-green-500" />
            {:else}
              <Copy class="h-3.5 w-3.5" />
            {/if}
          </Button>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {#if template.institution}
            <div class="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 class="h-3.5 w-3.5" />
              <span>{template.institution || "Institution"}</span>
            </div>
          {/if}
          {#if template.term || template.year}
            <div class="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar class="h-3.5 w-3.5" />
              <span>{template.term || "Term"} {template.year || ""}</span>
            </div>
          {/if}
        </div>
        <div class="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <User class="h-3 w-3" />
          <span
            >By {#if template.creator?.id}
              <Link
                to={`/user/${template.creator.id}`}
                class="hover:text-primary hover:underline"
              >
                {template.creator.username}
              </Link>
            {:else}
              {template.creator?.username || "Unknown"}
            {/if}</span
          >
        </div>
      </div>
      <VoteButtons
        voteCount={template.vote_count}
        userVote={template.user_vote}
        creatorId={template.creator?.id}
        templateId={template.id}
        {onDelete}
      />
    </div>
  </Card.Header>

  {#if showActions}
    <Card.Footer class="flex justify-between mt-auto flex-wrap gap-2 pt-0">
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          class="flex items-center gap-1 bg-muted/30 hover:bg-muted"
          on:click={() => copyShareLink(template.id)}
        >
          <Link2 class="h-3.5 w-3.5" />
          <span>Share</span>
        </Button>
        <Link to={`/template/${template.id}`}>
          <Button
            variant="outline"
            size="sm"
            class="flex items-center gap-1 bg-muted/30 hover:bg-muted"
          >
            <ScanEye class="h-3.5 w-3.5" />
            <span>Preview</span>
          </Button>
        </Link>
      </div>
      <Button
        size="sm"
        class="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-1"
        on:click={() => useTemplate(template.id)}
      >
        <ExternalLink class="h-3.5 w-3.5" />
        <span>Use Template</span>
      </Button>
    </Card.Footer>
  {/if}

  <div class="mt-auto">
    <Separator />
    <Button
      variant="ghost"
      size="sm"
      class="w-full rounded-none h-10 justify-center text-muted-foreground hover:text-primary hover:bg-primary/5"
      on:click={() => openCommentsModal(template.id)}
    >
      <MessageSquare class="h-4 w-4 mr-2" />
      <span>View Comments</span>
    </Button>
  </div>
</Card.Root>
