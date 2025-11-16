import { useState } from "react";
import { Bell, ListPlus, ShoppingBag, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/NotificationContext";

const AdminNotifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await refreshNotifications();
    setLoading(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'listing':
        return <ListPlus className="h-5 w-5 text-blue-500" />;
      case 'order':
        return <ShoppingBag className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="py-6 px-8 flex items-center justify-between border-b bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{notifications.length} total</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 bg-teal-600 hover:bg-teal-700"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="p-8">
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent activity</CardTitle>
            <CardDescription>New listings by sellers and new orders by buyers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`flex items-start gap-3 p-4 rounded-lg transition-all duration-200 hover:shadow-sm ${
                      !n.read 
                        ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-sm" 
                        : "bg-muted/40 hover:bg-muted/60"
                    }`}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${!n.read ? "text-gray-900" : "text-gray-700"}`}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{n.subtitle}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(n.date)}
                            </span>
                            {!n.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(n.id)}
                                className="h-6 px-2 text-xs hover:bg-blue-100 text-blue-600"
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;


