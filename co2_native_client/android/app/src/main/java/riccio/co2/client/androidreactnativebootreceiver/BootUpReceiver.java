// https://medium.com/reactbrasil/how-to-create-an-unstoppable-service-in-react-native-using-headless-js-93656b6fd5d1


import android.content.Intent;
import android.content.Context;
import android.content.BroadcastReceiver;

import android.util.Log;

public class BootUpReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {

        // see also: https://www.puresourcecode.com/dotnet/csharp/xamarin-android-and-starting-a-service-at-device-boot/
        Log.d("riccio.co2.client", "BootReceiver OnReceive");

        context.startService(new Intent(context, BootUpHandlerService.class));
    }
}
