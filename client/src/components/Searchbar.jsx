import { useState } from "react";
import { searchUsers } from "../services/api";
import { Search, X, UserPlus } from "lucide-react";

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.length > 0) {
      setIsSearching(true);
      try {
        const users = await searchUsers(val);
        setResults(users);
      } catch (err) {
        setResults([]);
      }
      setIsSearching(false);
    } else {
      setResults([]);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="p-3 bg-white border-b border-[#e6e6e6] shrink-0">
      <div className="relative flex items-center bg-[#f4f4f5] rounded-xl flex-1 border border-transparent focus-within:border-[#3390ec] transition-all">
        <div className="pl-4 pr-2 text-gray-400">
          <Search size={18} />
        </div>
        <input
          className="w-full bg-transparent p-2 text-[15px] outline-none text-[#222] placeholder-gray-400"
          placeholder="Search..."
          value={query}
          onChange={handleSearch}
        />
        {query && (
          <button 
            onClick={clearSearch}
            className="pr-4 text-gray-400 hover:text-gray-200"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search Dropdown / Results */}
      {query && (
        <div className="absolute left-0 right-0 top-[110px] bottom-0 bg-white z-20 overflow-y-auto w-full md:w-[inherit]">
          {isSearching ? (
             <div className="p-8 text-center text-gray-400 text-sm">Searching...</div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-[13px] text-[#3390ec] font-semibold uppercase tracking-wide">Contacts</div>
              {results.map((u) => (
                <div 
                  key={u._id} 
                  onClick={() => {
                    onSelect(u);
                    clearSearch();
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-[#3390ec] text-white rounded-full flex items-center justify-center overflow-hidden">
                    {u.avatar ? (
                      <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      u.username.substring(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[#222] text-[16px] font-medium">{u.username}</span>
                     {u.isOnline && <span className="text-[13px] text-[#3390ec]">Online</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              No users found matching "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}