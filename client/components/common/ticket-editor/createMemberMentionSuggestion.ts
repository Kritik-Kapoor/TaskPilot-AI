import MentionList, {
  type MentionListRef,
} from "@/components/common/ticket-editor/MentionList";
import type { MentionMemberItem } from "@/components/common/ticket-editor/MentionList";
import { ReactRenderer } from "@tiptap/react";
import type {
  SuggestionKeyDownProps,
  SuggestionOptions,
  SuggestionProps,
} from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";

const getClientRect = (clientRect?: (() => DOMRect | null) | null) => () =>
  clientRect?.() ?? new DOMRect();

export const createMemberMentionSuggestion = (
  members: MentionMemberItem[],
): Omit<SuggestionOptions<MentionMemberItem>, "editor"> => ({
  char: "@",
  items: ({ query }) =>
    members
      .filter((member) =>
        member.username.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 8),
  render: () => {
    let component: ReactRenderer<MentionListRef> | null = null;
    let popup: TippyInstance | null = null;
    let latestProps: SuggestionProps<MentionMemberItem> | null = null;

    const buildRendererProps = (props: SuggestionProps<MentionMemberItem>) => ({
      ...props,
      command: (item: { id: string; label: string }) => {
        latestProps?.command(item);
      },
    });

    return {
      onStart: (props: SuggestionProps<MentionMemberItem>) => {
        latestProps = props;

        component = new ReactRenderer(MentionList, {
          props: buildRendererProps(props),
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy(document.body, {
          getReferenceClientRect: getClientRect(props.clientRect),
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          theme: "mention",
          maxWidth: "none",
          zIndex: 9999,
        });
      },

      onUpdate: (props: SuggestionProps<MentionMemberItem>) => {
        latestProps = props;
        component?.updateProps(buildRendererProps(props));

        if (!props.clientRect || !popup) {
          return;
        }

        popup.setProps({
          getReferenceClientRect: getClientRect(props.clientRect),
        });
      },

      onKeyDown: (keyDownProps: SuggestionKeyDownProps) => {
        if (keyDownProps.event.key === "Escape") {
          popup?.hide();
          return true;
        }

        return (
          (component?.ref as MentionListRef | null)?.onKeyDown?.({
            event: keyDownProps.event,
          }) ?? false
        );
      },

      onExit: () => {
        popup?.destroy();
        component?.destroy();
        popup = null;
        component = null;
        latestProps = null;
      },
    };
  },
});
