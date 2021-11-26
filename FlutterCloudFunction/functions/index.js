const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const CoordInit = 100;
const CoordMax = 200;
const MinUsers = 5;

exports.waiter = functions.database()
    .ref("users/{userID}/x")
    .onUpdate((change, context) => {
      const userID = context.params.userdID;
      const newValue = change.after.val();
      const oldValue = change.before.val();
      if (oldValue < CoordInit && oldValue > CoordMax) {
        if (newValue > 200 || newValue < 100) {
          // subtract from counter
          admin.database()
              .ref("/rooms/waiting/count")
              .update({count: admin.database()
                  .ref("/rooms/waiting/count")
                  .get()
                  .val() - 1}
              );
          // remove user from the waiting list
          admin.database().ref("/rooms/waiting").remove({userID: userID});
        }
      } else {
        if (newValue < CoordMax && newValue > CoordInit) {
          // add to couter
          admin.database().ref("/rooms/waiting/count")
              .update({count: admin.database()
                  .ref("/rooms/waiting/count")
                  .get()
                  .val() + 1}
              );
          // add user to the waiting list
          admin.database().ref("/rooms/waiting").update({userID: userID});
        }
      }
    });

exports.timer = functions.database()
    .ref("/rooms/waiting/count")
    .onUpdate((change, context) => {
      const newValue = change.after.val();
      const oldValue = change.before.val();
      if (oldValue >= MinUsers && newValue < MinUsers) {
        admin.database().ref("/rooms/waiting/timer")
            .update({counting: false});
      } else {
        if (newValue >= MinUsers) {
          admin.database().ref("/rooms/waiting/timer")
              .update({counting: true});
          admin.database().ref("/rooms/waiting/timer")
              .update({begin: Date.now()});
        }
      }
    }
    );

// exports.teleporter = functions.pubsub
//     .schedule("every 1 seconds").onRun((context) => {
//       const now = Date.now();
//       const begin = admin.database()
//           .ref("/rooms/waiting/timer/begin").get().val();
//       const counting = admin.database()
//           .ref("/rooms/waiting/timer/counting").get().val();
//       if (counting) {
//         const diff = now - begin;
//         if (diff > 10) {
//           // not counting anymore
//           admin.database().ref("/rooms/waiting/timer")
//               .update({counting: false});
//           // everybody is teleported
//           admin.database().ref("/rooms/waiting/count")
//               .update({count: 0});
//           // teleport everybody and remove from waiting list
//           admin.database().ref("/rooms/waiting").remove({userID: {userID}});
//         }
//       }
//     }
//     );
