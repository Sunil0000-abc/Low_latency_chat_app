export default function MessageBubble({ text, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : ""}`}>
      <div
        className={`p-2 rounded-lg max-w-xs ${
          isOwn ? "bg-[#005c4b]" : "bg-[#202c33]"
        }`}
      >
        {text}
      </div>
    </div>
  );
}