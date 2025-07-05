import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';
import { MemberData } from '@/types/member';

// Mock member data for demonstration
const MOCK_MEMBERS: Partial<MemberData>[] = [
  {
    id: '1',
    name: 'Yash Chaudhari',
    designation: 'Senior Developer',
    department: 'Engineering',
    profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100'
  },
  {
    id: '2',
    name: 'Saket Bhide',
    designation: 'Product Manager',
    department: 'Product',
    profilePicture: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&h=100'
  },
  {
    id: '3',
    name: 'Pravin Warke',
    designation: 'UX Designer',
    department: 'Design',
    profilePicture: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=100&h=100'
  },
  {
    id: '4',
    name: 'Ravi Patil',
    designation: 'Frontend Developer',
    department: 'Engineering',
    profilePicture: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100'
  },
  {
    id: '5',
    name: 'Tanuja Nemade',
    designation: 'HR Manager',
    department: 'Human Resources',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100'
  }
];

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof MOCK_MEMBERS>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for members
  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsLoading(true);
      
      // Mock API call with timeout to simulate network request
      const timeoutId = setTimeout(() => {
        // In a real application, this would be an API call
        // const fetchMembers = async () => {
        //   const response = await fetch(`/api/members/search?q=${searchQuery}`);
        //   const data = await response.json();
        //   setSearchResults(data);
        // };
        
        // Filter mock data for demonstration
        const filteredResults = MOCK_MEMBERS.filter(member => 
          member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.department?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setSearchResults(filteredResults);
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [searchQuery]);

  const handleSearchFocus = () => {
    setIsOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const viewMemberProfile = (memberId: string) => {
    // Navigate to member profile page
    window.location.href = `/members/${memberId}`;
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search className="h-5 w-5 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search members..."
            className="bg-transparent border-none focus:outline-none w-60"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          <div className="p-2">
            <h3 className="text-xs font-semibold text-gray-500 px-3 py-2">SEARCH RESULTS</h3>
            
            {isLoading && (
              <div className="flex justify-center items-center py-4">
                <div className="loader">Loading...</div>
              </div>
            )}
            
            {!isLoading && searchResults.length === 0 && searchQuery && (
              <div className="text-center py-4 text-gray-500">
                No members found matching "{searchQuery}"
              </div>
            )}
            
            {!isLoading && searchResults.map((member) => (
              <div 
                key={member.id}
                className="flex items-center px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
                onClick={() => viewMemberProfile(member.id!)}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <img 
                    src={member.profilePicture} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium text-sm">{member.name}</div>
                  <div className="text-xs text-gray-500">
                    {member.designation} • {member.department}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch; 