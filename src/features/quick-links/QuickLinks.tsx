"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { DEFAULT_LINKS } from "@/config/defaults";
import type { QuickLink } from "@/types/profile";

type QuickLinksProps = {
  isLoading: boolean;
  links?: QuickLink[];
};

type SortableItemProps = {
  link: QuickLink;
};

function SortableLinkItem({ link }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: link.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-3 transition-colors hover:border-[color:var(--border-bright)] ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <button
        type="button"
        aria-label={`Arrastar link ${link.label}`}
        className="grid h-8 w-8 place-items-center rounded-md border border-[color:var(--border)] font-[family-name:var(--font-geist-mono)] text-xs text-[color:var(--text-secondary)] transition-colors hover:border-[color:var(--border-bright)] hover:text-[color:var(--text-primary)]"
        {...attributes}
        {...listeners}
      >
        :::
      </button>

      <span className="grid h-8 w-8 place-items-center rounded-md bg-[color:var(--accent-dim)] font-[family-name:var(--font-geist-mono)] text-xs font-semibold text-[color:var(--accent)]">
        {link.iconText}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{link.label}</p>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-xs text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--accent)]"
        >
          {link.url}
        </a>
      </div>
    </li>
  );
}

function QuickLinksSkeleton() {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 sm:p-6">
      <div className="mb-4 h-4 w-36 animate-pulse rounded bg-[color:var(--bg-elevated)]" />
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <li
            key={`quick-link-skeleton-${index}`}
            className="h-14 animate-pulse rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)]"
          />
        ))}
      </ul>
    </section>
  );
}

export function QuickLinks({
  isLoading,
  links: providedLinks,
}: QuickLinksProps) {
  const [links, setLinks] = useState<QuickLink[]>(
    providedLinks ?? DEFAULT_LINKS,
  );

  useEffect(() => {
    if (providedLinks) {
      setLinks(providedLinks);
    }
  }, [providedLinks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setLinks((currentLinks) => {
      const oldIndex = currentLinks.findIndex(
        (item) => item.id === String(active.id),
      );
      const newIndex = currentLinks.findIndex(
        (item) => item.id === String(over.id),
      );

      if (oldIndex === -1 || newIndex === -1) {
        return currentLinks;
      }

      return arrayMove(currentLinks, oldIndex, newIndex);
    });
  }

  if (isLoading) {
    return <QuickLinksSkeleton />;
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-[color:var(--text-muted)]">
          Quick Links
        </h2>
        <span className="h-px flex-1 bg-[color:var(--border)]" />
      </div>

      <p className="mb-4 text-sm text-[color:var(--text-secondary)]">
        Reordene os links arrastando o handle a esquerda.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={links.map((link) => link.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-3">
            {links.map((link) => (
              <SortableLinkItem key={link.id} link={link} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
