import React, { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface NotificationSettings {
    soundEnabled: boolean;
    browserNotifications: boolean;
    emailNotifications: boolean;
    newListings: boolean;
    newOrders: boolean;
    systemUpdates: boolean;
}

export const NotificationSettings: React.FC = () => {
    const [settings, setSettings] = useState<NotificationSettings>({
        soundEnabled: true,
        browserNotifications: true,
        emailNotifications: false,
        newListings: true,
        newOrders: true,
        systemUpdates: true,
    });

    // Load settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    // Save settings to localStorage
    const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    };

    const requestBrowserPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            updateSetting('browserNotifications', permission === 'granted');
        }
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Notification Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Sound Settings */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        Sound Notifications
                    </h3>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="sound-enabled" className="text-sm">
                            Play sound for new notifications
                        </Label>
                        <Switch
                            id="sound-enabled"
                            checked={settings.soundEnabled}
                            onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                        />
                    </div>
                </div>

                <Separator />

                {/* Browser Notifications */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        {settings.browserNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        Browser Notifications
                    </h3>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="browser-notifications" className="text-sm">
                            Show browser notifications
                        </Label>
                        <div className="flex items-center gap-2">
                            {!settings.browserNotifications && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={requestBrowserPermission}
                                    className="text-xs"
                                >
                                    Enable
                                </Button>
                            )}
                            <Switch
                                id="browser-notifications"
                                checked={settings.browserNotifications}
                                onCheckedChange={(checked) => updateSetting('browserNotifications', checked)}
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Notification Types */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">Notification Types</h3>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="new-listings" className="text-sm">
                            New listings from sellers
                        </Label>
                        <Switch
                            id="new-listings"
                            checked={settings.newListings}
                            onCheckedChange={(checked) => updateSetting('newListings', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="new-orders" className="text-sm">
                            New orders from buyers
                        </Label>
                        <Switch
                            id="new-orders"
                            checked={settings.newOrders}
                            onCheckedChange={(checked) => updateSetting('newOrders', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="system-updates" className="text-sm">
                            System updates and announcements
                        </Label>
                        <Switch
                            id="system-updates"
                            checked={settings.systemUpdates}
                            onCheckedChange={(checked) => updateSetting('systemUpdates', checked)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};