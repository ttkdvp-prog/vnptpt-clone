import React, { useState } from 'react';
import { txt } from '@/lib/text';
import { Bookmark, Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SavedView } from '@/lib/saved-views';

interface SavedViewsManagerProps<TFilters> {
  views: SavedView<TFilters>[];
  activeViewId: string | null;
  onApplyView: (view: SavedView<TFilters>) => void;
  onSaveView: (name: string) => void;
  onDeleteView: (id: string) => void;
}

function SavedViewsManager<TFilters>({
  views, activeViewId, onApplyView, onSaveView, onDeleteView,
}: SavedViewsManagerProps<TFilters>) {
  const [newName, setNewName] = useState('');

  const handleSave = () => {
    const name = newName.trim();
    if (!name) return;
    onSaveView(name);
    setNewName('');
  };

  return (
    <div className="w-64 overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
        <Bookmark size={12} className="text-muted-foreground" />
        <h4 className="text-xs font-medium text-muted-foreground">{txt('common.savedViews')}</h4>
      </div>

      <div className="p-1.5 max-h-[240px] overflow-y-auto custom-scrollbar">
        {views.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground text-center">{txt('common.noSavedViews')}</p>
        ) : (
          views.map((view) => (
            <div
              key={view.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg group transition-colors",
                activeViewId === view.id ? "bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              <button
                type="button"
                onClick={() => onApplyView(view)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left"
              >
                <Check size={12} className={cn("shrink-0", activeViewId === view.id ? "text-primary" : "opacity-0")} />
                <span className="text-xs truncate text-foreground">{view.name}</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteView(view.id)}
                aria-label={txt('common.deleteView')}
                className="shrink-0 p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-border flex items-center gap-1.5">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={txt('common.viewNamePlaceholder')}
          className="flex-1 h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!newName.trim()}
          aria-label={txt('common.saveNewView')}
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default SavedViewsManager;
