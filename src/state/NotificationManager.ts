import { Thunk, thunk } from "easy-peasy";
import PushNotification, { PushNotificationObject } from "react-native-push-notification";

import { navigate } from "../utils/navigation";
import { IStoreModel } from "./index";

import logger from "./../utils/log";
import { ANDROID_PUSH_NOTIFICATION_PUSH_CHANNEL_ID, ANDROID_PUSH_NOTIFICATION_PUSH_CHANNEL_NAME, PLATFORM } from "../utils/constants";
import { localNotification } from "../utils/push-notification";
const log = logger("NotificationManager");

interface ILocalNotificationPayload {
  message: string;
  importance?: PushNotificationObject["importance"];
}

export interface INotificationManagerModel {
  initialize: Thunk<INotificationManagerModel>;

  localNotification: Thunk<INotificationManagerModel, ILocalNotificationPayload,  any, IStoreModel>;
};

export const notificationManager: INotificationManagerModel = {
  initialize: thunk(async () => {
    try {
      log.d("Initializing");

      if (PLATFORM === "ios") {
        const permissions = await PushNotification.requestPermissions(["alert", "sound", "badge"]);

        if(!permissions.alert) {
          log.w("Didn't get permissions to send push notifications.");
          return;
        }
      }

      PushNotification.configure({
        requestPermissions: false,
        onNotification: ((notification) => {
          log.i("onNotification", [notification]);

          // TODO(hsjoberg): ios notification deeplinking
          if (PLATFORM === "android") {
            if (notification.message.toString().includes("on-chain")) {
              log.i("Navigating to OnChainTransactionLog");
              navigate("OnChain", { screen: "OnChainTransactionLog"});
            }
            else if (notification.message.toString().toLocaleLowerCase().includes("payment channel")) {
              log.i("Navigating to LightningInfo");
              navigate("LightningInfo");
            }
          }
        }),
      });

      if (PLATFORM === "android") {
        PushNotification.createChannel({
            channelId: ANDROID_PUSH_NOTIFICATION_PUSH_CHANNEL_ID,
            channelName: ANDROID_PUSH_NOTIFICATION_PUSH_CHANNEL_NAME,
          },
          () => {}
        );
      }
    } catch (error) {
      throw new Error("NotificationManager: ") + error;
    }
  }),

  localNotification: thunk((_, { message, importance }, { getStoreState }) => {
    if (getStoreState().settings.pushNotificationsEnabled) {
      localNotification(
        message,
        importance ?? "default"
      );
    }
  }),
};
