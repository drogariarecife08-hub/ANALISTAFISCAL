import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Check, Building2, GitBranch, Users, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

interface ClearSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClearSystemModal: React.FC<ClearSystemModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { clearAllData, resetToDefaultData, companies, branches, invoices, occurrences } = useSystem();
  const [confirmWord, setConfirmWord] = useState('');

  if (!isOpen) return null;

  const handleClear = () => {
    clearAllData();
    onClose();
    if (onSuccess) onSuccess();
  };

  const handleRestore = () => {
    resetToDefaultData();
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 text-red-600">
            <div className="p-3 bg-red-100 rounded-xl">
              <Trash2 className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Zerar Todo o Sistema
              </h3>
              <p className="text-xs text-slate-500">
                Reiniciar para novos cadastros reais
              </p>
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

        <div className="mt-4 space-y-3">
          <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-xl text-red-900 text-xs leading-relaxed">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Atenção: Limpeza Completa da Base de Dados</span>
            </div>
            Esta ação removerá todos os dados de demonstração ({companies.length} empresas, {branches.length} filiais, {invoices.length} notas fiscais e {occurrences.length} ocorrências) para que você inicie o cadastro limpo de suas filiais, empresas e fornecedores reais.
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">O que será zerado:</p>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-500">
              <li>Empresas e Matrizes</li>
              <li>Filiais e Centros de Distribuição</li>
              <li>Colaboradores e Analistas Fiscais</li>
              <li>Notas Fiscais e Danfes</li>
              <li>Ocorrências e Avarias</li>
              <li>Tarefas e Cronogramas Fiscais</li>
            </ul>
            <p className="text-[11px] text-slate-500 pt-1">
              * O seu usuário atual continuará conectado para que você comece os cadastros imediatamente.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleRestore}
            className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center gap-1"
            title="Recarrega os dados de teste padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Demonstração</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Zerar Sistema Agora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
