import { MemberData } from "@/types/member";
import { useEffect, useState } from "react";

interface MemberCardProps {
  member: MemberData;
  onViewProfile: () => void;
}

const MemberCard = ({ member, onViewProfile }: MemberCardProps) => {
  const [imageError, setImageError] = useState({
    profile: false,
    cover: false
  });

  // Reset error state if member changes
  useEffect(() => {
    setImageError({
      profile: false,
      cover: false
    });
  }, [member.id]);
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-500">
        {member.coverPhoto && !imageError.cover && (
          <img 
            src={member.coverPhoto} 
            alt="" 
            className="w-full h-full object-cover"
            onError={() => setImageError(prev => ({ ...prev, cover: true }))}
          />
        )}
      </div>
      
      <div className="flex justify-center">
        <div className="relative w-20 h-20 -mt-10 rounded-full border-4 border-white overflow-hidden">
          <img 
            src={imageError.profile && member.coverPhoto ? member.coverPhoto : member.profilePicture} 
            alt={member.name} 
            className="w-full h-full object-cover"
            onError={() => setImageError(prev => ({ ...prev, profile: true }))}
          />
        </div>
      </div>
      
      <div className="p-4 text-center">
        <h3 className="font-semibold text-lg">{member.name}</h3>
        {member.designation && (
          <p className="text-gray-600 text-sm">{member.designation}</p>
        )}
        {member.department && (
          <p className="text-gray-500 text-sm">{member.department}</p>
        )}
      </div>
      
      <div className="border-t border-gray-100 p-4">
        {member.email && (
          <p className="text-sm text-gray-600 truncate">
            <span className="font-medium">Email:</span> {member.email}
          </p>
        )}
        {member.phone && (
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Phone:</span> {member.phone}
          </p>
        )}
      </div>
      
      <div className="bg-gray-50 p-4">
        <button
          onClick={onViewProfile}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default MemberCard; 