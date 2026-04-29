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
      const menuWidth = 165; // Estimated min-w-[150px] + padding
      const menuHeight = 50; // Estimated height

      let adjustedX = x;
      let adjustedY = y;

      if (x + menuWidth > window.innerWidth) {
        adjustedX = window.innerWidth - menuWidth - 10;
      }
      if (y + menuHeight > window.innerHeight) {
        adjustedY = window.innerHeight - menuHeight - 10;
      }

      setPosition({ top: Math.max(10, adjustedY), left: Math.max(10, adjustedX) });
    }
  }, [visible, x, y]);

  if (!visible) return null;

  return (
    <div
      style={{
        top: position.top,
        left: position.left
      }}
      className="fixed z-50 bg-[#202c33] rounded-lg shadow-lg border border-gray-700 min-w-[150px]"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-[#2a3942] rounded-lg transition-colors whitespace-nowrap"
      >
        <Trash2 size={16} />
        {label}
      </button>
    </div>
  );
}
