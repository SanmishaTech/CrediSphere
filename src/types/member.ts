// Member data interface definition
export interface MemberData {
  id: string;
  name: string;
  profilePicture: string;
  coverPhoto?: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  joinDate?: string;
  skills?: string[];
  meetingsAttended?: number;
  totalMeetings?: number;
  projects?: { name: string; role: string; status: string }[];
  achievements?: string[];
  lastActive?: string;
  
  // Business details
  businessDetails?: {
    gstNo?: string;
    organizationName?: string;
    organizationEmail?: string;
    organizationPhone?: string;
    organizationLandline?: string;
    organizationWebsite?: string;
    organizationAddress?: string;
    organizationDescription?: string;
  };
  
  // Personal details
  personalDetails?: {
    gender?: string;
    dob?: string;
    address?: string;
  };
} 