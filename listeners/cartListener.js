const { admin, db } = require('../config/firebase');

function listenCarts() {
  db.collection('cart').onSnapshot(async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      const cartData = change.doc.data();

      const userId = cartData?.createdBy;

      if (!userId) {
        console.log(`Skipping notification for doc ${change.doc.id}: userId (createdBy) not found.`);
        continue;
      }

      let tokens = [];
      try {
        const tokensSnap = await db.collection('users').doc(userId)
          .collection('device_tokens').get();

        if (tokensSnap.empty) {
            console.log(`No device tokens found for user: ${userId}`);
            continue;
        }

        tokensSnap.forEach(tokenDoc => tokens.push(tokenDoc.data().token));

        let title = '';
        let body = '';

        if (change.type === 'added') {
          title = 'Item Baru Ditambahkan! 🎉';
          body = `Item "${cartData.name}" telah ditambahkan ke keranjang Anda.`;
        } else if (change.type === 'modified') {
          title = 'Keranjang Diperbarui';
          body = `Item "${cartData.name}" di keranjang Anda telah diubah.`;
        } else if (change.type === 'removed') {
          title = 'Item Dihapus';
          body = `Satu item telah dihapus dari keranjang Anda.`;
        }

        if (tokens.length > 0 && title) {
          const message = {
            tokens: tokens,
            notification: { title, body },
            apns: {
                payload: {
                    aps: {
                        'content-available': 1,
                    },
                },
            },
            android: {
                priority: 'high',
            }
          };

          await admin.messaging().sendEachForMulticast(message);
          console.log(`Notification sent for user ${userId} (${change.type}):`, change.doc.id);
        }
      } catch (error) {
        console.error(`Failed to process notification for user ${userId}:`, error);
      }
    }
  });
}

module.exports = { listenCarts };