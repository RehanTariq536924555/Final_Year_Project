import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface Notification {
  id: string;
  type: 'listing' | 'order' | 'user' | 'system';
  title: string;
  subtitle: string;
  date: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [previousCount, setPreviousCount] = useState(0);
  const { playNotificationSound } = useNotificationSound();

  const fetchNotifications = async () => {
    try {
      const [listingsRes, ordersRes] = await Promise.all([
        fetch("http://localhost:3001/listings"),
        fetch("http://localhost:3001/payment/admin/all"),
      ]);

      const listings = await listingsRes.json();
      const orders = await ordersRes.json();

      // Debug: Log the first listing to see the data structure
      if (listings && listings.length > 0) {
        console.log("=== NOTIFICATION DEBUG: Sample listing data ===");
        console.log("Sample listing:", JSON.stringify(listings[0], null, 2));
        console.log("Available listing keys:", Object.keys(listings[0]));
      }

      // Get stored read notifications from localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');

      const listingNotifs: Notification[] = (listings || []).slice(-10).map((l: any, index: number) => {
        console.log(`\n=== Processing Listing ${index + 1} for Notifications ===`);
        console.log("Listing data:", l);
        
        // Try multiple possible fields for seller name
        let sellerName = "Unknown";
        
        if (l.seller?.name) {
          sellerName = l.seller.name;
          console.log("Found seller name in l.seller.name:", sellerName);
        }
        else if (l.seller?.username) {
          sellerName = l.seller.username;
          console.log("Found seller name in l.seller.username:", sellerName);
        }
        else if (typeof l.seller === 'string') {
          sellerName = l.seller;
          console.log("Found seller name in l.seller (string):", sellerName);
        }
        else if (l.sellerName) {
          sellerName = l.sellerName;
          console.log("Found seller name in l.sellerName:", sellerName);
        }
        else if (l.user?.name) {
          sellerName = l.user.name;
          console.log("Found seller name in l.user.name:", sellerName);
        }
        else if (l.user?.username) {
          sellerName = l.user.username;
          console.log("Found seller name in l.user.username:", sellerName);
        }
        else if (l.userName) {
          sellerName = l.userName;
          console.log("Found seller name in l.userName:", sellerName);
        }
        else if (l.owner?.name) {
          sellerName = l.owner.name;
          console.log("Found seller name in l.owner.name:", sellerName);
        }
        else if (l.ownerName) {
          sellerName = l.ownerName;
          console.log("Found seller name in l.ownerName:", sellerName);
        }
        else if (l.createdBy?.name) {
          sellerName = l.createdBy.name;
          console.log("Found seller name in l.createdBy.name:", sellerName);
        }
        else if (l.author?.name) {
          sellerName = l.author.name;
          console.log("Found seller name in l.author.name:", sellerName);
        }
        else {
          console.log("No seller name found, using 'Unknown'");
          console.log("Available fields:", Object.keys(l));
        }

        const notification = {
          id: `listing_${l.id}`,
          type: "listing" as const,
          title: l.title || "New Listing Created",
          subtitle: `Seller: ${sellerName}`,
          date: new Date(l.createdAt || Date.now()).toISOString(),
          read: readNotifications.includes(`listing_${l.id}`),
        };
        
        console.log("Final notification:", notification);
        return notification;
      });

      const orderNotifs: Notification[] = (orders || []).slice(-10).map((o: any) => ({
        id: `order_${o.id}`,
        type: "order" as const,
        title: `New Order • ${o.orderId}`,
        subtitle: `Buyer: ${o.buyer || "Unknown"} • Rs ${(o.total || 0).toLocaleString()}`,
        date: new Date(o.date || Date.now()).toISOString(),
        read: readNotifications.includes(`order_${o.id}`),
      }));

      // Merge and sort by date desc
      const merged = [...listingNotifs, ...orderNotifs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setNotifications(merged);
      
      // Play sound for new notifications
      const currentUnreadCount = merged.filter(n => !n.read).length;
      if (currentUnreadCount > previousCount && previousCount > 0) {
        playNotificationSound();
      }
      setPreviousCount(currentUnreadCount);
    } catch (error) {
      console.error("Failed to load notifications", error);
      setNotifications([]);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    
    // Update localStorage
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotifications.includes(id)) {
      readNotifications.push(id);
      localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    
    // Update localStorage
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${notification.type}_${Date.now()}`,
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    playNotificationSound();
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Initialize previous count after first load
  useEffect(() => {
    if (notifications.length > 0 && previousCount === 0) {
      setPreviousCount(notifications.filter(n => !n.read).length);
    }
  }, [notifications, previousCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};