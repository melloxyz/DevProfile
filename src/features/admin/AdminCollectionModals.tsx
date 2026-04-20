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
import { useEffect, useMemo, useState } from "react";

import type {
  Certificate,
  EventItem,
  Project,
  QuickLink,
} from "@/types/profile";

type ModalShellProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  isSaving: boolean;
  saveLabel: string;
  children: React.ReactNode;
};

function ModalShell({
  isOpen,
  title,
  description,
  onClose,
  onSave,
  isSaving,
  saveLabel,
  children,
}: ModalShellProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-(--border-bright) bg-(--bg-surface)">
        <header className="border-b border-(--border) px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
            {title}
          </h3>
          <p className="mt-1 text-xs text-(--text-secondary)">{description}</p>
        </header>

        <div className="max-h-[calc(88vh-124px)] overflow-auto px-4 py-4 sm:px-5">
          {children}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-(--border) px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-(--border) bg-(--bg-primary) px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-(--text-secondary)"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="rounded-full border border-(--accent) bg-(--accent-dim) px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : saveLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

type SortableQuickLinkRowProps = {
  link: QuickLink;
  isActive: boolean;
  onSelect: () => void;
};

function SortableQuickLinkRow({
  link,
  isActive,
  onSelect,
}: SortableQuickLinkRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: link.id,
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs",
        isActive
          ? "border-(--accent) bg-(--accent-dim)"
          : "border-(--border) bg-(--bg-primary)",
      ].join(" ")}
    >
      <span
        className="cursor-grab rounded-md border border-(--border) px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[10px] text-(--text-secondary)"
        {...attributes}
        {...listeners}
      >
        :::
      </span>
      <span className="grid h-6 w-6 place-items-center rounded bg-(--accent-dim) text-[10px] text-(--accent)">
        {link.iconText || "--"}
      </span>
      <span className="truncate">{link.label || "Novo link"}</span>
    </button>
  );
}

type QuickLinksEditorModalProps = {
  isOpen: boolean;
  initialItems: QuickLink[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (items: QuickLink[]) => void | Promise<void>;
};

export function QuickLinksEditorModal({
  isOpen,
  initialItems,
  isSaving,
  onClose,
  onSave,
}: QuickLinksEditorModalProps) {
  const [draft, setDraft] = useState<QuickLink[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const seeded = initialItems.length > 0 ? structuredClone(initialItems) : [];
    setDraft(seeded);
    setSelectedId(seeded[0]?.id ?? null);
  }, [initialItems, isOpen]);

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

  const selectedItem = useMemo(
    () => draft.find((item) => item.id === selectedId) ?? null,
    [draft, selectedId],
  );

  function updateSelected(updater: (current: QuickLink) => QuickLink) {
    if (!selectedId) {
      return;
    }

    setDraft((current) =>
      current.map((item) => (item.id === selectedId ? updater(item) : item)),
    );
  }

  function addItem() {
    const newItem: QuickLink = {
      id: crypto.randomUUID(),
      label: "Novo link",
      url: "https://",
      iconText: "LK",
    };

    setDraft((current) => [...current, newItem]);
    setSelectedId(newItem.id);
  }

  function removeSelected() {
    if (!selectedId) {
      return;
    }

    setDraft((current) => {
      const next = current.filter((item) => item.id !== selectedId);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setDraft((current) => {
      const oldIndex = current.findIndex(
        (item) => item.id === String(active.id),
      );
      const newIndex = current.findIndex((item) => item.id === String(over.id));

      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }

      return arrayMove(current, oldIndex, newIndex);
    });
  }

  return (
    <ModalShell
      isOpen={isOpen}
      title="Quick Links"
      description="Arraste para reordenar, selecione um item para editar e salve quando terminar."
      isSaving={isSaving}
      onClose={onClose}
      onSave={() => onSave(draft)}
      saveLabel="Salvar quick links"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addItem}
              className="rounded-full border border-(--border) bg-(--bg-primary) px-3 py-1.5 text-xs"
            >
              Adicionar link
            </button>
            <button
              type="button"
              onClick={removeSelected}
              disabled={!selectedId}
              className="rounded-full border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remover selecionado
            </button>
          </div>

          {draft.length === 0 ? (
            <p className="rounded-lg border border-dashed border-(--border-bright) px-3 py-4 text-xs text-(--text-secondary)">
              Nenhum link cadastrado.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={draft.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {draft.map((item) => (
                    <SortableQuickLinkRow
                      key={item.id}
                      link={item}
                      isActive={item.id === selectedId}
                      onSelect={() => setSelectedId(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>

        <section className="rounded-xl border border-(--border) bg-(--bg-primary) p-4">
          {selectedItem ? (
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs">
                <span>Label</span>
                <input
                  value={selectedItem.label}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={32}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>URL</span>
                <input
                  value={selectedItem.url}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      url: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={240}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>Icon Text</span>
                <input
                  value={selectedItem.iconText}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      iconText: event.target.value.slice(0, 4),
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={4}
                />
              </label>
            </div>
          ) : (
            <p className="text-xs text-(--text-secondary)">
              Selecione um item para editar.
            </p>
          )}
        </section>
      </div>
    </ModalShell>
  );
}

type ProjectsEditorModalProps = {
  isOpen: boolean;
  initialItems: Project[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (items: Project[]) => void | Promise<void>;
};

function createEmptyProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    stack: [],
    repoUrl: "https://",
    demoUrl: "",
    thumbnailUrl: "",
  };
}

export function ProjectsEditorModal({
  isOpen,
  initialItems,
  isSaving,
  onClose,
  onSave,
}: ProjectsEditorModalProps) {
  const [draft, setDraft] = useState<Project[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const seeded = initialItems.length > 0 ? structuredClone(initialItems) : [];
    setDraft(seeded);
    setSelectedIndex(0);
  }, [initialItems, isOpen]);

  const selected = draft[selectedIndex];

  function updateSelected(updater: (item: Project) => Project) {
    setDraft((current) =>
      current.map((item, index) =>
        index === selectedIndex ? updater(item) : item,
      ),
    );
  }

  function addItem() {
    setDraft((current) => [...current, createEmptyProject()]);
    setSelectedIndex(draft.length);
  }

  function removeSelected() {
    setDraft((current) => {
      const next = current.filter((_, index) => index !== selectedIndex);
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      return next;
    });
  }

  return (
    <ModalShell
      isOpen={isOpen}
      title="Projetos"
      description="Edite projetos fallback usados quando a API GitHub não estiver disponível."
      isSaving={isSaving}
      onClose={onClose}
      onSave={() => onSave(draft)}
      saveLabel="Salvar projetos"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addItem}
              className="rounded-full border border-(--border) bg-(--bg-primary) px-3 py-1.5 text-xs"
            >
              Adicionar projeto
            </button>
            <button
              type="button"
              onClick={removeSelected}
              disabled={draft.length === 0}
              className="rounded-full border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remover selecionado
            </button>
          </div>

          <div className="space-y-2">
            {draft.length === 0 ? (
              <p className="rounded-lg border border-dashed border-(--border-bright) px-3 py-4 text-xs text-(--text-secondary)">
                Nenhum projeto fallback cadastrado.
              </p>
            ) : (
              draft.map((item, index) => (
                <button
                  key={`${item.id}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={[
                    "w-full rounded-lg border px-3 py-2 text-left text-xs",
                    selectedIndex === index
                      ? "border-(--accent) bg-(--accent-dim)"
                      : "border-(--border) bg-(--bg-primary)",
                  ].join(" ")}
                >
                  <p className="truncate font-medium">
                    {item.name || "Novo projeto"}
                  </p>
                  <p className="mt-1 truncate text-(--text-secondary)">
                    {item.repoUrl}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-(--border) bg-(--bg-primary) p-4">
          {selected ? (
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs">
                <span>Nome</span>
                <input
                  value={selected.name}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={64}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>Descricao</span>
                <textarea
                  value={selected.description}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={260}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>Stack (separada por virgula)</span>
                <input
                  value={selected.stack.join(", ")}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      stack: event.target.value
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={180}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>Repositorio</span>
                <input
                  value={selected.repoUrl}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      repoUrl: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={240}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>Demo (opcional)</span>
                <input
                  value={selected.demoUrl ?? ""}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      demoUrl: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={240}
                />
              </label>
            </div>
          ) : (
            <p className="text-xs text-(--text-secondary)">
              Selecione um projeto para editar.
            </p>
          )}
        </section>
      </div>
    </ModalShell>
  );
}

type CredentialItem = Certificate | EventItem;

type CredentialsEditorModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  saveLabel: string;
  initialItems: CredentialItem[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (items: CredentialItem[]) => void | Promise<void>;
};

function createEmptyCredential(): CredentialItem {
  return {
    titulo: "",
    instituicao: "",
    emitido_em: "",
    codigo_credencial: "",
    url_validador: "https://",
  };
}

export function CredentialsEditorModal({
  isOpen,
  title,
  description,
  saveLabel,
  initialItems,
  isSaving,
  onClose,
  onSave,
}: CredentialsEditorModalProps) {
  const [draft, setDraft] = useState<CredentialItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const seeded = initialItems.length > 0 ? structuredClone(initialItems) : [];
    setDraft(seeded);
    setSelectedIndex(0);
  }, [initialItems, isOpen]);

  const selected = draft[selectedIndex];

  function updateSelected(updater: (item: CredentialItem) => CredentialItem) {
    setDraft((current) =>
      current.map((item, index) =>
        index === selectedIndex ? updater(item) : item,
      ),
    );
  }

  function addItem() {
    setDraft((current) => [...current, createEmptyCredential()]);
    setSelectedIndex(draft.length);
  }

  function removeSelected() {
    setDraft((current) => {
      const next = current.filter((_, index) => index !== selectedIndex);
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      return next;
    });
  }

  return (
    <ModalShell
      isOpen={isOpen}
      title={title}
      description={description}
      isSaving={isSaving}
      onClose={onClose}
      onSave={() => onSave(draft)}
      saveLabel={saveLabel}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addItem}
              className="rounded-full border border-(--border) bg-(--bg-primary) px-3 py-1.5 text-xs"
            >
              Adicionar item
            </button>
            <button
              type="button"
              onClick={removeSelected}
              disabled={draft.length === 0}
              className="rounded-full border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remover selecionado
            </button>
          </div>

          <div className="space-y-2">
            {draft.length === 0 ? (
              <p className="rounded-lg border border-dashed border-(--border-bright) px-3 py-4 text-xs text-(--text-secondary)">
                Nenhum item cadastrado.
              </p>
            ) : (
              draft.map((item, index) => (
                <button
                  key={`${item.codigo_credencial || "item"}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={[
                    "w-full rounded-lg border px-3 py-2 text-left text-xs",
                    selectedIndex === index
                      ? "border-(--accent) bg-(--accent-dim)"
                      : "border-(--border) bg-(--bg-primary)",
                  ].join(" ")}
                >
                  <p className="truncate font-medium">
                    {item.titulo || "Novo item"}
                  </p>
                  <p className="mt-1 truncate text-(--text-secondary)">
                    {item.instituicao || "Instituicao"}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-(--border) bg-(--bg-primary) p-4">
          {selected ? (
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs">
                <span>Titulo</span>
                <input
                  value={selected.titulo}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      titulo: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={140}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>Instituicao</span>
                <input
                  value={selected.instituicao}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      instituicao: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={80}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>Emitido em</span>
                <input
                  value={selected.emitido_em}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      emitido_em: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={12}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>Codigo da credencial</span>
                <input
                  value={selected.codigo_credencial}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      codigo_credencial: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={72}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span>URL validador</span>
                <input
                  value={selected.url_validador}
                  onChange={(event) =>
                    updateSelected((current) => ({
                      ...current,
                      url_validador: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-(--border) bg-(--bg-elevated) px-3 py-2"
                  maxLength={240}
                />
              </label>
            </div>
          ) : (
            <p className="text-xs text-(--text-secondary)">
              Selecione um item para editar.
            </p>
          )}
        </section>
      </div>
    </ModalShell>
  );
}
