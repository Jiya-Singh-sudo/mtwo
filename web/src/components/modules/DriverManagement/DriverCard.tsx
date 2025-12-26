import { Driver } from '../../../types/drivers';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { User, Phone, CreditCard } from 'lucide-react';

interface DriverCardProps {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
  onView: (driver: Driver) => void;
  onToggleStatus?: (driver: Driver) => void;
}

export function DriverCard({
  driver,
  onEdit,
  onDelete,
  onView,
  onToggleStatus
}: DriverCardProps) {
  const getStatusBadge = () => {
    if (!driver.is_active) {
      return <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-200">Inactive</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-500 text-white">Active</Badge>;
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow bg-white border border-gray-200 cursor-pointer"
      onClick={() => onView(driver)}
    >
      <CardContent className="p-4">
        {/* Header: Driver info and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="size-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{driver.driver_name}</h3>
              <p className="text-xs text-gray-500">{driver.driver_id}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Driver Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <CreditCard className="size-3.5 text-gray-400 flex-shrink-0" />
            <span>{driver.driver_license}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="size-3.5 text-gray-400 flex-shrink-0" />
            <span>{driver.driver_contact}</span>
          </div>
          {driver.address && (
            <div className="text-xs text-gray-600">
              <span>{driver.address}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(driver);
            }}
          >
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(driver);
            }}
          >
            Delete
          </Button>

          {onToggleStatus && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(driver);
              }}
            >
              {driver.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}