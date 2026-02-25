// Service Worker for Daily Grind workout notifications
const NOTIFICATION_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const ALARM_TAG = 'workout-reminder';

const MOTIVATIONAL_QUOTES = [
  "Push yourself because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Success doesn't just find you. You have to go out and get it.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't stop when you're tired. Stop when you're done.",
  "The body achieves what the mind believes.",
  "Train insane or remain the same.",
  "Your only limit is you.",
  "Sweat is just fat crying.",
  "No pain, no gain. Shut up and train.",
  "Wake up. Work out. Look hot. Kick ass.",
  "Strive for progress, not perfection.",
  "You don't have to be great to start, but you have to start to be great.",
  "The harder you work, the luckier you get.",
  "Believe in yourself and all that you are.",
  "Champions aren't made in gyms. Champions are made from something deep inside.",
  "The difference between try and triumph is a little umph.",
  "Fitness is not about being better than someone else. It's about being better than you used to be.",
  "Take care of your body. It's the only place you have to live.",
  "Every workout is progress.",
];

let notificationTimerId = null;

function getRandomQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

function showWorkoutNotification() {
  const quote = getRandomQuote();
  self.registration.showNotification('Time to grind! 💪', {
    body: quote,
    icon: '/assets/generated/app-logo.dim_256x256.png',
    badge: '/assets/generated/app-logo.dim_256x256.png',
    tag: ALARM_TAG,
    renotify: true,
    requireInteraction: false,
    data: { url: self.location.origin },
  });
}

function startSchedule() {
  if (notificationTimerId !== null) {
    clearInterval(notificationTimerId);
  }
  // Show first notification after 4 hours, then every 4 hours
  notificationTimerId = setInterval(() => {
    showWorkoutNotification();
  }, NOTIFICATION_INTERVAL_MS);
}

function stopSchedule() {
  if (notificationTimerId !== null) {
    clearInterval(notificationTimerId);
    notificationTimerId = null;
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'START_NOTIFICATIONS':
      startSchedule();
      break;
    case 'STOP_NOTIFICATIONS':
      stopSchedule();
      break;
    case 'SHOW_TEST_NOTIFICATION':
      showWorkoutNotification();
      break;
    default:
      break;
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.startsWith(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
