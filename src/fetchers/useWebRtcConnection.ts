import { useCallback, useMemo, useState } from "react";
import { db } from "@/firebase-config/firebase-config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";

/**
 * references:
 * - https://firebase.google.com/docs/firestore/query-data/get-data?hl=ja#web_1
 * - https://github.com/webrtc/FirebaseRTC/blob/solution/public/app.js
 *  */
export const useWebRtcConnection = () => {
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

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | undefined>();
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | undefined>();

  const [connectionId, setConnectionId] = useState<string | null>(null);

  const createDataChannel = useCallback(
    (newDataChannel: RTCDataChannel) => {
      newDataChannel.onopen = () => {
        console.log("Data channel is open");
      };
      newDataChannel.onmessage = (event) => {
        console.log("Got message:", event.data);
      };
      newDataChannel.onclose = () => {
        console.log("Data channel is closed");
      };
      newDataChannel.onerror = (error) => {
        console.error("Data channel error:", error);
      };
      setDataChannel(newDataChannel);
    },
    [setDataChannel]
  );

  const registerPeerConnectionListeners = useCallback(
    (newPeerConnection: RTCPeerConnection) => {
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
        createDataChannel(receiveChannel);
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
      newPeerConnection?.addEventListener("icecandidate", (event) => {
        if (!event.candidate) {
          console.log("Got final candidate!");
          return;
        }
        console.log("Got candidate: ", event.candidate);
        addDoc(collection(connectionRef, candidatesDataName), event.candidate.toJSON());
      });
    },
    []
  );

  const offerConnection = useCallback(
    async (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>
    ) => {
      console.log(newPeerConnection);
      const offer = await newPeerConnection?.createOffer();
      await newPeerConnection?.setLocalDescription(offer);
      console.log("Created offer:", offer);

      const connectionWithOffer = {
        offer: {
          type: offer?.type,
          sdp: offer?.sdp,
        },
      };
      await setDoc(connectionRef, connectionWithOffer);
      setConnectionId(connectionRef.id);
      console.log(`New connection created with SDP offer. Connection ID: ${connectionRef.id}`);
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

  const listenCandidates = useCallback(
    async (
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
  // end of functions for creating a connection

  // functions for joining a connection
  const answerOffer = useCallback(
    async (
      newPeerConnection: RTCPeerConnection,
      connectionRef: DocumentReference<DocumentData, DocumentData>,
      connectionSnapshot: DocumentSnapshot<DocumentData, DocumentData>
    ) => {
      const offer = connectionSnapshot.data()?.offer;
      console.log("Got offer:", offer);
      await newPeerConnection?.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await newPeerConnection?.createAnswer();
      console.log("Created answer:", answer);
      await newPeerConnection?.setLocalDescription(answer);

      const connectionWithAnswer = {
        answer: {
          type: answer?.type,
          sdp: answer?.sdp,
        },
      };
      await updateDoc(connectionRef, connectionWithAnswer);
    },
    []
  );
  // end of functions for joining a connection

  const createConnection = useCallback(async () => {
    const connectionRef = doc(collection(db, "connections"));
    console.log("Create PeerConnection with configuration: ", configuration);
    const newPeerConnection = new RTCPeerConnection(configuration);
    createDataChannel(newPeerConnection?.createDataChannel("my-chat"));
    registerPeerConnectionListeners(newPeerConnection);
    collectCandidates(newPeerConnection, connectionRef, "callerCandidates");
    offerConnection(newPeerConnection, connectionRef);
    listenRemoteDescription(newPeerConnection, connectionRef);
    listenCandidates(newPeerConnection, connectionRef, "calleeCandidates");
    console.log(newPeerConnection);

    setPeerConnection(newPeerConnection);
  }, [
    configuration,
    collectCandidates,
    createDataChannel,
    listenCandidates,
    listenRemoteDescription,
    offerConnection,
    registerPeerConnectionListeners,
  ]);

  const joinConnectionById = useCallback(
    async (connectionId: string) => {
      console.log(connectionId);
      const connectionRef = doc(collection(db, "connections"), connectionId);
      const connectionSnapshot = await getDoc(connectionRef);
      console.log("Got connection:", connectionSnapshot.exists());

      if (connectionSnapshot.exists()) {
        console.log("Create PeerConnection with configuration: ", configuration);
        const newPeerConnection = new RTCPeerConnection(configuration);
        // createDataChannel(newPeerConnection);
        registerPeerConnectionListeners(newPeerConnection);
        collectCandidates(newPeerConnection, connectionRef, "calleeCandidates");
        answerOffer(newPeerConnection, connectionRef, connectionSnapshot);
        listenCandidates(newPeerConnection, connectionRef, "callerCandidates");
        setConnectionId(connectionId);
        console.log(newPeerConnection);

        setPeerConnection(newPeerConnection);
      }
    },
    [
      configuration,
      answerOffer,
      collectCandidates,
      listenCandidates,
      registerPeerConnectionListeners,
    ]
  );

  const hangUp = useCallback(async () => {
    if (peerConnection) {
      dataChannel?.close();
      peerConnection.close();
    }

    if (connectionId) {
      const connectionRef = doc(collection(db, "connections"), connectionId);
      const calleeCandidates = await getDocs(collection(connectionRef, "calleeCandidates"));
      calleeCandidates.forEach(async (candidate) => {
        await deleteDoc(candidate.ref);
      });
      const callerCandidates = await getDocs(collection(connectionRef, "callerCandidates"));
      callerCandidates.forEach(async (candidate) => {
        await deleteDoc(candidate.ref);
      });
      await deleteDoc(connectionRef);
      setConnectionId("");
    }
  }, [connectionId, dataChannel, peerConnection]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!peerConnection) {
        console.error("PeerConnection is not created");
        return;
      }
      console.log(
        "Send message:",
        message,
        peerConnection?.connectionState,
        dataChannel,
        dataChannel?.readyState
      );
      console.log(dataChannel?.onmessage);
      dataChannel?.send(message);
    },
    [dataChannel, peerConnection]
  );

  return {
    connectionId,
    createConnection,
    joinConnectionById,
    hangUp,
    sendMessage,
  };
};
