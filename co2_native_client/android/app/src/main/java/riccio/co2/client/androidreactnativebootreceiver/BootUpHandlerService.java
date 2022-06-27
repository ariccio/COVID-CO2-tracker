
// https://medium.com/reactbrasil/how-to-create-an-unstoppable-service-in-react-native-using-headless-js-93656b6fd5d1
package riccio.co2.client.androidreactnativebootreceiver;
import android.content.Intent;
import android.content.Context;
import android.app.Service;
import android.os.Handler;
import java.lang.Runnable;
import android.app.PendingIntent;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

import android.os.Binder;
import android.os.IBinder;

import android.util.Log;

import riccio.co2.client.MainActivity;

public class BootUpHandlerService extends Service {

    private Handler handler = new Handler();
    private Runnable runnableCode = new Runnable() {
        @Override
        public void run() {
            Log.d("riccio.co2.client", "BootUpHandlerService run");
            // context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("Bootup",
            // null);

            Context context = getApplicationContext();
            Intent myIntent = new Intent(context, BootUpHandlerService.class);
            context.startService(myIntent);
            // HeadlessJsTaskService.acquireWakeLockNow(context);
            handler.postDelayed(this, 2000);
        }
    };

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d("riccio.co2.client", intent.toString());
        if (intent.getAction() != Intent.ACTION_BOOT_COMPLETED) {
            Log.d("riccio.co2.client", "BootUpHandlerService onStartCommand: NOT an ACTION_BOOT_COMPLETED");
            return START_STICKY;
        }
        Log.d("riccio.co2.client", "BootUpHandlerService onStartCommand ACTION_BOOT_COMPLETED");
        this.handler.post(this.runnableCode); // Starting the interval
        // Turning into a foreground service
        createNotificationChannel(); // Creating channel for API 26+
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, notificationIntent,
                PendingIntent.FLAG_CANCEL_CURRENT);
        // Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
        // .setContentTitle("Bootup handler")
        // .setContentText("Running…")
        // .setSmallIcon(R.mipmap.ic_launcher)
        // .setContentIntent(contentIntent)
        // .setOngoing(true)
        // .build();
        // startForeground(SERVICE_NOTIFICATION_ID, notification);
        createNotificationChannel();

        Context context = getApplicationContext();
        // https://stackoverflow.com/a/57447857/625687
        Intent it = new Intent(context, MainActivity.class);
        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(it);

        return START_NOT_STICKY;
    }

    // https://developer.android.com/guide/components/bound-services
    // https://medium.com/@anant.rao07/android-bound-services-f1cceb2f1f3e
    private final IBinder localBinder = new MyBinder();

    @Override
    public IBinder onBind(Intent intent) {
        return localBinder;
    }

    public class MyBinder extends Binder {

        public BootUpHandlerService getService() {
            return BootUpHandlerService.this;

        }
    }

    private static final String CHANNEL_ID = "Bootup";

    private void createNotificationChannel() {
        Log.d("riccio.co2.client", "BootUpHandlerService createNotificationChannel");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            int importance = NotificationManager.IMPORTANCE_DEFAULT;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Bootup", importance);
            channel.setDescription("Bootup notification channel");
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

}