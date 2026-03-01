const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const NotificationManager = {
    /**
     * Check if notifications are supported and permitted
     */
    checkPermission: () => {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission; // 'granted', 'denied', or 'default'
    },

    /**
     * Register service worker and subscribe to push
     */
    registerAndSubscribe: async () => {
        try {
            if (!('serviceWorker' in navigator)) return;

            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('SW registered:', registration);

            // Wait for registration to be ready
            await navigator.serviceWorker.ready;

            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            // Send to backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push-notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth system
                },
                body: JSON.stringify({ subscription }),
            });

            if (!response.ok) throw new Error('Failed to save subscription on backend');

            return true;
        } catch (error) {
            console.error('Notification Subscription Error:', error);
            return false;
        }
    },

    /**
     * Request permission
     */
    requestPermission: async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            return await NotificationManager.registerAndSubscribe();
        }
        return false;
    }
};
