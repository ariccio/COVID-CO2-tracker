package riccio.co2.client;
import expo.modules.updates.UpdatesDevLauncherController;
// import expo.modules.devlauncher.DevLauncherUpdatesInterfaceDelegate;
import expo.modules.devlauncher.DevLauncherController;

import android.app.Application;
import android.content.Context;
import android.content.res.Configuration;
import androidx.annotation.NonNull;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.soloader.SoLoader;
import riccio.co2.client.newarchitecture.MainApplicationReactNativeHost;

import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;
import riccio.co2.client.BuildConfig;
import riccio.co2.client.androidreactnativebootreceiver.AndroidReactNativeBootReceiverPackage;

import java.lang.reflect.InvocationTargetException;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost = new ReactNativeHostWrapper(this,
    new ReactNativeHost(this) {
      @Override
      public boolean getUseDeveloperSupport() {
        return DevLauncherController.getInstance().getUseDeveloperSupport();
      }

      @Override
      protected List<ReactPackage> getPackages() {
        @SuppressWarnings("UnnecessaryLocalVariable")
        List<ReactPackage> packages = new PackageList(this).getPackages();
        // Packages that cannot be autolinked yet can be added manually here, for example:
        // packages.add(new MyReactNativePackage());
        
        //boot receiver
        packages.add(new AndroidReactNativeBootReceiverPackage());
        return packages;
      }

      @Override
      protected String getJSMainModuleName() {
        return "index";
      }
  });
  private final ReactNativeHost mNewArchitectureNativeHost = new MainApplicationReactNativeHost(this);

  @Override
  public ReactNativeHost getReactNativeHost() {
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      return mNewArchitectureNativeHost;
    } else {
      return mReactNativeHost;
    }
  }

  @Override
  public void onCreate() {
    super.onCreate();
    // If you opted-in for the New Architecture, we enable the TurboModule system
    ReactFeatureFlags.useTurboModules = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    SoLoader.init(this, /* native exopackage */ false);

    DevLauncherController.initialize(this, getReactNativeHost());
    if (BuildConfig.DEBUG) {

      // Seems to be broken, see expo issue: https://github.com/expo/expo/issues/17288
      // DevLauncherController.getInstance().setUpdatesInterface(UpdatesDevLauncherController.initialize(this));

      // https://github.com/expo/expo/issues/17288#issuecomment-1167808654
      // I hope @thespacemanatee knows what he's doing, this looks like some disgusinting java hack :)
      // DevLauncherUpdatesInterfaceDelegate.INSTANCE.initializeUpdatesInterface(this);
    }

    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    ApplicationLifecycleDispatcher.onApplicationCreate(this);
  }

  @Override
  public void onConfigurationChanged(@NonNull Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   * @param reactInstanceManager
   */
  private static void initializeFlipper(
      Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("riccio.co2.client.ReactNativeFlipper");
        aClass
            .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
            .invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
}
