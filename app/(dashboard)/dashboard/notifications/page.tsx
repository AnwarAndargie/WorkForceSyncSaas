"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, CreditCard, AlertCircle, CheckCircle2, Info, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New user signed up",
    description: "A new user has signed up for your service.",
    time: "Just now",
    type: "info",
    read: false,
  },
  {
    id: "2",
    title: "Payment successful",
    description: "Your subscription payment was successfully processed.",
    time: "2 hours ago",
    type: "success",
    read: false,
  },
  {
    id: "3",
    title: "Usage limit approaching",
    description: "You're at 80% of your monthly API calls limit.",
    time: "1 day ago",
    type: "warning",
    read: true,
  },
  {
    id: "4",
    title: "Failed login attempt",
    description: "There was a failed login attempt to your account.",
    time: "2 days ago",
    type: "error",
    read: true,
  },
  {
    id: "5",
    title: "Feature update available",
    description: "We've released a new feature that you might like.",
    time: "3 days ago",
    type: "info",
    read: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((notification) => notification.id !== id));
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications = filter === "unread"
    ? notifications.filter((notification) => !notification.read)
    : notifications;

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">
          Stay updated with your account activity
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            className={filter === "all" ? "bg-orange-600 hover:bg-orange-500" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            className={filter === "unread" ? "bg-orange-600 hover:bg-orange-500" : ""}
            onClick={() => setFilter("unread")}
          >
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-1 bg-white text-orange-600">{unreadCount}</Badge>
            )}
          </Button>
        </div>
        <Button variant="outline" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 rounded-lg border p-4 ${
                    notification.read ? "bg-white" : "bg-orange-50"
                  }`}
                >
                  <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{notification.title}</h4>
                      <span className="text-xs text-gray-500">{notification.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{notification.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="sr-only">Mark as read</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-gray-300" />
                <p className="mt-4 text-lg font-medium">No notifications</p>
                <p className="text-sm text-gray-500">
                  You're all caught up! We'll notify you when there's new activity.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
