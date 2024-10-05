// rooms: {
//   "roomId": {
//     members: {
//       "userAId": {},
//       "userBId": {
//         connections: {
//           "userAId": {
//             callerCandidates: {...},
//             calleeCandidates: {...},
//             offer: {
//               type: "offer",
//               sdp: "..."
//             },
//             answer: {
//               type: "answer",
//               sdp: "..."
//             },
//           }
//         },
//       },
//       "userCId": {
//         connections: {
//           "userAId": {
//             ...,
//           },
//           "userBId": {
//             ...,
//           },
//         },
//       },
//     },
//   },
// }

import { db } from "@/firebase-config/firebase-config";
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  DocumentReference,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useCallback, useMemo, useState } from "react";

/**
 * A hook for mesh WebRTC connection.
 * First user creates a room and other users join the room.
 * New members will create offers to all existing members.
 * Existing members will create answers to new members.
 *
 * Offers, answers and ICE candidates data are stored in Firestore.
 * With onSnapshot, we can listen these data changes and create WebRTC connection.
 */
export const useWebRtcMultiConnection = ({
  onMessageReceived,
}: {
  onMessageReceived?: (message: string) => void;
}) => {
  const configuration = useMemo(
    () => ({
      iceServers: [
        {
          urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
        },
      ],
    }),
    []
  );

  const [roomId, setRoomId] = useState<string | null>(null);
  // key: remote member id
  const [peerConnectionMap, setPeerConnectionMap] = useState<Map<string, RTCPeerConnection>>(
    new Map()
  );
  const [dataChannelMap, setDataChannelMap] = useState<Map<string, RTCDataChannel>>(new Map());
  const [connectionIdList, setConnectionIdList] = useState<string[]>([]);

  const createDataChannel = useCallback(
    (newDataChannel: RTCDataChannel, remoteMemberId: string) => {
      newDataChannel.onopen = () => {
        console.log("Data channel is open");
      };
      newDataChannel.onmessage = (event) => {
        console.log(event);
        console.log("Got message:", event.data);
        onMessageReceived?.(event.data);
      };
      newDataChannel.onclose = () => {
        console.log("Data channel is closed");
      };
      newDataChannel.onerror = (error) => {
        console.error("Data channel error:", error);
      };
      setDataChannelMap((prev) => new Map(prev.set(remoteMemberId, newDataChannel)));
    },
    [onMessageReceived, setDataChannelMap]
  );

  const registerPeerConnectionListeners = useCallback(
    (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>,
      remoteMemberId: string,
      collectingCandidateName: string,
      listeningCandidateName: string
    ) => {
      if (!newPeerConnection) return;

      newPeerConnection.onicegatheringstatechange = () => {
        console.log(`ICE gathering state changed: ${newPeerConnection?.iceGatheringState}`);
      };

      newPeerConnection.onconnectionstatechange = () => {
        console.log(`Connection state change: ${newPeerConnection?.connectionState}`);
      };

      newPeerConnection.onsignalingstatechange = () => {
        console.log(
          `Signaling state change: ${newPeerConnection.localDescription} ${newPeerConnection?.signalingState}`
        );
      };

      const unsubscribe = onSnapshot(
        collection(connectionRef, listeningCandidateName),
        (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
              await newPeerConnection?.addIceCandidate(new RTCIceCandidate(data));
            }
          });
        }
      );

      newPeerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state change: ${newPeerConnection?.iceConnectionState}`);
        if (newPeerConnection.iceConnectionState === "connected") {
          console.log("connected events removed");
          newPeerConnection.onicecandidate = null;
          unsubscribe();
        }
      };

      newPeerConnection.ondatachannel = (event) => {
        const receiveChannel = event.channel;
        createDataChannel(receiveChannel, remoteMemberId);
      };

      newPeerConnection.onicecandidate = async (event) => {
        if (newPeerConnection.iceConnectionState == "connected") {
          console.log("already connected");
          return;
        }
        if (!event.candidate) {
          console.log("Got final candidate!");
          return;
        }
        console.log("Got candidate: ", event.candidate);
        await addDoc(collection(connectionRef, collectingCandidateName), event.candidate.toJSON());
      };
    },
    [createDataChannel]
  );

  const createAnswer = useCallback(
    async (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>,
      connectionData: DocumentData
    ) => {
      await newPeerConnection.setRemoteDescription(new RTCSessionDescription(connectionData.offer));
      const answer = await newPeerConnection.createAnswer();
      await newPeerConnection.setLocalDescription(answer);
      updateDoc(connectionRef, {
        answer: { type: answer.type, sdp: answer.sdp },
      });
    },
    []
  );

  const listenNewMembers = useCallback(
    (roomRef: DocumentReference<DocumentData>, myMemberId: string, createdAt: number) => {
      const membersRef = collection(roomRef, "members");
      onSnapshot(membersRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (
            change.doc.id === myMemberId ||
            change.doc.data().createdAt < createdAt ||
            change.type !== "added"
          ) {
            return;
          }
          const remoteMemberId = change.doc.id;
          onSnapshot(
            collection(doc(membersRef, remoteMemberId), "connections"),
            async (connSnapshot) => {
              connSnapshot.docChanges().forEach(async (connChange) => {
                if (connChange.doc.id !== myMemberId || connChange.type !== "added") {
                  return;
                }
                const newPeerConnection = new RTCPeerConnection(configuration);
                const connectionRef = connChange.doc.ref;
                const connectionData = connChange.doc.data();

                registerPeerConnectionListeners(
                  newPeerConnection,
                  connectionRef,
                  remoteMemberId,
                  "calleeCandidates",
                  "callerCandidates"
                );
                await createAnswer(newPeerConnection, connectionRef, connectionData);

                setPeerConnectionMap(
                  (prev) => new Map(prev.set(remoteMemberId, newPeerConnection))
                );
                setConnectionIdList((prev) => [...prev, remoteMemberId]);
              });
            }
          );
        });
      });
    },
    [
      configuration,
      setPeerConnectionMap,
      setConnectionIdList,
      registerPeerConnectionListeners,
      createAnswer,
    ]
  );

  ////////////////////////////////////////
  /////// createRoom
  const createRoom = useCallback(async () => {
    // create room doc
    const roomRef = doc(collection(db, "rooms"));
    setRoomId(roomRef.id);
    // create my doc
    const myMemberRef = doc(collection(roomRef, "members"));
    const createdAt = Date.now();
    listenNewMembers(roomRef, myMemberRef.id, createdAt);
    setDoc(myMemberRef, {
      createdAt,
    });
    console.log("createRoom", roomRef.id, myMemberRef.id);
  }, [setRoomId, listenNewMembers]);

  ////////////////////////////////////////
  /////// joinRoomById
  const createOffer = useCallback(
    async (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>
    ) => {
      const offer = await newPeerConnection.createOffer();
      await newPeerConnection.setLocalDescription(offer);
      await setDoc(connectionRef, { offer: { type: offer.type, sdp: offer.sdp } });
    },
    []
  );

  const listenAnswer = useCallback(
    (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>
    ) => {
      onSnapshot(connectionRef, async (snapshot) => {
        const data = snapshot.data();
        if (!newPeerConnection?.currentRemoteDescription && data?.answer) {
          console.log(data?.isAnswerChecked, connectionRef.id);
          const rtcSessionDescription = new RTCSessionDescription(data.answer);
          await newPeerConnection?.setRemoteDescription(rtcSessionDescription);
        }
      });
    },
    []
  );

  const createConnections = useCallback(
    async (
      roomRef: DocumentReference<DocumentData>,
      myMemberRef: DocumentReference<DocumentData, DocumentData>
    ) => {
      // create connections to all members
      (await getDocs(collection(roomRef, "members"))).forEach(async (memberDoc) => {
        if (memberDoc.id === myMemberRef.id) {
          return;
        }
        const remoteMemberId = memberDoc.id;
        const newPeerConnection = new RTCPeerConnection(configuration);
        const connectionRef = doc(collection(myMemberRef, "connections"), remoteMemberId);
        createDataChannel(newPeerConnection.createDataChannel("my-chat"), remoteMemberId);
        registerPeerConnectionListeners(
          newPeerConnection,
          connectionRef,
          remoteMemberId,
          "callerCandidates",
          "calleeCandidates"
        );
        await createOffer(newPeerConnection, connectionRef);
        listenAnswer(newPeerConnection, connectionRef);

        setConnectionIdList((prev) => [...prev, remoteMemberId]);
        setPeerConnectionMap((prev) => new Map(prev.set(remoteMemberId, newPeerConnection)));
      });
    },
    [
      configuration,
      setPeerConnectionMap,
      setConnectionIdList,
      createDataChannel,
      registerPeerConnectionListeners,
      createOffer,
      listenAnswer,
    ]
  );

  const joinRoomById = useCallback(
    async (roomId: string) => {
      setRoomId(roomId);
      const roomRef = doc(collection(db, "rooms"), roomId);
      // set my member doc
      const myMemberRef = doc(collection(roomRef, "members"));
      await createConnections(roomRef, myMemberRef);
      const createdAt = Date.now();
      listenNewMembers(roomRef, myMemberRef.id, createdAt);
      setDoc(myMemberRef, {
        createdAt,
      });
      console.log("joinRoomById", roomId, myMemberRef.id);
    },
    [setRoomId, createConnections, listenNewMembers]
  );

  ////////////////////////////////////////
  /////// sendMessage
  const sendMessage = useCallback(
    (message: string) => {
      connectionIdList.forEach((connectionId) => {
        if (!peerConnectionMap.has(connectionId)) return;
        console.log("Send message: ", message);
        dataChannelMap.get(connectionId)?.send(message);
      });
    },
    [connectionIdList, peerConnectionMap, dataChannelMap]
  );

  return { roomId, createRoom, joinRoomById, sendMessage };
};
