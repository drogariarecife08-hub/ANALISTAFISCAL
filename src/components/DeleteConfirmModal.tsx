import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemType?: string;
  description?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Exclusão',
  itemName,
  itemType = 'item',
  description
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 text-red-600">
            <div className="p-3 bg-red-100 rounded-xl">
              <Trash2 className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Ação irreversível no sistema</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            Tem certeza de que deseja excluir permanentemente o(a) {itemType}:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <p className="font-bold text-xs text-slate-900 break-words">{itemName}</p>
          </div>
          {description && (
            <p className="text-[11px] text-slate-500 leading-normal">{description}</p>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 p-2.5 rounded-lg mt-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Todos os dados associados a este registro serão removidos.</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirmar Exclusão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
