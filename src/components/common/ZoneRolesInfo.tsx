import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, ChevronDownIcon } from "lucide-react";
import { getZoneRoles } from "@/services/zoneRoleService";

interface ZoneRolesInfoProps {
  zoneId: number | null;
}

export default function ZoneRolesInfo({ zoneId }: ZoneRolesInfoProps) {
  const [open, setOpen] = useState(false);

  // Reset open state when zoneId changes
  useEffect(() => {
    setOpen(false);
  }, [zoneId]);

  // Fetch zone roles information
  const { data, isLoading, error } = useQuery({
    queryKey: ["zoneRoles", zoneId],
    queryFn: () => (zoneId ? getZoneRoles(zoneId) : Promise.resolve(null)),
    enabled: !!zoneId && zoneId > 0,
  });

  if (!zoneId || zoneId <= 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 p-1 h-8 w-8"
          aria-label="View zone roles"
        >
          <InfoIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 p-2">
            Failed to load zone roles
          </div>
        ) : !data?.roles?.length ? (
          <div className="text-sm text-muted-foreground p-2">
            No roles assigned to this zone
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-medium">Roles for {data.zoneName}</div>
            {data.roles.map((role) => (
              <div
                key={role.assignmentId}
                className="flex items-start justify-between border-b pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <div className="text-sm font-medium">{role.roleType}</div>
                  <div className="text-xs text-muted-foreground">
                    {role.memberName}
                  </div>
                  {role.organizationName && (
                    <div className="text-xs text-muted-foreground">
                      {role.organizationName}
                    </div>
                  )}
                </div>
                {role.profilePicture && (
                  <div className="h-8 w-8 rounded-full overflow-hidden">
                    <img
                      src={role.profilePicture}
                      alt={role.memberName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
