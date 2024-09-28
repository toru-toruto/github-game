// MeshのWebRTCコネクションを実現する。
// あるルームに参加しているユーザー全員とのWebRTCコネクションを確立する。
// 最初の一人が部屋を作成する。他のメンバーはその部屋に参加する。
// 部屋作成時にroomIdを生成。各メンバー参加時にconnectionIdを生成。
// 各IdはFirestoreで自動生成されるドキュメントID。
// rooms: {
//   "roomId": {
//     members: {
//       "userBId": {
//         connections: {
//           "userAId": {
//             offer: {
//               type: "offer",
//               sdp: "..."
//             },
//           }
//         },
//       },
//       "userCId": {
//         connections: {
//           "userAId": {
//             offer: {
//               type: "offer",
//               sdp: "..."
//             },
//           },
//           "userBId": {
//             offer: {
//               type: "offer",
//               sdp: "..."
//             },
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
  DocumentSnapshot,
  getDoc,
  getDocs,
  onSnapshot,
  QueryDocumentSnapshot,
  setDoc,
  updateDoc,
  WriteBatch,
  writeBatch,
} from "firebase/firestore";
import { useCallback, useMemo, useState } from "react";
import { useWebRtcConnection } from "./useWebRtcConnection";
import { get } from "http";

export const useWebRtcMultiConnection = () => {
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
      };
      newDataChannel.onclose = () => {
        console.log("Data channel is closed");
      };
      newDataChannel.onerror = (error) => {
        console.error("Data channel error:", error);
      };
      setDataChannelMap((prev) => new Map(prev.set(remoteMemberId, newDataChannel)));
    },
    [setDataChannelMap]
  );

  const registerPeerConnectionListeners = useCallback(
    (newPeerConnection: RTCPeerConnection, remoteMemberId: string) => {
      if (!newPeerConnection) return;

      newPeerConnection?.addEventListener("icegatheringstatechange", () => {
        console.log(`ICE gathering state changed: ${newPeerConnection?.iceGatheringState}`);
      });

      newPeerConnection?.addEventListener("connectionstatechange", () => {
        console.log(`Connection state change: ${newPeerConnection?.connectionState}`);
      });

      newPeerConnection?.addEventListener("signalingstatechange", () => {
        console.log(`Signaling state change: ${newPeerConnection?.signalingState}`);
      });

      newPeerConnection?.addEventListener("iceconnectionstatechange ", () => {
        console.log(`ICE connection state change: ${newPeerConnection?.iceConnectionState}`);
      });

      newPeerConnection?.addEventListener("datachannel", (event) => {
        const receiveChannel = event.channel;
        createDataChannel(receiveChannel, remoteMemberId);
      });
    },
    [createDataChannel]
  );

  // functions for creating a connection
  const collectCandidates = useCallback(
    (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>,
      candidatesDataName: string
    ) => {
      newPeerConnection?.addEventListener("icecandidate", async (event) => {
        if (newPeerConnection.iceConnectionState == "connected") {
          console.log("already connected");
          return;
        }
        if (!event.candidate) {
          console.log("Got final candidate!");
          return;
        }
        console.log("Got candidate: ", event.candidate);
        await addDoc(collection(connectionRef, candidatesDataName), event.candidate.toJSON());
      });
    },
    []
  );

  const createAnswer = useCallback(
    async (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>,
      connectionData: DocumentData
    ) => {
      const offer = connectionData.offer;
      await newPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await newPeerConnection.createAnswer();
      await newPeerConnection.setLocalDescription(answer);
      updateDoc(connectionRef, {
        answer: { type: answer.type, sdp: answer.sdp },
      });
      console.log("Created answer:", answer);
    },
    []
  );

  const listenCandidates = useCallback(
    (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>,
      candidatesDataName: string
    ) => {
      onSnapshot(collection(connectionRef, candidatesDataName), (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
            await newPeerConnection?.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    },
    []
  );

  const listenNewMembers = useCallback(
    (roomRef: DocumentReference<DocumentData>, myMemberId: string) => {
      const membersRef = collection(roomRef, "members");
      onSnapshot(membersRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.doc.id === myMemberId) return;
          console.log(change);
          if (change.type === "added") {
            const remoteMemberId = change.doc.id;
            console.log("New member: ", remoteMemberId);
            onSnapshot(
              collection(doc(membersRef, remoteMemberId), "connections"),
              async (connSnapshot) => {
                connSnapshot.docChanges().forEach(async (connChange) => {
                  if (connChange.type === "added") {
                    const newPeerConnection = new RTCPeerConnection(configuration);
                    const connectionRef = connChange.doc.ref;
                    const connectionData = connChange.doc.data();

                    registerPeerConnectionListeners(newPeerConnection, remoteMemberId);
                    collectCandidates(newPeerConnection, connectionRef, "calleeCandidates");
                    await createAnswer(newPeerConnection, connectionRef, connectionData);
                    listenCandidates(newPeerConnection, connectionRef, "callerCandidates");

                    setPeerConnectionMap(
                      (prev) => new Map(prev.set(remoteMemberId, newPeerConnection))
                    );
                    setConnectionIdList((prev) => [...prev, remoteMemberId]);
                  }
                });
              }
            );
          }
        });
      });
    },
    [setPeerConnectionMap, setConnectionIdList]
  );

  const createOffer = useCallback(
    async (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>
    ) => {
      const offer = await newPeerConnection.createOffer();
      await newPeerConnection.setLocalDescription(offer);

      await setDoc(connectionRef, { offer: { type: offer.type, sdp: offer.sdp } });
      console.log("Created offer:", offer);
    },
    []
  );

  const listenRemoteDescription = useCallback(
    async (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>
    ) => {
      onSnapshot(connectionRef, async (snapshot) => {
        const data = snapshot.data();
        if (!newPeerConnection?.currentRemoteDescription && data?.answer) {
          console.log("Set remote description: ", data.answer);
          const rtcSessionDescription = new RTCSessionDescription(data.answer);
          await newPeerConnection?.setRemoteDescription(rtcSessionDescription);
        }
      });
    },
    []
  );

  const createConnections = useCallback(
    async (roomRef: DocumentReference<DocumentData>, myMemberId: string) => {
      // get members
      const membersSnapshot = await getDocs(collection(roomRef, "members"));
      console.log("membersSnapshot", membersSnapshot.size);
      // create connections to all members
      membersSnapshot.forEach(async (memberDoc) => {
        console.log("start each member");
        if (memberDoc.id === myMemberId) return;
        const remoteMemberId = memberDoc.id;
        const newPeerConnection = new RTCPeerConnection(configuration);
        const connectionRef = doc(
          collection(doc(collection(roomRef, "members"), myMemberId), "connections"),
          remoteMemberId
        );
        createDataChannel(newPeerConnection.createDataChannel("my-chat"), remoteMemberId);
        registerPeerConnectionListeners(newPeerConnection, remoteMemberId);
        collectCandidates(newPeerConnection, connectionRef, "callerCandidates");
        await createOffer(newPeerConnection, connectionRef);
        await listenRemoteDescription(newPeerConnection, connectionRef);
        listenCandidates(newPeerConnection, connectionRef, "calleeCandidates");

        setConnectionIdList((prev) => [...prev, remoteMemberId]);
        setPeerConnectionMap((prev) => new Map(prev.set(remoteMemberId, newPeerConnection)));
        console.log("end each member");
      });
    },
    [setPeerConnectionMap]
  );

  const createRoom = useCallback(async () => {
    // create room doc
    const roomRef = doc(collection(db, "rooms"));
    setRoomId(roomRef.id);
    // create my doc
    const myMemberRef = doc(collection(roomRef, "members"));
    listenNewMembers(roomRef, myMemberRef.id);
    setDoc(myMemberRef, {});
    console.log("createRoom", roomRef.id, myMemberRef.id);
  }, []);

  const joinRoomById = useCallback(async (roomId: string) => {
    setRoomId(roomId);
    const roomRef = doc(collection(db, "rooms"), roomId);
    // set my member doc
    const myMemberRef = doc(collection(roomRef, "members"));
    await createConnections(roomRef, myMemberRef.id);
    listenNewMembers(roomRef, myMemberRef.id);
    setDoc(myMemberRef, {});
    console.log("joinRoomById", roomId, myMemberRef.id);
  }, []);

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
