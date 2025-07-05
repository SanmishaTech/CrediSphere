import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarClock, CheckCircle, AlertCircle } from 'lucide-react';

interface MembershipStatusAlertProps {
  isActive: boolean;
  expiryDate?: string;
  expiryType?: string;
  daysUntilExpiry?: number;
}

const MembershipStatusAlert = ({ 
  isActive, 
  expiryDate, 
  expiryType, 
  daysUntilExpiry 
}: MembershipStatusAlertProps) => {
  console.log(isActive,expiryDate,daysUntilExpiry)
  if (isActive) {
    const isExpiringSoon = daysUntilExpiry !== undefined && daysUntilExpiry < 30;
    
    return (
      <Alert className={`border-l-4 ${isExpiringSoon ? 'border-l-yellow-500 bg-yellow-50' : 'border-l-green-500 bg-green-50'}`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {isExpiringSoon 
              ? <AlertCircle className="h-5 w-5 text-yellow-600" />
              : <CheckCircle className="h-5 w-5 text-green-600" />}
          </div>
          <div>
            <AlertTitle className="mb-1 flex items-center gap-2">
              <span className="font-medium">Membership Active</span>
              {expiryType && (
                <Badge variant="outline" className="ml-1">
                  {expiryType}
                </Badge>
              )}
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <CalendarClock className="h-4 w-4" />
                <span>
                  Expires on <span className="font-medium">{expiryDate ? format(new Date(expiryDate), "PPP") : 'N/A'}</span>
                </span>
              </div>
              {daysUntilExpiry !== undefined && (
                <div className={`text-sm mt-1 ${isExpiringSoon ? 'text-yellow-700 font-medium' : ''}`}>
                  {daysUntilExpiry} days remaining
                  {isExpiringSoon && ' - expiring soon'}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  }
  
  return (
    <Alert className="border-l-4 border-l-red-500 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <AlertTitle className="mb-1 text-red-700">Membership Expired</AlertTitle>
          <AlertDescription className="text-red-600">
            This member's membership has expired. Please contact administration for renewal.
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default MembershipStatusAlert;
