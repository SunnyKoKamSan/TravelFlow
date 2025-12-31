interface FABProps {
  openAddModal: () => void;
  activeTab: string;
}

export default function FAB({ openAddModal, activeTab }: FABProps) {
  if (activeTab === 'map') return null;

  return (
    <button
      onClick={openAddModal}
      className="fixed right-6 bottom-32 w-16 h-16 rounded-[28px] bg-stone-800 text-amber-50 shadow-2xl flex items-center justify-center z-30 transition-transform active:scale-90 hover:scale-105 hover:bg-stone-700 border border-stone-600/50"
    >
      <i className="ph ph-plus text-2xl"></i>
    </button>
  );
}
