import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

export default function ContextMenu({ visible, x, y, onClose, onDelete, label = "Delete" }) {
  const [position, setPosition] = useState({ top: y, left: x });

  // Close menu on outside click
  useEffect(() => {
    if (!visible) return;
    const close = () => onClose();
    window.addEventListener("click", close);
    // Cleanup on unmount or when visible changes
    return () => window.removeEventListener("click", close);
  }, [visible, onClose]);

  // Adjust position to keep it inside the screen
  useEffect(() => {
    if (visible) {
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // Center of the screen for mobile
        setPosition({ 
          top: window.innerHeight / 2 - 30, 
          left: window.innerWidth / 2 - 75 
        });
      } else {
        const menuWidth = 160;
        const menuHeight = 50;
        let adjustedX = x;
        let adjustedY = y;

        if (x + menuWidth > window.innerWidth) adjustedX = window.innerWidth - menuWidth - 20;
        if (y + menuHeight > window.innerHeight) adjustedY = window.innerHeight - menuHeight - 20;

        setPosition({ top: Math.max(10, adjustedY), left: Math.max(10, adjustedX) });
      }
    }
  }, [visible, x, y]);

  if (!visible) return null;

  const isMobile = window.innerWidth < 768;

  return (
    <>
      {/* Dimmed Overlay with enhanced blur */}
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Centered Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-[#e6e6e6] min-w-[200px] overflow-hidden pointer-events-auto transition-all animate-in fade-in zoom-in duration-200`}
        >
          <div className="px-5 py-6 flex flex-col items-center gap-4">
             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <Trash2 size={24} />
             </div>
             <div className="text-center">
                <h3 className="text-lg font-semibold text-[#222]">Delete Message?</h3>
                <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
             </div>
             <div className="flex flex-col w-full gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#222] rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
