import { useEffect, useState } from 'react';
import Index from '@/modules/Facebookprofile/Index';
import Header from '@/components/Header';
import { MemberData } from '@/types/member';

// Sample member data (in a real app, this would come from an API)
const MEMBERS_DATA: Record<string, MemberData> = {
  '1': {
    id: '1',
    name: 'Yash Chaudhari',
    profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100',
    coverPhoto: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c6b2?auto=format&fit=crop&w=1470&h=400',
    email: 'yash.chaudhari@example.com',
    phone: '+91 9876543210',
    designation: 'Senior Developer',
    department: 'Engineering',
    joinDate: 'January 15, 2022',
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
    meetingsAttended: 45,
    totalMeetings: 50,
    projects: [
      { name: 'CrediSphere Platform', role: 'Lead Developer', status: 'Active' },
      { name: 'Mobile App', role: 'Frontend Developer', status: 'Completed' }
    ],
    achievements: ['Employee of the Month - March 2023', 'Completed AWS Certification'],
    lastActive: '2 hours ago'
  },
  '2': {
    id: '2',
    name: 'Saket Bhide',
    profilePicture: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&h=100',
    coverPhoto: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1470&h=400',
    email: 'saket.bhide@example.com',
    phone: '+91 8765432109',
    designation: 'Product Manager',
    department: 'Product',
    joinDate: 'March 10, 2021',
    skills: ['Product Strategy', 'User Research', 'Agile', 'Roadmapping'],
    meetingsAttended: 38,
    totalMeetings: 40,
    projects: [
      { name: 'CrediSphere Platform', role: 'Product Manager', status: 'Active' },
      { name: 'Analytics Dashboard', role: 'Product Owner', status: 'Planning' }
    ],
    achievements: ['Highest Customer Satisfaction Q2 2023', 'Product Launch Excellence Award'],
    lastActive: '5 hours ago'
  },
  '3': {
    id: '3',
    name: 'Pravin Warke',
    profilePicture: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=100&h=100',
    coverPhoto: 'https://images.unsplash.com/photo-1616763355548-1b606f439f86?auto=format&fit=crop&w=1470&h=400',
    email: 'pravin.warke@example.com',
    phone: '+91 7654321098',
    designation: 'UX Designer',
    department: 'Design',
    joinDate: 'May 22, 2022',
    skills: ['UI/UX Design', 'Figma', 'User Research', 'Wireframing'],
    meetingsAttended: 30,
    totalMeetings: 35,
    projects: [
      { name: 'CrediSphere Platform', role: 'UX Designer', status: 'Active' },
      { name: 'Mobile App', role: 'UI Designer', status: 'Completed' }
    ],
    achievements: ['Design Excellence Award 2023'],
    lastActive: '1 day ago'
  }
};

const MemberProfilePage = () => {
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the member ID from the URL
    const path = window.location.pathname;
    const memberId = path.split('/').pop() || null;
    setId(memberId);

    if (memberId) {
      // In a real app, this would be an API call
      // const fetchMemberData = async () => {
      //   try {
      //     const response = await fetch(`/api/members/${memberId}`);
      //     if (!response.ok) {
      //       throw new Error('Member not found');
      //     }
      //     const data = await response.json();
      //     setMemberData(data);
      //   } catch (error) {
      //     setError(error.message);
      //   } finally {
      //     setLoading(false);
      //   }
      // };
      // fetchMemberData();

      // Mock data fetch
      setTimeout(() => {
        const member = MEMBERS_DATA[memberId];
        
        if (member) {
          setMemberData(member);
        } else {
          setError('Member not found');
        }
        
        setLoading(false);
      }, 800);
    }
  }, []);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
            <p>{error}</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <Index memberId={id as string} />
    </div>
  );
};

export default MemberProfilePage; 